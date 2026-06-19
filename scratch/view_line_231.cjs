const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/product.$slug.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.replace(/\r\n/g, '\n').split('\n');

console.log(lines.slice(220, 245).join('\n'));
