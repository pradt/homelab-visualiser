# Custom View Documentation

## Overview

The **Custom View** is an advanced layout system in the Homelab Visualiser that allows you to create flexible, customizable arrangements of your containers and applications. Unlike the standard Box View and Tree View, Custom View introduces the concept of **Containers** that can be organized in various layouts to better suit your specific needs.

## What is Custom View?

Custom View is a powerful organizational tool that lets you:

- **Group related applications** into logical containers
- **Create flexible layouts** using columns and rows
- **Customize the appearance** of each container
- **Drag and drop** to reorganize your layout
- **Manage categories** dynamically

### Key Concepts

#### Containers
Containers are the building blocks of Custom View. Each container can have one of two roles:

- **Column Container** (📁): Stacks its contents vertically
- **Row Container** (➡️): Stacks its contents horizontally

#### Categories
Categories are groups of applications or services that share common characteristics. Examples include:
- Web Services
- Database Servers
- Monitoring Tools
- Development Environments
- Network Services

## Features

### 🎯 Core Features

#### 1. **Flexible Container Layouts**
- Create containers as columns or rows
- Nest containers within other containers
- Automatic responsive layouts
- Visual role indicators (📁 for columns, ➡️ for rows)

#### 2. **Drag-and-Drop Organization**
- Reorder containers by dragging
- Move categories between containers
- Drag categories from available list into containers
- Visual feedback during drag operations

#### 3. **Container Styling**
- Custom background colors, gradients, or images
- Border styling (color, size, style)
- Padding and margin controls
- Border radius and box shadows
- Custom CSS for advanced styling
- Hide/show container headers

#### 4. **Category Management**
- View all available categories
- Assign categories to containers
- Remove categories from containers
- Track unassigned categories

#### 5. **Edit Mode**
- Toggle edit mode for container management
- Inline title editing
- Container actions via hamburger menus
- Real-time visual feedback

### 🛠️ Advanced Features

#### Container Actions Menu
Each container has a hamburger menu (☰) with options:
- **🎨 Style Container**: Open styling modal
- **➕ Add Column/Row**: Add new container of opposite role
- **🗑️ Delete Container**: Remove empty containers

#### Available Categories Zone
- Shows categories not assigned to any container
- Drag categories from here into containers
- Real-time count of available categories
- Only visible in edit mode

#### Reset Functionality
- Clear all containers and reorganize
- Move all categories back to available list
- Start fresh with a clean layout

## How to Use Custom View

### Getting Started

1. **Access Custom View**
   - Click the "🏷️ Custom View" button in the main toolbar
   - The view will load with your existing container configuration

2. **Enable Edit Mode**
   - Click the "✏️ Edit Mode" button in the Custom View toolbar
   - This activates all editing features and shows drag handles

### Creating and Managing Containers

#### Adding New Containers

1. **Add Column Container**
   - Click "➕ Add Column" in the toolbar
   - A new column container will be created
   - Click the container title to rename it

2. **Add Row Container**
   - Click "➡️ Add Row" in the toolbar
   - A new row container will be created
   - Row containers stack content horizontally

3. **Add Container via Menu**
   - Click the hamburger menu (☰) on any container
   - Select "➕ Add Column" or "➕ Add Row"
   - The new container will be added to the selected container

#### Styling Containers

1. **Open Styling Modal**
   - Click the hamburger menu (☰) on a container
   - Select "🎨 Style Container"

2. **Configure Container Information**
   - **Heading Text**: Set the container's display name
   - **Role**: Choose between Column or Row layout

3. **Customize Appearance**
   - **Background**: Choose color, gradient, CSS, or image
   - **Border**: Set color, size, style, and custom CSS
   - **Additional Styles**: Configure padding, margin, border radius, box shadow
   - **Visibility**: Hide container header if desired

4. **Save Changes**
   - Click "Save Styling" to apply changes
   - Changes are immediately visible and saved to backend

### Managing Categories

#### Moving Categories Between Containers

1. **Enable Edit Mode**
   - Make sure edit mode is active (button shows "✏️ Edit Mode")

2. **Drag Categories**
   - Look for the drag handle (⋮⋮⋮) on category headers
   - Click and drag the category to another container
   - Visual feedback shows where the category will be dropped

3. **From Available Categories**
   - Categories not assigned to any container appear in the "Available Categories" zone
   - Drag these categories into any container
   - The available count updates automatically

#### Editing Category Assignments

1. **View Available Categories**
   - In edit mode, the "Available Categories" zone shows unassigned categories
   - Each category shows with a drag indicator

2. **Reorganize Categories**
   - Drag categories between containers
   - Drag categories out of containers to make them available
   - Use the reset function to start over

### Advanced Operations

#### Container Reordering

1. **Drag Containers**
   - In edit mode, containers show drag handles
   - Drag containers to reorder them
   - Visual placeholders show drop locations

#### Inline Editing

1. **Edit Container Names**
   - Click on any container title in edit mode
   - Type the new name
   - Press Enter or click outside to save

#### Reset Layout

1. **Reset All Containers**
   - Click "🔄 Reset View" in the toolbar
   - Confirm the action
   - All containers will be cleared and categories moved to available list

### Keyboard Shortcuts

While in edit mode:
- **Click + Drag**: Move containers or categories
- **Click**: Edit container titles
- **Escape**: Cancel title editing

## Best Practices

### Organizing Your Layout

1. **Logical Grouping**
   - Group related services in the same container
   - Use descriptive container names
   - Consider your workflow when organizing

2. **Layout Planning**
   - Use columns for vertical organization
   - Use rows for horizontal organization
   - Mix containers for complex layouts

3. **Visual Hierarchy**
   - Use styling to create visual separation
   - Consistent color schemes help with recognition
   - Hide headers for cleaner looks when appropriate

### Performance Tips

1. **Container Limits**
   - Avoid creating too many nested containers
   - Keep container counts reasonable for smooth performance

2. **Category Management**
   - Regularly review and organize categories
   - Remove unused categories to keep the interface clean

## Troubleshooting

### Common Issues

#### Drag and Drop Not Working
- **Solution**: Make sure edit mode is enabled
- **Check**: Look for drag handles (⋮⋮⋮) on containers and categories
- **Verify**: jQuery UI is loaded properly

#### Containers Not Saving
- **Solution**: Check browser console for errors
- **Verify**: Server is running and accessible
- **Check**: Network connectivity to backend

#### Styling Not Applied
- **Solution**: Refresh the page after saving
- **Check**: Container styling modal saved successfully
- **Verify**: No CSS conflicts in custom CSS field

#### Categories Not Moving
- **Solution**: Ensure edit mode is active
- **Check**: Category has a drag handle visible
- **Verify**: Target container can accept categories

### Getting Help

If you encounter issues:

1. **Check Browser Console**: Look for JavaScript errors
2. **Verify Server Status**: Ensure backend is running
3. **Clear Browser Cache**: Refresh with Ctrl+F5 (or Cmd+Shift+R)
4. **Check Network Tab**: Verify API calls are successful

## Technical Details

### Data Structure

Containers are stored with the following structure:
```json
{
  "id": "unique-container-id",
  "name": "Container Name",
  "role": "column|row",
  "order": 1,
  "styling": {
    "hideHeader": false,
    "bgType": "color|gradient|css",
    "backgroundColor": "#f9f9f9",
    "backgroundGradient": "",
    "backgroundCSS": "",
    "backgroundImage": "",
    "backgroundOpacity": "100",
    "borderColor": "#e0e0e0",
    "borderSize": "2",
    "borderStyle": "solid",
    "borderCSS": "",
    "customCSS": "",
    "borderRadius": "8",
    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
    "padding": "15",
    "margin": "10"
  },
  "categories": ["category1", "category2"],
  "children": []
}
```

### API Endpoints

- `GET /api/custom-view-containers` - Retrieve container configuration
- `POST /api/custom-view-containers` - Save container configuration
- `GET /api/columns` - Legacy endpoint (redirects to custom-view-containers)
- `POST /api/columns` - Legacy endpoint (redirects to custom-view-containers)

### Browser Compatibility

Custom View requires:
- Modern browser with ES6+ support
- jQuery 3.7.1+
- jQuery UI 1.13.2+
- CSS Grid and Flexbox support

## Conclusion

Custom View provides a powerful and flexible way to organize your homelab infrastructure. With its drag-and-drop interface, customizable styling, and intuitive container system, you can create layouts that perfectly match your workflow and organizational preferences.

The system is designed to be both powerful and user-friendly, allowing both simple layouts for basic needs and complex nested arrangements for advanced use cases. Regular use of the features described in this documentation will help you get the most out of your Custom View experience. 