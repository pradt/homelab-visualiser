const express = require('express');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fontAwesomeIcons = require('./icons');
const materialIcons = require('./materialIcons');
const emojiIcons = require('./emoji');
const simpleIcons = require('./simpleIconsList');
const homelabIcons = require('./homelabIconsFull');
const AgentManager = require('./agent-manager');

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'storage', 'containers.json');

const storageDir = path.join(__dirname, 'storage');
const dataFile = path.join(storageDir, 'containers.json');

// Initialize agent manager
const agentManager = new AgentManager(io);

// Ensure storage folder and file exist
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]'); // initialize with empty list
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Load containers and initialize agent connections
function loadContainersAndConnectAgents() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  const containers = JSON.parse(data);
  
  // Connect to agents for Computer and VM types
  containers.forEach(container => {
    if ((container.type === 'Computer' || container.type === 'VM') && container.agent) {
      agentManager.connectToAgent(container.id, container.agent);
    }
  });
  
  return containers;
}

app.get('/api/containers', (req, res) => {
  const containers = loadContainersAndConnectAgents();
  res.json(containers);
});

app.get('/api/icons/fontawesome', (req, res) => {
  res.json(fontAwesomeIcons);
});

app.get('/api/icons/material', (req, res) => {
  res.json(materialIcons);
});

app.get('/api/icons/emoji', (req, res) => {
  res.json(emojiIcons);
});

app.get('/api/icons/simpleicons', (req, res) => {
  res.json(simpleIcons);
});

app.get('/api/icons/homelab', (req, res) => {
  res.json(homelabIcons);
});

app.post('/api/containers', (req, res) => {
  const containers = req.body;
  
  // Handle agent connections for new/updated containers
  containers.forEach(container => {
    if ((container.type === 'Computer' || container.type === 'VM') && container.agent) {
      agentManager.connectToAgent(container.id, container.agent);
    } else {
      // Disconnect if agent config was removed
      agentManager.disconnectAgent(container.id);
    }
  });
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(containers, null, 2));
  res.status(200).json({ status: 'saved' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize agent connections on startup
loadContainersAndConnectAgents();

// Start HTTP server for web interface
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

