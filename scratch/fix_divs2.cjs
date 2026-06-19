const fs = require('fs');
const path = require('path');
const file = path.join('src', 'routes', 'product.$slug.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex2 = /<\/div>\s*<\/div>[\s\n]*<div>[\s\n]*\{\/\* RIGHT:/g;
const matches2 = content.match(regex2);
console.log(`Found more specific matches: ${matches2 ? matches2.length : 0}`);

if (matches2) {
  content = content.replace(regex2, '</div>\n          </div>\n\n          {/* RIGHT:');
  fs.writeFileSync(file, content);
  console.log('Fixed more matches.');
}
