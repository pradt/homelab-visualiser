const fs = require('fs');
const path = require('path');
const vm = require('vm');

class PluginManager {
  constructor() {
    this.pluginsDir = path.join(__dirname, 'plugins');
    this.plugins = new Map();
    this.loadPlugins();
  }

  loadPlugins() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
    const files = fs.readdirSync(this.pluginsDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const pluginPath = path.join(this.pluginsDir, file);
      try {
        const code = fs.readFileSync(pluginPath, 'utf8');
        const sandbox = { module: {}, exports: {}, require, console };
        vm.createContext(sandbox);
        vm.runInContext(code, sandbox, { timeout: 2000, filename: file });
        const plugin = sandbox.module.exports || sandbox.exports;
        if (plugin && plugin.id && typeof plugin === 'object') {
          this.plugins.set(plugin.id, { ...plugin, _path: pluginPath });
          console.log(`[PluginManager] Loaded plugin: ${plugin.id}`);
        } else {
          console.warn(`[PluginManager] Invalid plugin format in ${file}`);
        }
      } catch (err) {
        console.error(`[PluginManager] Failed to load plugin ${file}:`, err);
      }
    }
  }

  getPluginList() {
    return Array.from(this.plugins.values()).map(({ id, description }) => ({ id, description }));
  }

  async callPluginFunction(pluginId, functionName, args = {}) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error('Plugin not found');
    if (typeof plugin[functionName] !== 'function') throw new Error('Function not found in plugin');
    // Optionally, run in a new vm context for each call for isolation
    try {
      return await plugin[functionName](args);
    } catch (err) {
      console.error(`[PluginManager] Error in plugin ${pluginId}.${functionName}:`, err);
      throw err;
    }
  }
}

module.exports = PluginManager; 