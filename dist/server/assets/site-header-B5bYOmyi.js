import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Printer, Sparkles, Moon, Sun, ShoppingBag, User, Menu } from "lucide-react";
import { u as useTheme, B as Button, S as Sheet, b as SheetTrigger, d as SheetContent, e as SheetHeader, f as SheetTitle } from "./router-frHDfBxK.js";
import { useState, useEffect } from "react";
function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("lk-auth-token");
      const profileStr = localStorage.getItem("lk-printer-profile");
      if (token && profileStr) {
        setIsLoggedIn(true);
        try {
          const profile = JSON.parse(profileStr);
          setUserName(profile.name || profile.yourName || "Account");
        } catch {
          setUserName("Account");
        }
      } else {
        setIsLoggedIn(false);
        setUserName("");
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1e3);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem("lk-printer-cart");
        if (saved) {
          const cart = JSON.parse(saved);
          setCartCount(Array.isArray(cart) ? cart.length : 0);
        } else {
          setCartCount(0);
        }
      } catch (e) {
        setCartCount(0);
      }
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    const interval = setInterval(updateCount, 1e3);
    return () => {
      window.removeEventListener("storage", updateCount);
      clearInterval(interval);
    };
  }, []);
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-6 py-4 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-2 group", children: [
      /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-primary group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsx(Printer, { className: "w-5 h-5 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxs("span", { className: "text-2xl font-serif font-bold tracking-tight", children: [
        "LK ",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "Printer" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex items-center gap-8 text-sm font-medium", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", activeOptions: { exact: true }, activeProps: { className: "text-primary" }, className: "text-foreground/80 hover:text-primary transition-colors", children: "Home" }),
      /* @__PURE__ */ jsxs(Link, { to: "/smart-upload", activeProps: { className: "text-primary" }, className: "text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors flex items-center gap-1.5 animate-pulse", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
        "AI Smart Upload"
      ] }),
      /* @__PURE__ */ jsx("a", { href: "/#categories", className: "text-foreground/80 hover:text-primary transition-colors", children: "Categories" }),
      /* @__PURE__ */ jsx("a", { href: "/#about", className: "text-foreground/80 hover:text-primary transition-colors", children: "About" }),
      /* @__PURE__ */ jsx("a", { href: "/#contact", className: "text-foreground/80 hover:text-primary transition-colors", children: "Contact" }),
      /* @__PURE__ */ jsx(Link, { to: "/account/orders", activeProps: { className: "text-primary" }, className: "text-foreground/80 hover:text-primary transition-colors", children: "My Orders" }),
      /* @__PURE__ */ jsx(Link, { to: "/admin", activeProps: { className: "text-primary" }, className: "text-foreground/80 hover:text-primary transition-colors font-bold text-red-600 dark:text-red-400", children: "Admin Panel" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: () => setTheme(theme === "light" ? "dark" : "light"),
          "aria-label": "Toggle theme",
          children: theme === "light" ? /* @__PURE__ */ jsx(Moon, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Sun, { className: "w-5 h-5" })
        }
      ),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", asChild: true, "aria-label": "Cart", className: "relative", children: /* @__PURE__ */ jsxs(Link, { to: "/cart", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { className: "w-5 h-5" }),
        cartCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in", children: cartCount })
      ] }) }),
      isLoggedIn ? /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "hidden sm:inline-flex gap-2", children: /* @__PURE__ */ jsxs(Link, { to: "/account/orders", children: [
        /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-primary" }),
        " ",
        userName
      ] }) }) : /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "hidden sm:inline-flex gap-2", children: /* @__PURE__ */ jsxs(Link, { to: "/login", children: [
        /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
        " Login"
      ] }) }),
      /* @__PURE__ */ jsxs(Sheet, { children: [
        /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "md:hidden", children: /* @__PURE__ */ jsx(Menu, { className: "w-5 h-5" }) }) }),
        /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-[300px] sm:w-[400px]", children: [
          /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsxs(SheetTitle, { className: "text-left flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Printer, { className: "w-5 h-5 text-primary" }),
            "LK Printer"
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 mt-10", children: [
            /* @__PURE__ */ jsx(Link, { to: "/", className: "text-lg font-medium hover:text-primary transition-colors", children: "Home" }),
            /* @__PURE__ */ jsxs(Link, { to: "/smart-upload", className: "text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5" }),
              "AI Smart Upload"
            ] }),
            /* @__PURE__ */ jsx("a", { href: "/#categories", className: "text-lg font-medium hover:text-primary transition-colors", children: "Categories" }),
            /* @__PURE__ */ jsx("a", { href: "/#about", className: "text-lg font-medium hover:text-primary transition-colors", children: "About Us" }),
            /* @__PURE__ */ jsx("a", { href: "/#contact", className: "text-lg font-medium hover:text-primary transition-colors", children: "Contact" }),
            /* @__PURE__ */ jsx(Link, { to: "/account/orders", className: "text-lg font-medium hover:text-primary transition-colors text-blue-600", children: "My Orders" }),
            /* @__PURE__ */ jsx(Link, { to: "/admin", className: "text-lg font-bold hover:text-primary transition-colors text-red-600 dark:text-red-400", children: "Admin Panel" }),
            /* @__PURE__ */ jsx("hr", { className: "border-muted" }),
            isLoggedIn ? /* @__PURE__ */ jsx(Button, { asChild: true, className: "w-full justify-start gap-2", variant: "outline", children: /* @__PURE__ */ jsxs(Link, { to: "/account/orders", children: [
              /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-primary" }),
              " ",
              userName
            ] }) }) : /* @__PURE__ */ jsx(Button, { asChild: true, className: "w-full justify-start gap-2", variant: "outline", children: /* @__PURE__ */ jsxs(Link, { to: "/login", children: [
              /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
              " Login / Register"
            ] }) })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  SiteHeader as S
};
