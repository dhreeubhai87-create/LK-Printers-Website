const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/product.$slug.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let found = false;
let start = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function B2BFileSelector') || lines[i].includes('const B2BFileSelector')) {
    start = i;
    found = true;
    break;
  }
}

if (found) {
  console.log('Found B2BFileSelector at line:', start + 1);
  console.log(lines.slice(start, start + 60).join('\n'));
} else {
  console.log('B2BFileSelector not found in product.$slug.tsx');
}
