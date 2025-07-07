package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"go-sys-agent/config"
	"go-sys-agent/internal/docker"
	"go-sys-agent/internal/metrics"
	"go-sys-agent/internal/socket"
)

func main() {
	// Load configuration from environment
	cfg := config.LoadConfig()

	// Initialize system metrics and Docker setup
	metrics.Initialize()
	docker.Initialize()

	// Start the socket server in a separate goroutine
	go func() {
		err := socket.StartServer(cfg)
		if err != nil {
			log.Fatalf("Socket server failed to start: %v", err)
		}
	}()

	// Block until SIGINT or SIGTERM
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	<-sigs

	fmt.Println("Shutting down agent...")
	docker.Shutdown()
	socket.Shutdown()
}
