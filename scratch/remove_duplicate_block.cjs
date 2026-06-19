const fs = require('fs');
const path = require('path');
const file = path.join('src', 'routes', 'product.$slug.tsx');
let content = fs.readFileSync(file, 'utf8');

// Find the SECOND B2BFileSelector
const firstIndex = content.indexOf('export function B2BFileSelector');
const secondIndex = content.indexOf('export function B2BFileSelector', firstIndex + 100);

if (secondIndex !== -1) {
  // Find the StickerCustomizer after the second index
  const stickerIndex = content.indexOf('// CUSTOM STICKER CONFIGURATOR', secondIndex);
  
  if (stickerIndex !== -1) {
    console.log(`Removing from index ${secondIndex} to ${stickerIndex}`);
    // Go backwards from stickerIndex to include the // ----- line
    const startOfSticker = content.lastIndexOf('// ---', stickerIndex);
    
    content = content.substring(0, secondIndex) + content.substring(startOfSticker);
    fs.writeFileSync(file, content);
    console.log('Removed duplicate block successfully!');
  } else {
    console.log('Could not find StickerCustomizer after second B2BFileSelector');
  }
} else {
  console.log('Could not find second B2BFileSelector');
}
