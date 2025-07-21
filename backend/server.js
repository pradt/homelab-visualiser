const express = require('express');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fontAwesomeIcons = require('./icons');
const materialIcons = require('./materialIcons');
const emojiIcons = require('./emoji');
const simpleIcons = require('./simpleIconsList');
const homelabIcons = require('./homelabIconsFull');
const AgentManager = require('./agent-manager');
const WidgetManager = require('./widget-manager');

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'storage', 'containers.json');

const storageDir = path.join(__dirname, 'storage');
const dataFile = path.join(storageDir, 'containers.json');
const columnsFile = path.join(storageDir, 'columns.json');

// Initialize managers
const agentManager = new AgentManager(io);
const widgetManager = new WidgetManager();

// Configure multer for file uploads
const upload = multer({ 
  dest: path.join(__dirname, 'storage', 'temp'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed for widget installation'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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

// Widget management endpoints
app.get('/api/widgets', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/widgets - Retrieving all widgets`);
  const widgets = widgetManager.getAvailableWidgets();
  console.log(`[${new Date().toISOString()}] Successfully retrieved ${widgets.length} widgets`);
  res.json(widgets);
});

app.get('/api/widgets/:id', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/widgets/:id - Loading widget with ID: ${req.params.id}`);
  try {
    const widget = await widgetManager.loadWidget(req.params.id);
    console.log(`[${new Date().toISOString()}] Successfully loaded widget: ${req.params.id}`);
    res.json(widget);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error loading widget:`, error);
    res.status(404).json({ error: 'Widget not found' });
  }
});

app.post('/api/widgets', upload.single('widget'), async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/widgets - Installing widget`);
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const widgetId = await widgetManager.installWidget(req.file.path);
    console.log(`[${new Date().toISOString()}] Widget installed successfully with ID: ${widgetId}`);
    res.status(200).json({ status: 'installed', widgetId });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error installing widget:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/widgets/:id', async (req, res) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/widgets/:id - Uninstalling widget with ID: ${req.params.id}`);
  try {
    await widgetManager.uninstallWidget(req.params.id);
    console.log(`[${new Date().toISOString()}] Widget uninstalled successfully with ID: ${req.params.id}`);
    res.status(200).json({ status: 'uninstalled' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error uninstalling widget:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Widget render endpoint
app.get('/api/widgets/:id/render', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/widgets/:id/render - Rendering widget with ID: ${req.params.id}`);
  try {
    const widget = await widgetManager.loadWidget(req.params.id);
    const config = req.query.config ? JSON.parse(decodeURIComponent(req.query.config)) : {};
    
    // Create HTML page for widget
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${widget.manifest.name}</title>
    <style>
        body {
            margin: 0;
            padding: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
        }
        ${widget.css}
    </style>
</head>
<body>
    <div id="widget-root"></div>
    <script>
        // Widget configuration
        const widgetConfig = ${JSON.stringify(config)};
        
        // Widget API
        const widgetAPI = {
            getConfig: () => widgetConfig,
            getElement: () => document.getElementById('widget-root'),
            setSize: (width, height) => {
                const root = document.getElementById('widget-root');
                if (root) {
                    root.style.width = width;
                    root.style.height = height;
                }
            },
            emit: (eventName, data) => {
                window.parent.postMessage({
                    type: 'widget-event',
                    eventName: eventName,
                    data: data
                }, '*');
            }
        };
        
        // Safe fetch with rate limiting
        const safeFetch = async (url, options = {}) => {
            try {
                const response = await fetch(url, options);
                return {
                    ok: response.ok,
                    status: response.status,
                    json: async () => await response.json(),
                    text: async () => await response.text()
                };
            } catch (error) {
                throw new Error('Fetch failed: ' + error.message);
            }
        };
        
        // Safe storage
        const safeStorage = {
            data: {},
            getItem: (key) => safeStorage.data[key] || null,
            setItem: (key, value) => {
                if (typeof key !== 'string' || typeof value !== 'string') {
                    throw new Error('Storage keys and values must be strings');
                }
                if (key.length > 100 || value.length > 10000) {
                    throw new Error('Storage key or value too large');
                }
                safeStorage.data[key] = value;
            },
            removeItem: (key) => delete safeStorage.data[key],
            clear: () => safeStorage.data = {}
        };
        
        // Execute widget code
        try {
            ${widget.code}
            
            // Call render function if it exists
            if (typeof render === 'function') {
                const result = render(widgetConfig);
                if (result && result.nodeType) {
                    document.getElementById('widget-root').appendChild(result);
                }
            }
        } catch (error) {
            console.error('Widget execution error:', error);
            document.getElementById('widget-root').innerHTML = 
                '<div style="padding: 20px; text-align: center; color: #d32f2f; background: #ffebee; border: 1px solid #f44336; border-radius: 4px;">' +
                '<strong>Widget Error:</strong><br>' + error.message + '</div>';
        }
        
        // Handle messages from parent
        window.addEventListener('message', (event) => {
            if (event.data.type === 'widget-config') {
                // Update configuration
                Object.assign(widgetConfig, event.data.config);
                // Re-render if render function exists
                if (typeof render === 'function') {
                    const root = document.getElementById('widget-root');
                    root.innerHTML = '';
                    const result = render(widgetConfig);
                    if (result && result.nodeType) {
                        root.appendChild(result);
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error rendering widget:`, error);
    res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Widget Not Found</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
        }
    </style>
</head>
<body>
    <div style="padding: 20px; text-align: center; color: #d32f2f; background: #ffebee; border: 1px solid #f44336; border-radius: 4px;">
        <strong>Widget Error:</strong><br>Widget not found or failed to load
    </div>
</body>
</html>`);
  }
});

// Widget download endpoint
app.get('/api/widgets/download/clock-widget', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/widgets/download/clock-widget - Downloading clock widget`);
  const widgetPath = path.join(__dirname, '../examples/clock-widget/clock-widget.zip');
  
  if (fs.existsSync(widgetPath)) {
    res.download(widgetPath, 'clock-widget.zip', (err) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] Error downloading widget:`, err);
        res.status(500).json({ error: 'Failed to download widget' });
      }
    });
  } else {
    console.error(`[${new Date().toISOString()}] Widget file not found: ${widgetPath}`);
    res.status(404).json({ error: 'Widget file not found' });
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

