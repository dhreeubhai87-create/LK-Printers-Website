const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/product.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
let normalized = content.replace(/\r\n/g, '\n');

// 1. Replace main parent component fileName initializer
const oldFileNameState = `  const [fileName, setFileName] = useState<string | null>(null);`;
const newFileNameState = `  const [fileName, setFileName] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-filename") || null;
  });`;

if (normalized.includes(oldFileNameState)) {
  normalized = normalized.replace(oldFileNameState, newFileNameState);
  console.log('Successfully replaced main parent fileName!');
} else {
  console.log('Error: Could not find parent fileName state.');
}

// 2. Replace B2BFileSelector states
const oldFileSelectorStates = `  const [localFile, setLocalFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [fixedImageUrl, setFixedImageUrl] = useState<string | null>(null);`;

const newFileSelectorStates = `  const [localFile, setLocalFile] = useState<File | null>(() => {
    const savedFilename = localStorage.getItem("lk-smart-upload-filename");
    if (savedFilename) {
      return new File([""], savedFilename, { type: "image/png" });
    }
    return null;
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState<any>(() => {
    const saved = localStorage.getItem("lk-smart-upload-image");
    if (saved) {
      return {
        status: "fixed",
        isFixed: true,
        dimensions: { width: spec.w, height: spec.h },
        dpi: spec.dpi,
        colorMode: spec.color,
        issues: []
      };
    }
    return null;
  });
  const [fixedImageUrl, setFixedImageUrl] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });`;

if (normalized.includes(oldFileSelectorStates)) {
  normalized = normalized.replace(oldFileSelectorStates, newFileSelectorStates);
  console.log('Successfully replaced B2BFileSelector states!');
} else {
  console.log('Error: Could not find B2BFileSelector states.');
}

// Write back with CRLF line endings to match the rest of the file
fs.writeFileSync(filePath, normalized.replace(/\n/g, '\r\n'), 'utf8');
console.log('Changes saved successfully!');
