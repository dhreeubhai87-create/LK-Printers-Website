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

    const handleStart = section.indexOf('const handleAddToCart = () => {');
    const handleEnd = section.indexOf('};', handleStart) + 2;
    const handleCode = section.substring(handleStart, handleEnd);

    const breakdownStart = section.indexOf('const breakdown = useMemo');
    const breakdownEnd = section.indexOf(');', breakdownStart) + 2;
    const breakdownCode = section.substring(breakdownStart, breakdownEnd);

    if (handleStart !== -1 && breakdownStart !== -1 && handleStart < breakdownStart) {
        console.log(`Reordering in ${name}`);
        // Remove both
        let newSection = section.replace(handleCode, '');
        newSection = newSection.replace(breakdownCode, '');
        
        // Find where handleStart was and insert breakdown then handle
        // Better: just insert them after the last useState/useEffect
        const lastHook = Math.max(newSection.lastIndexOf('useState('), newSection.lastIndexOf('useEffect('));
        const insertPos = newSection.indexOf('\n', newSection.indexOf('}', lastHook)) + 1;
        
        newSection = newSection.substring(0, insertPos) + '\n' + breakdownCode + '\n\n' + handleCode + '\n' + newSection.substring(insertPos);
        
        content = content.substring(0, startIdx) + newSection + content.substring(endIdx === -1 ? content.length : endIdx);
    }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully reordered breakdown and handleAddToCart');
