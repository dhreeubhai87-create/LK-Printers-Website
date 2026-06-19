const fs = require('fs');
const path = require('path');

const filePath = 'E:/New folder/lk/copy/src/lib/fallback-data.ts';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'export const FALLBACK_PRODUCTS: Product[] = [';
const startIndex = content.indexOf(startMarker);
const arrayStart = startIndex + startMarker.length;
const arrayEnd = content.lastIndexOf('];');
const arrayContent = content.substring(arrayStart, arrayEnd);

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
    const fieldMatch = (field) => {
        const regex = new RegExp(field + ':\\s*["\'`](.*?)["\'`],');
        const match = pString.match(regex);
        return match ? match[1] : '';
    };
    
    const name = fieldMatch('name');
    const desc = fieldMatch('description');
    
    const featuresMatch = pString.match(/features:\s*\[([\s\S]*?)\],/);
    const features = featuresMatch ? featuresMatch[1] : '';
    
    const finishingMatch = pString.match(/finishing_options:\s*\[([\s\S]*?)\],/);
    const finishing = finishingMatch ? finishingMatch[1] : '';

    const fullText = (name + ' ' + desc + ' ' + features + ' ' + finishing).toLowerCase();

    let lamination = "Not Available";
    if (fullText.includes("velvet")) lamination = "Velvet";
    else if (fullText.includes("matt")) lamination = "Matt";
    else if (fullText.includes("gloss")) lamination = "Gloss";
    else if (fullText.includes("drip-off")) lamination = "Drip-off";
    else if (fullText.includes("uv coated")) lamination = "Gloss UV Coated";
    
    if (name.toLowerCase().includes("sticker") && lamination === "Not Available") lamination = "Available";

    let uv = "Not Available";
    if (fullText.includes("uv") || fullText.includes("spot") || fullText.includes("ultra")) uv = "Available";

    let foil = "Not Available";
    if (fullText.includes("foil") || fullText.includes("stamping")) {
        if (fullText.includes("5 types")) foil = "Available (5 Types)";
        else foil = "Available";
    }

    let die_cut = "Not Available";
    if (fullText.includes("die cut") || fullText.includes("die shape") || fullText.includes("die-cut") || fullText.includes("punch")) {
        if (fullText.includes("36 types")) die_cut = "Available (36 Types)";
        else if (fullText.includes("10 different") || fullText.includes("10 shapes")) die_cut = "Available (10 Shapes)";
        else die_cut = "Available";
    }

    let production_time = "3 days";
    const prodMatch = fullText.match(/(\d+)\s*(working\s*days|days)/);
    if (prodMatch) production_time = prodMatch[1] + " days";
    if (name.toLowerCase().includes("sticker")) production_time = "7 days";

    // Extract existing code from details if present, otherwise from top level
    let code = "N/A";
    const codeTopMatch = pString.match(/code:\s*["'`](.*?)["'`],/);
    if (codeTopMatch) code = codeTopMatch[1];
    const detailsCodeMatch = pString.match(/code:\s*["'`](.*?)["'`]/); // within product_details
    if (detailsCodeMatch) code = detailsCodeMatch[1];

    const newDetails = `    product_details: {
      code: "${code}",
      lamination: "${lamination}",
      uv: "${uv}",
      foil: "${foil}",
      die_cut: "${die_cut}",
      production_time: "${production_time}"
    },`;

    if (pString.includes('product_details:')) {
        return pString.replace(/product_details:\s*\{[\s\S]*?\}/, newDetails.trim());
    } else {
        return pString.replace('...defaultDelivery', `${newDetails}\n    ...defaultDelivery`);
    }
});

const newContent = content.substring(0, arrayStart) + '\n  ' + updatedProducts.join(',\n  ') + '\n' + content.substring(arrayEnd);
fs.writeFileSync(filePath, newContent);
console.log('Done');
