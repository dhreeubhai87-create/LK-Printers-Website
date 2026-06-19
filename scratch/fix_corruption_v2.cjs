const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find all occurrences where breakdown is started inside handleFileChange incorrectly
// This usually looks like:
// reader.onloadend = () => { setFilePreview(reader.result as string); };\n\nconst breakdown = useMemo(() => { ... });\n\nreader.readAsDataURL(file);

const regex = /reader\.onloadend = \(\) => \{\s+setFilePreview\(reader\.result as string\);\s+\};\s+const breakdown = useMemo\(\(\) => \{([\s\S]*?)\}\s*,\s*\[([\s\S]*?)\]\);\s+reader\.readAsDataURL\(file\);/g;

content = content.replace(regex, (match, body, deps) => {
    return `reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const breakdown = useMemo(() => {${body}}, [${deps}]);`;
});

// Also fix case where handleAddToCart is inside breakdown (happened in some cases)
// ... already did that with fix_corruption.cjs but maybe it needs re-running or better regex

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed common corruption patterns');
