const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove dangling }, [deps]); lines that appear immediately after a hook or handler
// They usually look like:
//   }, [deps1]);\n\n}, [deps2]);

content = content.replace(/\}\s*,\s*\[([\s\S]*?)\]\);\s*\n\s*\}\s*,\s*\[([\s\S]*?)\]\);/g, (match, deps1, deps2) => {
    // Keep the first one if it belongs to a hook, but usually the second one is the dangling one from a previous bad edit
    // However, in our case, it seems the second one is dangling.
    return `}, [${deps1}]);`;
});

// Also fix cases where it's:
//  };\n\n}, [deps]);
content = content.replace(/\}\s*;\s*\n\s*\}\s*,\s*\[([\s\S]*?)\]\);/g, '};');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully removed dangling brackets');
