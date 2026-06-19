export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  coming_soon: boolean;
};

export type SizeOption = { id: string; label: string; multiplier: number };
export type PaperType = { id: string; label: string; price: number; image?: string; production_time?: string };
export type ColorOption = { id: string; label: string; price: number };
export type FinishingOption = { id: string; label: string; price: number };
export type QuantityTier = { qty: number; discount: number };

export type Product = {
  id: string;
  slug: string;
  category_slug: string;
  name: string;
  description: string | null;
  base_price: number;
  images: string[];
  sizes: SizeOption[];
  paper_types: PaperType[];
  color_options: ColorOption[];
  finishing_options: FinishingOption[];
  quantity_tiers: QuantityTier[];
  delivery_days: number;
  shipping_cost: number;
  express_extra: number;
  subcategory?: string;
  features?: string[];
  coming_soon?: boolean;
  is_new?: boolean;
  theme_color?: string;
  size_label?: string;
  paper_label?: string;
  color_label?: string;
  finishing_label?: string;
  product_details?: {
    code?: string;
    lamination?: string;
    uv?: string;
    foil?: string;
    die_cut?: string;
    texture?: string;
    production_time?: string;
  };
};

export type PriceBreakdown = {
  basePrice: number;
  sizeAdjustment: number;
  paperPrice: number;
  colorPrice: number;
  finishingPrice: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  discountPct: number;
  shipping: number;
  expressExtra: number;
  total: number;
  quantity: number;
};
