// generateMaterialIcons.js
const fs = require('fs/promises');
const path = require('path');

async function main() {
  const metaPath = path.resolve(
    '../node_modules/@material-icons/svg/data.json'
  );
  const data = JSON.parse(await fs.readFile(metaPath, 'utf-8'));

  // Generate icon definitions
  const icons = data.icons.map(icon => ({
    class: icon.name.replace(/_/g, '-'),
    name: icon.name
      .split(/[_\s]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }));

  await fs.writeFile(
    'materialIcons.js',
    `module.exports = ${JSON.stringify(icons, null, 2)};\n`
  );

  console.log(`✅ Generated ${icons.length} icons.`);
}

main().catch(console.error);
