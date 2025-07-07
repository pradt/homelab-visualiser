# Agent Monitoring Setup Guide

This guide explains how to set up and use the new agent monitoring functionality in the Homelab Visualiser.

## Overview

The agent monitoring system allows you to connect real-time system metrics from your computers and VMs to the Homelab Visualiser. This provides live monitoring of CPU, memory, disk usage, and other system metrics directly in your homelab visualization.

## Features

- **Real-time Metrics**: Live CPU, memory, disk, and network monitoring
- **Multiple Agents**: Support for multiple agents (one per computer/VM)
- **Automatic Reconnection**: Agents automatically reconnect if the connection is lost
- **Visual Indicators**: Containers with agents show connection status and metrics
- **Secure**: API key authentication for agent connections

## Setup Instructions

### 1. Install the Go Agent

The agent is a Go application that collects system metrics. You can install it in several ways:

#### Option A: Docker (Recommended)
```bash
# Pull the agent image
docker pull your-registry/homelab-agent:latest

# Run the agent
docker run -d \
  --name homelab-agent \
  --restart unless-stopped \
  -e API_KEY="your-secret-api-key" \
  -e SOCKET_PORT=9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  your-registry/homelab-agent:latest
```

#### Option B: Binary Installation
```bash
# Download and build the agent
cd agent
go mod tidy
go build -o agent main.go

# Run the agent
export API_KEY="your-secret-api-key"
./agent
```

### 2. Configure Agent in Homelab Visualiser

1. **Open the Homelab Visualiser** in your browser
2. **Create or Edit** a Computer or VM container
3. **Fill in the basic information**:
   - Name: Your computer/VM name
   - Type: Computer or VM
   - IP Address: The IP address of the machine running the agent
4. **Configure the Agent**:
   - Agent IP Address: IP address where the agent is running
   - Agent Port: Port the agent is listening on (default: 9000)
   - API Key: The same API key you used when starting the agent
5. **Save the container**

### 3. Verify Connection

After saving, you should see:
- A green border on the left side of the container (indicating connected agent)
- Real-time metrics displayed below the container name
- Connection status in the agent configuration section

## Agent Configuration Options

### Environment Variables

The agent supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_KEY` | Secret key for authentication | Required |
| `SOCKET_PORT` | Port for the socket server | 9000 |
| `TLS_ENABLED` | Enable TLS encryption | false |
| `TLS_CERT_FILE` | Path to TLS certificate | - |
| `TLS_KEY_FILE` | Path to TLS private key | - |
| `WHITELISTED_CLIENTS` | Comma-separated list of allowed IPs | - |

### Example Configuration

```bash
# Basic configuration
export API_KEY="my-secret-key-123"
export SOCKET_PORT=9000

# With TLS (recommended for production)
export API_KEY="my-secret-key-123"
export SOCKET_PORT=9000
export TLS_ENABLED=true
export TLS_CERT_FILE="/path/to/cert.pem"
export TLS_KEY_FILE="/path/to/key.pem"

# With IP whitelisting
export API_KEY="my-secret-key-123"
export SOCKET_PORT=9000
export WHITELISTED_CLIENTS="192.168.1.100,192.168.1.101"
```

## Testing the Setup

### Using the Test Agent Simulator

For testing purposes, you can use the included test agent simulator:

```bash
# Run the test agent
node test-agent-simulator.js

# Configure a container with:
# - Agent IP: localhost
# - Agent Port: 9000
# - API Key: test-api-key
```

### Manual Testing

1. Start the agent on a test machine
2. Configure a container in the visualiser
3. Check the connection status
4. Verify real-time metrics are updating

## Troubleshooting

### Common Issues

#### Agent Connection Fails
- **Check IP and Port**: Verify the agent IP and port are correct
- **Check API Key**: Ensure the API key matches between agent and visualiser
- **Check Firewall**: Make sure the agent port is accessible
- **Check Agent Status**: Verify the agent is running and listening

#### No Metrics Displayed
- **Check Agent Data**: Verify the agent is sending data
- **Check Browser Console**: Look for Socket.IO connection errors
- **Check Server Logs**: Review backend logs for connection issues

#### Agent Disconnects Frequently
- **Check Network**: Ensure stable network connection
- **Check Agent Resources**: Verify the agent has sufficient resources
- **Check Reconnection Settings**: The system automatically reconnects with exponential backoff

### Debugging

#### Enable Debug Logging

Add debug logging to the backend:

```javascript
// In backend/server.js, add:
const debug = require('debug')('homelab:agent');
```

#### Check Agent Logs

```bash
# If using Docker
docker logs homelab-agent

# If running binary
./agent 2>&1 | tee agent.log
```

#### Check Backend Logs

The backend logs all agent connection events:

```bash
# Check backend logs
tail -f backend/logs/server.log
```

## Security Considerations

1. **Use Strong API Keys**: Generate random, strong API keys
2. **Enable TLS**: Use TLS encryption in production environments
3. **IP Whitelisting**: Restrict agent connections to trusted IPs
4. **Network Isolation**: Run agents on isolated networks when possible
5. **Regular Updates**: Keep agents and the visualiser updated

## Performance Considerations

1. **Agent Frequency**: Agents send data every 5 seconds by default
2. **Multiple Agents**: The system supports multiple agents simultaneously
3. **Data Storage**: Agent data is stored in `backend/storage/agent-data-*.json`
4. **Memory Usage**: Each agent connection uses minimal memory
5. **Network Usage**: Data transmission is minimal (JSON payloads)

## API Reference

### Agent Data Format

The agent sends JSON data with the following structure:

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
    "network": [...],
    "top_processes": [...]
  },
  "containers": [...],
  "docker_meta": [...],
  "logs": {...}
}
```

### Socket.IO Events

The frontend receives real-time updates via Socket.IO:

- `agent-data`: New agent data received
- `agent-status`: Agent connection status updates

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the agent and backend logs
3. Verify network connectivity and firewall settings
4. Test with the provided test agent simulator 