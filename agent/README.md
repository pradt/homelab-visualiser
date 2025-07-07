# Go System Agent

A Go application that collects system metrics and Docker container data, serving it via a socket connection for real-time monitoring.

## Overview

The agent is designed to run on a host system and collect comprehensive metrics including:
- System performance data (CPU, memory, disk, network)
- Docker container statistics and metadata
- Container logs
- Process information

All data is served via a TCP socket connection with authentication and optional TLS support.

## Architecture

```
agent/
├── main.go                 # Application entry point
├── go.mod                  # Go module dependencies
├── config/
│   └── config.go          # Configuration management
├── internal/
│   ├── docker/
│   │   ├── docker.go      # Docker client initialization and container listing
│   │   ├── docker_logs.go # Container log collection
│   │   └── docker_metrics.go # Container statistics collection
│   ├── metrics/
│   │   └── system.go      # System metrics collection
│   └── socket/
│       └── server.go      # Socket server implementation
└── test-agent.go          # Testing utility
```

## Features

### System Metrics Collection
- CPU usage percentage
- Memory usage (used/total in MB)
- Disk usage (used/total in GB)
- System uptime
- Load averages (1m, 5m, 15m)
- Network interface statistics
- Top processes by CPU usage

### Docker Integration
- Container listing with metadata
- Real-time container statistics (CPU, memory, network)
- Container log collection (configurable line count)
- Support for running containers only

### Socket Server
- TCP socket server with configurable port
- API key authentication
- Optional TLS encryption
- IP whitelisting support
- Automatic data transmission every 5 seconds
- Graceful shutdown handling

## Configuration

The agent uses environment variables for configuration:

### Required
- `API_KEY` - Secret key for client authentication

### Optional
- `SOCKET_PORT` - Port for socket server (default: 9000)
- `TLS_ENABLED` - Enable TLS encryption (default: false)
- `TLS_CERT_FILE` - Path to TLS certificate file
- `TLS_KEY_FILE` - Path to TLS private key file
- `WHITELISTED_CLIENTS` - Comma-separated list of allowed IP addresses

## Installation and Setup

### Prerequisites
- Go 1.21 or later
- Docker daemon running (for container metrics)
- Access to Docker socket (usually requires root or docker group membership)

### Building
```bash
cd agent
go mod tidy
go build -o agent main.go
```

### Running
```bash
# Set required environment variables
export API_KEY="your-secret-api-key"

# Run the agent
./agent

# Or run directly with go
go run main.go
```

### Docker Socket Access
To access Docker metrics, ensure the agent has access to the Docker socket:

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Or run with sudo (not recommended for production)
sudo ./agent
```

## Data Format

The agent sends JSON data every 5 seconds with the following structure:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "status": "ok",
  "system": {
    "cpu_percent": [12.5],
    "memory_used": 8192.0,
    "memory_total": 16384.0,
    "disk_used": 100.5,
    "disk_total": 500.0,
    "uptime": 86400,
    "load_avg": {
      "1m": 0.5,
      "5m": 0.3,
      "15m": 0.2
    },
    "network": [
      {
        "name": "eth0",
        "bytes_sent": 1024000,
        "bytes_recv": 2048000,
        "packets_sent": 1000,
        "packets_recv": 2000
      }
    ],
    "top_processes": [
      {
        "name": "nginx",
        "cpu": 5.2,
        "mem": 2.1,
        "pid": 1234
      }
    ]
  },
  "containers": [
    {
      "id": "abc123def456",
      "name": "/my-container",
      "image": "nginx:latest",
      "status": "running",
      "cpu_percent": 2.5,
      "memory_usage": 52428800,
      "memory_limit": 1073741824,
      "memory_percent": 4.9,
      "network": {
        "eth0": {
          "rx_bytes": 1024000,
          "tx_bytes": 512000,
          "rx_packets": 1000,
          "tx_packets": 500
        }
      }
    }
  ],
  "docker_meta": [
    {
      "id": "abc123def456",
      "names": ["/my-container"],
      "image": "nginx:latest",
      "status": "running",
      "state": "running",
      "ports": [],
      "created": 1640995200
    }
  ],
  "logs": {
    "my-container": [
      "2024-01-01T12:00:00Z [INFO] Server started",
      "2024-01-01T12:00:01Z [INFO] Listening on port 80"
    ]
  }
}
```

## Socket Protocol

### Connection
1. Client connects to TCP socket on configured port
2. Client sends API key followed by newline
3. Server validates API key and responds with "Unauthorized" if invalid
4. If authorized, server begins sending data every 5 seconds

### Authentication
```
Client -> Server: "your-api-key\n"
Server -> Client: (no response if valid, "Unauthorized\n" if invalid)
```

### Data Transmission
- Server sends JSON data every 5 seconds
- Each JSON object is followed by a newline
- Client should parse each line as a separate JSON object

## Testing

Use the included test utility to verify agent functionality:

```bash
# Test all components
go run test-agent.go

# Test socket connection (requires running agent)
go run test-agent.go test-socket
```

## Error Handling

The agent includes comprehensive error handling:
- Graceful degradation when Docker is unavailable
- Timeout handling for all external calls
- Logging of errors without application termination
- Automatic reconnection for socket clients

## Security Considerations

- API key should be a strong, randomly generated string
- Use TLS in production environments
- Implement IP whitelisting for additional security
- Run with minimal required privileges
- Consider using Docker socket proxy for containerized deployment

