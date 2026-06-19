const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const customizers = [
    'GenericVisitingCardCustomizer',
    'MetalCardCustomizer',
    'Velvet800GsmCustomizer',
    'Matt800GsmCustomizer',
    'CraftSheet800GsmCustomizer',
    'Texture800GsmCustomizer',
    'Velvet500GsmCustomizer',
    'Matt500GsmCustomizer',
    'DripOff500GsmCustomizer',
    'GarmentTagCustomizer',
    'FilesCustomizer',
    'LetterheadCustomizer',
    'EnvelopeCustomizer',
    'ATMPouchCustomizer',
    'BillBookCustomizer',
    'StickerCustomizer',
    'PenCustomizer',
    'PamphletPosterCustomizer',
    'TargetCustomizer'
];

customizers.forEach(name => {
    const startIdx = content.indexOf(`function ${name}`);
    if (startIdx === -1) return;

    // Find handleAddToCart in this function
    const handleStart = content.indexOf('const handleAddToCart = () => {', startIdx);
    if (handleStart === -1) return;
    
    // Check if it's already fixed (contains addToCart with breakdown.total)
    const handleEnd = content.indexOf('};', handleStart) + 2;
    const handleBody = content.substring(handleStart, handleEnd);
    
    if (handleBody.includes('addToCart(product, breakdown.total')) {
        console.log(`${name} already fixed`);
        return;
    }

    // Determine which variant variable to use
    let variantVar = 'selectedVariant';
    if (content.indexOf('selectedVariantId', startIdx) !== -1 && content.indexOf('selectedVariantId', startIdx) < content.indexOf('return (', startIdx)) {
        variantVar = 'selectedVariantId';
    }

    const replacement = `  const handleAddToCart = () => {
    addToCart(product, breakdown.total, quantity, {
      orderName,
      variant: typeof ${variantVar} !== 'undefined' ? ${variantVar} : undefined,
      printing: typeof printing !== 'undefined' ? printing : (typeof selectedPrinting !== 'undefined' ? selectedPrinting : undefined),
      spotUv: typeof spotUv !== 'undefined' ? spotUv : (typeof selectedSpotUV !== 'undefined' ? selectedSpotUV : undefined),
      foil: typeof foil !== 'undefined' ? foil : undefined,
      foilColor: typeof foilColor !== 'undefined' ? foilColor : undefined,
      dieShape: typeof dieShape !== 'undefined' ? dieShape : undefined,
      privacy: typeof privacyPacking !== 'undefined' ? privacyPacking : undefined,
      whiteBase: typeof whiteBase !== 'undefined' ? whiteBase : undefined,
      textureType: typeof textureType !== 'undefined' ? textureType : undefined,
      metalFinish: typeof metalFinish !== 'undefined' ? metalFinish : undefined,
      colorCount: typeof colorCount !== 'undefined' ? colorCount : undefined,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: \`\${product.name} order has been created.\` });
  };`;

    content = content.substring(0, handleStart) + replacement.replace(/\n/g, '\r\n') + content.substring(handleEnd);
    console.log(`Fixed ${name} handleAddToCart`);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated all customizers');
