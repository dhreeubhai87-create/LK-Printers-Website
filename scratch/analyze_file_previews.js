const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/product.$slug.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const matches = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('filePreview') && lines[i].includes('useState')) {
    matches.push({ lineNum: i + 1, content: lines[i].trim() });
  }
}

console.log('Matches:', JSON.stringify(matches, null, 2));
