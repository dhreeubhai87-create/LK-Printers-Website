import { jsxs, jsx } from "react/jsx-runtime";
import { Printer } from "lucide-react";
function SiteFooter() {
  return /* @__PURE__ */ jsxs("footer", { id: "contact", className: "bg-foreground text-background mt-24", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Printer, { className: "w-5 h-5 text-primary-foreground" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-2xl font-serif font-bold", children: "LK Printer" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-background/70 leading-relaxed", children: "Premium printing solutions for businesses, professionals, and creators across India." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold mb-4 uppercase tracking-wider text-background/90", children: "Categories" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-background/70", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/#categories", className: "hover:text-accent transition-colors", children: "Visiting Cards" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/#categories", className: "hover:text-accent transition-colors", children: "Letterheads" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/#categories", className: "hover:text-accent transition-colors", children: "Pamphlets" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/#categories", className: "hover:text-accent transition-colors", children: "Stickers & Labels" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold mb-4 uppercase tracking-wider text-background/90", children: "Company" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-background/70", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/#about", className: "hover:text-accent transition-colors", children: "About Us" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "How It Works" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Quality Promise" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-accent transition-colors", children: "Bulk Inquiries" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold mb-4 uppercase tracking-wider text-background/90", children: "Get in Touch" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-background/70", children: [
          /* @__PURE__ */ jsx("li", { children: "📍 Mumbai, India" }),
          /* @__PURE__ */ jsx("li", { children: "✉️ hello@lkprinter.in" }),
          /* @__PURE__ */ jsx("li", { children: "📞 +91 98765 43210" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-t border-background/10 py-6 text-center text-xs text-background/50", children: [
      "© ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " LK Printer. All rights reserved."
    ] })
  ] });
}
export {
  SiteFooter as S
};
