const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const customizers = [
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

    const endIdx = content.indexOf('// ---', startIdx);
    let section = content.substring(startIdx, endIdx === -1 ? content.length : endIdx);

    // Look for nested handleAddToCart
    const handleStart = section.indexOf('const handleAddToCart = () => {');
    const breakdownStart = section.indexOf('const breakdown = useMemo');
    
    // Check if handle is inside breakdown
    // Breakdown end is normally }); or ]);
    // In the corrupted version, handle is between breakdownStart and breakdownEnd
    const breakdownEnd = section.indexOf('}, [', breakdownStart);
    const breakdownEndFinal = section.indexOf(']);', breakdownEnd) + 3;
    
    if (handleStart > breakdownStart && handleStart < breakdownEndFinal) {
        console.log(`Fixing corruption in ${name}`);
        
        // Extract handleAddToCart
        const handleEnd = section.indexOf('  };', handleStart) + 4;
        const handleCode = section.substring(handleStart, handleEnd);
        
        // Remove handleCode from section
        let newSection = section.replace(handleCode, '');
        
        // Now find where breakdown ends in the NEW section
        const newBreakdownStart = newSection.indexOf('const breakdown = useMemo');
        const newBreakdownEnd = newSection.indexOf('}, [', newBreakdownStart);
        const newBreakdownEndFinal = newSection.indexOf(']);', newBreakdownEnd) + 3;
        
        // Insert handleCode after breakdown
        newSection = newSection.substring(0, newBreakdownEndFinal) + '\n\n' + handleCode + newSection.substring(newBreakdownEndFinal);
        
        content = content.substring(0, startIdx) + newSection + content.substring(endIdx === -1 ? content.length : endIdx);
    }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed corrupted customizers');
