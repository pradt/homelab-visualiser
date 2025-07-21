# Homelab Visualizer

Most dashboards are great at visualizing metrics — but they rarely help when you need to understand the **physical layout** of your homelab.

There were many times I needed to answer questions like:

- What’s running at a specific IP?
- Is this app running on bare metal, in Docker, or inside an LXC container?
- Where is that failing app actually deployed?

To address these gaps, I built **Homelab Visualizer** — originally for my own use — and now sharing it with the community in case you find it helpful too.

Here is what it looks like with little customisation. 
![A bad picture of what it looks like](https://github.com/user-attachments/assets/b33df170-89b5-42f9-b814-88a1d2355750)
---

## Purpose

### Be Your Homelab Dashboard
A central place to visualize and launch into the physical and virtual layers of your setup.

The current focus is on helping you define and map your homelab’s infrastructure, with a roadmap toward becoming a true **one-stop operational hub**.

### Locate Applications by IP
Given an IP address, identify:

- What application is running there
- Where it resides physically (e.g., server, VM, Docker container, LXC)

By mapping your infrastructure hierarchically, you’ll be able to quickly trace where each workload lives and take action.
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
The application supports multiple icon types, we tried to make it as easy as possible by allowing you to view the icons and select from a wide range of icons or just a URL for a custom image:

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



## Getting Started



### Installation 



The application is available as a pre-built Docker image from GitHub Container Registry.

##### Quick Start with Docker Compose (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd homelab-visualiser

# Create data directory for persistent storage
mkdir -p data

# Start the application
docker-compose up -d

# Access the application at http://localhost:3000
```

##### Quick Start with Docker Run
```bash
# Create data directory
mkdir -p /path/to/your/data

# Pull the latest image
docker pull ghcr.io/pradt/homelab-visualiser/homelab-visualiser:latest

# Run the container
docker run -d \
  --name homelab-visualiser \
  -p 3000:3000 \
  -v /path/to/your/data:/app/backend/storage \
  --restart unless-stopped \
  ghcr.io/pradt/homelab-visualiser/homelab-visualiser:latest
```

##### Running with Docker Swarm
```bash
# Clone the repository
git clone <repository-url>
cd homelab-visualiser

# Deploy the stack
docker stack deploy -c docker-stack.yml homelab

# Check the service status
docker service ls

# Access the application at http://localhost:3000
```

##### Manual Image Pull
If you prefer to pull the image manually:
```bash
# Pull the latest version
docker pull ghcr.io/pradt/homelab-visualiser/homelab-visualiser:latest

# Or pull a specific version
docker pull ghcr.io/pradt/homelab-visualiser/homelab-visualiser:v1.0.0
```



## Docker Configuration

### Image Source
The application uses a pre-built Docker image from GitHub Container Registry:
- **Image**: `ghcr.io/pradt/homelab-visualiser/homelab-visualiser:latest`
- **Registry**: GitHub Container Registry (ghcr.io)
- **Automatic Updates**: Pull the latest image to get updates

### Volume Mapping
The application uses volume mapping to persist your homelab data:

- **Host Path**: `./data/containers.json` (with docker-compose)
- **Container Path**: `/app/backend/storage/containers.json`

### Environment Variables
- `PORT`: Server port (default: 3000)
- `WIDGET_ENCRYPTION_KEY`: (Recommended) A secure random string used to encrypt sensitive widget configuration fields (such as API keys). If not set, sensitive fields will be stored in plain text with a warning. Example:

```bash
export WIDGET_ENCRYPTION_KEY=your-secure-32-character-key-here
```

### Docker Compose Configuration
The `docker-compose.yml` file includes:
- Pre-built image from GitHub Container Registry
- Volume mapping for persistent data
- Port mapping (3000:3000)
- Restart policy
- Network configuration

### Docker Stack Configuration
The `docker-stack.yml` file includes:
- Pre-built image from GitHub Container Registry
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

### Updating the Container
To update to the latest version:
```bash
# Stop the current container
docker-compose down

# Pull the latest image
docker pull ghcr.io/pradt/homelab-visualiser/homelab-visualiser:latest

# Start with the new image
docker-compose up -d
```

Or with Docker Run:
```bash
# Stop the current container
docker stop homelab-visualiser
docker rm homelab-visualiser

# Pull the latest image
docker pull ghcr.io/pradt/homelab-visualiser/homelab-visualiser:latest

# Run with the new image (use your original run command)
docker run -d \
  --name homelab-visualiser \
  -p 3000:3000 \
  -v /path/to/your/data:/app/backend/storage \
  --restart unless-stopped \
  ghcr.io/pradt/homelab-visualiser/homelab-visualiser:latest
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





## License

This project is open source. See the LICENSE file for details.



## Roadmap

Check the issues for a list of enhancements that's being considered - if you want to request a feature then create an issue. 

---

