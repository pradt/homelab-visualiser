const https = require('https');

module.exports = {
  id: 'youtube-plugin',
  description: 'Fetches YouTube channel data and subscriber count.',
  
  getChannelInfo: async ({ config }) => {
    if (!config || !config.apiKey || !config.channelId) {
      throw new Error('API key and channel ID are required');
    }
    
    const { apiKey, channelId } = config;

    return new Promise((resolve, reject) => {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${apiKey}`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.error) {
              reject(new Error(`YouTube API Error: ${response.error.message}`));
              return;
            }
            
            if (!response.items || response.items.length === 0) {
              reject(new Error('Channel not found'));
              return;
            }
            
            const channel = response.items[0];
            const snippet = channel.snippet;
            const statistics = channel.statistics;
            
            resolve({
              channelId: channel.id,
              title: snippet.title,
              description: snippet.description,
              thumbnail: snippet.thumbnails?.default?.url,
              subscriberCount: parseInt(statistics.subscriberCount) || 0,
              videoCount: parseInt(statistics.videoCount) || 0,
              viewCount: parseInt(statistics.viewCount) || 0
            });
          } catch (error) {
            reject(new Error('Failed to parse YouTube API response'));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });
    });
  },
  
  getLatestVideo: async ({ config }) => {
    if (!config || !config.apiKey || !config.channelId) {
      throw new Error('API key and channel ID are required');
    }
    
    const { apiKey, channelId } = config;

    return new Promise((resolve, reject) => {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&order=date&maxResults=1&type=video&key=${apiKey}`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.error) {
              reject(new Error(`YouTube API Error: ${response.error.message}`));
              return;
            }
            
            if (!response.items || response.items.length === 0) {
              resolve(null);
              return;
            }
            
            const video = response.items[0];
            const snippet = video.snippet;
            
            resolve({
              videoId: video.id.videoId,
              title: snippet.title,
              description: snippet.description,
              thumbnail: snippet.thumbnails?.medium?.url,
              publishedAt: snippet.publishedAt,
              url: `https://www.youtube.com/watch?v=${video.id.videoId}`
            });
          } catch (error) {
            reject(new Error('Failed to parse YouTube API response'));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });
    });
  }
}; 