const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/routes/product.$slug.tsx');
const content = fs.readFileSync(filePath, 'utf8');

let level = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let oldLevel = level;
  for (let char of line) {
    if (char === '{') level++;
    if (char === '}') level--;
  }
  if (level < 0) {
    console.log('Line', i + 1, 'dropped level to', level, ':', line);
    level = 0; // Reset to avoid cascade
  }
  // If a line ends with level 0 but it's not the end of a function, it might be an extra brace
  if (level === 0 && oldLevel > 0 && line.trim() === '}') {
    // Check if this is a top-level function end
    // (Simple heuristic: look at previous lines to see if it's a function)
  }
}
