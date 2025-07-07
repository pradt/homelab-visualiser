const net = require('net');
const fs = require('fs');
const path = require('path');

class AgentClient {
    constructor(host = 'localhost', port = 9000, apiKey) {
        this.host = host;
        this.port = port;
        this.apiKey = apiKey;
        this.client = null;
        this.isConnected = false;
        this.reconnectInterval = null;
        this.dataFile = path.join(__dirname, 'storage', 'agent-data.json');
        
        // Ensure storage directory exists
        const storageDir = path.dirname(this.dataFile);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
    }

    connect() {
        console.log(`[${new Date().toISOString()}] Connecting to agent at ${this.host}:${this.port}`);
        
        this.client = new net.Socket();
        
        this.client.on('connect', () => {
            console.log(`[${new Date().toISOString()}] Connected to agent`);
            this.isConnected = true;
            
            // Send API key for authentication
            this.client.write(this.apiKey + '\n');
        });

        this.client.on('data', (data) => {
            try {
                const lines = data.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    const agentData = JSON.parse(line);
                    this.processAgentData(agentData);
                }
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error parsing agent data:`, error);
            }
        });

        this.client.on('error', (error) => {
            console.error(`[${new Date().toISOString()}] Agent connection error:`, error.message);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            console.log(`[${new Date().toISOString()}] Agent connection closed`);
            this.isConnected = false;
            this.scheduleReconnect();
        });

        this.client.connect(this.port, this.host);
    }

    scheduleReconnect() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
        }
        
        console.log(`[${new Date().toISOString()}] Scheduling reconnect in 5 seconds...`);
        this.reconnectInterval = setTimeout(() => {
            this.connect();
        }, 5000);
    }

    processAgentData(data) {
        console.log(`[${new Date().toISOString()}] Received data from agent`);
        
        // Save the raw agent data
        fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
        
        // Process container data for the frontend
        if (data.containers && Array.isArray(data.containers)) {
            const containerData = data.containers.map(container => ({
                id: container.id,
                name: container.name,
                image: container.image,
                status: container.status,
                cpu_percent: container.cpu_percent || 0,
                memory_usage: container.memory_usage || 0,
                memory_limit: container.memory_limit || 0,
                memory_percent: container.memory_percent || 0,
                network: container.network || {}
            }));
            
            const containersFile = path.join(__dirname, 'storage', 'containers.json');
            fs.writeFileSync(containersFile, JSON.stringify(containerData, null, 2));
        }
    }

    disconnect() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }
        
        this.isConnected = false;
        console.log(`[${new Date().toISOString()}] Disconnected from agent`);
    }

    getStatus() {
        return {
            connected: this.isConnected,
            host: this.host,
            port: this.port
        };
    }
}

module.exports = AgentClient; 