const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create ZIP file
const output = fs.createWriteStream(path.join(__dirname, '../examples/clock-widget/clock-widget.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('Clock widget ZIP created successfully!');
  console.log('Total size: ' + archive.pointer() + ' bytes');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add widget files to ZIP
const widgetDir = path.join(__dirname, '../examples/clock-widget');
archive.file(path.join(widgetDir, 'manifest.json'), { name: 'manifest.json' });
archive.file(path.join(widgetDir, 'widget.js'), { name: 'widget.js' });
archive.file(path.join(widgetDir, 'widget.css'), { name: 'widget.css' });
archive.file(path.join(widgetDir, 'README.md'), { name: 'README.md' });

archive.finalize(); 