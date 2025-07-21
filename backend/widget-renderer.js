const vm = require('vm');
const path = require('path');

class WidgetRenderer {
  constructor() {
    this.createSandbox();
  }

  createSandbox() {
    this.sandbox = {
      console: {
        log: (...args) => console.log('[Widget]', ...args),
        error: (...args) => console.error('[Widget]', ...args),
        warn: (...args) => console.warn('[Widget]', ...args)
      },
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      Date: Date,
      Math: Math,
      JSON: JSON,
      // Limited fetch API for widgets
      fetch: this.createSafeFetch(),
      // Safe storage API
      localStorage: this.createSafeStorage(),
      // Widget API
      widgetAPI: this.createWidgetAPI()
    };
  }

  createSafeFetch() {
    return async (url, options = {}) => {
      // Only allow specific domains or local API calls
      const allowedDomains = [
        'api.openweathermap.org',
        'api.github.com',
        'api.youtube.com',
        'localhost',
        '127.0.0.1'
      ];
      
      const urlObj = new URL(url);
      if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
        throw new Error('Domain not allowed for widget requests');
      }
      
      // Rate limiting - max 10 requests per minute per widget
      const now = Date.now();
      if (!this.requestCount) this.requestCount = {};
      if (!this.requestCount[urlObj.hostname]) {
        this.requestCount[urlObj.hostname] = { count: 0, resetTime: now + 60000 };
      }
      
      if (now > this.requestCount[urlObj.hostname].resetTime) {
        this.requestCount[urlObj.hostname] = { count: 0, resetTime: now + 60000 };
      }
      
      if (this.requestCount[urlObj.hostname].count >= 10) {
        throw new Error('Rate limit exceeded');
      }
      
      this.requestCount[urlObj.hostname].count++;
      
      try {
        const response = await fetch(url, options);
        return {
          ok: response.ok,
          status: response.status,
          json: async () => await response.json(),
          text: async () => await response.text()
        };
      } catch (error) {
        throw new Error(`Fetch failed: ${error.message}`);
      }
    };
  }

  createSafeStorage() {
    const storage = {};
    return {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => {
        if (typeof key !== 'string' || typeof value !== 'string') {
          throw new Error('Storage keys and values must be strings');
        }
        if (key.length > 100 || value.length > 10000) {
          throw new Error('Storage key or value too large');
        }
        storage[key] = value;
      },
      removeItem: (key) => delete storage[key],
      clear: () => Object.keys(storage).forEach(key => delete storage[key])
    };
  }

  createWidgetAPI() {
    return {
      // Get widget configuration
      getConfig: () => this.currentConfig || {},
      
      // Get widget element
      getElement: () => this.currentElement,
      
      // Set widget size
      setSize: (width, height) => {
        if (this.currentElement) {
          this.currentElement.style.width = width;
          this.currentElement.style.height = height;
        }
      },
      
      // Emit events to parent
      emit: (eventName, data) => {
        if (this.currentElement) {
          this.currentElement.dispatchEvent(new CustomEvent('widget-event', {
            detail: { eventName, data }
          }));
        }
      }
    };
  }

  renderWidget(widgetId, config = {}, element = null) {
    try {
      this.currentConfig = config;
      this.currentElement = element;
      
      // Create isolated context
      const context = vm.createContext(this.sandbox);
      
      // Load widget code (this would be passed from the widget manager)
      const widgetCode = this.getWidgetCode(widgetId);
      
      // Execute widget code
      const script = new vm.Script(widgetCode);
      script.runInContext(context, { timeout: 5000 });
      
      // Call widget render function if it exists
      if (typeof context.render === 'function') {
        return context.render(config);
      } else {
        throw new Error('Widget must export a render function');
      }
    } catch (error) {
      console.error('Widget execution error:', error);
      return this.createErrorWidget(error.message);
    }
  }

  getWidgetCode(widgetId) {
    // This would be loaded from the widget manager
    // For now, return a placeholder
    return `
      function render(config) {
        const element = document.createElement('div');
        element.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Widget ${widgetId} loaded</div>';
        return element;
      }
    `;
  }

  createErrorWidget(errorMessage) {
    const errorElement = document.createElement('div');
    errorElement.className = 'widget-error';
    errorElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #d32f2f; background: #ffebee; border: 1px solid #f44336; border-radius: 4px;">
        <strong>Widget Error:</strong><br>
        ${errorMessage}
      </div>
    `;
    return errorElement;
  }

  // Clean up resources
  cleanup() {
    this.currentConfig = null;
    this.currentElement = null;
    if (this.requestCount) {
      Object.keys(this.requestCount).forEach(hostname => {
        if (Date.now() > this.requestCount[hostname].resetTime) {
          delete this.requestCount[hostname];
        }
      });
    }
  }
}

module.exports = WidgetRenderer; 