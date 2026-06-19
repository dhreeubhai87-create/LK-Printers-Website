const fs = require('fs');
const filePath = 'E:/New folder/lk/copy/src/lib/fallback-data.ts';
let content = fs.readFileSync(filePath, 'utf8');

const products = content.split('  {');
const updatedProducts = products.map(p => {
    if (!p.includes('product_details:')) return p;

    let updatedP = p;
    const categorySlugMatch = p.match(/category_slug:\s*"(.*?)"/);
    const categorySlug = categorySlugMatch ? categorySlugMatch[1] : '';
    const nameMatch = p.match(/name:\s*"(.*?)"/);
    const name = nameMatch ? nameMatch[1] : '';

    // Visiting Cards
    if (categorySlug === 'visiting-cards') {
        if (!p.includes('id: "vcard-1"')) { // Metal cards are special
            updatedP = updatedP.replace(/foil:\s*"Not Available"/g, 'foil: "Available"');
            updatedP = updatedP.replace(/die_cut:\s*"Not Available"/g, 'die_cut: "Available"');
        }
    }

    // Files
    if (categorySlug === 'files') {
        updatedP = updatedP.replace(/die_cut:\s*"Not Available"/g, 'die_cut: "Available"');
        updatedP = updatedP.replace(/foil:\s*"Not Available"/g, 'foil: "Available"');
    }

    // Envelopes
    if (categorySlug === 'envelopes') {
        updatedP = updatedP.replace(/die_cut:\s*"Not Available"/g, 'die_cut: "Available"');
    }

    // Letterheads
    if (categorySlug === 'letter-heads') {
        if (!p.includes('p6-6')) { // Standard paper might not support everything
            updatedP = updatedP.replace(/uv:\s*"Not Available"/g, 'uv: "Available"');
            updatedP = updatedP.replace(/foil:\s*"Not Available"/g, 'foil: "Available"');
        }
    }

    // Stickers
    if (categorySlug === 'stickers-labels') {
        updatedP = updatedP.replace(/uv:\s*"Not Available"/g, 'uv: "Available"');
        updatedP = updatedP.replace(/foil:\s*"Not Available"/g, 'foil: "Available"');
        updatedP = updatedP.replace(/die_cut:\s*"Not Available"/g, 'die_cut: "Available"');
    }

    return updatedP;
});

fs.writeFileSync(filePath, updatedProducts.join('  {'));
console.log('Final Polish Done');
