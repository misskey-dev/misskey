const fs = require('fs');

const from = process.argv[2];
const to = process.argv[3];
fs.copyFileSync(from, to);
