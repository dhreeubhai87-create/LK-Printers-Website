const fs = require('fs');
const path = require('path');

const filePath = 'E:/New folder/lk/copy/src/lib/fallback-data.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find the FALLBACK_PRODUCTS array
const startMarker = 'export const FALLBACK_PRODUCTS: Product[] = [';
const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
    console.error('Could not find FALLBACK_PRODUCTS array');
    process.exit(1);
}

const arrayStart = startIndex + startMarker.length;
// We'll extract the array content. Since it ends with '];', we look for that.
const arrayEnd = content.lastIndexOf('];');
const arrayContent = content.substring(arrayStart, arrayEnd);

// Split products by the structure '},\n  {' or '}, {'
const products = [];
let currentProduct = '';
let braceCount = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    if ((char === "'" || char === '"' || char === '`') && arrayContent[i-1] !== '\\') {
        if (!inString) {
            inString = true;
            stringChar = char;
        } else if (char === stringChar) {
            inString = false;
        }
    }

    if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
    }

    currentProduct += char;

    if (braceCount === 0 && currentProduct.trim().length > 0) {
        if (char === ',' || i === arrayContent.length - 1) {
            products.push(currentProduct.trim());
            currentProduct = '';
        }
    }
}

const updatedProducts = products.map(pString => {
    const getName = () => {
        const match = pString.match(/name:\s*["'`](.*?)["'`],/);
        return match ? match[1] : '';
    };
    const getFeatures = () => {
        const match = pString.match(/features:\s*\[([\s\S]*?)\],/);
        if (!match) return [];
        return match[1].split(',').map(f => f.trim().replace(/^["'`](.*)["'`]$/, '$1'));
    };
    const getCode = () => {
        const match = pString.match(/code:\s*["'`](.*?)["'`],/);
        return match ? match[1] : '';
    };

    const name = getName();
    const features = getFeatures().join(' ');
    const fullText = (name + ' ' + features).toLowerCase();

    let lamination = "Not Available";
    if (fullText.includes("velvet")) lamination = "Velvet";
    else if (fullText.includes("matt")) lamination = "Matt";
    else if (fullText.includes("gloss")) lamination = "Gloss";
    else if (fullText.includes("drip-off")) lamination = "Drip-off";
    else if (fullText.includes("uv coated")) lamination = "Gloss UV Coated";
    
    if (name.toLowerCase().includes("sticker") && lamination === "Not Available") lamination = "Available";

    let uv = "Not Available";
    if (fullText.includes("spot uv") || fullText.includes("uv option: available")) uv = "Available";
    else if (fullText.includes("uv")) uv = "Available";

    let foil = "Not Available";
    if (fullText.includes("foil")) {
        if (fullText.includes("5 types")) foil = "Available (5 Types)";
        else foil = "Available";
    }

    let die_cut = "Not Available";
    if (fullText.includes("die cut") || fullText.includes("die shape") || fullText.includes("die-cut")) {
        if (fullText.includes("36 types")) die_cut = "Available (36 Types)";
        else if (fullText.includes("10 different")) die_cut = "Available (10 Shapes)";
        else die_cut = "Available";
    }

    let production_time = "3 days";
    const prodMatch = fullText.match(/(\d+)\s*(working\s*days|days)/);
    if (prodMatch) production_time = prodMatch[1] + " days";
    if (name.toLowerCase().includes("sticker")) production_time = "7 days";

    const code = getCode() || "N/A";
    const newDetails = `        product_details: {
      code: "${code}",
      lamination: "${lamination}",
      uv: "${uv}",
      foil: "${foil}",
      die_cut: "${die_cut}",
      production_time: "${production_time}"
    },`;

    if (pString.includes('product_details:')) {
        return pString.replace(/product_details:\s*\{[\s\S]*?\}/, newDetails.replace(/        product_details:/, 'product_details:').replace(/,$/, ''));
    } else {
        return pString.replace('...defaultDelivery', `${newDetails}\n    ...defaultDelivery`);
    }
});

const newContent = content.substring(0, arrayStart) + updatedProducts.join('\n  ') + content.substring(arrayEnd);
fs.writeFileSync(filePath, newContent);
console.log('Done');
