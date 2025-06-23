const fs = require('fs/promises');
const path = require('path');

async function main() {
  const cssPath = path.resolve('materialdesignicons.min.css');
  const cssContent = await fs.readFile(cssPath, 'utf-8');

  // Extract icon class names using regex
  // Pattern: .mdi-{icon-name}::before
  const iconRegex = /\.mdi-([^:]+)::before/g;
  const icons = [];
  let match;

  while ((match = iconRegex.exec(cssContent)) !== null) {
    const iconName = match[1];
    
    // Skip utility classes that don't represent actual icons
    if (iconName.includes('px') || 
        iconName === 'set' || 
        iconName === 'dark' || 
        iconName === 'light' || 
        iconName === 'inactive' ||
        iconName.startsWith('rotate-') ||
        iconName.startsWith('flip-') ||
        iconName === 'spin') {
      continue;
    }

    // Convert kebab-case to Title Case for display name
    const displayName = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    icons.push({
      class: `mdi-${iconName}`,
      name: displayName
    });
  }

  // Sort icons alphabetically by name
  icons.sort((a, b) => a.name.localeCompare(b.name));

  // Generate the output file
  const outputContent = `module.exports = ${JSON.stringify(icons, null, 2)};\n`;
  
  await fs.writeFile('materialIcons.js', outputContent);

  console.log(`✅ Generated ${icons.length} icons from CSS file.`);
  console.log(`📁 Output saved to: materialIcons.js`);
}

main().catch(console.error); 