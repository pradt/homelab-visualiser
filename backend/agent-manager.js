const net = require('net');
const fs = require('fs');
const path = require('path');

class AgentManager {
    constructor(io) {
        this.io = io;
        this.agents = new Map(); // Map of containerId -> AgentConnection
        this.agentData = new Map(); // Map of containerId -> latest data
        this.storageDir = path.join(__dirname, 'storage');
        
        // Ensure storage directory exists
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    connectToAgent(containerId, agentConfig) {
        // Disconnect existing connection if any
        this.disconnectAgent(containerId);
        
        console.log(`[${new Date().toISOString()}] Establishing connection to agent for container ${containerId} at ${agentConfig.ip}:${agentConfig.port}`);
        
        const agentConnection = new AgentConnection(
            containerId,
            agentConfig.ip,
            agentConfig.port,
            agentConfig.apiKey,
            this.io,
            this.agentData
        );
        
        this.agents.set(containerId, agentConnection);
        agentConnection.connect();
    }

    disconnectAgent(containerId) {
        const agent = this.agents.get(containerId);
        if (agent) {
            console.log(`[${new Date().toISOString()}] Disconnecting agent for container ${containerId}`);
            agent.disconnect();
            this.agents.delete(containerId);
            this.agentData.delete(containerId);
        }
    }

    getAgentStatus(containerId) {
        const agent = this.agents.get(containerId);
        if (agent) {
            return agent.getStatus();
        }
        return { connected: false, error: 'Agent not configured' };
    }

    getAllAgentStatuses() {
        const statuses = {};
        for (const [containerId, agent] of this.agents) {
            statuses[containerId] = agent.getStatus();
        }
        return statuses;
    }

    getAgentData(containerId) {
        return this.agentData.get(containerId) || null;
    }

    getAllAgentData() {
        return Object.fromEntries(this.agentData);
    }

    processAgentData(containerId, data) {
        console.log(`[${new Date().toISOString()}] Processing data for container ${containerId}`);
        
        // Store the data
        this.agentData.set(containerId, {
            ...data,
            containerId: containerId,
            timestamp: new Date().toISOString()
        });
        
        // Save to file for persistence
        const dataFile = path.join(__dirname, 'storage', `agent-data-${containerId}.json`);
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        
        // Broadcast to all connected frontend clients
        this.io.emit('agent-data', {
            containerId: containerId,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Update agent status to connected
        this.io.emit('agent-status', {
            containerId: containerId,
            status: 'connected',
            timestamp: new Date().toISOString()
        });
    }
}

class AgentConnection {
    constructor(containerId, host, port, apiKey, io, agentData) {
        this.containerId = containerId;
        this.host = host;
        this.port = port;
        this.apiKey = apiKey;
        this.io = io;
        this.agentData = agentData;
        this.client = null;
        this.isConnected = false;
        this.reconnectInterval = null;
        this.lastError = null;
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 10;
    }

    connect() {
        console.log(`[${new Date().toISOString()}] Connecting to agent at ${this.host}:${this.port} for container ${this.containerId}`);
        
        this.client = new net.Socket();
        
        this.client.on('connect', () => {
            console.log(`[${new Date().toISOString()}] Connected to agent for container ${this.containerId}`);
            this.isConnected = true;
            this.connectionAttempts = 0;
            this.lastError = null;
            
            // Send API key for authentication
            this.client.write(this.apiKey + '\n');
            
            // Broadcast connection status to frontend
            this.io.emit('agent-status', {
                containerId: this.containerId,
                status: 'connected',
                timestamp: new Date().toISOString()
            });
        });

        this.client.on('data', (data) => {
            try {
                const lines = data.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    const agentData = JSON.parse(line);
                    this.processAgentData(agentData);
                }
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error parsing agent data for container ${this.containerId}:`, error);
            }
        });

        this.client.on('error', (error) => {
            console.error(`[${new Date().toISOString()}] Agent connection error for container ${this.containerId}:`, error.message);
            this.isConnected = false;
            this.lastError = error.message;
            
            // Broadcast error status to frontend
            this.io.emit('agent-status', {
                containerId: this.containerId,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });

        this.client.on('close', () => {
            console.log(`[${new Date().toISOString()}] Agent connection closed for container ${this.containerId}`);
            this.isConnected = false;
            
            // Broadcast disconnection status to frontend
            this.io.emit('agent-status', {
                containerId: this.containerId,
                status: 'disconnected',
                timestamp: new Date().toISOString()
            });
            
            this.scheduleReconnect();
        });

        this.client.connect(this.port, this.host);
    }

    scheduleReconnect() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
        }
        
        this.connectionAttempts++;
        if (this.connectionAttempts > this.maxReconnectAttempts) {
            console.log(`[${new Date().toISOString()}] Max reconnection attempts reached for container ${this.containerId}`);
            return;
        }
        
        const delay = Math.min(5000 * this.connectionAttempts, 30000); // Exponential backoff, max 30s
        console.log(`[${new Date().toISOString()}] Scheduling reconnect for container ${this.containerId} in ${delay}ms (attempt ${this.connectionAttempts})`);
        
        this.reconnectInterval = setTimeout(() => {
            this.connect();
        }, delay);
    }

    processAgentData(data) {
        console.log(`[${new Date().toISOString()}] Received data from agent for container ${this.containerId}`);
        
        // Store the data
        this.agentData.set(this.containerId, {
            ...data,
            containerId: this.containerId,
            timestamp: new Date().toISOString()
        });
        
        // Save to file for persistence
        const dataFile = path.join(__dirname, 'storage', `agent-data-${this.containerId}.json`);
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        
        // Broadcast to all connected frontend clients
        this.io.emit('agent-data', {
            containerId: this.containerId,
            data: data,
            timestamp: new Date().toISOString()
        });
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
        console.log(`[${new Date().toISOString()}] Disconnected from agent for container ${this.containerId}`);
    }

    getStatus() {
        return {
            connected: this.isConnected,
            host: this.host,
            port: this.port,
            lastError: this.lastError,
            connectionAttempts: this.connectionAttempts
        };
    }
}

module.exports = AgentManager; 