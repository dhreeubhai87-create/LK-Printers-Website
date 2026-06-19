const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/smart-upload.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
let normalized = content.replace(/\r\n/g, '\n');

// 1. Replace TanStack router import to include useNavigate
const oldImport = `import { createFileRoute } from "@tanstack/react-router";`;
const newImport = `import { createFileRoute, useNavigate } from "@tanstack/react-router";`;

if (normalized.includes(oldImport)) {
  normalized = normalized.replace(oldImport, newImport);
  console.log('Successfully replaced import!');
} else {
  console.log('Error: Could not find TanStack Route import.');
}

// 2. Define the preset slug mapping
const slugMappingDefinition = `
// Map of smart-upload presets to product slugs in fallback-data / store
const PRESET_TO_PRODUCT_SLUG_MAP: Record<string, string> = {
  // Visiting Cards
  "vcard-premium": "800-gsm-velvet",
  "vcard-classic": "regular-matt",
  "vcard-shiny": "regular-gloss-coated",
  
  // Garments Tags
  "tag-standard": "garments-tags-gloss",
  "tag-diecut": "garments-tags-matt-uv",
  
  // Files & Folders
  "file-standard": "files-sbs-small",
  "file-clip": "files-pvc-clip",
  
  // Letter Heads
  "lh-standard": "letterheads-100gsm-bond",
  "lh-classic": "letter-head-paper",
  
  // Envelopes
  "env-9x4": "envelopes-9x4",
  "env-a4": "envelopes-940x1240",
  
  // Digital Paper Printing
  "dp-a4-color": "letter-head-paper",
  "dp-a3-brochure": "art-paper",
  
  // ATM Pouches
  "atm-sleeve": "atm-pouch-gloss",
  
  // Bill Books
  "bb-duplicate": "a4-bill-book-2-copy",
  
  // Stickers & Labels
  "sticker-circle": "paper-stickers",
  
  // Pens
  "pen-laser": "laser-printed-pen",
  
  // Pamphlets & Posters
  "poster-a3": "a3-posters",
};
`;

// Insert the mapping before the SmartUploadPage function
const functionStart = `function SmartUploadPage() {`;
const newFunctionStart = slugMappingDefinition + '\n' + `function SmartUploadPage() {` + '\n' + `  const navigate = useNavigate();`;

if (normalized.includes(functionStart)) {
  normalized = normalized.replace(functionStart, newFunctionStart);
  console.log('Successfully added slug map and navigate hook!');
} else {
  console.log('Error: Could not find SmartUploadPage function start.');
}

// 3. Replace Lock Design button onClick handler
const oldButton = `              {/* Complete checkout button */}
              {report?.status === "fixed" && (
                <Button
                  className="w-full h-13 text-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-emerald flex items-center justify-center gap-2 group uppercase tracking-wider"
                  onClick={() => toast.success("Design successfully locked! Sending high-res TIFF to checkout...")}
                >
                  <span>Lock Design & Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}`;

const newButton = `              {/* Complete checkout button */}
              {report?.status === "fixed" && (
                <Button
                  className="w-full h-13 text-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-emerald flex items-center justify-center gap-2 group uppercase tracking-wider"
                  onClick={() => {
                    if (!file) return;
                    localStorage.setItem("lk-smart-upload-image", fixedImageUrl || "");
                    localStorage.setItem("lk-smart-upload-filename", file.name);
                    
                    const matchingSlug = PRESET_TO_PRODUCT_SLUG_MAP[selectedProduct.id] || "800-gsm-velvet";
                    toast.success("Design successfully locked! Redirecting to checkout customizer...");
                    
                    setTimeout(() => {
                      navigate({
                        to: "/product/$slug",
                        params: { slug: matchingSlug },
                      });
                    }, 800);
                  }}
                >
                  <span>Lock Design & Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}`;

if (normalized.includes(oldButton)) {
  normalized = normalized.replace(oldButton, newButton);
  console.log('Successfully updated Lock Design button onClick handler!');
} else {
  console.log('Error: Could not find Lock Design button block.');
}

// Write back with CRLF line endings
fs.writeFileSync(filePath, normalized.replace(/\n/g, '\r\n'), 'utf8');
console.log('smart-upload.tsx modified successfully!');
