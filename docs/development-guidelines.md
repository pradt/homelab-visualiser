# Homelab Visualiser - Development Guidelines

## Project Overview

The Homelab Visualiser is a web application that enables users to map out their physical home lab infrastructure and software components. It serves as both a visual mapping tool and a dashboard for monitoring home lab resources.

### Key Features
- **Physical Infrastructure Mapping**: Visual representation of servers, VMs, containers, and network devices
- **Software Application Management**: Track applications, services, and their relationships
- **Real-time Monitoring**: Agent-based monitoring of system resources (CPU, memory, disk, network)
- **Multiple View Modes**: Box View, Tree View, and Custom View for different use cases
- **Customizable Styling**: Extensive styling options for containers and layouts
- **Widget System**: Extensible widget framework for custom dashboards

## Project Structure

### Backend (`backend/`)
- **Node.js/Express server** handling API endpoints
- **Socket.IO** for real-time communication with agents
- **File-based storage** (`storage/containers.json`) for container data
- **Agent communication** for system monitoring
- **Static file serving** for the frontend

### Frontend (`frontend/`)
- **Vanilla JavaScript** (no frameworks)
- **HTML5** with semantic markup
- **CSS3** with view-specific styling
- **jQuery** for DOM manipulation and sortable functionality
- **Socket.IO client** for real-time updates

### Documentation (`docs/`)
- Development guidelines
- API documentation
- Widget development guide

## Architecture Decisions

### 1. CSS Scoping Pattern (CRITICAL)

**Problem**: CSS conflicts between different views (Box View, Tree View, Custom View) caused styling issues and unexpected behavior.

**Solution**: Implement view-specific CSS scoping using parent classes on the `#container-root` element.

#### Implementation
```javascript
// In switchView() and renderContainers()
const containerRoot = document.getElementById('container-root');
containerRoot.classList.remove('boxview', 'treeview', 'customview');
containerRoot.classList.add(currentView + 'view');
```

#### CSS Structure
```css
/* Box View specific styles */
.boxview .container-box { /* styles */ }
.boxview .hamburger-btn { /* styles */ }
.boxview .hamburger-actions { /* styles */ }

/* Tree View specific styles */
.treeview .container-box { /* styles */ }
.treeview .hamburger-btn { /* styles */ }

/* Custom View specific styles */
.customview .container-box { /* styles */ }
/* Note: Custom View uses context menus, not hamburger menus */
```

#### Why This Matters
- **Prevents CSS conflicts** between different view modes
- **Ensures consistent behavior** across view switches
- **Maintains view-specific functionality** (hamburger menus vs context menus)
- **Critical for proper initialization** - must be applied on first load

### 2. View-Specific UI Patterns

#### Box View
- **Hamburger menus**: Traditional ☰ button with dropdown actions
- **Context menus**: Right-click for quick edit access
- **Physical layout**: Represents actual hardware/network topology

#### Tree View
- **Inline buttons**: Direct ➕ and ✏️ buttons in headers
- **Hierarchical display**: Parent-child relationships
- **Expandable/collapsible**: Tree structure navigation

#### Custom View
- **Context menus only**: Right-click for all actions
- **Conceptual grouping**: Categories and application groups
- **Dashboard focus**: Widget integration and monitoring

### 3. Data Flow

```
User Action → JavaScript Handler → API Call → Backend Processing → File Storage
                                 ↓
Real-time Updates ← Socket.IO ← Agent Data ← System Monitoring
```

## Development Standards

### CSS Guidelines

1. **Always scope styles by view**:
   ```css
   /* ✅ Correct */
   .boxview .container-box { /* styles */ }
   
   /* ❌ Avoid global styles that affect multiple views */
   .container-box { /* styles */ }
   ```

2. **Use view-specific selectors for interactive elements**:
   ```css
   .boxview .hamburger-btn { /* Box View hamburger button */ }
   .customview .context-menu { /* Custom View context menu */ }
   ```

3. **Maintain consistent naming**:
   - View classes: `boxview`, `treeview`, `customview`
   - Container elements: `container-box`, `container-header`
   - Interactive elements: `hamburger-btn`, `context-menu`

### JavaScript Guidelines

1. **View initialization**:
   ```javascript
   // Always apply view-specific class on render
   root.classList.remove('boxview', 'treeview', 'customview');
   root.classList.add(currentView + 'view');
   ```

2. **Event handling**:
   - Use view-specific event handlers where appropriate
   - Ensure proper cleanup when switching views
   - Handle both hamburger menus and context menus

3. **Data management**:
   - Use consistent data structures across views
   - Implement proper error handling for API calls
   - Maintain real-time updates through Socket.IO

### HTML Structure

1. **Semantic markup**:
   ```html
   <div id="container-root" class="boxview">
     <div class="container-box" data-container-id="...">
       <div class="container-header">
         <!-- Header content -->
       </div>
     </div>
   </div>
   ```

2. **Data attributes**:
   - Use `data-container-id` for container identification
   - Use `data-tooltip` for accessibility
   - Use `data-*` attributes for custom functionality

## Common Pitfalls

### 1. CSS Scoping Issues
**Problem**: Styles affecting wrong views
**Solution**: Always use view-specific selectors

### 2. Initialization Problems
**Problem**: View-specific classes not applied on first load
**Solution**: Apply classes in `renderContainers()`, not just `switchView()`

### 3. Event Handler Conflicts
**Problem**: Multiple event handlers for same elements
**Solution**: Use view-specific handlers and proper cleanup

### 4. Real-time Update Issues
**Problem**: Updates not reflecting across views
**Solution**: Ensure proper Socket.IO event handling and DOM updates

## Testing Guidelines

### View Switching
- Test switching between all three views
- Verify CSS classes are applied correctly
- Check that interactive elements work in each view

### Responsive Design
- Test on different screen sizes
- Verify mobile compatibility
- Check touch interactions

### Real-time Features
- Test agent connectivity
- Verify real-time updates
- Check error handling for disconnected agents

## Widget Development

### Widget Structure
```javascript
// Widget configuration
{
  id: 'widget-name',
  title: 'Widget Title',
  config: { /* widget-specific config */ }
}

// Widget rendering
function createWidgetElement(widgetContainer) {
  // Create widget DOM elements
  // Apply styling
  // Handle interactions
}
```

### Widget Guidelines
- Use consistent styling patterns
- Implement proper error handling
- Support configuration options
- Follow the view-specific CSS patterns

## Deployment

### Backend
- Node.js environment
- Required dependencies in `package.json`
- Environment variables for configuration

### Frontend
- Static file serving
- No build process required
- Browser compatibility considerations

## Contributing

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Update documentation for new features

### Feature Development
1. Understand the view-specific patterns
2. Follow CSS scoping guidelines
3. Test across all view modes
4. Update documentation
5. Consider real-time implications

### Bug Fixes
1. Reproduce in all relevant views
2. Check CSS scoping first
3. Verify initialization logic
4. Test view switching scenarios

## Resources

- **Socket.IO Documentation**: https://socket.io/docs/
- **CSS Selectors**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- **JavaScript DOM Manipulation**: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model

---

**Remember**: The CSS scoping pattern is critical for maintaining view separation and preventing styling conflicts. Always test changes across all three views to ensure consistent behavior. 