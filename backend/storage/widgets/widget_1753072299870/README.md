# Clock Widget

A simple clock widget for Homelab-Visualiser that displays the current time and date with configurable timezone and format.

## Features

- **Real-time updates**: Updates every second
- **Configurable timezone**: Support for any IANA timezone
- **Time format**: 12-hour or 24-hour format
- **Date display**: Optional date display
- **Customizable styling**: Font size, colors, and background
- **Responsive design**: Works on different screen sizes

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timezone` | string | "UTC" | Timezone to display (e.g., "America/New_York", "Europe/London") |
| `format` | select | "24h" | Time format ("12h" or "24h") |
| `showDate` | boolean | true | Show current date |
| `fontColor` | color | "#000000" | Text color |
| `fontSize` | range | 24 | Font size in pixels (12-48) |
| `backgroundColor` | color | "#ffffff" | Background color |

## Installation

1. Download the `clock-widget.zip` file
2. Open Homelab-Visualiser
3. Go to Custom View
4. Click the "🔧 Widgets" button
5. Click "Upload Widget"
6. Select the `clock-widget.zip` file
7. The widget will be installed and available in the Widget Gallery

## Usage

1. In Custom View, click the "🔧 Widgets" button
2. Find "Clock Widget" in the gallery
3. Click on it to add it to your Custom View
4. Configure the widget using the settings button (⚙️)

## Examples

### Basic Clock
- Timezone: UTC
- Format: 24h
- Show Date: true

### Local Time
- Timezone: America/New_York
- Format: 12h
- Show Date: true

### Minimal Clock
- Timezone: Europe/London
- Format: 24h
- Show Date: false

## Development

This widget demonstrates:
- Basic widget structure
- Configuration handling
- Real-time updates
- Error handling
- Responsive design

## Files

- `manifest.json`: Widget metadata and configuration schema
- `widget.js`: Main widget logic
- `widget.css`: Widget styles
- `README.md`: This documentation

## License

This widget is provided as an example for the Homelab-Visualiser Widget System. 