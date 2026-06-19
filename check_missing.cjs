const fs = require('fs');
const content = fs.readFileSync('src/routes/product.$slug.tsx', 'utf-8');
const used = [...content.matchAll(/<([A-Z][a-zA-Z0-9]*Customizer)\b/g)].map(m => m[1]);
const defined = [...content.matchAll(/function\s+([A-Z][a-zA-Z0-9]*Customizer)\b/g)].map(m => m[1]);
const missing = [...new Set(used)].filter(c => !defined.includes(c));
console.log('Missing Components:', missing);
