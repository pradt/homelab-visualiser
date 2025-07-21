(function() {
  let intervalId = null;
  let widgetElement = null;

  function render(config) {
    if (intervalId) clearInterval(intervalId);

    widgetElement = document.createElement('div');
    widgetElement.className = 'system-info-widget';
    widgetElement.innerHTML = '<div>Loading system info...</div>';

    async function updateInfo() {
      try {
        const response = await fetch('/api/plugins/system-info/getInfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.result) {
          const info = data.result;
          widgetElement.innerHTML = `
            <div><strong>Platform:</strong> ${info.platform}</div>
            <div><strong>Uptime:</strong> ${Math.floor(info.uptime/60)} min</div>
            <div><strong>CPU Load:</strong> ${info.load.map(l => l.toFixed(2)).join(', ')}</div>
            <div><strong>Memory:</strong> ${(info.memory.free/1e6).toFixed(0)}MB free / ${(info.memory.total/1e6).toFixed(0)}MB</div>
          `;
        } else {
          widgetElement.innerHTML = '<div>Error loading system info</div>';
        }
      } catch (e) {
        widgetElement.innerHTML = '<div>Error loading system info</div>';
      }
    }

    updateInfo();
    intervalId = setInterval(updateInfo, (config.refreshInterval || 5) * 1000);

    return widgetElement;
  }

  window.render = render;
})(); 