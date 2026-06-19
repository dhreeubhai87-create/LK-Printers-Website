import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const baseProduct = {
  sizes: [{ id: "standard", label: "Standard Size", multiplier: 1 }],
  paper_types: [{ id: "standard", label: "Standard Quality", price: 0 }, { id: "premium", label: "Premium Quality", price: 100 }],
  color_options: [{ id: "cmyk", label: "Full Color", price: 0 }],
  finishing_options: [{ id: "none", label: "None", price: 0 }, { id: "matte", label: "Matte Finish", price: 50 }],
  quantity_tiers: [{ qty: 100, discount: 0 }, { qty: 500, discount: 10 }, { qty: 1000, discount: 20 }],
  images: ["https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80"],
  delivery_days: 3,
  shipping_cost: 50,
  express_extra: 100
};

const products = [
  {
    category_slug: "card-holders",
    slug: "metal-card-holder",
    name: "Premium Metal Card Holder",
    description: "Elegant metal card holders for executives.",
    base_price: 250,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1516542076529-1ea3854896e1?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "card-holders",
    slug: "leather-card-holder",
    name: "Leather Finish Card Holder",
    description: "Classic faux leather card holder with magnetic snap.",
    base_price: 350,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "pamphlets",
    slug: "a4-posters",
    name: "A4 Event Posters",
    description: "High-quality A4 posters for your events and sales.",
    base_price: 500,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "pamphlets",
    slug: "a5-flyers",
    name: "A5 Promotional Flyers",
    description: "Cost-effective flyers for mass distribution.",
    base_price: 300,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "garment-tags",
    slug: "premium-garment-tags",
    name: "Premium Garment Tags",
    description: "300gsm tags with custom hole punch for apparel.",
    base_price: 200,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "files-folders",
    slug: "corporate-folders",
    name: "Corporate Presentation Folders",
    description: "A4 folders with inside pockets and card slits.",
    base_price: 800,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "letterheads",
    slug: "executive-letterheads",
    name: "Executive Letterheads",
    description: "100gsm bond paper letterheads for professional correspondence.",
    base_price: 400,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "envelopes",
    slug: "window-envelopes",
    name: "Window Envelopes (9x4)",
    description: "Standard business envelopes with transparent window.",
    base_price: 300,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "envelopes",
    slug: "a4-envelopes",
    name: "A4 Size Envelopes",
    description: "Large envelopes for document mailing.",
    base_price: 500,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "digital-printing",
    slug: "letter-head-paper",
    name: "LETTER HEAD PAPER",
    description: "Premium letterhead printing on quality paper.",
    base_price: 30,
    theme_color: "#1d4ed8",
    features: ["Production Time: 1 day", "High-resolution print", "Custom branding available"],
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "digital-printing",
    slug: "art-paper",
    name: "ART PAPER",
    description: "Smooth art paper printing with rich color reproduction.",
    base_price: 35,
    theme_color: "#0f766e",
    features: ["Production Time: 1 day", "Vibrant colors", "Sharp detail"],
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1557682250-0a6a9aa0bdc7?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "digital-printing",
    slug: "texture-paper",
    name: "TEXTURE PAPER",
    description: "Elegant textured sheets for premium stationery.",
    base_price: 45,
    theme_color: "#6d28d9",
    features: ["Production Time: 1 day", "Premium tactile finish", "Distinctive look"],
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1514497170322-89ae1a08cfd8?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "digital-printing",
    slug: "metallic-paper",
    name: "METALLIC PAPER",
    description: "Shiny metallic paper for luxe branding and invitations.",
    base_price: 55,
    theme_color: "#b45309",
    features: ["Production Time: 1 day", "Metallic sheen", "Premium presentation"],
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1530731141654-5993c3016c77?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "digital-printing",
    slug: "nt-pvc-sheets",
    name: "NT / PVC SHEETS",
    description: "Durable NT and PVC sheets for robust printing applications.",
    base_price: 60,
    theme_color: "#15803d",
    features: ["Production Time: 1 day", "Water resistant", "Long-lasting print"],
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1560347876-aeef00ee58a1?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "digital-printing",
    slug: "paper-gumming",
    name: "PAPER GUMMING",
    description: "Paper gumming services for labels and stickers.",
    base_price: 40,
    theme_color: "#dc2626",
    features: ["Production Time: 1 day", "Strong adhesive", "Clean edges"],
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1517089958527-56c4d6ed9de7?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "digital-printing",
    slug: "pvc-gumming",
    name: "PVC GUMMING",
    description: "PVC gumming for rugged product labels and tags.",
    base_price: 50,
    theme_color: "#0f172a",
    features: ["Production Time: 1 day", "Waterproof finish", "Durable adhesion"],
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1541446654331-461d22fec5c1?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "digital-printing",
    slug: "only-printing",
    name: "ONLY PRINTING",
    description: "Digital-only printing service for simple jobs.",
    base_price: 25,
    theme_color: "#111827",
    features: ["Production Time: 1 day", "Fast turnaround", "Cost-effective"],
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1515834714536-41b9b5d2d5f0?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "atm-pouches",
    slug: "printed-atm-pouches",
    name: "Printed ATM Card Pouches",
    description: "Custom paper pouches for ATM and room key cards.",
    base_price: 150,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "bill-books",
    slug: "duplicate-bill-books",
    name: "Duplicate Bill Books",
    description: "1+1 carbonless duplicate invoice books.",
    base_price: 300,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "stickers-labels",
    slug: "diecut-vinyl-stickers",
    name: "Die-Cut Vinyl Stickers",
    description: "Waterproof vinyl stickers cut to your custom shape.",
    base_price: 200,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "pens",
    slug: "promotional-pens",
    name: "Promotional Ball Pens",
    description: "Plastic pens with single color pad printing.",
    base_price: 15,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "shooting-targets",
    slug: "10m-rifle-targets",
    name: "10m Air Rifle Targets",
    description: "ISSF standard 10m targets on premium card.",
    base_price: 100,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "sample-files",
    slug: "sample-kit",
    name: "Print Quality Sample Kit",
    description: "A complete kit of our paper stocks and finishes.",
    base_price: 250,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"]
  },
  {
    category_slug: "packaging",
    slug: "custom-boxes",
    name: "Custom Product Boxes",
    description: "Full-color printed folding cartons for your products.",
    base_price: 1000,
    ...baseProduct,
    images: ["https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80"]
  }
];

async function seed() {
  console.log("Seeding products...");
  for (const product of products) {
    const { data, error } = await supabase.from('products').upsert([product], { onConflict: 'slug' });
    if (error) {
      console.error("Error inserting", product.name, error.message);
    } else {
      console.log("Successfully inserted", product.name);
    }
  }
  console.log("Seeding complete!");
}

seed();
