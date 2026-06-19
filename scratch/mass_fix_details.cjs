const fs = require('fs');
const filePath = 'E:/New folder/lk/copy/src/lib/fallback-data.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Use a regex to find and update product_details blocks
// We want to be more generous with "Available"
content = content.replace(/product_details:\s*\{([\s\S]*?)\}/g, (match, p1) => {
    let details = p1;
    
    // If it's a visiting card or file or tag, die_cut is almost always available
    // We can check the code or just do it for all if not specifically "Not Available" in a way that matters.
    
    // Fix Foil: if it's a premium card (800 GSM, Black, Craft, Texture, Velvet, Matt), foil is available.
    if (details.includes('code: "2"') || details.includes('code: "3"') || details.includes('code: "4"') || 
        details.includes('code: "5"') || details.includes('code: "6"') || details.includes('code: "7"') || 
        details.includes('code: "8"') || details.includes('code: "9"') || details.includes('code: "10"') ||
        details.includes('code: "11"')) {
        details = details.replace(/foil:\s*"Not Available"/, 'foil: "Available"');
        details = details.replace(/die_cut:\s*"Not Available"/, 'die_cut: "Available"');
    }
    
    // For Files (5-1, 5-2, etc.)
    if (details.includes('code: "5-')) {
        details = details.replace(/die_cut:\s*"Not Available"/, 'die_cut: "Available"');
        details = details.replace(/foil:\s*"Not Available"/, 'foil: "Available"');
    }
    
    // For Envelopes (7-1, etc.)
    if (details.includes('code: "7-')) {
        details = details.replace(/die_cut:\s*"Not Available"/, 'die_cut: "Available"');
    }
    
    return `product_details: {${details}}`;
});

fs.writeFileSync(filePath, content);
console.log('Done');
