import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatINR } from "@/lib/pricing";
import type { Category, Product } from "@/lib/types";

import { FALLBACK_PRODUCTS, HARDCODED_CATEGORIES } from "@/lib/fallback-data";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

// Helper to extract the (QTY...) part from subcategory
function parseSubcategory(subcat: string) {
  const match = subcat.match(/^(.*?)\s*(\(.*?\))?$/i);
  if (match) {
    return {
      title: match[1],
      qty: match[2] || "",
    };
  }
  return { title: subcat, qty: "" };
}

// Product details block shown BELOW the colored card
function ProductDetailsBlock({ p, themeColor }: { p: Product; themeColor: string }) {
  const d = p.product_details;
  if (!d) return null;

  const blueColor = "#0066cc";
  const pinkColor = "#990066";

  const renderDetail = (label: string | null, value: string | undefined, color: string) => {
    if (!value || value === "Not Available") return null;
    return (
      <div style={{ color }} className="leading-tight">
        {label && <span className="opacity-100">{label} </span>}
        {value}
      </div>
    );
  };

  return (
    <div className="w-full text-[14px] text-center space-y-[4px] mt-4 px-2" style={{ fontFamily: "Arial, sans-serif" }}>
      {renderDetail("Product Code:", d.code, blueColor)}
      <div className="h-[1px] w-8 bg-gray-100 mx-auto my-2" />
      {renderDetail(null, d.lamination, pinkColor)}

      <div className="pt-1">
        {renderDetail("Production Time:", d.production_time, blueColor)}
      </div>
    </div>
  );
}

function CategoryPage() {
  const { slug } = Route.useParams();

  // Find fallback category and products synchronously for instant rendering
  const initialCategory = useMemo(() => {
    return (HARDCODED_CATEGORIES.find(c => c.slug === slug) as unknown as Category) || null;
  }, [slug]);

  const initialProducts = useMemo(() => {
    return FALLBACK_PRODUCTS.filter(p => p.category_slug === slug);
  }, [slug]);

  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(!initialCategory);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    // Synchronously sync local fallback state if the slug changes
    if (initialCategory) {
      setCategory(initialCategory);
      setProducts(initialProducts);
      setLoading(false);
    } else {
      setCategory(null);
      setProducts([]);
      setLoading(true);
    }

    (async () => {
      setPageError(null);
      setNotFoundFlag(false);

      let categoryData: Category | null = null;
      let dbProducts: Product[] = [];
      let supabaseError: string | null = null;

      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from("categories").select("*").eq("slug", slug).maybeSingle(),
          supabase.from("products").select("*").eq("category_slug", slug),
        ]);

        if (catRes.error || prodRes.error) {
          const errorMessage = catRes.error?.message || prodRes.error?.message || "Unknown Supabase error";
          supabaseError = `Supabase query failed: ${errorMessage}`;
          console.warn("Supabase load issue:", catRes.error || prodRes.error);
        } else {
          categoryData = catRes.data as Category;
          dbProducts = (prodRes.data ?? []) as unknown as Product[];
        }
      } catch (error) {
        supabaseError = error instanceof Error ? error.message : String(error);
        console.warn("Supabase request failed:", error);
      }

      if (!categoryData) {
        const fallbackCat = HARDCODED_CATEGORIES.find(c => c.slug === slug);
        if (fallbackCat) {
          categoryData = fallbackCat as unknown as Category;
        }
      }

      const localProducts = FALLBACK_PRODUCTS.filter(p => p.category_slug === slug);
      const selectedProducts = localProducts.length > 0 ? localProducts : dbProducts;

      if (!categoryData) {
        setNotFoundFlag(true);
        setCategory(null);
        setProducts([]);
        if (supabaseError) {
          setPageError(`Unable to load category data. ${supabaseError}`);
        }
      } else {
        setCategory(categoryData);
        setProducts(selectedProducts);
        if (supabaseError && localProducts.length === 0 && dbProducts.length === 0) {
          setPageError(`Unable to load product list. ${supabaseError}`);
        }
      }

      setLoading(false);
    })();
  }, [slug, initialCategory, initialProducts]);

  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: Product[] } = {};
    products.forEach((p) => {
      const key = p.subcategory || "default";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [products]);

  // Shared product card renderer
  function ProductCard({ p, themeColor }: { p: Product; themeColor: string }) {
    const bgColor = p.theme_color || themeColor || "#333";
    const gradient = `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`;
    const productImage = p.images?.[0];
    return (
      <Link
        key={p.id}
        to="/product/$slug"
        params={{ slug: p.slug }}
        className="flex flex-col items-center group relative w-[280px] transition-all duration-300 hover:scale-[1.03]"
      >
        {p.coming_soon && (
          <div className="absolute -top-1 -right-2 z-10 w-24 h-24 overflow-hidden pointer-events-none">
            <div className="absolute top-[20px] -right-[24px] bg-red-600 text-white text-[10px] font-bold py-0.5 px-8 rotate-45 shadow-sm text-center w-[120px]">
              Coming Soon
            </div>
          </div>
        )}
        {p.is_new && (
          <div className="absolute -top-1 -right-2 z-10 w-24 h-24 overflow-hidden pointer-events-none">
            <div className="absolute top-[20px] -right-[24px] bg-red-600 text-white text-[10px] font-bold py-0.5 px-8 rotate-45 shadow-sm text-center w-[120px]">
              NEW
            </div>
          </div>
        )}

        {/* Colored name card */}
        <div
          className="w-full p-[3px] bg-white mb-0 shadow-lg group-hover:shadow-xl transition-shadow duration-300 rounded-sm"
          style={{ border: `2px solid ${bgColor}` }}
        >
          <div
            className="w-full h-full flex flex-col items-center justify-center text-white px-4 py-8 min-h-[140px]"
            style={{ background: gradient }}
          >
            <h3
              className="text-[20px] font-bold text-center leading-tight tracking-widest uppercase drop-shadow-md"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {p.name}
            </h3>
          </div>
        </div>

        {/* Details below the card */}
        <ProductDetailsBlock p={p} themeColor={bgColor} />
      </Link>
    );
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {pageError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center mb-8">
            <h1 className="text-3xl font-bold text-red-700 mb-3">Something went wrong</h1>
            <p className="text-sm text-red-600 mb-4">Unable to load this category right now. Try again in a few moments.</p>
            <p className="text-xs text-red-500 opacity-90 break-words">{pageError}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="h-96 rounded bg-gray-100 animate-pulse" />
        ) : notFoundFlag || !category ? (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-2">Category not found</h1>
            <Link to="/" className="text-blue-600 hover:underline">Go home</Link>
          </div>
        ) : (
          <div className="space-y-12 max-w-[1200px] mx-auto">
            {Object.entries(groupedProducts).map(([subcat, prods]) => {
              const themeColor = prods[0].theme_color || "#333";
              const { title, qty } = parseSubcategory(subcat);

              if (subcat === "default") {
                return (
                  <div key={subcat} className="mb-12">
                    <h2
                      className="text-[28px] font-bold mb-6"
                      style={{ color: themeColor, fontFamily: "Arial, sans-serif" }}
                    >
                      {category.name}
                    </h2>
                    <div className="flex flex-wrap gap-6">
                      {prods.map((p) => (
                        <ProductCard key={p.id} p={p} themeColor={themeColor} />
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={subcat} className="mb-12">
                  <h2
                    className="text-[28px] font-bold mb-6 flex items-baseline gap-2"
                    style={{ color: themeColor, fontFamily: 'Arial, sans-serif' }}
                  >
                    <span>{title}</span>
                    {qty && <span className="text-[18px]">{qty}</span>}
                  </h2>

                  <div className="flex flex-wrap gap-6">
                    {prods.map((p) => (
                      <ProductCard key={p.id} p={p} themeColor={themeColor} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
