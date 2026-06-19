const fs = require('fs');
const path = require('path');
const file = path.join('src', 'routes', 'product.$slug.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<FullProductDetails product=\{product\} \/>\s*<\/div>\s*<\/div>[\s\n]*<div>[\s\n]*\{\/\* RIGHT:/g;
const matches = content.match(regex);
console.log(`Found ${matches ? matches.length : 0} matches.`);

if (matches) {
  content = content.replace(regex, '<FullProductDetails product={product} />\n            </div>\n          </div>\n\n          {/* RIGHT:');
  fs.writeFileSync(file, content);
  console.log('Fixed matches.');
}
