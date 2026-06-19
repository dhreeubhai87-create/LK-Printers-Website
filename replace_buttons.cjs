const fs = require('fs');
const path = 'src/routes/product.$slug.tsx';
let content = fs.readFileSync(path, 'utf-8');

const genericB2BRegex = /className="([^"]*?)"([^>]*)>\s*ADD TO CART\s*<\/Button>/g;
content = content.replace(genericB2BRegex, (match, p1, p2) => {
  let newClasses = p1.replace(/bg-red-600/g, 'bg-[#007bff]') // using a standard blue close to the image
                     .replace(/bg-red-\d00/g, 'bg-[#007bff]') // just in case
                     .replace(/hover:bg-red-700/g, 'hover:bg-blue-600')
                     .replace(/\buppercase\b/g, '')
                     .replace(/rounded-none/g, 'rounded-md')
                     .replace(/py-6/g, 'py-5') // adjusting padding slightly
                     .replace(/text-sm/g, 'text-base');
  
  if (!newClasses.includes('bg-[#007bff]') && !newClasses.includes('bg-')) {
     newClasses += ' bg-[#007bff] hover:bg-blue-600 text-white rounded-md';
  }
  return `className="${newClasses}"${p2}>\n                  Add Order (Pay From Wallet)\n                </Button>`;
});

// For default layout
const templateRegex = /<ShoppingBag[^>]+>\s*Add to Cart\s*<\/Button>/g;
content = content.replace(templateRegex, '<ShoppingBag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Add Order (Pay From Wallet)\n                </Button>');

// Replace "Add to Cart" text generally for standard layout just in case
const fallbackRegex = />\s*Add to Cart\s*<\/Button>/g;
content = content.replace(fallbackRegex, '>\n                  Add Order (Pay From Wallet)\n                </Button>');

fs.writeFileSync(path, content, 'utf-8');
console.log('Replaced successfully in product.$slug.tsx');
