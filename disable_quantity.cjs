const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/routes/product.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');
let result = [];
let quantityFieldIndex = -1;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Skip onChange lines for quantity
  if (line.includes('onChange') && line.includes('setQuantity')) {
    continue;
  }
  
  // Mark when we find a quantity field
  if (line.includes('value={quantity')) {
    quantityFieldIndex = i;
  }
  
  // Add disabled when we find the closing tag after a quantity field was marked
  if (quantityFieldIndex !== -1 && (line.includes('/>') || line.includes('</select>'))) {
    if (!line.includes('disabled') && !line.includes('value={quantity')) {
      // Add disabled before closing tag
      if (line.includes('/>')) {
        line = line.replace(/\/>\s*$/, ' disabled className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />');
      } else if (line.includes('</select>')) {
        // For select, add disabled at the opening tag (need to look back)
        if (result.length > 0) {
          let j = result.length - 1;
          while (j >= 0 && !result[j].includes('<select')) {
            j--;
          }
          if (j >= 0 && !result[j].includes('disabled')) {
            result[j] = result[j].replace(/>/, ' disabled>');
          }
        }
      }
    }
    quantityFieldIndex = -1;
  }
  
  // Also handle single line case
  if (line.includes('value={quantity') && line.includes('/>')) {
    if (!line.includes('disabled')) {
      line = line.replace(/\/>\s*$/, ' disabled className="max-w-[180px] bg-gray-100 cursor-not-allowed" />');
    }
  }
  
  result.push(line);
}

let newContent = result.join('\n');
fs.writeFileSync(filePath, newContent);
console.log('Disabled all quantity input/select fields');



