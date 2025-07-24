# Widget Development Handbook

## Overview

The Homelab-Visualiser Widget System allows third-party developers to create custom widgets that can be installed and used within the Custom View. Widgets are modular components that can display dynamic content, interact with external APIs, and provide useful functionality to users.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Widget Structure](#widget-structure)
3. [Widget Manifest](#widget-manifest)
4. [Widget Code](#widget-code)
5. [Widget API](#widget-api)
6. [Configuration System](#configuration-system)
7. [Styling](#styling)
8. [Security Considerations](#security-considerations)
9. [Testing](#testing)
10. [Distribution](#distribution)
11. [Examples](#examples)

## Getting Started

### Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- Understanding of JSON
- Familiarity with web APIs (optional, for external data)

### Development Environment

1. **Local Testing**: You can test widgets locally before packaging
2. **Widget Package**: Create a ZIP file containing your widget files
3. **Installation**: Upload the ZIP file through the Widget Gallery

## Widget Structure

A widget consists of the following files packaged in a ZIP archive:

```
my-widget/
├── manifest.json      # Widget metadata and configuration
├── widget.js          # Main widget code
├── widget.css         # Widget styles (optional)
├── assets/            # Additional assets (optional)
│   ├── icon.svg
│   └── preview.png
└── README.md          # Documentation (optional)
```

### Required Files

- **manifest.json**: Contains widget metadata and configuration schema
- **widget.js**: Contains the main widget logic

### Optional Files

- **widget.css**: Custom styles for the widget
- **assets/**: Directory for images, icons, or other assets
- **README.md**: Documentation for your widget

## Widget Manifest

The `manifest.json` file defines your widget's metadata and configuration options.

### Basic Manifest Structure

```json
{
  "id": "com.example.my-widget",
  "name": "My Widget",
  "version": "1.0.0",
  "description": "A description of what your widget does",
  "author": "Your Name",
  "category": "Utility",
  "icon": "🕐",
  "entryPoint": "widget.js",
  "configSchema": {
    "title": {
      "type": "string",
      "default": "My Widget",
      "description": "Widget title"
    },
    "refreshInterval": {
      "type": "number",
      "default": 30,
      "description": "Refresh interval in seconds"
    }
  },
  "permissions": ["dom", "storage"],
  "dependencies": []
}
```

### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for your widget |
| `name` | string | Yes | Display name of the widget |
| `version` | string | Yes | Semantic version (e.g., "1.0.0") |
| `description` | string | Yes | Brief description of the widget |
| `author` | string | Yes | Your name or organization |
| `category` | string | Yes | Widget category (Utility, Monitoring, etc.) |
| `icon` | string | Yes | Emoji or icon for the widget |
| `entryPoint` | string | Yes | Main JavaScript file (usually "widget.js") |
| `configSchema` | object | No | Configuration options schema |
| `permissions` | array | No | Required permissions |
| `dependencies` | array | No | External dependencies |

### Configuration Schema

The `configSchema` defines what configuration options your widget accepts:

```json
{
  "configSchema": {
    "apiKey": {
      "type": "string",
      "default": "",
      "description": "API Key for external service"
    },
    "updateInterval": {
      "type": "range",
      "min": 5,
      "max": 300,
      "default": 60,
      "description": "Update interval in seconds"
    },
    "showTitle": {
      "type": "boolean",
      "default": true,
      "description": "Show widget title"
    },
    "theme": {
      "type": "select",
      "options": ["light", "dark", "auto"],
      "default": "auto",
      "description": "Widget theme"
    },
    "fontSize": {
      "type": "range",
      "min": 12,
      "max": 24,
      "default": 16,
      "description": "Font size in pixels"
    },
    "textColor": {
      "type": "color",
      "default": "#000000",
      "description": "Text color"
    }
  }
}
```

### Configuration Field Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text input | API keys, titles, URLs |
| `number` | Numeric input | Intervals, limits, sizes |
| `boolean` | Checkbox | Enable/disable features |
| `select` | Dropdown selection | Themes, modes, options |
| `range` | Slider input | Sizes, intervals, percentages |
| `color` | Color picker | Text colors, backgrounds |

### Sensitive Configuration Fields

For fields containing sensitive information like API keys, passwords, or tokens, you can mark them as sensitive:

```json
{
  "configSchema": {
    "apiKey": {
      "type": "string",
      "default": "",
      "description": "API Key for external service",
      "sensitive": true
    }
  }
}
```

**How it works:**
- Fields marked with `"sensitive": true` are automatically encrypted when saved
- The encryption key is set via the `WIDGET_ENCRYPTION_KEY` environment variable
- Sensitive fields are decrypted automatically when the widget needs them
- If no encryption key is set, sensitive fields are stored in plain text (with a warning)

**For users:**
- Set the `WIDGET_ENCRYPTION_KEY` environment variable to a secure random string
- Example: `WIDGET_ENCRYPTION_KEY=your-secure-32-character-key-here`
- The key should be at least 32 characters long for AES-256 encryption

**Security benefits:**
- API keys and other secrets are encrypted at rest
- Even if someone gains access to the configuration files, they can't read sensitive data
- Each sensitive field is encrypted with a unique initialization vector

## Widget Code

The `widget.js` file contains your widget's main logic. It must export a `render` function.

### Basic Widget Structure

```javascript
(function() {
  let widgetElement = null;
  let updateInterval = null;
  
  // Main render function - called when widget is loaded or config changes
  function render(config) {
    // Create widget element
    widgetElement = document.createElement('div');
    widgetElement.className = 'my-widget';
    
    // Apply configuration
    applyConfig(config);
    
    // Initialize widget
    initializeWidget();
    
    // Start updates if needed
    if (config.updateInterval) {
      startUpdates(config.updateInterval);
    }
    
    return widgetElement;
  }
  
  // Apply configuration to widget
  function applyConfig(config) {
    if (widgetElement) {
      widgetElement.style.fontSize = (config.fontSize || 16) + 'px';
      widgetElement.style.color = config.textColor || '#000000';
      
      if (config.showTitle) {
        widgetElement.innerHTML = `
          <h3>${config.title || 'My Widget'}</h3>
          <div class="widget-content">
            <p>Widget content goes here</p>
          </div>
        `;
      } else {
        widgetElement.innerHTML = `
          <div class="widget-content">
            <p>Widget content goes here</p>
          </div>
        `;
      }
    }
  }
  
  // Initialize widget functionality
  function initializeWidget() {
    // Add event listeners, fetch initial data, etc.
    loadData();
  }
  
  // Load data from external source
  async function loadData() {
    try {
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();
      updateDisplay(data);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load data');
    }
  }
  
  // Update widget display
  function updateDisplay(data) {
    const content = widgetElement.querySelector('.widget-content');
    if (content) {
      content.innerHTML = `
        <p>Data: ${JSON.stringify(data)}</p>
      `;
    }
  }
  
  // Show error message
  function showError(message) {
    if (widgetElement) {
      widgetElement.innerHTML = `
        <div class="widget-error">
          <p>${message}</p>
        </div>
      `;
    }
  }
  
  // Start periodic updates
  function startUpdates(interval) {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
      loadData();
    }, interval * 1000);
  }
  
  // Cleanup function (optional)
  function cleanup() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
  
  // Expose render function globally
  window.render = render;
})();
```

### Widget Lifecycle

1. **Initialization**: Widget code is loaded and executed
2. **Rendering**: `render(config)` function is called with initial configuration
3. **Configuration Changes**: When user changes config, `render(config)` is called again
4. **Cleanup**: Widget is destroyed when removed or page unloads

## Widget API

The widget system provides a safe API for widgets to interact with the host environment.

### Available APIs

#### widgetAPI Object

```javascript
const widgetAPI = {
  // Get current configuration
  getConfig: () => config,
  
  // Get widget root element
  getElement: () => document.getElementById('widget-root'),
  
  // Set widget size
  setSize: (width, height) => {
    const root = document.getElementById('widget-root');
    if (root) {
      root.style.width = width;
      root.style.height = height;
    }
  },
  
  // Emit events to parent
  emit: (eventName, data) => {
    window.parent.postMessage({
      type: 'widget-event',
      eventName: eventName,
      data: data
    }, '*');
  }
};
```

#### Safe Fetch API

```javascript
// Limited fetch with rate limiting
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

**Allowed Domains:**
- `api.openweathermap.org`
- `api.github.com`
- `api.youtube.com`
- `localhost`
- `127.0.0.1`

**Rate Limits:**
- Maximum 10 requests per minute per domain
- Requests are automatically throttled

#### Safe Storage API

```javascript
// Local storage with size limits
localStorage.setItem('myKey', 'myValue');
const value = localStorage.getItem('myKey');
localStorage.removeItem('myKey');
localStorage.clear();
```

**Limits:**
- Key length: 100 characters
- Value length: 10,000 characters
- Keys and values must be strings

### Global Objects

| Object | Description | Restrictions |
|--------|-------------|--------------|
| `console` | Logging | Limited to widget context |
| `setTimeout` | Delayed execution | Available |
| `setInterval` | Periodic execution | Available |
| `Date` | Date/time utilities | Available |
| `Math` | Mathematical functions | Available |
| `JSON` | JSON parsing/stringifying | Available |

## Configuration System

### Accessing Configuration

```javascript
function render(config) {
  // config contains all user-defined settings
  const title = config.title || 'Default Title';
  const interval = config.updateInterval || 30;
  const showTitle = config.showTitle !== false; // default to true
  
  // Use configuration in your widget
  widgetElement.innerHTML = `
    ${showTitle ? `<h3>${title}</h3>` : ''}
    <div class="content">
      Update interval: ${interval} seconds
    </div>
  `;
}
```

### Configuration Validation

The system automatically validates configuration based on your schema:

- **String fields**: Must be strings
- **Number fields**: Must be numbers
- **Boolean fields**: Must be true/false
- **Select fields**: Must be one of the defined options
- **Range fields**: Must be within min/max bounds
- **Color fields**: Must be valid CSS colors

## Styling

### CSS File

Create a `widget.css` file for your widget styles:

```css
.my-widget {
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.my-widget h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.widget-content {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.widget-error {
  color: #d32f2f;
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
}

.widget-loading {
  text-align: center;
  color: #666;
  padding: 20px;
}
```

### CSS Isolation

- Widget CSS is scoped to the widget iframe
- No conflicts with host page styles
- Use specific class names to avoid conflicts

### Responsive Design

```css
/* Make widgets responsive */
.my-widget {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .my-widget {
    padding: 10px;
    font-size: 14px;
  }
}
```

## Widget Styling Best Practices

Homelab-Visualiser provides a rich set of built-in style configuration options for widgets, including:
- Widget Name
- Hide widget header
- Background Type (color, gradient, CSS)
- Background Color
- Background Transparency
- Border Color, Size, Style, and Custom CSS
- Additional Styles (Custom CSS, Border Radius, Box Shadow, Padding, Margin)

These are automatically available in the widget configuration modal and are passed to your widget as part of the `config.styling` object.

### How to Use Styling in Your Widget

In your widget's `render` function, you can apply these styles to your root element:

```js
function render(config) {
  const el = document.createElement('div');
  // Apply background
  if (config.styling) {
    if (config.styling.bgType === 'color') {
      el.style.background = config.styling.backgroundColor || '#fff';
    } else if (config.styling.bgType === 'gradient') {
      el.style.background = config.styling.backgroundGradient || '';
    } else if (config.styling.bgType === 'css') {
      el.style.cssText += config.styling.backgroundCSS || '';
    }
    // Transparency
    if (config.styling.backgroundOpacity !== undefined) {
      el.style.opacity = config.styling.backgroundOpacity / 100;
    }
    // Border
    el.style.borderColor = config.styling.borderColor || '#e0e0e0';
    el.style.borderWidth = (config.styling.borderSize || 1) + 'px';
    el.style.borderStyle = config.styling.borderStyle || 'solid';
    if (config.styling.borderCSS) {
      el.style.cssText += config.styling.borderCSS;
    }
    // Additional styles
    el.style.borderRadius = (config.styling.borderRadius || 8) + 'px';
    el.style.boxShadow = config.styling.boxShadow || '0 2px 4px rgba(0,0,0,0.1)';
    el.style.padding = (config.styling.padding || 10) + 'px';
    el.style.margin = (config.styling.margin || 5) + 'px';
    if (config.styling.customCSS) {
      el.style.cssText += config.styling.customCSS;
    }
  }
  // ... rest of your widget rendering ...
  return el;
}
```

**Tip:** Always check for the presence of `config.styling` and provide sensible defaults.

### Example: Applying All Styles

```js
(function() {
  function render(config) {
    const el = document.createElement('div');
    // Apply all built-in styles
    if (config.styling) {
      // ... (see above for details) ...
    }
    // Widget content here
    el.textContent = config.name || 'Widget';
    return el;
  }
  window.render = render;
})();
```

By following this pattern, your widget will automatically respect all user-configured style options from the dashboard UI.

## Security Considerations

### Sandboxing

Widgets run in isolated iframes with limited access:

- **No DOM access** to parent page
- **Limited fetch** to approved domains
- **Rate limiting** on API calls
- **Size limits** on storage
- **Timeout limits** on execution

### Best Practices

1. **Validate Input**: Always validate configuration and user input
2. **Error Handling**: Handle errors gracefully
3. **Resource Limits**: Be mindful of memory and CPU usage
4. **Secure APIs**: Use HTTPS for external API calls
5. **No Sensitive Data**: Don't store sensitive information in widgets

### Restricted Operations

- File system access
- Network access to unauthorized domains
- Access to parent page DOM
- Access to browser APIs (camera, microphone, etc.)
- Cross-origin requests to unauthorized domains

## Testing

### Local Testing

1. Create your widget files
2. Test in a local HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
    <link rel="stylesheet" href="widget.css">
</head>
<body>
    <div id="widget-root"></div>
    <script src="widget.js"></script>
    <script>
        // Test your widget
        const config = {
            title: "Test Widget",
            updateInterval: 30,
            showTitle: true
        };
        
        const result = render(config);
        document.getElementById('widget-root').appendChild(result);
    </script>
</body>
</html>
```

### Package Testing

1. Create your widget package (ZIP file)
2. Install in Homelab-Visualiser
3. Test in Custom View
4. Verify configuration options work
5. Test error handling

### Common Issues

- **Widget not loading**: Check manifest.json syntax
- **Configuration not working**: Verify configSchema structure
- **API calls failing**: Check domain allowlist
- **Styling issues**: Ensure CSS is properly scoped

## Distribution

### Creating Widget Package

1. **Organize Files**: Ensure all required files are present
2. **Test Locally**: Verify widget works in test environment
3. **Create ZIP**: Package all files in a ZIP archive
4. **Test Package**: Install and test in Homelab-Visualiser

### Package Structure Example

```
clock-widget.zip
├── manifest.json
├── widget.js
├── widget.css
├── assets/
│   └── icon.svg
└── README.md
```

### Installation

1. Open Homelab-Visualiser
2. Go to Custom View
3. Click "🔧 Widgets" button
4. Click "Upload Widget"
5. Select your ZIP file
6. Widget will be installed and available

### Distribution Channels

- **Direct Distribution**: Share ZIP files directly
- **GitHub**: Host widget packages on GitHub
- **Widget Marketplace**: Future feature for centralized distribution

## Examples

### Example 1: Clock Widget

**manifest.json:**
```json
{
  "id": "com.example.clock-widget",
  "name": "Clock Widget",
  "version": "1.0.0",
  "description": "Displays current time with configurable timezone",
  "author": "Widget Developer",
  "category": "Utility",
  "icon": "🕐",
  "entryPoint": "widget.js",
  "configSchema": {
    "timezone": {
      "type": "string",
      "default": "UTC",
      "description": "Timezone to display"
    },
    "format": {
      "type": "select",
      "options": ["12h", "24h"],
      "default": "24h",
      "description": "Time format"
    },
    "fontColor": {
      "type": "color",
      "default": "#000000",
      "description": "Text color"
    },
    "fontSize": {
      "type": "range",
      "min": 12,
      "max": 48,
      "default": 24,
      "description": "Font size"
    }
  }
}
```

**widget.js:**
```javascript
(function() {
  let updateInterval = null;
  
  function render(config) {
    const widgetElement = document.createElement('div');
    widgetElement.className = 'clock-widget';
    
    // Apply styling
    widgetElement.style.color = config.fontColor || '#000000';
    widgetElement.style.fontSize = (config.fontSize || 24) + 'px';
    widgetElement.style.textAlign = 'center';
    widgetElement.style.padding = '20px';
    
    function updateTime() {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        timeZone: config.timezone || 'UTC',
        hour12: config.format === '12h'
      });
      
      widgetElement.innerHTML = `
        <div class="time">${timeString}</div>
        <div class="date">${now.toLocaleDateString()}</div>
      `;
    }
    
    // Update time immediately
    updateTime();
    
    // Update every second
    updateInterval = setInterval(updateTime, 1000);
    
    return widgetElement;
  }
  
  // Cleanup on widget removal
  function cleanup() {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  }
  
  window.render = render;
})();
```

**widget.css:**
```css
.clock-widget {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.clock-widget .time {
  font-size: 1.2em;
  margin-bottom: 5px;
}

.clock-widget .date {
  font-size: 0.8em;
  opacity: 0.7;
}
```

### Example 2: Weather Widget

**manifest.json:**
```json
{
  "id": "com.example.weather-widget",
  "name": "Weather Widget",
  "version": "1.0.0",
  "description": "Displays current weather for a location",
  "author": "Widget Developer",
  "category": "Utility",
  "icon": "🌤️",
  "entryPoint": "widget.js",
  "configSchema": {
    "apiKey": {
      "type": "string",
      "default": "",
      "description": "OpenWeatherMap API Key"
    },
    "city": {
      "type": "string",
      "default": "London",
      "description": "City name"
    },
    "units": {
      "type": "select",
      "options": ["metric", "imperial"],
      "default": "metric",
      "description": "Temperature units"
    },
    "updateInterval": {
      "type": "range",
      "min": 300,
      "max": 3600,
      "default": 1800,
      "description": "Update interval in seconds"
    }
  }
}
```

**widget.js:**
```javascript
(function() {
  let updateInterval = null;
  
  function render(config) {
    const widgetElement = document.createElement('div');
    widgetElement.className = 'weather-widget';
    
    if (!config.apiKey) {
      widgetElement.innerHTML = `
        <div class="error">
          Please configure your OpenWeatherMap API key
        </div>
      `;
      return widgetElement;
    }
    
    async function loadWeather() {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(config.city)}&appid=${config.apiKey}&units=${config.units}`
        );
        
        if (!response.ok) {
          throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        
        const temp = Math.round(data.main.temp);
        const unit = config.units === 'metric' ? '°C' : '°F';
        const description = data.weather[0].description;
        const icon = data.weather[0].icon;
        
        widgetElement.innerHTML = `
          <div class="weather-content">
            <div class="location">${data.name}</div>
            <div class="temperature">${temp}${unit}</div>
            <div class="description">${description}</div>
            <div class="icon">${getWeatherIcon(icon)}</div>
          </div>
        `;
      } catch (error) {
        widgetElement.innerHTML = `
          <div class="error">
            Failed to load weather data
          </div>
        `;
      }
    }
    
    function getWeatherIcon(iconCode) {
      const icons = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '🌨️', '13n': '🌨️',
        '50d': '🌫️', '50n': '🌫️'
      };
      return icons[iconCode] || '🌤️';
    }
    
    // Load weather immediately
    loadWeather();
    
    // Set up periodic updates
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(loadWeather, (config.updateInterval || 1800) * 1000);
    
    return widgetElement;
  }
  
  window.render = render;
})();
```

## Extending the Backend with Plugins

### Overview

Homelab-Visualiser now supports backend plugins, allowing advanced widgets to securely extend backend functionality. Plugins are Node.js modules placed in the `backend/plugins/` directory. Each plugin can expose functions that can be called via HTTP endpoints.

### How Plugins Work
- Plugins are loaded by the backend at startup.
- Each plugin must export an object with an `id`, `description`, and one or more functions.
- Plugins run in a sandboxed environment for security.
- Widgets (or other clients) can call plugin functions via HTTP POST requests to `/api/plugins/:id/:function`.

### Creating a Plugin

1. Create a new file in `backend/plugins/`, e.g. `my-plugin.js`:

```js
module.exports = {
  id: 'my-plugin',
  description: 'Does something useful.',
  doSomething: async ({ input }) => {
    // Your backend logic here
    return { message: `You sent: ${input}` };
  }
};
```

2. Restart the backend server to load new plugins.

### Example Plugin

`backend/plugins/hello-plugin.js`:
```js
module.exports = {
  id: 'hello-plugin',
  description: 'A sample plugin that greets the user.',
  greet: async ({ name }) => {
    return `Hello, ${name || 'World'}!`;
  }
};
```

### Calling a Plugin from a Widget

Widgets can call backend plugin functions using `fetch`:

```js
const response = await fetch('/api/plugins/hello-plugin/greet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice' })
});
const data = await response.json();
console.log(data.result); // "Hello, Alice!"
```

### Security Considerations
- Plugins run in a sandbox, but can access backend resources. Only install plugins from trusted sources.
- Review plugin code before enabling.
- All plugin actions are logged by the backend.
- If a plugin misbehaves, remove its file from `backend/plugins/` and restart the server.

### Best Practices
- Document your plugin's API and expected arguments.
- Handle errors gracefully in plugin code.
- Avoid long-running or blocking operations in plugins.

