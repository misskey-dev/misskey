const fs = require('fs');
const meta = require('../built/_vite_/meta.json');

fs.mkdirSync(__dirname + '/../built', { recursive: true });
fs.writeFileSync(__dirname + '/../built/meta.json', JSON.stringify({ version: meta.buildHash }), 'utf-8');
