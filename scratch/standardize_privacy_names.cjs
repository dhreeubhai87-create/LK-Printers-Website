const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const mapping = {
    'GarmentTagCustomizer': 'garment_tag_privacy',
    'FilesCustomizer': 'files_privacy',
    'LetterheadCustomizer': 'letterhead_privacy',
    'EnvelopeCustomizer': 'envelope_privacy',
    'ATMPouchCustomizer': 'atm_pouch_privacy',
    'BillBookCustomizer': 'bill_book_privacy',
    'StickerCustomizer': 'sticker_privacy',
    'PenCustomizer': 'pen_privacy',
    'PamphletPosterCustomizer': 'pamphlet_privacy',
    'TargetCustomizer': 'target_privacy'
};

Object.entries(mapping).forEach(([comp, name]) => {
    const start = content.indexOf(`function ${comp}`);
    if (start === -1) return;
    const end = content.indexOf('// ---', start);
    let section = content.substring(start, end === -1 ? content.length : end);

    // Replace name="xxx" inside this section
    // Look for <input type="radio" name="..."
    section = section.replace(/<input type="radio" name="[^"]*"/g, `<input type="radio" name="${name}"`);
    
    content = content.substring(0, start) + section + content.substring(end === -1 ? content.length : end);
    console.log(`Standardized privacy names in ${comp}`);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully standardized all privacy radio button names');
