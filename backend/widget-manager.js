const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');

class WidgetManager {
  constructor() {
    this.widgetsDir = path.join(__dirname, 'storage', 'widgets');
    this.installedWidgets = new Map();
    this.registryFile = path.join(__dirname, 'storage', 'widget-registry.json');
    this.ensureWidgetsDirectory();
    this.loadWidgetRegistry();
  }

  ensureWidgetsDirectory() {
    if (!fs.existsSync(this.widgetsDir)) {
      fs.mkdirSync(this.widgetsDir, { recursive: true });
    }
  }

  loadWidgetRegistry() {
    if (fs.existsSync(this.registryFile)) {
      try {
        const registry = JSON.parse(fs.readFileSync(this.registryFile, 'utf8'));
        this.installedWidgets = new Map(Object.entries(registry));
      } catch (error) {
        console.error('Error loading widget registry:', error);
        this.installedWidgets = new Map();
      }
    }
  }

  async saveWidgetRegistry() {
    const registry = Object.fromEntries(this.installedWidgets);
    fs.writeFileSync(this.registryFile, JSON.stringify(registry, null, 2));
  }

  validateManifest(manifest) {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'entryPoint'];
    return requiredFields.every(field => manifest.hasOwnProperty(field));
  }

  async installWidget(widgetFilePath) {
    try {
      // Generate unique widget ID based on timestamp
      const widgetId = `widget_${Date.now()}`;
      const widgetDir = path.join(this.widgetsDir, widgetId);
      
      // Create widget directory
      fs.mkdirSync(widgetDir, { recursive: true });
      
      // Extract widget package
      await extract(widgetFilePath, { dir: widgetDir });
      
      // Load and validate manifest
      const manifestPath = path.join(widgetDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Widget package must contain manifest.json');
      }
      
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.id = widgetId; // Override with our generated ID
      
      if (!this.validateManifest(manifest)) {
        throw new Error('Invalid widget manifest');
      }
      
      // Verify entry point exists
      const entryPointPath = path.join(widgetDir, manifest.entryPoint);
      if (!fs.existsSync(entryPointPath)) {
        throw new Error(`Widget entry point not found: ${manifest.entryPoint}`);
      }
      
      // Register widget
      this.installedWidgets.set(widgetId, manifest);
      await this.saveWidgetRegistry();
      
      // Clean up uploaded file
      if (fs.existsSync(widgetFilePath)) {
        fs.unlinkSync(widgetFilePath);
      }
      
      return widgetId;
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(widgetFilePath)) {
        fs.unlinkSync(widgetFilePath);
      }
      throw error;
    }
  }

  async loadWidget(widgetId) {
    const manifest = this.installedWidgets.get(widgetId);
    if (!manifest) {
      throw new Error('Widget not found');
    }
    
    const widgetPath = path.join(this.widgetsDir, widgetId);
    const entryPointPath = path.join(widgetPath, manifest.entryPoint);
    
    if (!fs.existsSync(entryPointPath)) {
      throw new Error('Widget entry point not found');
    }
    
    const widgetCode = fs.readFileSync(entryPointPath, 'utf8');
    const cssPath = path.join(widgetPath, 'widget.css');
    const widgetCSS = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
    
    return { manifest, code: widgetCode, css: widgetCSS };
  }

  getAvailableWidgets() {
    return Array.from(this.installedWidgets.values());
  }

  async uninstallWidget(widgetId) {
    const manifest = this.installedWidgets.get(widgetId);
    if (!manifest) {
      throw new Error('Widget not found');
    }
    
    // Remove widget files
    const widgetPath = path.join(this.widgetsDir, widgetId);
    if (fs.existsSync(widgetPath)) {
      fs.rmSync(widgetPath, { recursive: true, force: true });
    }
    
    // Remove from registry
    this.installedWidgets.delete(widgetId);
    await this.saveWidgetRegistry();
  }

  async updateWidget(widgetId, widgetFilePath) {
    // Uninstall existing widget
    await this.uninstallWidget(widgetId);
    
    // Install new version
    return await this.installWidget(widgetFilePath);
  }
}

module.exports = WidgetManager; 