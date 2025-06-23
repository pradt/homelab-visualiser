// generateHomelabIcons.js

const fs = require('fs/promises');
const path = require('path');

async function main() {
  const url = 'https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/metadata.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`);
  const data = await res.json();

  // metadata.json is an object, not an array
  const icons = Object.keys(data).map(slug => ({
    icon: slug,
    name: slug
      .replace(/-light$|-dark$/, '')      // remove variant suffix
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }));

  const file = path.resolve('homelabIconsFull.js');
  await fs.writeFile(file, `module.exports = ${JSON.stringify(icons, null, 2)};\n`);
  console.log(`✅ Generated ${icons.length} unique icons`);
}

main().catch(console.error);
