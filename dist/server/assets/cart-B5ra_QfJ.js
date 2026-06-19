import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { S as SiteHeader } from "./site-header-B5bYOmyi.js";
import { S as SiteFooter } from "./site-footer-ehRP9ZUw.js";
import { B as Button } from "./router-frHDfBxK.js";
import { ShoppingBag, Trash2, CreditCard, ShieldCheck } from "lucide-react";
import { f as formatINR } from "./pricing-DDwJ8HTl.js";
import { toast } from "sonner";
import { c as createOrderFromCart, s as saveOrder } from "./orders-7cCYmoLB.js";
import "zod";
import "@supabase/supabase-js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-dialog";
import "pdf-lib";
import "fs";
import "path";
import "sharp";
import "date-fns";
import "./api-client-Bu49ln3o.js";
function CartPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lk-printer-cart");
      if (saved) {
        const cart = JSON.parse(saved);
        if (Array.isArray(cart)) setItems(cart);
      }
    } catch (e) {
      console.error("Error loading cart:", e);
      setItems([]);
    }
  }, []);
  const removeItem = (id) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    localStorage.setItem("lk-printer-cart", JSON.stringify(updated));
    toast.success("Item removed from cart");
  };
  const total = items.reduce((acc, item) => acc + item.price, 0);
  const handleCheckout = async () => {
    toast.info("Initiating secure payment...", {
      description: "Redirecting to Razorpay (Mock)",
      duration: 3e3
    });
    let userProfile = {
      name: "Guest Customer",
      email: "",
      phone: ""
    };
    try {
      const {
        api
      } = await import("./api-DY95vw1Q.js");
      const p = await api.getProfile();
      if (p) {
        userProfile = {
          name: p.name || "Guest Customer",
          email: p.email || "",
          phone: p.phone || ""
        };
      }
    } catch (e) {
      console.error("Could not fetch user profile for order placement:", e);
    }
    setTimeout(async () => {
      const newOrder = createOrderFromCart(items, total);
      newOrder.customerName = userProfile.name;
      await saveOrder(newOrder, userProfile.email, userProfile.phone);
      toast.success("Payment Successful!", {
        description: `Order ${newOrder.orderNumber} has been placed successfully.`,
        action: {
          label: "View Orders",
          onClick: () => window.location.href = "/account/orders"
        }
      });
      setItems([]);
      localStorage.removeItem("lk-printer-cart");
    }, 200);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-background flex flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-6 py-12", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-serif font-bold mb-8", children: "Your Cart" }),
      items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { className: "w-16 h-16 mx-auto text-muted-foreground mb-4" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold mb-2", children: "Cart is empty" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-8", children: "Looks like you haven't added anything yet." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", className: "rounded-2xl", children: /* @__PURE__ */ jsx(Link, { to: "/", children: "Start Shopping" }) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-3 gap-12", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-6", children: items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex gap-6 p-6 bg-card border rounded-[2rem] shadow-soft group hover:shadow-md transition-all", children: [
          /* @__PURE__ */ jsx("div", { className: "w-32 h-32 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border", children: /* @__PURE__ */ jsx("img", { src: item.image, alt: item.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold", children: item.name }),
              /* @__PURE__ */ jsx("button", { onClick: () => removeItem(item.id), className: "text-muted-foreground hover:text-destructive transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" }) })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              "Qty: ",
              item.quantity
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 pt-2", children: Object.entries(item.options).map(([k, v]) => v && /* @__PURE__ */ jsxs("span", { className: "text-[10px] px-2 py-0.5 bg-muted rounded-full uppercase font-bold tracking-wider", children: [
              k,
              ": ",
              v
            ] }, k)) }),
            /* @__PURE__ */ jsx("div", { className: "pt-4 text-xl font-bold text-primary", children: formatINR(item.price) })
          ] })
        ] }, item.id)) }),
        /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "p-8 bg-card border rounded-[2.5rem] shadow-xl sticky top-24", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold mb-6", children: "Order Summary" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm mb-6 pb-6 border-b", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: formatINR(total) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Shipping" }),
              /* @__PURE__ */ jsx("span", { className: "text-success font-bold", children: "FREE" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "GST (18%)" }),
              /* @__PURE__ */ jsx("span", { children: "Included" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-2xl font-serif font-bold mb-8", children: [
            /* @__PURE__ */ jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: formatINR(total) })
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: handleCheckout, size: "lg", className: "w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg group", children: [
            "Pay with Razorpay",
            /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 ml-2 group-hover:scale-110 transition-transform" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-widest", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-green-500" }),
            "Secure Checkout"
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  CartPage as component
};
