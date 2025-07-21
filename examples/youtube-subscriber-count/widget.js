(function() {
  let intervalId = null;
  let widgetElement = null;

  function render(config) {
    if (intervalId) clearInterval(intervalId);

    widgetElement = document.createElement('div');
    widgetElement.className = 'youtube-widget';
    
    // Apply styling from config
    widgetElement.style.color = config.fontColor || '#ffffff';
    widgetElement.style.fontSize = (config.fontSize || 16) + 'px';
    widgetElement.style.fontFamily = config.fontFamily || 'Arial';
    widgetElement.style.backgroundColor = config.backgroundColor || '#ff0000';
    widgetElement.style.padding = '16px';
    widgetElement.style.borderRadius = '8px';
    widgetElement.style.textAlign = 'center';

    // Check if API key and channel ID are configured
    if (!config.apiKey || !config.channelId) {
      widgetElement.innerHTML = `
        <div class="error-message">
          <strong>⚠️ Configuration Required</strong><br>
          Please configure your YouTube API Key and Channel ID in the widget settings.
        </div>
      `;
      return widgetElement;
    }

    widgetElement.innerHTML = '<div>Loading YouTube data...</div>';

    async function updateYouTubeData() {
      try {
        // Fetch channel info
        const channelResponse = await fetch('/api/plugins/youtube-plugin/getChannelInfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: 'com.example.youtube-subscriber-count',
            config: config
          })
        });
        
        const channelData = await channelResponse.json();
        
        if (channelData.error) {
          throw new Error(channelData.error);
        }

        const channel = channelData.result;

        // Fetch latest video
        const videoResponse = await fetch('/api/plugins/youtube-plugin/getLatestVideo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: 'com.example.youtube-subscriber-count',
            config: config
          })
        });
        
        const videoData = await videoResponse.json();
        const latestVideo = videoData.error ? null : videoData.result;

        // Format subscriber count
        const formatNumber = (num) => {
          if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
          } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
          }
          return num.toString();
        };

        // Update widget content
        widgetElement.innerHTML = `
          <div class="channel-info">
            ${channel.thumbnail ? `<img src="${channel.thumbnail}" alt="${channel.title}" class="channel-thumbnail">` : ''}
            <h3 class="channel-title">${channel.title}</h3>
            <div class="subscriber-count">
              <span class="count">${formatNumber(channel.subscriberCount)}</span>
              <span class="label">subscribers</span>
            </div>
            <div class="stats">
              <span>${formatNumber(channel.videoCount)} videos</span>
              <span>•</span>
              <span>${formatNumber(channel.viewCount)} views</span>
            </div>
          </div>
          ${latestVideo ? `
            <div class="latest-video">
              <h4>Latest Video</h4>
              <a href="${latestVideo.url}" target="_blank" class="video-link">
                <img src="${latestVideo.thumbnail}" alt="${latestVideo.title}" class="video-thumbnail">
                <div class="video-title">${latestVideo.title}</div>
              </a>
            </div>
          ` : ''}
        `;

      } catch (error) {
        console.error('YouTube widget error:', error);
        widgetElement.innerHTML = `
          <div class="error-message">
            <strong>❌ Error Loading Data</strong><br>
            ${error.message}
          </div>
        `;
      }
    }

    updateYouTubeData();
    intervalId = setInterval(updateYouTubeData, (config.refreshInterval || 300) * 1000);

    return widgetElement;
  }

  window.render = render;
})(); 