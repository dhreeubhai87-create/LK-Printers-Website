import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { a as Route, s as supabase } from "./router-frHDfBxK.js";
import { S as SiteHeader } from "./site-header-B5bYOmyi.js";
import { S as SiteFooter } from "./site-footer-ehRP9ZUw.js";
import { H as HARDCODED_CATEGORIES, F as FALLBACK_PRODUCTS } from "./fallback-data-DTgqkTfJ.js";
import "zod";
import "@supabase/supabase-js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-dialog";
import "sonner";
import "pdf-lib";
import "fs";
import "path";
import "sharp";
function parseSubcategory(subcat) {
  const match = subcat.match(/^(.*?)\s*(\(.*?\))?$/i);
  if (match) {
    return {
      title: match[1],
      qty: match[2] || ""
    };
  }
  return {
    title: subcat,
    qty: ""
  };
}
function ProductDetailsBlock({
  p,
  themeColor
}) {
  const d = p.product_details;
  if (!d) return null;
  const blueColor = "#0066cc";
  const pinkColor = "#990066";
  const renderDetail = (label, value, color) => {
    if (!value || value === "Not Available") return null;
    return /* @__PURE__ */ jsxs("div", { style: {
      color
    }, className: "leading-tight", children: [
      label && /* @__PURE__ */ jsxs("span", { className: "opacity-100", children: [
        label,
        " "
      ] }),
      value
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full text-[14px] text-center space-y-[4px] mt-4 px-2", style: {
    fontFamily: "Arial, sans-serif"
  }, children: [
    renderDetail("Product Code:", d.code, blueColor),
    /* @__PURE__ */ jsx("div", { className: "h-[1px] w-8 bg-gray-100 mx-auto my-2" }),
    renderDetail(null, d.lamination, pinkColor),
    /* @__PURE__ */ jsx("div", { className: "pt-1", children: renderDetail("Production Time:", d.production_time, blueColor) })
  ] });
}
function CategoryPage() {
  const {
    slug
  } = Route.useParams();
  const initialCategory = useMemo(() => {
    return HARDCODED_CATEGORIES.find((c) => c.slug === slug) || null;
  }, [slug]);
  const initialProducts = useMemo(() => {
    return FALLBACK_PRODUCTS.filter((p) => p.category_slug === slug);
  }, [slug]);
  const [category, setCategory] = useState(initialCategory);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(!initialCategory);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [pageError, setPageError] = useState(null);
  useEffect(() => {
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
      let categoryData = null;
      let dbProducts = [];
      let supabaseError = null;
      try {
        const [catRes, prodRes] = await Promise.all([supabase.from("categories").select("*").eq("slug", slug).maybeSingle(), supabase.from("products").select("*").eq("category_slug", slug)]);
        if (catRes.error || prodRes.error) {
          const errorMessage = catRes.error?.message || prodRes.error?.message || "Unknown Supabase error";
          supabaseError = `Supabase query failed: ${errorMessage}`;
          console.warn("Supabase load issue:", catRes.error || prodRes.error);
        } else {
          categoryData = catRes.data;
          dbProducts = prodRes.data ?? [];
        }
      } catch (error) {
        supabaseError = error instanceof Error ? error.message : String(error);
        console.warn("Supabase request failed:", error);
      }
      if (!categoryData) {
        const fallbackCat = HARDCODED_CATEGORIES.find((c) => c.slug === slug);
        if (fallbackCat) {
          categoryData = fallbackCat;
        }
      }
      const localProducts = FALLBACK_PRODUCTS.filter((p) => p.category_slug === slug);
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
    const groups = {};
    products.forEach((p) => {
      const key = p.subcategory || "default";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [products]);
  function ProductCard({
    p,
    themeColor
  }) {
    const bgColor = p.theme_color || themeColor || "#333";
    const gradient = `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`;
    p.images?.[0];
    return /* @__PURE__ */ jsxs(Link, { to: "/product/$slug", params: {
      slug: p.slug
    }, className: "flex flex-col items-center group relative w-[280px] transition-all duration-300 hover:scale-[1.03]", children: [
      p.coming_soon && /* @__PURE__ */ jsx("div", { className: "absolute -top-1 -right-2 z-10 w-24 h-24 overflow-hidden pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "absolute top-[20px] -right-[24px] bg-red-600 text-white text-[10px] font-bold py-0.5 px-8 rotate-45 shadow-sm text-center w-[120px]", children: "Coming Soon" }) }),
      p.is_new && /* @__PURE__ */ jsx("div", { className: "absolute -top-1 -right-2 z-10 w-24 h-24 overflow-hidden pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "absolute top-[20px] -right-[24px] bg-red-600 text-white text-[10px] font-bold py-0.5 px-8 rotate-45 shadow-sm text-center w-[120px]", children: "NEW" }) }),
      /* @__PURE__ */ jsx("div", { className: "w-full p-[3px] bg-white mb-0 shadow-lg group-hover:shadow-xl transition-shadow duration-300 rounded-sm", style: {
        border: `2px solid ${bgColor}`
      }, children: /* @__PURE__ */ jsx("div", { className: "w-full h-full flex flex-col items-center justify-center text-white px-4 py-8 min-h-[140px]", style: {
        background: gradient
      }, children: /* @__PURE__ */ jsx("h3", { className: "text-[20px] font-bold text-center leading-tight tracking-widest uppercase drop-shadow-md", style: {
        fontFamily: "Arial, sans-serif"
      }, children: p.name }) }) }),
      /* @__PURE__ */ jsx(ProductDetailsBlock, { p, themeColor: bgColor })
    ] }, p.id);
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Home"
      ] }),
      pageError ? /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-red-200 bg-red-50 p-8 text-center mb-8", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-red-700 mb-3", children: "Something went wrong" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 mb-4", children: "Unable to load this category right now. Try again in a few moments." }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 opacity-90 break-words", children: pageError })
      ] }) : null,
      loading ? /* @__PURE__ */ jsx("div", { className: "h-96 rounded bg-gray-100 animate-pulse" }) : notFoundFlag || !category ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-2", children: "Category not found" }),
        /* @__PURE__ */ jsx(Link, { to: "/", className: "text-blue-600 hover:underline", children: "Go home" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-12 max-w-[1200px] mx-auto", children: Object.entries(groupedProducts).map(([subcat, prods]) => {
        const themeColor = prods[0].theme_color || "#333";
        const {
          title,
          qty
        } = parseSubcategory(subcat);
        if (subcat === "default") {
          return /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-[28px] font-bold mb-6", style: {
              color: themeColor,
              fontFamily: "Arial, sans-serif"
            }, children: category.name }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-6", children: prods.map((p) => /* @__PURE__ */ jsx(ProductCard, { p, themeColor }, p.id)) })
          ] }, subcat);
        }
        return /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-[28px] font-bold mb-6 flex items-baseline gap-2", style: {
            color: themeColor,
            fontFamily: "Arial, sans-serif"
          }, children: [
            /* @__PURE__ */ jsx("span", { children: title }),
            qty && /* @__PURE__ */ jsx("span", { className: "text-[18px]", children: qty })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-6", children: prods.map((p) => /* @__PURE__ */ jsx(ProductCard, { p, themeColor }, p.id)) })
        ] }, subcat);
      }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  CategoryPage as component
};
