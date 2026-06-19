const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'fallback-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find the double brace
const doubleBrace = '  {\n  {';
if (content.includes(doubleBrace)) {
    const newContent = content.replace(doubleBrace, '  {');
    fs.writeFileSync(filePath, newContent);
    console.log("Fixed double brace successfully");
} else {
    // try with different line endings or spacing
    const doubleBrace2 = '  {\r\n  {';
    if (content.includes(doubleBrace2)) {
        const newContent = content.replace(doubleBrace2, '  {');
        fs.writeFileSync(filePath, newContent);
        console.log("Fixed double brace (CRLF) successfully");
    } else {
        console.error("Could not find double brace");
    }
}
