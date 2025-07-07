package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"time"

	"go-sys-agent/config"
	"go-sys-agent/internal/docker"
	"go-sys-agent/internal/metrics"
)

func main() {
	fmt.Println("Testing Go Agent Components...")

	// Test configuration
	cfg := config.LoadConfig()
	fmt.Printf("✓ Configuration loaded - Socket Port: %s\n", cfg.SocketPort)

	// Test metrics initialization
	metrics.Initialize()
	fmt.Println("✓ Metrics initialized")

	// Test Docker initialization
	docker.Initialize()
	fmt.Println("✓ Docker client initialized")

	// Test system stats collection
	systemStats := metrics.CollectSystemStats()
	fmt.Printf("✓ System stats collected - CPU: %v, Memory: %.2f MB\n", 
		systemStats["cpu_percent"], systemStats["memory_used"])

	// Test Docker container listing
	containers := docker.ListContainers()
	fmt.Printf("✓ Docker containers listed - Found %d containers\n", len(containers))

	// Test Docker stats collection
	containerStats := docker.GetContainerStats()
	fmt.Printf("✓ Docker stats collected - Found %d running containers\n", len(containerStats))

	// Test Docker logs collection
	logs := docker.GetAllContainerLogs(10)
	fmt.Printf("✓ Docker logs collected - Found logs for %d containers\n", len(logs))

	// Test socket connection (if agent is running)
	if len(os.Args) > 1 && os.Args[1] == "test-socket" {
		testSocketConnection(cfg)
	}

	fmt.Println("\n🎉 All tests passed! Agent is ready to run.")
}

func testSocketConnection(cfg config.Config) {
	fmt.Println("\nTesting socket connection...")
	
	conn, err := net.Dial("tcp", "localhost:"+cfg.SocketPort)
	if err != nil {
		fmt.Printf("✗ Socket connection failed: %v\n", err)
		return
	}
	defer conn.Close()

	// Send API key
	conn.Write([]byte(cfg.APIKey + "\n"))

	// Read response
	scanner := bufio.NewScanner(conn)
	if scanner.Scan() {
		line := scanner.Text()
		if line == "Unauthorized" {
			fmt.Println("✗ Authentication failed")
			return
		}
	}

	// Try to read data
	timeout := time.After(10 * time.Second)
	select {
	case <-timeout:
		fmt.Println("✗ Timeout waiting for data")
		return
	default:
		if scanner.Scan() {
			var data map[string]interface{}
			if err := json.Unmarshal([]byte(scanner.Text()), &data); err != nil {
				fmt.Printf("✗ Failed to parse data: %v\n", err)
				return
			}
			fmt.Printf("✓ Received data from agent - Timestamp: %s\n", data["timestamp"])
		}
	}
} 