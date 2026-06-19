const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'fallback-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

const p11Start = content.indexOf('id: "p11",');
if (p11Start === -1) {
    console.error("Could not find p11");
    process.exit(1);
}

// Find the end of p11 block (the next } followed by a comma and newline at depth 1)
// or just find the next ...defaultDelivery and the closing brace after it.

const deliveryIndex = content.indexOf('...defaultDelivery', p11Start);
const closingBraceIndex = content.indexOf('},', deliveryIndex);
const p11End = closingBraceIndex + 2;

const p11Block = content.substring(p11Start - 4, p11End); // -4 for indentation

const newStickers = `  {
    id: "st-without-cut",
    slug: "sticker-without-half-cut",
    category_slug: "stickers-labels",
    name: "Sticker ( Without Half Cut )",
    description: "Standard paper stickers without half-cut, ideal for manual cutting or large labels.",
    base_price: 2.5,
    images: ["https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?auto=format&fit=crop&w=600&q=80"],
    sizes: [{ id: "7x9.5", label: "7\\"X9.5\\"", multiplier: 1 }],
    paper_types: [{ id: "paper", label: "Paper Sticker", price: 0 }],
    color_options: [{ id: "cmyk", label: "Full Color", price: 0 }],
    finishing_options: [
      { id: "matt", label: "Matt Finish", price: 0.5 },
      { id: "gloss", label: "Gloss Finish", price: 0.5 }
    ],
    quantity_tiers: [{ qty: 1000, discount: 0 }],
    product_details: {
      code: "ST-1",
      lamination: "Available",
      uv: "Available",
      foil: "Available",
      die_cut: "Not Available",
      production_time: "7 days"
    },
    ...defaultDelivery
  },
  {
    id: "st-round-cut",
    slug: "sticker-with-round-cut",
    category_slug: "stickers-labels",
    name: "Sticker ( With Round Cut )",
    description: "Premium stickers with precise round half-cut for easy peeling.",
    base_price: 3.0,
    images: ["https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?auto=format&fit=crop&w=600&q=80"],
    sizes: [{ id: "7x9.5", label: "7\\"X9.5\\"", multiplier: 1 }],
    paper_types: [{ id: "paper", label: "Paper Sticker", price: 0 }],
    color_options: [{ id: "cmyk", label: "Full Color", price: 0 }],
    finishing_options: [
      { id: "matt", label: "Matt Finish", price: 0.5 },
      { id: "gloss", label: "Gloss Finish", price: 0.5 }
    ],
    quantity_tiers: [{ qty: 1000, discount: 0 }],
    product_details: {
      code: "ST-2",
      lamination: "Available",
      uv: "Available",
      foil: "Available",
      die_cut: "Available (Round)",
      production_time: "7 days"
    },
    ...defaultDelivery
  },
  {
    id: "st-straight-cut",
    slug: "sticker-with-straight-cut",
    category_slug: "stickers-labels",
    name: "Sticker ( With Straight Cut )",
    description: "Professional stickers with straight half-cut for quick application.",
    base_price: 2.8,
    images: ["https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?auto=format&fit=crop&w=600&q=80"],
    sizes: [{ id: "7x9.5", label: "7\\"X9.5\\"", multiplier: 1 }],
    paper_types: [{ id: "paper", label: "Paper Sticker", price: 0 }],
    color_options: [{ id: "cmyk", label: "Full Color", price: 0 }],
    finishing_options: [
      { id: "matt", label: "Matt Finish", price: 0.5 },
      { id: "gloss", label: "Gloss Finish", price: 0.5 }
    ],
    quantity_tiers: [{ qty: 1000, discount: 0 }],
    product_details: {
      code: "ST-3",
      lamination: "Available",
      uv: "Available",
      foil: "Available",
      die_cut: "Available (Straight)",
      production_time: "7 days"
    },
    ...defaultDelivery
  },`;

const newContent = content.substring(0, p11Start - 4) + newStickers + content.substring(p11End);
fs.writeFileSync(filePath, newContent);
console.log("Updated stickers successfully");
