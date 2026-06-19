const fs = require('fs');
const path = 'src/routes/product.$slug.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Match the B2B wrapper structure:
// <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-... gap-4 mt-...">
//   <div />
//   <Button ...> ADD ORDER (PAY FROM WALLET) </Button>
// </div>

const regex = /<div className="grid grid-cols-\[140px_1fr\] sm:grid-cols-\[160px_1fr\][^>]*>\s*<div \/>\s*<Button\s+onClick=\{handleAddToCart\}[\s\S]*?<\/Button>\s*<\/div>/g;

const replacement = `<div className="mt-6 w-full">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
              </div>`;

let count = 0;
content = content.replace(regex, (match) => {
  // make sure it actually contains the button we want to replace
  if (match.includes('onClick={handleAddToCart}')) {
    count++;
    return replacement;
  }
  return match;
});

// Also replace the red ones that might have been left over if they weren't in that exact grid
const leftoverRegex = /className="[^"]*bg-red-600[^"]*"[^>]*>\s*(?:ADD ORDER \(PAY FROM WALLET\)|Add Order \(Pay From Wallet\))\s*<\/Button>/g;
let leftoverCount = 0;
content = content.replace(leftoverRegex, () => {
    leftoverCount++;
    return `className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide">\n                  Add Order (Pay From Wallet)\n                </Button>`;
});

fs.writeFileSync(path, content, 'utf-8');
console.log('Replaced ' + count + ' grid occurrences and ' + leftoverCount + ' leftover button occurrences.');
