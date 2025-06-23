const express = require('express');
const fs = require('fs');
const path = require('path');
const fontAwesomeIcons = require('./icons');
const materialIcons = require('./materialIcons');
const emojiIcons = require('./emoji');
const simpleIcons = require('./simpleIconsList');
const homelabIcons = require('./homelabIconsFull');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'storage', 'containers.json');

const storageDir = path.join(__dirname, 'storage');
const dataFile = path.join(storageDir, 'containers.json');

// Ensure storage folder and file exist
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]'); // initialize with empty list
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/containers', (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  res.json(JSON.parse(data));
});

app.get('/api/icons/fontawesome', (req, res) => {
  res.json(fontAwesomeIcons);
});

app.get('/api/icons/material', (req, res) => {
  res.json(materialIcons);
});

app.get('/api/icons/emoji', (req, res) => {
  res.json(emojiIcons);
});

app.get('/api/icons/simpleicons', (req, res) => {
  res.json(simpleIcons);
});

app.get('/api/icons/homelab', (req, res) => {
  res.json(homelabIcons);
});

app.post('/api/containers', (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.status(200).json({ status: 'saved' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});