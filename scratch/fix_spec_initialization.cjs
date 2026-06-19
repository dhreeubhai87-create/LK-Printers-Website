const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/product.$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
let normalized = content.replace(/\r\n/g, '\n');

// 1. Define getSpecsBySlug helper function
const helperFunc = `
function getSpecsBySlug(slug: string) {
  let w = 90;
  let h = 54;
  let bleed = 3;
  let safe = 3;
  let dpi = 300;
  let pages = 2;
  let color = "CMYK";

  const s = slug.toLowerCase();
  if (s.includes("pvc") || s.includes("micron")) {
    w = 90; h = 54; bleed = 2; safe = 3; pages = 2;
  } else if (s.includes("letterhead") || s.includes("letter-head")) {
    w = 210; h = 297; bleed = 3; safe = 5; pages = 1;
  } else if (s.includes("envelope")) {
    w = 220; h = 110; bleed = 3; safe = 4; pages = 1;
  } else if (s.includes("folder") || s.includes("file")) {
    w = 220; h = 310; bleed = 5; safe = 5; pages = 1;
  } else if (s.includes("poster") || s.includes("pamphlet")) {
    w = 297; h = 420; bleed = 5; safe = 5; pages = 1;
  } else if (s.includes("sticker") || s.includes("label")) {
    w = 50; h = 50; bleed = 2; safe = 3; pages = 1;
  } else if (s.includes("pen")) {
    w = 60; h = 8; bleed = 1; safe = 1; pages = 1;
  } else if (s.includes("tag")) {
    w = 50; h = 90; bleed = 3; safe = 3; pages = 2;
  } else if (s.includes("bill") || s.includes("invoice")) {
    w = 148; h = 210; bleed = 4; safe = 5; pages = 2;
  }

  return { id: slug, name: "Selected Product", w, h, bleed, safe, dpi, pages, color };
}
`;

// Insert the helper function right before "export function B2BFileSelector"
const targetStr = `export function B2BFileSelector({`;
if (normalized.includes(targetStr)) {
  normalized = normalized.replace(targetStr, helperFunc + '\n' + targetStr);
  console.log('Successfully inserted getSpecsBySlug helper!');
} else {
  console.log('Error: Could not find B2BFileSelector definition.');
}

// 2. Update B2BFileSelector report state to use getSpecsBySlug
const oldReportState = `  const [report, setReport] = useState<any>(() => {
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
  });`;

const newReportState = `  const [report, setReport] = useState<any>(() => {
    const saved = localStorage.getItem("lk-smart-upload-image");
    if (saved) {
      const currentSpec = getSpecsBySlug(slug);
      return {
        status: "fixed",
        isFixed: true,
        dimensions: { width: currentSpec.w, height: currentSpec.h },
        dpi: currentSpec.dpi,
        colorMode: currentSpec.color,
        issues: []
      };
    }
    return null;
  });`;

if (normalized.includes(oldReportState)) {
  normalized = normalized.replace(oldReportState, newReportState);
  console.log('Successfully updated report state initializer!');
} else {
  console.log('Error: Could not find old report state pattern.');
}

// 3. Simplify spec memo in B2BFileSelector to use the helper
const oldSpecMemo = `  // Auto-detect dynamic specifications based on slug context
  const spec = useMemo(() => {
    let w = 90;
    let h = 54;
    let bleed = 3;
    let safe = 3;
    let dpi = 300;
    let pages = 2;
    let color = "CMYK";

    const s = slug.toLowerCase();
    if (s.includes("pvc") || s.includes("micron")) {
      w = 90; h = 54; bleed = 2; safe = 3; pages = 2;
    } else if (s.includes("letterhead") || s.includes("letter-head")) {
      w = 210; h = 297; bleed = 3; safe = 5; pages = 1;
    } else if (s.includes("envelope")) {
      w = 220; h = 110; bleed = 3; safe = 4; pages = 1;
    } else if (s.includes("folder") || s.includes("file")) {
      w = 220; h = 310; bleed = 5; safe = 5; pages = 1;
    } else if (s.includes("poster") || s.includes("pamphlet")) {
      w = 297; h = 420; bleed = 5; safe = 5; pages = 1;
    } else if (s.includes("sticker") || s.includes("label")) {
      w = 50; h = 50; bleed = 2; safe = 3; pages = 1;
    } else if (s.includes("pen")) {
      w = 60; h = 8; bleed = 1; safe = 1; pages = 1;
    } else if (s.includes("tag")) {
      w = 50; h = 90; bleed = 3; safe = 3; pages = 2;
    } else if (s.includes("bill") || s.includes("invoice")) {
      w = 148; h = 210; bleed = 4; safe = 5; pages = 2;
    }

    return { id: slug, name: "Selected Product", w, h, bleed, safe, dpi, pages, color };
  }, [slug]);`;

const newSpecMemo = `  // Auto-detect dynamic specifications based on slug context
  const spec = useMemo(() => getSpecsBySlug(slug), [slug]);`;

if (normalized.includes(oldSpecMemo)) {
  normalized = normalized.replace(oldSpecMemo, newSpecMemo);
  console.log('Successfully simplified spec useMemo!');
} else {
  console.log('Error: Could not find old spec useMemo pattern.');
}

// Write back with CRLF line endings
fs.writeFileSync(filePath, normalized.replace(/\n/g, '\r\n'), 'utf8');
console.log('product.$slug.tsx updated successfully!');
