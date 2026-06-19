const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/routes/product.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix double disabled attributes
content = content.replace(/disabled\s+disabled className=/g, 'disabled className=');

// Fix spaces before disabled
content = content.replace(/value={quantity}\s*\n\s*disabled\s+className=/g, 'value={quantity}\n disabled className=');
content = content.replace(/\s{2,}disabled className=/g, ' disabled className=');

// Remove trailing disabled className lines
content = content.replace(/\s+disabled className="[^"]*" \/>/g, ' />');

fs.writeFileSync(filePath, content);
console.log('Final cleanup complete');
