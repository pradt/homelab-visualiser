# Homelab Visualizer

A modern, interactive web application for visualizing and managing your homelab infrastructure. Create visual representations of your servers, containers, VMs, and applications with customizable styling and multiple view modes.

## Features

### 🎯 Core Functionality
- **Visual Container Management**: Create, edit, and organize containers representing your homelab components
- **Multiple View Modes**: 
  - 📦 **Box View**: Traditional grid layout with customizable container sizes
  - 🌳 **Tree View**: Hierarchical tree structure for complex relationships
- **Real-time Search**: Filter containers by name or IP address
- **Responsive Design**: Works on desktop and mobile devices

### 🎨 Customization Options

#### Container Styling
- **Background Options**: Solid colors, gradients, custom CSS, or background images
- **Border Customization**: Color, size, style (solid, dashed, dotted, etc.), and custom CSS
- **Title Bar Styling**: Separate background settings for the header area
- **Advanced CSS**: Custom CSS properties, border radius, box shadows, padding, and margins
- **Transparency Controls**: Adjust opacity for backgrounds and title bars

#### Icon System
The application supports multiple icon types:

1. **Emoji Icons** 🎯
   - Built-in emoji picker with search functionality
   - Wide variety of emojis for different service types

2. **Font Awesome Icons** ⭐
   - Professional icon library with thousands of options
   - Searchable interface for easy icon discovery

3. **Material Design Icons** 🎨
   - Google's Material Design icon set
   - Clean, modern appearance

4. **Simple Icons** 🏷️
   - Brand and technology-specific icons
   - Perfect for representing specific services and tools

5. **Home-Lab Icons** 🏠
   - Specialized icons for homelab and infrastructure components
   - Custom icon set for server and networking equipment

6. **Favicon Auto-Detection** 🌐
   - Automatically fetches favicons from URLs
   - Perfect for web services and applications

7. **Custom URL Icons** 🔗
   - Use any image URL as an icon
   - Supports various image formats

8. **Generative Icons** 🎲
   - AI-generated or algorithmic icons
   - Unique visual representations

#### Icon Customization
- **Size Control**: Adjustable icon size from 12px to 60px
- **Color Customization**: Full color picker for icon tinting
- **Preview System**: Real-time preview of icon changes

### ⚙️ Page Settings

#### Global Styling
- **Page Background**: Customize the entire page background with colors, gradients, or images
- **Theme Support**: Light, dark, and auto themes
- **Font Customization**: Choose from multiple font families and sizes
- **Layout Controls**: Adjust container spacing, default widths, and page padding

#### View Controls
- **Container Width Slider**: Dynamically adjust container widths from 10% to 100%
- **Responsive Layout**: Containers automatically adapt to different screen sizes

### 🔧 Technical Features

#### Data Management
- **Persistent Storage**: All data is saved to `containers.json` with volume mapping support
- **Export/Import**: Save and restore your homelab configuration
- **Auto-save**: Changes are automatically saved as you work

#### Performance
- **Optimized Icon Loading**: Multiple approaches for icon management (see [README-ICONS.md](README-ICONS.md))
- **Efficient Rendering**: Smooth animations and transitions
- **Memory Management**: Optimized for large homelab setups

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Docker (for containerized deployment)
- Node.js (for local development)

### Installation Options

#### Option 1: Docker (Recommended for Production)

##### Building the Container
```bash
# Clone the repository
git clone <repository-url>
cd homelab-visualiser

# Build the Docker image
docker build -f docker/Dockerfile -t homelab-visualiser:latest .
```

##### Running with Docker Compose (Recommended)
```bash
# Create data directory for persistent storage
mkdir -p data

# Start the application
docker-compose up -d

# Access the application at http://localhost:3000
```

##### Running with Docker Run
```bash
# Create data directory
mkdir -p /path/to/your/data

# Run the container
docker run -d \
  --name homelab-visualiser \
  -p 3000:3000 \
  -v /path/to/your/data:/app/backend/storage \
  --restart unless-stopped \
  homelab-visualiser:latest
```

##### Running with Docker Swarm
```bash
# Deploy the stack
docker stack deploy -c docker-stack.yml homelab

# Check the service status
docker service ls

# Access the application at http://localhost:3000
```

#### Option 2: Local Development

##### Direct File Access
1. Download or clone this repository
2. Open `frontend/index.html` in your web browser
3. Start creating your homelab visualization

##### Local Server
```bash
# Navigate to the project directory
cd homelab-visualiser

# Install dependencies
cd backend && npm install

# Start the backend server
node server.js

# Open http://localhost:3000 in your browser
```

## Docker Configuration

### Volume Mapping
The application uses volume mapping to persist your homelab data:

- **Host Path**: `./data/containers.json` (with docker-compose)
- **Container Path**: `/app/backend/storage/containers.json`

### Environment Variables
- `PORT`: Server port (default: 3000)

### Docker Compose Configuration
The `docker-compose.yml` file includes:
- Volume mapping for persistent data
- Port mapping (3000:3000)
- Restart policy
- Network configuration

### Docker Stack Configuration
The `docker-stack.yml` file includes:
- Swarm-specific deployment settings
- Resource limits and reservations
- Restart policies
- Overlay network configuration

## Usage Guide

### Creating Containers
1. Click the "➕ Add Container" button
2. Fill in the basic information:
   - **Name**: Display name for the container
   - **Type**: Computer, VM, Docker Container, LXC Container, or Application
   - **IP Address**: Network address (optional)
   - **URL**: Web interface URL (optional)
   - **Notes**: Additional information (optional)
3. Configure the icon and styling
4. Click "Save" to create the container

### Managing Containers
- **Edit**: Click the hamburger menu (☰) and select "✏️ Edit"
- **Add Child**: Create nested containers for complex setups
- **Delete**: Remove containers (use with caution)
- **Move**: Drag and drop containers to reorganize

### Styling Your Homelab
1. **Container Styling**: Use the Style tab in the edit modal
2. **Page Settings**: Click the "⚙️ Settings" button for global options
3. **Icon Selection**: Choose from multiple icon libraries
4. **Color Schemes**: Create consistent themes across your setup

### View Modes
- **Box View**: Traditional grid layout, perfect for overview
- **Tree View**: Hierarchical view showing relationships between containers

## Configuration Examples

### Basic Server Setup
```
📦 Main Server (192.168.1.100)
├── 🐳 Docker Host
│   ├── 🌐 Nginx Proxy
│   ├── 🗄️ Database
│   └── 📊 Monitoring
└── 🖥️ VMs
    ├── 🏠 Home Assistant
    └── 📺 Media Server
```

### Network Infrastructure
```
🌐 Router (192.168.1.1)
├── 📡 WiFi Access Points
├── 🔌 Switches
└── 🖥️ Workstations
```

## Advanced Features

### Custom CSS Integration
Add custom CSS for advanced styling:
```css
/* Example: Glass morphism effect */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
```

### Icon Customization
- **Size**: Adjust from 12px to 60px
- **Color**: Full color picker support
- **Positioning**: Icons are automatically centered

### Responsive Design
- Containers adapt to screen size
- Mobile-friendly interface
- Touch support for mobile devices

## Data Persistence

### Docker Volumes
When running with Docker, your data is automatically persisted:
- **Docker Compose**: Data stored in `./data/containers.json`
- **Docker Run**: Data stored in your specified volume path
- **Docker Swarm**: Data stored in named volume `homelab_data`

### Backup and Restore
```bash
# Backup your data
cp ./data/containers.json ./backup/containers-$(date +%Y%m%d).json

# Restore from backup
cp ./backup/containers-20231201.json ./data/containers.json
```

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container logs
docker logs homelab-visualiser

# Check if port 3000 is available
netstat -tulpn | grep :3000
```

#### Data Not Persisting
```bash
# Verify volume mapping
docker inspect homelab-visualiser | grep -A 10 "Mounts"

# Check data directory permissions
ls -la ./data/
```

#### Permission Issues
```bash
# Fix data directory permissions
sudo chown -R $USER:$USER ./data/
chmod 755 ./data/
```

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ⚠️ Internet Explorer: Not supported

## Data Storage

All data is stored locally in your browser using:
- **LocalStorage**: For container data and settings
- **SessionStorage**: For temporary UI state
- **No external dependencies**: Your data stays private

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. See the LICENSE file for details.

## Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the [README-ICONS.md](README-ICONS.md) for icon-specific information
- **Community**: Join discussions in the project repository

## Roadmap

- [ ] Export to PNG/PDF
- [ ] Network topology visualization
- [ ] Real-time status monitoring
- [ ] Integration with monitoring APIs
- [ ] Dark mode improvements
- [ ] Mobile app version

---

**Happy Homelabbing! 🏠⚡** 