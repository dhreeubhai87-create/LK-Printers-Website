const fs = require('fs');
const path = require('path');
const file = path.join('src', 'routes', 'product.$slug.tsx');
let content = fs.readFileSync(file, 'utf8');

const matches = [...content.matchAll(/\/\/\s*REPLACED/g)];
console.log(`Found ${matches.length} REPLACED markers.`);

matches.forEach((m, i) => {
  console.log(`\n--- Match ${i} ---`);
  console.log(content.substring(m.index - 100, m.index + 300));
});
