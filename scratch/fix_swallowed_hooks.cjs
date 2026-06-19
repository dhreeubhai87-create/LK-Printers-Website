const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Pattern: const breakdown = useMemo(() => { ... return ...; \n\n const ... = useMemo ... }, [deps]);
// We want to extract the extra hooks from inside breakdown and put them before breakdown.

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

    const breakdownStart = section.indexOf('const breakdown = useMemo');
    if (breakdownStart === -1) return;
    
    const breakdownEnd = section.indexOf('}, [', breakdownStart);
    const breakdownEndFinal = section.indexOf(']);', breakdownEnd) + 3;
    const breakdownCode = section.substring(breakdownStart, breakdownEndFinal);

    // Check if there are other hooks inside breakdownCode
    if (breakdownCode.includes('const ') && (breakdownCode.includes(' = useMemo') || breakdownCode.includes(' = useState') || breakdownCode.includes(' = useEffect'))) {
        console.log(`Fixing swallowed hooks in ${name}`);
        
        // Find the return calculatePrice line
        const returnLine = breakdownCode.indexOf('return calculatePrice');
        const returnEnd = breakdownCode.indexOf(');', returnLine) + 2;
        const innerReturn = breakdownCode.substring(returnLine, returnEnd);
        
        // Everything else before return calculatePrice (excluding the start) is "prologue"
        const prologue = breakdownCode.substring(breakdownCode.indexOf('{') + 1, returnLine).trim();
        
        // Everything after return calculatePrice until the dependencies is "epilogue" (the swallowed hooks)
        const epilogue = breakdownCode.substring(returnEnd, breakdownEnd).trim();
        
        // The dependencies
        const deps = breakdownCode.substring(breakdownEnd + 4, breakdownEndFinal - 3).trim();
        
        const newBreakdown = `const breakdown = useMemo(() => {
    ${prologue}
    ${innerReturn}
  }, [${deps}]);`;

        const newCode = epilogue + '\n\n' + newBreakdown;
        
        let newSection = section.replace(breakdownCode, newCode);
        content = content.substring(0, startIdx) + newSection + content.substring(endIdx === -1 ? content.length : endIdx);
    }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed swallowed hooks');
