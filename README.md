# Homelab Visualizer

A modern, interactive web application for visualizing and managing your homelab infrastructure. Create visual representations of your servers, containers, VMs, and applications with customizable styling and multiple view modes.

## Features

### Core Functionality
- **Visual Container Management**: Create, edit, and organize containers representing your homelab components
- **Multiple View Modes**: 
  - **Box View**: Traditional grid layout with customizable container sizes
  - **Tree View**: Hierarchical tree structure for complex relationships
- **Real-time Search**: Filter containers by name or IP address
- **Responsive Design**: Works on desktop and mobile devices

### Customization Options

#### Container Styling
- **Background Options**: Solid colors, gradients, custom CSS, or background images
- **Border Customization**: Color, size, style (solid, dashed, dotted, etc.), and custom CSS
- **Title Bar Styling**: Separate background settings for the header area
- **Advanced CSS**: Custom CSS properties, border radius, box shadows, padding, and margins
- **Transparency Controls**: Adjust opacity for backgrounds and title bars

#### Icon System
The application supports multiple icon types:

1. **Emoji Icons** 
   - Built-in emoji picker with search functionality
   - Wide variety of emojis for different service types

2. **Font Awesome Icons** 
   - Professional icon library with thousands of options
   - Searchable interface for easy icon discovery

3. **Material Design Icons** 🎨
   - Google's Material Design icon set
   - Clean, modern appearance

4. **Simple Icons** 
   - Brand and technology-specific icons
   - Perfect for representing specific services and tools

5. **Home-Lab Icons** 
   - Specialized icons for homelab and infrastructure components
   - Custom icon set for server and networking equipment

6. **Favicon Auto-Detection** 
   - Automatically fetches favicons from URLs
   - Perfect for web services and applications

7. **Custom URL Icons** 
   - Use any image URL as an icon
   - Supports various image formats

8. **Generative Icons** 
   - AI-generated or algorithmic icons
   - Unique visual representations

#### Icon Customization
- **Size Control**: Adjustable icon size from 12px to 60px
- **Color Customization**: Full color picker for icon tinting
- **Preview System**: Real-time preview of icon changes

### Page Settings

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
<Need to revise >

## Usage Guide
Check out the [wiki](https://github.com/pradt/homelab-visualiser/wiki/How-to-use-this)`

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


---

