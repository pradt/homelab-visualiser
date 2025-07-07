package socket

import (
	"bufio"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"strings"
	"time"

	"go-sys-agent/config"
	"go-sys-agent/internal/docker"
	"go-sys-agent/internal/metrics"
)

var listener net.Listener

func StartServer(cfg config.Config) error {
	addr := ":" + cfg.SocketPort
	var err error

	if cfg.TLSEnabled {
		cert, err := tls.LoadX509KeyPair(cfg.CertFile, cfg.KeyFile)
		if err != nil {
			return fmt.Errorf("failed to load TLS cert: %w", err)
		}
		tlsConfig := &tls.Config{Certificates: []tls.Certificate{cert}}
		listener, err = tls.Listen("tcp", addr, tlsConfig)
	} else {
		listener, err = net.Listen("tcp", addr)
	}

	if err != nil {
		return fmt.Errorf("failed to start listener: %w", err)
	}

	log.Printf("Socket server listening on %s (TLS: %v)", addr, cfg.TLSEnabled)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Accept error: %v", err)
			continue
		}

		remoteIP := strings.Split(conn.RemoteAddr().String(), ":")[0]
		if len(cfg.WhitelistedClients) > 0 && !isWhitelisted(remoteIP, cfg.WhitelistedClients) {
			log.Printf("Rejected connection from non-whitelisted IP: %s", remoteIP)
			conn.Close()
			continue
		}

		go handleConnection(conn, cfg)
	}
}

func Shutdown() {
	if listener != nil {
		listener.Close()
	}
}

func isWhitelisted(ip string, whitelist []string) bool {
	for _, w := range whitelist {
		if strings.TrimSpace(w) == ip {
			return true
		}
	}
	return false
}

func handleConnection(conn net.Conn, cfg config.Config) {
	defer conn.Close()
	scanner := bufio.NewScanner(conn)

	// Expect client to send API key first
	if scanner.Scan() {
		line := scanner.Text()
		if line != cfg.APIKey {
			log.Printf("Invalid API key from %s", conn.RemoteAddr())
			conn.Write([]byte("Unauthorized\n"))
			return
		}
	} else {
		log.Printf("No API key received from %s", conn.RemoteAddr())
		return
	}

	log.Printf("Client connected: %s", conn.RemoteAddr())

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		data := map[string]interface{}{
			"timestamp":   time.Now().Format(time.RFC3339),
			"status":      "ok",
			"system":      metrics.CollectSystemStats(),
			"containers":  docker.GetContainerStats(),
			"docker_meta": docker.ListContainers(),
			"logs":        docker.GetAllContainerLogs(50), // Get last 50 lines from each container
		}
		err := json.NewEncoder(conn).Encode(data)
		if err != nil {
			log.Printf("Failed to send data to %s: %v", conn.RemoteAddr(), err)
			return
		}
	}
}