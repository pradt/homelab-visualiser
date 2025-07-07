// generateSimpleIcons.js
const fs = require('fs/promises');
const path = require('path');
const simpleIcons = require('simple-icons');

async function main() {
  // Get all icon keys and map them to the required format
  const list = Object.keys(simpleIcons)
    .map(key => {
      const icon = simpleIcons[key];
      return {
        icon: icon.slug,
        name: icon.title
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

  const outPath = path.resolve('simpleIconsList.js');
  await fs.writeFile(
    outPath,
    `module.exports = ${JSON.stringify(list, null, 2)};\n`
  );

  console.log(`✅ Generated ${list.length} icons.`);
}

main().catch(console.error);
