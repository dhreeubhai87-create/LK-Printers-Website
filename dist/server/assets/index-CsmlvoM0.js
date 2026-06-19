import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight, Star, Truck, Zap, Printer, Package, PenTool, Palette, Droplets, Heart, ChevronRight, Layers, Focus } from "lucide-react";
import { S as SiteHeader } from "./site-header-B5bYOmyi.js";
import { S as SiteFooter } from "./site-footer-ehRP9ZUw.js";
import { B as Button } from "./router-frHDfBxK.js";
import { B as Badge } from "./badge-DHgTIpEC.js";
import { H as HARDCODED_CATEGORIES } from "./fallback-data-DTgqkTfJ.js";
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
const heroImg = "/assets/hero-CKUvNKLS.jpg";
function HomePage() {
  const [loading, setLoading] = useState(false);
  const categories = HARDCODED_CATEGORIES;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-background flex flex-col selection:bg-primary/20", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px]" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-8 max-w-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold animate-fade-in", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { children: "India's Premium Print Service" })
          ] }),
          /* @__PURE__ */ jsxs("h1", { className: "text-5xl md:text-7xl font-serif font-bold leading-[1.05] tracking-tight text-balance animate-fade-in-up", style: {
            animationDelay: "100ms"
          }, children: [
            "Design Your ",
            /* @__PURE__ */ jsx("span", { className: "text-primary italic", children: "Dreams," }),
            /* @__PURE__ */ jsx("br", {}),
            "We Print Your ",
            /* @__PURE__ */ jsxs("span", { className: "text-foreground relative inline-block", children: [
              "Reality.",
              /* @__PURE__ */ jsx("span", { className: "absolute bottom-2 left-0 w-full h-2 bg-accent/20 -z-10" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl animate-fade-in-up", style: {
            animationDelay: "200ms"
          }, children: "Experience professional-grade printing with live pricing, instant previews, and lightning-fast delivery across the nation." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in-up", style: {
            animationDelay: "300ms"
          }, children: [
            /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "h-14 px-8 text-base rounded-2xl shadow-xl shadow-primary/20 group bg-indigo-600 hover:bg-indigo-700 text-white border-0", children: /* @__PURE__ */ jsxs(Link, { to: "/smart-upload", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-4.5 h-4.5 mr-2" }),
              "AI Smart Upload",
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" })
            ] }) }),
            /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", variant: "outline", className: "h-14 px-8 text-base rounded-2xl border-2 hover:bg-muted/50", children: /* @__PURE__ */ jsx("a", { href: "#categories", children: "Explore Catalog" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6 pt-6 animate-fade-in-up", style: {
            animationDelay: "400ms"
          }, children: [
            /* @__PURE__ */ jsx("div", { className: "flex -space-x-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: `https://i.pravatar.cc/100?img=${i + 10}`, alt: "User" }) }, i)) }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 text-accent", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsx(Star, { className: "w-3.5 h-3.5 fill-current" }, i)) }),
              /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground mt-0.5", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-foreground", children: "10k+" }),
                " Happy Customers"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative animate-slide-in-right", style: {
          animationDelay: "200ms"
        }, children: [
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-background group", children: [
            /* @__PURE__ */ jsx("img", { src: heroImg, alt: "Premium Prints", className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "absolute -top-6 -right-6 bg-card p-4 rounded-3xl shadow-xl border animate-bounce-slow z-20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Truck, { className: "w-5 h-5 text-green-600" }) }),
            /* @__PURE__ */ jsxs("div", { className: "pr-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold", children: "Fast Delivery" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "Across India" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-6 -left-6 bg-card p-4 rounded-3xl shadow-xl border animate-bounce-slow-delayed z-20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Zap, { className: "w-5 h-5 text-primary" }) }),
            /* @__PURE__ */ jsxs("div", { className: "pr-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold", children: "Instant Price" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "Live Calculator" })
            ] })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "py-8 bg-muted/30 border-y overflow-hidden whitespace-nowrap", children: /* @__PURE__ */ jsx("div", { className: "flex items-center animate-marquee space-x-12 px-6", children: [...Array(3)].map((_, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-12 text-sm font-medium text-muted-foreground", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4 text-primary" }),
        " Premium Offset"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-4 h-4 text-primary" }),
        " Custom Packaging"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(PenTool, { className: "w-4 h-4 text-primary" }),
        " Luxury Finishing"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Palette, { className: "w-4 h-4 text-primary" }),
        " Spot UV & Foil"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Droplets, { className: "w-4 h-4 text-primary" }),
        " CMYK Matching"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Heart, { className: "w-4 h-4 text-primary" }),
        " Trusted Quality"
      ] })
    ] }, idx)) }) }),
    /* @__PURE__ */ jsx("section", { id: "categories", className: "py-24 bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-4xl md:text-5xl font-serif font-bold tracking-tight", children: "Premium Collections" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground", children: "Discover our curated range of professional printing solutions tailored for your brand's excellence." })
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "rounded-full group h-12", children: [
          "View All Products ",
          /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8", children: categories.map((cat, index) => /* @__PURE__ */ jsxs(Link, { to: cat.coming_soon ? "/" : "/category/$slug", params: cat.coming_soon ? {} : {
        slug: cat.slug
      }, className: `group relative h-[380px] rounded-[2.5rem] overflow-hidden border bg-card shadow-soft hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-in-up ${cat.coming_soon ? "opacity-70 cursor-not-allowed" : ""}`, style: {
        animationDelay: `${index * 100}ms`
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
          /* @__PURE__ */ jsx("img", { src: cat.image, alt: cat.name, className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 w-full p-8 space-y-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-white tracking-wide uppercase", children: cat.name }),
          !cat.coming_soon && /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-all duration-300", children: /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5" }) }) }),
          cat.coming_soon && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-white/10 text-white border-white/20 backdrop-blur-sm rounded-full", children: "Coming Soon" })
        ] })
      ] }, cat.id)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "about", className: "py-24 bg-muted/40 relative overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-20 space-y-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl md:text-5xl font-serif font-bold", children: "The Seamless Flow" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-lg", children: "Getting high-quality prints is now simpler than ever." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-12 max-w-6xl mx-auto", children: [{
        idx: "01",
        title: "Choose Product",
        desc: "Browse through our extensive catalog of 15+ premium printing categories.",
        icon: /* @__PURE__ */ jsx(Layers, { className: "w-6 h-6 text-primary" }),
        bg: "bg-primary/10"
      }, {
        idx: "02",
        title: "Live Customization",
        desc: "Instantly adjust size, paper, and finishing with our live price calculator.",
        icon: /* @__PURE__ */ jsx(Focus, { className: "w-6 h-6 text-accent" }),
        bg: "bg-accent/10"
      }, {
        idx: "03",
        title: "Direct Delivery",
        desc: "Upload your design and sit back while we print and deliver to your doorstep.",
        icon: /* @__PURE__ */ jsx(Truck, { className: "w-6 h-6 text-green-500" }),
        bg: "bg-green-500/10"
      }].map((step, i) => /* @__PURE__ */ jsxs("div", { className: "relative p-10 rounded-[3rem] bg-card border shadow-soft hover:shadow-xl transition-all duration-500 group", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-6 left-10 w-16 h-16 rounded-3xl bg-card border-4 border-muted/20 shadow-lg flex items-center justify-center font-serif font-bold text-2xl text-primary group-hover:scale-110 transition-transform", children: step.idx }),
        /* @__PURE__ */ jsx("div", { className: `w-12 h-12 ${step.bg} rounded-2xl flex items-center justify-center mb-6`, children: step.icon }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-serif font-bold mb-4", children: step.title }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed", children: step.desc })
      ] }, step.idx)) })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {}),
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          width: max-content;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .animate-bounce-slow-delayed {
          animation: bounce-slow 4s ease-in-out 2s infinite;
        }
      ` })
  ] });
}
export {
  HomePage as component
};
