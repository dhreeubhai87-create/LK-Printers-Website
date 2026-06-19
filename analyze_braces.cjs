const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/routes/product.$slug.tsx');
const content = fs.readFileSync(filePath, 'utf8');

let open = 0;
let inString = false;
let inComment = false;
let quote = '';

for (let i = 0; i < content.length; i++) {
  let char = content[i];
  let next = content[i+1];
  
  if (inComment) {
    if (inComment === 'line' && char === '\n') inComment = false;
    else if (inComment === 'block' && char === '*' && next === '/') {
      inComment = false;
      i++;
    }
  } else if (inString) {
    if (char === quote && content[i-1] !== '\\') inString = false;
  } else {
    if (char === '/' && next === '/') {
      inComment = 'line';
      i++;
    } else if (char === '/' && next === '*') {
      inComment = 'block';
      i++;
    } else if (char === '"' || char === "'" || char === '`') {
      inString = true;
      quote = char;
    } else if (char === '{') {
      open++;
    } else if (char === '}') {
      open--;
      if (open < 0) {
        console.log('Unmatched closing brace at index', i, 'near', content.substring(i-20, i+20));
      }
    }
  }
}

console.log('Final brace balance:', open);
if (open > 0) console.log('Missing', open, 'closing braces');
else if (open < 0) console.log('Too many', -open, 'closing braces');
