(function() {
  let updateInterval = null;
  let widgetElement = null;
  
  // Main render function - called when widget is loaded or config changes
  function render(config) {
    // Clean up previous interval if exists
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    
    // Create widget element
    widgetElement = document.createElement('div');
    widgetElement.className = 'clock-widget';
    
    // Apply configuration
    applyConfig(config);
    
    // Initialize clock
    updateTime(config);
    
    // Start periodic updates
    updateInterval = setInterval(() => {
      updateTime(config);
    }, 1000);
    
    return widgetElement;
  }
  
  // Apply configuration to widget
  function applyConfig(config) {
    if (widgetElement) {
      widgetElement.style.color = config.fontColor || '#000000';
      widgetElement.style.fontSize = (config.fontSize || 24) + 'px';
      widgetElement.style.backgroundColor = config.backgroundColor || '#ffffff';
      widgetElement.style.textAlign = 'center';
      widgetElement.style.padding = '20px';
      widgetElement.style.borderRadius = '8px';
      widgetElement.style.fontFamily = 'monospace';
      widgetElement.style.fontWeight = 'bold';
    }
  }
  
  // Update time display
  function updateTime(config) {
    if (!widgetElement) return;
    
    try {
      const now = new Date();
      
      // Format time
      const timeOptions = {
        timeZone: config.timezone || 'UTC',
        hour12: config.format === '12h',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      
      const timeString = now.toLocaleTimeString('en-US', timeOptions);
      
      // Format date if enabled
      let dateString = '';
      if (config.showDate !== false) {
        const dateOptions = {
          timeZone: config.timezone || 'UTC',
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        };
        dateString = now.toLocaleDateString('en-US', dateOptions);
      }
      
      // Update widget content
      widgetElement.innerHTML = `
        <div class="time">${timeString}</div>
        ${dateString ? `<div class="date">${dateString}</div>` : ''}
        <div class="timezone">${config.timezone || 'UTC'}</div>
      `;
      
    } catch (error) {
      console.error('Clock widget error:', error);
      widgetElement.innerHTML = `
        <div class="error">
          <div>⏰ Clock Widget</div>
          <div style="font-size: 0.8em; opacity: 0.7;">Error: ${error.message}</div>
        </div>
      `;
    }
  }
  
  // Cleanup function
  function cleanup() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
  
  // Expose render function globally
  window.render = render;
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
})(); 