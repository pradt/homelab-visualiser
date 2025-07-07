const net = require('net');

// Test agent simulator that mimics the Go agent
class TestAgentSimulator {
    constructor(port = 9000, apiKey = 'test-api-key') {
        this.port = port;
        this.apiKey = apiKey;
        this.server = null;
        this.clients = new Set();
    }

    start() {
        console.log(`[${new Date().toISOString()}] Test agent starting on port ${this.port}`);
        
        this.server = net.createServer((socket) => {
            console.log(`[${new Date().toISOString()}] Backend connected from ${socket.remoteAddress}:${socket.remotePort}`);
            
            let authenticated = false;
            
            socket.on('data', (data) => {
                const lines = data.toString().split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (!authenticated) {
                        // Expect API key from backend
                        const receivedApiKey = line.trim();
                        console.log(`[${new Date().toISOString()}] Received API key: ${receivedApiKey}`);
                        
                        if (receivedApiKey === this.apiKey) {
                            authenticated = true;
                            this.clients.add(socket);
                            console.log(`[${new Date().toISOString()}] Backend authenticated successfully`);
                            
                            // Start sending mock data to this client
                            this.startSendingData(socket);
                        } else {
                            console.log(`[${new Date().toISOString()}] Invalid API key, closing connection`);
                            socket.write('Unauthorized\n');
                            socket.destroy();
                            return;
                        }
                    } else {
                        // Handle any other data from backend (if needed)
                        console.log(`[${new Date().toISOString()}] Received data from backend: ${line}`);
                    }
                }
            });
            
            socket.on('error', (error) => {
                console.error(`[${new Date().toISOString()}] Socket error:`, error.message);
            });
            
            socket.on('close', () => {
                console.log(`[${new Date().toISOString()}] Backend disconnected`);
                this.clients.delete(socket);
            });
        });
        
        this.server.on('error', (error) => {
            console.error(`[${new Date().toISOString()}] Server error:`, error.message);
        });
        
        this.server.listen(this.port, () => {
            console.log(`[${new Date().toISOString()}] Test agent listening on port ${this.port}`);
            console.log(`[${new Date().toISOString()}] API Key: ${this.apiKey}`);
            console.log(`[${new Date().toISOString()}] Ready to accept connections from backend...`);
        });
    }

    startSendingData(socket) {
        const interval = setInterval(() => {
            if (socket.destroyed) {
                clearInterval(interval);
                return;
            }
            
            const mockData = this.generateMockData();
            console.log(`[${new Date().toISOString()}] Sending mock data to backend`);
            socket.write(JSON.stringify(mockData) + '\n');
        }, 5000); // Send data every 5 seconds
        
        // Store interval reference for cleanup
        socket.dataInterval = interval;
    }

    generateMockData() {
        const now = new Date();
        const cpuPercent = Math.random() * 100;
        const memoryUsed = 4000 + Math.random() * 8000; // 4-12 GB
        const memoryTotal = 16384; // 16 GB
        const diskUsed = 50 + Math.random() * 200; // 50-250 GB
        const diskTotal = 500; // 500 GB
        const uptime = Math.floor(Math.random() * 86400 * 30); // 0-30 days

        return {
            timestamp: now.toISOString(),
            status: "ok",
            system: {
                cpu_percent: [cpuPercent],
                memory_used: memoryUsed,
                memory_total: memoryTotal,
                disk_used: diskUsed,
                disk_total: diskTotal,
                uptime: uptime,
                load_avg: {
                    "1m": Math.random() * 2,
                    "5m": Math.random() * 2,
                    "15m": Math.random() * 2
                },
                network: [
                    {
                        name: "eth0",
                        bytes_sent: Math.floor(Math.random() * 1000000),
                        bytes_recv: Math.floor(Math.random() * 2000000),
                        packets_sent: Math.floor(Math.random() * 1000),
                        packets_recv: Math.floor(Math.random() * 2000)
                    }
                ],
                top_processes: [
                    {
                        name: "nginx",
                        cpu: Math.random() * 10,
                        mem: Math.random() * 5,
                        pid: Math.floor(Math.random() * 10000)
                    }
                ]
            },
            containers: [
                {
                    id: "test-container-1",
                    name: "/test-nginx",
                    image: "nginx:latest",
                    status: "running",
                    cpu_percent: Math.random() * 5,
                    memory_usage: Math.random() * 100000000,
                    memory_limit: 1073741824,
                    memory_percent: Math.random() * 10,
                    network: {
                        eth0: {
                            rx_bytes: Math.floor(Math.random() * 1000000),
                            tx_bytes: Math.floor(Math.random() * 500000),
                            rx_packets: Math.floor(Math.random() * 1000),
                            tx_packets: Math.floor(Math.random() * 500)
                        }
                    }
                }
            ],
            docker_meta: [
                {
                    id: "test-container-1",
                    names: ["/test-nginx"],
                    image: "nginx:latest",
                    status: "running",
                    state: "running",
                    ports: [],
                    created: Math.floor(now.getTime() / 1000) - 86400
                }
            ],
            logs: {
                "test-nginx": [
                    `${now.toISOString()} [INFO] Server started`,
                    `${now.toISOString()} [INFO] Listening on port 80`
                ]
            }
        };
    }

    stop() {
        console.log(`[${new Date().toISOString()}] Shutting down test agent...`);
        
        // Close all client connections
        for (const client of this.clients) {
            if (client.dataInterval) {
                clearInterval(client.dataInterval);
            }
            client.destroy();
        }
        this.clients.clear();
        
        // Close server
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        
        console.log(`[${new Date().toISOString()}] Test agent stopped`);
    }
}

// Usage example
if (require.main === module) {
    const agent = new TestAgentSimulator(9000, 'test-api-key');
    agent.start();
    
    // Keep the process running
    process.on('SIGINT', () => {
        agent.stop();
        process.exit(0);
    });
}

module.exports = TestAgentSimulator; 