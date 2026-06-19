const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/routes/product.$slug.tsx');
const content = fs.readFileSync(filePath, 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;
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
    } else if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '(') parens++;
    else if (char === ')') parens--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;
    
    if (braces < 0) console.log('Negative braces at', i);
    if (parens < 0) console.log('Negative parens at', i);
    if (brackets < 0) console.log('Negative brackets at', i);
  }
}

console.log('Balance - Braces:', braces, 'Parens:', parens, 'Brackets:', brackets);
