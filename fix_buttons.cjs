const fs = require('fs');
const path = 'src/routes/product.$slug.tsx';
let content = fs.readFileSync(path, 'utf-8');

// The current buttons were changed to blue. Let's revert the blue to red and fix the whitespace.
// I'll look for the text "Add Order (Pay From Wallet)" to find the buttons my previous script touched.

const regex = /className="([^"]*?)"([^>]*)>\s*Add Order \(Pay From Wallet\)\s*<\/Button>/g;

content = content.replace(regex, (match, p1, p2) => {
  // Restore red background
  let newClasses = p1.replace(/bg-\[#007bff\]/g, 'bg-red-600')
                     .replace(/hover:bg-blue-600/g, 'hover:bg-red-700')
                     .replace(/rounded-md/g, 'rounded-none');
                     
  // If it's the B2B button, ensure it has uppercase, whitespace-normal, and correct padding
  if (newClasses.includes('bg-red-600')) {
     newClasses = newClasses.replace(/text-base/g, 'text-sm')
                            .replace(/py-5/g, 'py-3 h-auto');
                            
     if (!newClasses.includes('uppercase')) newClasses += ' uppercase';
     if (!newClasses.includes('whitespace-normal')) newClasses += ' whitespace-normal';
     if (!newClasses.includes('leading-tight')) newClasses += ' leading-tight';
  }
  
  return `className="${newClasses}"${p2}>\n                  ADD ORDER (PAY FROM WALLET)\n                </Button>`;
});

// Also fix the default generic template
const templateRegex = /<ShoppingBag className="[^"]+" \/> Add Order \(Pay From Wallet\)\s*<\/Button>/g;
content = content.replace(templateRegex, '<ShoppingBag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> ADD ORDER (PAY FROM WALLET)\n                </Button>');

// Replace any remaining "Add Order" without generic template
const remainingRegex = />\s*Add Order \(Pay From Wallet\)\s*<\/Button>/g;
content = content.replace(remainingRegex, '>\n                  ADD ORDER (PAY FROM WALLET)\n                </Button>');

fs.writeFileSync(path, content, 'utf-8');
console.log('Replaced successfully.');
