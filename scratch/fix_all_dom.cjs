const fs = require('fs');
const path = require('path');
const file = path.join('src', 'routes', 'product.$slug.tsx');
let content = fs.readFileSync(file, 'utf8');

// The regex matches <FullProductDetails product={product} /> followed by any amount of whitespace,
// then ANY sequence of </div>, <div>, or whitespace, up until {/* RIGHT:
// We use a non-greedy match to ensure we only capture up to the NEXT {/* RIGHT:
const regex = /<FullProductDetails product=\{product\} \/>[\s\S]*?\{\/\* RIGHT:/g;

const matches = content.match(regex);
console.log(`Found ${matches ? matches.length : 0} components with FullProductDetails.`);

if (matches) {
  content = content.replace(regex, '<FullProductDetails product={product} />\n            </div>\n          </div>\n\n          {/* RIGHT:');
  fs.writeFileSync(file, content);
  console.log('Fixed the DOM structure between left and right columns.');
}
