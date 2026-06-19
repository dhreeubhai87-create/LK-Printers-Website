
const fs = require('fs');
const path = './src/routes/product.$slug.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/onChange=\{e => setQuantity\(Math\.max\(\d+,\s*Number\(e\.target\.value\) \|\| \d+\)\)\}/g, 'onChange={e => setQuantity(e.target.value as any)}');
content = content.replace(/onChange=\{\(e\) => setQuantity\(Math\.max\(\d+,\s*Number\(e\.target\.value\) \|\| \d+\)\)\}/g, 'onChange={(e) => setQuantity(e.target.value as any)}');

content = content.replace(/onChange=\{e => \{\s*const parsed = Number\(e\.target\.value\);\s*const minQty = product\.quantity_tiers\[0\]\?\.qty \|\| 1;\s*if \(!Number\.isFinite\(parsed\)\) \{\s*setQuantity\(minQty\);\s*return;\s*\}\s*setQuantity\(Math\.max\(minQty, Math\.floor\(parsed\)\)\);\s*\}\}/g, 'onChange={e => setQuantity(e.target.value as any)}');

content = content.replace(/      quantity,\s*\n      express: false/g, '      quantity: Number(quantity) || 1,\n      express: false');
content = content.replace(/addToCart\(product, breakdown\.total, quantity,/g, 'addToCart(product, breakdown.total, Number(quantity) || 1,');

fs.writeFileSync(path, content);
console.log('Fixed globally!');

