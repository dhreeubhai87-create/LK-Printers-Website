const fs = require('fs');
const path = 'src/routes/product.$slug.tsx';
let content = fs.readFileSync(path, 'utf-8');

// This regex finds the CURRENT single-button layout that is already in your file
const regex = /<div className="mt-6 w-full">\s*<Button\s+onClick=\{handleAddToCart\}\s+className="w-full bg-\[#007bff\] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-\[16px\] tracking-wide"\s*>\s*Add Order \(Pay From Wallet\)\s*<\/Button>\s*<\/div>/g;

// This replaces it with the DUAL button layout (Add Order + Order Now)
const replacement = `<div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault(); 
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout"; 
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>`;

let count = 0;
content = content.replace(regex, (match) => {
  count++;
  return replacement;
});

fs.writeFileSync(path, content, 'utf-8');
console.log('Replaced ' + count + ' occurrences with the dual-button (Order Now) layout.');
