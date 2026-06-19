const fs = require('fs');
const path = require('path');

const filePath = path.join('e:', 'New folder', 'lk', 'copy', 'src', 'routes', 'product.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix common unsafe patterns
content = content.replace(/image: product\.images\[0\]/g, 'image: product.images?.[0] || ""');
content = content.replace(/src=\{product\.images\[0\]\}/g, 'src={product.images?.[0] || ""}');
content = content.replace(/product\.images\.map/g, '(product.images || []).map');
content = content.replace(/product\.sizes\.map/g, '(product.sizes || []).map');
content = content.replace(/product\.paper_types\.map/g, '(product.paper_types || []).map');
content = content.replace(/product\.color_options\.map/g, '(product.color_options || []).map');
content = content.replace(/product\.finishing_options\.map/g, '(product.finishing_options || []).map');
content = content.replace(/product\.quantity_tiers\.map/g, '(product.quantity_tiers || []).map');

// Fix the find calls too
content = content.replace(/product\.sizes\.find/g, 'product?.sizes?.find');
content = content.replace(/product\.paper_types\.find/g, 'product?.paper_types?.find');
content = content.replace(/product\.color_options\.find/g, 'product?.color_options?.find');

fs.writeFileSync(filePath, content);
console.log('Fixed product.$slug.tsx');
