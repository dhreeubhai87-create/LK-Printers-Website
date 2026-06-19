const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/routes/product.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const chunkRegex = /(?=^(?:export\s+)?function\s+\w+)/m;
const chunks = content.split(chunkRegex);

console.log(`Total chunks: ${chunks.length}`);

let modifiedCount = 0;

for (let i = 0; i < chunks.length; i++) {
  let chunk = chunks[i];
  const funcMatch = chunk.match(/^(?:export\s+)?function\s+(\w+)/);
  if (!funcMatch) continue;
  const funcName = funcMatch[1];
  
  if (!funcName.endsWith('Customizer') && funcName !== 'ProductPage') continue;
  if (!chunk.includes('setQuantity')) continue;

  modifiedCount++;
  console.log(`[${modifiedCount}] Processing ${funcName}...`);

  let minExpr = null;
  
  // Find min quantity expression
  const minQtyDeclMatch = chunk.match(/(?:const|let)\s+(MIN_QTY|minQty)\s*=\s*([^;]+);/);
  if (minQtyDeclMatch) {
    minExpr = minQtyDeclMatch[1];
  } else {
    const minAttrMatch = chunk.match(/min=\{([^}]+)\}/);
    if (minAttrMatch) {
      minExpr = minAttrMatch[1].trim();
    } else {
      const qtyTierMatch = chunk.match(/product\.quantity_tiers\[0\]\?\.qty/);
      if (qtyTierMatch) {
        minExpr = 'product.quantity_tiers[0]?.qty || 1';
      }
    }
  }

  if (!minExpr) {
    if (funcName.includes('Gsm500') || funcName.includes('500Gsm')) {
      minExpr = '500';
    } else if (funcName.includes('MetalCard')) {
      minExpr = '50';
    } else {
      minExpr = '1000';
    }
  }

  console.log(`  minExpr: ${minExpr}`);

  // Replace initial state if it starts with empty or select
  chunk = chunk.replace(
    /const\s+\[quantity,\s*setQuantity\]\s*=\s*useState(<[^>]*>)?\(([^)]*)\);/,
    (match, generic, initVal) => {
      const trimmedVal = initVal.trim();
      if (trimmedVal === '""' || trimmedVal === '"--Select--"' || trimmedVal === "'--Select--'") {
        const newInit = isNaN(Number(minExpr)) ? minExpr : (trimmedVal.startsWith('"') ? `"${minExpr}"` : minExpr);
        return `const [quantity, setQuantity] = useState${generic || ''}(${newInit});`;
      }
      return match;
    }
  );

  // Replace useEffect setQuantity if it sets to empty or select
  chunk = chunk.replace(/setQuantity\((["'](?:--Select--)?["'])\);/g, (match, val) => {
    const newVal = isNaN(Number(minExpr)) ? minExpr : (val.startsWith('"') ? `"${minExpr}"` : minExpr);
    return `setQuantity(${newVal});`;
  });

  // Input/select replacement
  if (funcName === 'MattTextureCustomizer') {
    chunk = chunk.replace(
      /<select[^>]*value=\{quantity\}[^]*?<\/select>/,
      `<select
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                  value={[1000, 2000, 3000, 4000, 5000, 10000].includes(Number(quantity)) ? quantity : "custom"}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "custom") {
                      setQuantity(1000);
                    } else {
                      setQuantity(Number(val));
                    }
                  }}
                >
                  {[1000, 2000, 3000, 4000, 5000, 10000].map(qty => (
                    <option key={qty} value={qty}>{qty.toLocaleString()}</option>
                  ))}
                  <option value="custom">Other Quantity</option>
                </select>`
    );
    chunk = chunk.replace(
      /\{quantity\s*===\s*"custom"\s*&&\s*\(\s*<div className="grid grid-cols-\[140px_1fr\][^]*?<\/div>\s*\)\}/,
      `{![1000, 2000, 3000, 4000, 5000, 10000].includes(Number(quantity)) && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <div />
                  <Input
                    type="number"
                    min={1000}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value as any)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < 1000) {
                        setQuantity(1000);
                      }
                    }}
                    placeholder="Enter Quantity"
                    className="border border-gray-300 p-2 w-full max-w-[200px] rounded-none bg-white"
                  />
                </div>
              )}`
    );
  } else {
    const inputTagRegex = /<(Input|input)[^>]*?value=\{quantity\}[^]*?\/>/i;
    const selectTagRegex = /<select[^>]*?value=\{quantity\}[^]*?>[^]*?<\/select>/i;

    if (inputTagRegex.test(chunk)) {
      chunk = chunk.replace(inputTagRegex, (match, tagName) => {
        let className = "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none";
        const classMatch = match.match(/className="([^"]+)"/);
        if (classMatch) {
          className = classMatch[1]
            .replace(/bg-gray-100/g, 'bg-white')
            .replace(/cursor-not-allowed/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        let onChange = `onChange={e => setQuantity(e.target.value as any)}`;
        let onBlur = `onBlur={() => {
                    const minVal = ${minExpr};
                    const val = Number(quantity);
                    if (isNaN(val) || val < minVal) {
                      setQuantity(typeof quantity === 'number' ? (minVal as any) : String(minVal));
                    }
                  }}`;

        if (funcName === 'ProductPage') {
          onChange = `onChange={(e) => setQuantity(Number(e.target.value))}`;
          onBlur = `onBlur={() => {
                    const minVal = (product?.quantity_tiers || [])[0]?.qty || 100;
                    if (quantity < minVal) {
                      setQuantity(minVal);
                    }
                  }}`;
        }

        return `<${tagName}
                  type="number"
                  min={${minExpr}}
                  value={quantity}
                  ${onChange}
                  ${onBlur}
                  className="${className}"
                />`;
      });
    } else if (selectTagRegex.test(chunk)) {
      chunk = chunk.replace(selectTagRegex, (match) => {
        let options = match.match(/<select[^>]*>([^]*?)<\/select>/i)?.[1] || "";
        options = options.replace(/<option[^>]*>(?:--Select--)?<\/option>/g, '');
        options = options.replace(/<option\s+value=["']["']>[^]*?<\/option>/g, '');

        let className = "border border-gray-300 p-2 w-full bg-white outline-none";
        const classMatch = match.match(/className="([^"]+)"/);
        if (classMatch) {
          className = classMatch[1]
            .replace(/bg-gray-100/g, 'bg-white')
            .replace(/cursor-not-allowed/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        return `<select
                  className="${className}"
                  value={quantity}
                  onChange={e => {
                    const val = e.target.value;
                    setQuantity(typeof quantity === 'number' ? (Number(val) as any) : val);
                  }}
                >
                  ${options.trim()}
                </select>`;
      });
    }
  }

  chunks[i] = chunk;
}

const newContent = chunks.join('');
fs.writeFileSync(filePath, newContent);
console.log(`Successfully modified ${modifiedCount} components.`);
