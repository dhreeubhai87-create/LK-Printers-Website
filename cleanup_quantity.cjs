const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/routes/product.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern: Input element with old className, then value={quantity}, then disabled className
// Fix by removing the line with old className that comes before value={quantity}
const lines = content.split('\n');
let result = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // If this line has className and the next few lines have value={quantity}...disabled, skip this className line
  if (line.includes('className=') && line.includes('bg-white') && !line.includes('value={quantity')) {
    // Look ahead for value={quantity
    let foundQuantity = false;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].includes('value={quantity') && lines[j].includes('disabled')) {
        foundQuantity = true;
        break;
      }
    }
    if (foundQuantity) {
      // Skip this className line
      continue;
    }
  }
  
  result.push(line);
}

const newContent = result.join('\n');
fs.writeFileSync(filePath, newContent);
console.log('Cleaned up quantity field formatting');
