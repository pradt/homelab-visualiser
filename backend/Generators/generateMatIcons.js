// generateMaterialIcons.js

const fs = require('fs/promises');

async function main() {
  // Dynamic import for node-fetch since it's an ES module
  const fetch = (await import('node-fetch')).default;
  
  // Material Design Icons metadata
  const resp = await fetch(
    'https://raw.githubusercontent.com/Templarian/MaterialDesign/master/meta.json'
  );
  console.log("Fetch Completed");

  const data = await resp.json();
  
  console.log("JSON Parsed");

  // The MaterialDesign repository has a different structure
  const icons = Object.keys(data).map(key => ({
    class: key,
    // Convert kebab-case into Start Case (e.g., "account-circle" → "Account Circle")
    name: key
      .split('-')
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
