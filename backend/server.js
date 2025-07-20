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
const columnsFile = path.join(storageDir, 'columns.json');

// Initialize agent manager
const agentManager = new AgentManager(io);

// Ensure storage folder and file exist
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]'); // initialize with empty list
}
if (!fs.existsSync(columnsFile)) {
  fs.writeFileSync(columnsFile, '[]'); // initialize with empty columns list
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

// Column configuration endpoints
app.get('/api/columns', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/columns - Retrieving column configurations`);
  
  if (!fs.existsSync(columnsFile)) {
    console.log(`[${new Date().toISOString()}] Columns file does not exist, returning empty array`);
    fs.writeFileSync(columnsFile, '[]');
    return res.json([]);
  }
  
  try {
    const data = fs.readFileSync(columnsFile, 'utf-8');
    const columns = JSON.parse(data);
    console.log(`[${new Date().toISOString()}] Successfully retrieved ${columns.length} columns`);
    res.json(columns);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error reading columns file:`, error);
    res.status(500).json({ error: 'Failed to read columns configuration' });
  }
});

app.post('/api/columns', (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/columns - Saving column configurations`);
  
  try {
    const columns = req.body;
    
    // Validate that it's an array
    if (!Array.isArray(columns)) {
      return res.status(400).json({ error: 'Columns data must be an array' });
    }
    
    // Save to file
    fs.writeFileSync(columnsFile, JSON.stringify(columns, null, 2));
    console.log(`[${new Date().toISOString()}] Successfully saved ${columns.length} columns`);
    res.status(200).json({ status: 'saved' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error saving columns:`, error);
    res.status(500).json({ error: 'Failed to save columns configuration' });
  }
});

// Custom View Container configuration endpoints
app.get('/api/custom-view-containers', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/custom-view-containers - Retrieving custom view container configurations`);
  
  if (!fs.existsSync(columnsFile)) {
    console.log(`[${new Date().toISOString()}] Custom view containers file does not exist, returning empty array`);
    fs.writeFileSync(columnsFile, '[]');
    return res.json([]);
  }
  
  try {
    const data = fs.readFileSync(columnsFile, 'utf-8');
    const containers = JSON.parse(data);
    console.log(`[${new Date().toISOString()}] Successfully retrieved ${containers.length} custom view containers`);
    res.json(containers);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error reading custom view containers file:`, error);
    res.status(500).json({ error: 'Failed to read custom view container configuration' });
  }
});

app.post('/api/custom-view-containers', (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/custom-view-containers - Saving custom view container configurations`);
  
  try {
    const containers = req.body;
    
    // Validate that it's an array
    if (!Array.isArray(containers)) {
      return res.status(400).json({ error: 'Custom view containers data must be an array' });
    }
    
    // Save to file
    fs.writeFileSync(columnsFile, JSON.stringify(containers, null, 2));
    console.log(`[${new Date().toISOString()}] Successfully saved ${containers.length} custom view containers`);
    res.status(200).json({ status: 'saved' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error saving custom view containers:`, error);
    res.status(500).json({ error: 'Failed to save custom view container configuration' });
  }
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

