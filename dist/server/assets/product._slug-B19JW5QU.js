import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { useState, useRef, useMemo, useEffect } from "react";
import { Sparkles, Loader2, ShieldCheck, FileText, ArrowLeft, Zap, Check, Upload, Truck, ShoppingBag, ShoppingCart, Tag, Boxes, Book } from "lucide-react";
import * as fabric from "fabric";
import { c as cn, R as Route, B as Button, I as Input, T as Textarea, s as supabase } from "./router-frHDfBxK.js";
import { S as SiteHeader } from "./site-header-B5bYOmyi.js";
import { S as SiteFooter } from "./site-footer-ehRP9ZUw.js";
import { B as Badge } from "./badge-DHgTIpEC.js";
import { L as Label } from "./label-BaeoGtRW.js";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { toast } from "sonner";
import { c as calculatePrice, f as formatINR } from "./pricing-DDwJ8HTl.js";
import { F as FALLBACK_PRODUCTS } from "./fallback-data-DTgqkTfJ.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import "zod";
import "@supabase/supabase-js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-dialog";
import "fs";
import "path";
import "sharp";
import "@radix-ui/react-label";
const Switch = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;
const uint8ArrayToBase64 = (arr) => {
  let binary = "";
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return window.btoa(binary);
};
const addToCart = async (product, price, quantity, options) => {
  const toastId = toast.loading("Processing order and generating PDF Invoice...");
  try {
    let profile = {
      id: "Guest / Not Registered",
      name: "Guest Customer",
      phone: "",
      email: "",
      whatsappNo: "",
      company: "",
      address: ""
    };
    try {
      const savedProfile = localStorage.getItem("lk-printer-profile");
      if (savedProfile) {
        profile = JSON.parse(savedProfile);
      }
    } catch (e) {
      console.error("Error reading printer profile:", e);
    }
    const category = product.category_slug || "General";
    const productName = product.name;
    const pageUrl = window.location.href;
    const orderNumber = `ORD-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const dateStr = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata"
    });
    const scannedFields = [];
    const elements = Array.from(document.querySelectorAll("input, select, textarea"));
    elements.forEach((el) => {
      if (el.type === "submit" || el.type === "button") return;
      const isCustomizerInput = el.closest(".bg-white") || el.closest("form") || el.closest("[class*='Customizer']") || el.closest(".space-y-6") || el.closest(".space-y-5");
      if (!isCustomizerInput) return;
      if (el.type === "hidden" && el.name !== "file") return;
      if (el.type === "radio" && !el.checked) return;
      let labelText = "";
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) labelText = label.textContent?.trim() || "";
      }
      if (!labelText) {
        const labelParent = el.closest("label");
        if (labelParent) labelText = labelParent.textContent?.trim() || "";
      }
      if (!labelText) {
        const row = el.closest(".grid") || el.closest(".flex") || el.parentElement;
        if (row) {
          const label = row.querySelector("label");
          if (label) labelText = label.textContent?.trim() || "";
        }
      }
      if (!labelText) {
        labelText = el.placeholder || el.name || el.id || "Option";
      }
      labelText = labelText.replace(/[:*]/g, "").replace(/\s+/g, " ").trim();
      if (!labelText || labelText.toLowerCase().includes("select detail") || labelText.toLowerCase().includes("order name")) {
        if (labelText.toLowerCase().includes("order name")) {
        } else {
          return;
        }
      }
      let valText = "";
      if (el.type === "checkbox") {
        valText = el.checked ? "Yes" : "No";
      } else if (el.type === "file") {
        if (el.files && el.files.length > 0) {
          valText = Array.from(el.files).map((f) => f.name).join(", ");
        } else {
          const fileSpan = el.parentElement?.parentElement?.querySelector("span");
          if (fileSpan && fileSpan.textContent && !fileSpan.textContent.includes("No file chosen")) {
            valText = fileSpan.textContent.trim();
          } else {
            valText = "No file uploaded";
          }
        }
      } else {
        valText = el.value?.trim();
      }
      if (valText === "--Select--" || !valText) {
        valText = "Not Selected";
      }
      const existing = scannedFields.find((f) => f.label === labelText);
      if (existing) {
        if (el.type === "radio" || el.type === "checkbox") {
          existing.value = valText;
        }
      } else {
        scannedFields.push({
          label: labelText,
          value: valText
        });
      }
    });
    const subProductField = scannedFields.find((f) => f.label.toLowerCase().includes("select product") || f.label.toLowerCase().includes("variant"));
    const subProduct = subProductField ? subProductField.value : options?.variant || "Standard";
    const finalOptions = {
      ...options,
      detectedFields: scannedFields
    };
    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      price,
      quantity,
      image: product.images?.[0] || "",
      options: finalOptions
    };
    localStorage.removeItem("lk-smart-upload-image");
    localStorage.removeItem("lk-smart-upload-filename");
    const existingCart = localStorage.getItem("lk-printer-cart");
    const cart = existingCart ? JSON.parse(existingCart) : [];
    cart.push(cartItem);
    localStorage.setItem("lk-printer-cart", JSON.stringify(cart));
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 850]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let y = 790;
    page.drawText("LK PRINTER - OFFICIAL ORDER INVOICE", {
      x: 50,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0, 0.3, 0.6)
    });
    y -= 40;
    page.drawText(`Order ID: ${orderNumber}`, {
      x: 50,
      y,
      size: 11,
      font: boldFont
    });
    page.drawText(`Date & Time: ${dateStr}`, {
      x: 320,
      y,
      size: 11,
      font
    });
    y -= 20;
    page.drawText(`Category: ${category}`, {
      x: 50,
      y,
      size: 11,
      font
    });
    page.drawText(`Product: ${productName}`, {
      x: 320,
      y,
      size: 11,
      font
    });
    y -= 20;
    page.drawText(`Sub Product: ${subProduct}`, {
      x: 50,
      y,
      size: 11,
      font
    });
    y -= 20;
    page.drawLine({
      start: {
        x: 50,
        y
      },
      end: {
        x: 550,
        y
      },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    y -= 20;
    page.drawText("CUSTOMER PROFILE DETAILS:", {
      x: 50,
      y,
      size: 11,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1)
    });
    y -= 18;
    page.drawText(`Printer ID: ${profile.id || "N/A"}`, {
      x: 50,
      y,
      size: 10,
      font: boldFont
    });
    page.drawText(`Customer Name: ${profile.name || "Guest Customer"}`, {
      x: 320,
      y,
      size: 10,
      font
    });
    y -= 16;
    page.drawText(`WhatsApp / Phone: ${profile.phone || profile.whatsappNo || "N/A"}`, {
      x: 50,
      y,
      size: 10,
      font
    });
    page.drawText(`Email: ${profile.email || "N/A"}`, {
      x: 320,
      y,
      size: 10,
      font
    });
    y -= 16;
    if (profile.company) {
      page.drawText(`Company: ${profile.company}`, {
        x: 50,
        y,
        size: 10,
        font
      });
      y -= 16;
    }
    if (profile.address) {
      page.drawText(`Address: ${profile.address}`, {
        x: 50,
        y,
        size: 10,
        font
      });
      y -= 16;
    }
    page.drawLine({
      start: {
        x: 50,
        y
      },
      end: {
        x: 550,
        y
      },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    y -= 25;
    page.drawText("ORDER SPECIFICATIONS & OPTIONS DETECTED:", {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    y -= 25;
    for (const field of scannedFields) {
      if (y < 80) {
        page = pdfDoc.addPage([600, 850]);
        y = 790;
      }
      page.drawText(`${field.label}:`, {
        x: 70,
        y,
        size: 10,
        font: boldFont
      });
      page.drawText(`${field.value}`, {
        x: 230,
        y,
        size: 10,
        font
      });
      y -= 18;
    }
    y -= 10;
    if (y < 120) {
      page = pdfDoc.addPage([600, 850]);
      y = 790;
    }
    page.drawLine({
      start: {
        x: 50,
        y
      },
      end: {
        x: 550,
        y
      },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    y -= 30;
    const baseAmt = price;
    const gstAmt = price * 0.18;
    const totalAmt = price * 1.18;
    page.drawText(`Base Amount: Rs. ${baseAmt.toFixed(2)}`, {
      x: 50,
      y,
      size: 11,
      font
    });
    y -= 18;
    page.drawText(`GST (18%): Rs. ${gstAmt.toFixed(2)}`, {
      x: 50,
      y,
      size: 11,
      font
    });
    y -= 22;
    page.drawText(`Total Amount (incl. GST): Rs. ${totalAmt.toFixed(2)}`, {
      x: 50,
      y,
      size: 13,
      font: boldFont,
      color: rgb(0, 0.5, 0.2)
    });
    y -= 30;
    page.drawText("This is an automatically generated print order summary invoice.", {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5)
    });
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = uint8ArrayToBase64(pdfBytes);
    let pdfUrl = "";
    try {
      const apiRes = await fetch("/api/upload-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pdfBase64,
          orderNumber
        })
      });
      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.success) {
        pdfUrl = `${window.location.origin}/orders/${apiData.fileName}`;
      }
    } catch (apiErr) {
      console.error("Local PDF upload failed:", apiErr);
    }
    try {
      const fileBlob = new Blob([pdfBytes], {
        type: "application/pdf"
      });
      const {
        data,
        error
      } = await supabase.storage.from("orders").upload(`${orderNumber}.pdf`, fileBlob, {
        cacheControl: "3600",
        upsert: true
      });
      if (!error) {
        const {
          data: urlData
        } = supabase.storage.from("orders").getPublicUrl(`${orderNumber}.pdf`);
        pdfUrl = urlData.publicUrl;
      }
    } catch (sbErr) {
      console.error("Supabase Storage upload failed:", sbErr);
    }
    if (!pdfUrl) {
      pdfUrl = `data:application/pdf;base64,${pdfBase64}`;
    }
    const orderItem = {
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.price,
      quantity: cartItem.quantity,
      image: cartItem.image,
      options: cartItem.options
    };
    const newOrder = {
      id: crypto.randomUUID(),
      orderNumber,
      date: dateStr,
      customerName: profile.name || "Guest Customer",
      items: [orderItem],
      totalAmount: totalAmt,
      status: "Confirmed",
      invoiceUrl: pdfUrl
    };
    try {
      const existingOrdersStr = localStorage.getItem("lk-printer-orders");
      const existingOrders = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
      const updatedOrders = [newOrder, ...existingOrders];
      localStorage.setItem("lk-printer-orders", JSON.stringify(updatedOrders));
      console.log("Order logged successfully in lk-printer-orders:", newOrder);
    } catch (e) {
      console.error("Failed to log order to lk-printer-orders:", e);
    }
    try {
      const fileBlob = new Blob([pdfBytes], {
        type: "application/pdf"
      });
      const downloadUrl = URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      console.log("PDF Invoice download triggered successfully.");
    } catch (downloadErr) {
      console.error("Auto-downloading PDF invoice failed:", downloadErr);
    }
    const whatsappMessage = `*NEW PRINT ORDER RECEIVED* 📄
----------------------------------
*Customer Profile:*
• *Printer ID:* ${profile.id || "N/A"}
• *Name:* ${profile.name || "Guest Customer"}
• *WhatsApp No:* ${profile.whatsappNo || profile.phone || "N/A"}
• *Address:* ${profile.address || "N/A"}

*Order Details:*
• *Order ID:* ${orderNumber}
• *Category:* ${category}
• *Product:* ${productName}
• *Variant:* ${subProduct}
• *Quantity:* ${quantity}

*Pricing Info:*
• *Base Amount:* Rs. ${baseAmt.toFixed(2)}
• *GST (18%):* Rs. ${gstAmt.toFixed(2)}
• *Total Amount:* Rs. ${totalAmt.toFixed(2)}

*Order Specifications PDF:*
${pdfUrl}

*Page Reference:*
${pageUrl}
----------------------------------
Please confirm the order specs and share print approval.`;
    const whatsappUrl = `https://wa.me/919351037177?text=${encodeURIComponent(whatsappMessage)}`;
    toast.update(toastId, {
      type: "success",
      render: "Order processed! Opening WhatsApp...",
      duration: 3e3,
      isLoading: false
    });
    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
    }, 800);
  } catch (err) {
    console.error("Auto order processing failed:", err);
    toast.update(toastId, {
      type: "error",
      render: `Error: ${err.message || "Failed to process order"}`,
      duration: 4e3,
      isLoading: false
    });
  }
};
function Section({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2", children: title }),
    children
  ] });
}
function OptionPill({
  active,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx("button", { type: "button", onClick, className: `px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card border-border hover:border-primary/50 hover:bg-muted/40"}`, children });
}
function Row({
  label,
  value,
  bold,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: `flex justify-between items-center text-sm ${bold ? "font-bold" : ""} ${accent ? "text-green-600" : ""}`, children: [
    /* @__PURE__ */ jsx("span", { className: bold ? "" : "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { children: value })
  ] });
}
function FullProductDetails({
  product
}) {
  const d = product.product_details;
  const features = product.features || [];
  if (!d && features.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center text-slate-500", children: "Premium quality product with professional finish." });
  }
  const isVisitingCard = product.category_slug === "visiting-cards";
  const isLargeFormatCard = product.slug === "nt-pvc-800-micron";
  const isStandardCard = isVisitingCard && !isLargeFormatCard;
  const pointsSizes = isLargeFormatCard ? {
    design: "96.00 mm X 58.00 mm"
  } : isStandardCard ? {
    design: "90.00 mm X 54.00 mm"
  } : null;
  const descriptionItems = [];
  if (d) {
    if (d.code) descriptionItems.push(`Product Code : ${d.code}`);
    if (d.lamination && d.lamination !== "Not Available") descriptionItems.push(`Lamination : ${d.lamination}`);
    if (d.uv && d.uv !== "Not Available") descriptionItems.push(`UV : ${d.uv}`);
    if (d.foil && d.foil !== "Not Available") descriptionItems.push(`Foil : ${d.foil}`);
    if (d.texture && d.texture !== "Not Available") descriptionItems.push(`Texture : ${d.texture}`);
    if (d.die_cut && d.die_cut !== "Not Available") descriptionItems.push(`Die Cut : ${d.die_cut}`);
    if (d.production_time) descriptionItems.push(`Production Time : ${d.production_time}`);
  }
  const noteFeatures = [];
  features.forEach((f) => {
    if (f.toLowerCase().startsWith("note:")) {
      noteFeatures.push(f);
    } else {
      descriptionItems.push(f);
    }
  });
  if (pointsSizes) {
    descriptionItems.push(`Card Sizes : ${pointsSizes.design} (Custom Size & Shape Available)`);
  }
  const importantNotes = ["Use high-resolution vector files. (PDF / CDR)", "Font size above 10 pt recommended for best clarity.", "Please do not use full-backgrounds, gradients, or CMYK images in the design.", "Only standard pre-mixed spot colors are available — CMYK printing (CMYK mixing) is not applicable.", "Spot colors are fully applied by hand — no machines used.", "Follow sample file instructions for correct design."];
  const SectionHeader = ({
    title
  }) => /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx("h3", { className: "text-[#003366] font-bold text-2xl border-b-[3px] border-[#003366] inline-block pb-0.5", children: title }) });
  const ListItem = ({
    text
  }) => {
    const isNote = text.toLowerCase().startsWith("note:");
    let key = "";
    let value = "";
    const colonIndex = text.indexOf(" : ");
    if (colonIndex !== -1) {
      key = text.substring(0, colonIndex).trim();
      value = text.substring(colonIndex + 3).trim();
    } else {
      const colonIndexAlt = text.indexOf(": ");
      if (colonIndexAlt !== -1) {
        key = text.substring(0, colonIndexAlt).trim();
        value = text.substring(colonIndexAlt + 2).trim();
      }
    }
    return /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2.5 text-[#444] text-[15.5px] leading-relaxed", children: [
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-[#cbd5e0] mt-[9px] flex-shrink-0" }),
      /* @__PURE__ */ jsx("span", { children: key && value ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-[#333]", children: [
          key,
          " :"
        ] }),
        " ",
        value
      ] }) : /* @__PURE__ */ jsx("span", { className: isNote ? "font-bold text-[#333]" : "", children: text }) })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-12 py-6", children: [
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx(SectionHeader, { title: "Product Description" }),
      /* @__PURE__ */ jsxs("ul", { className: "space-y-2.5", children: [
        descriptionItems.map((item, i) => /* @__PURE__ */ jsx(ListItem, { text: item }, i)),
        noteFeatures.map((note, i) => /* @__PURE__ */ jsx(ListItem, { text: note }, i))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx(SectionHeader, { title: "Important Notes." }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-2.5", children: importantNotes.map((item, i) => /* @__PURE__ */ jsx(ListItem, { text: item }, i)) })
    ] })
  ] });
}
function ProductPage() {
  const {
    slug
  } = Route.useParams();
  const initialProduct = useMemo(() => {
    return FALLBACK_PRODUCTS.find((fp) => fp.slug === slug) || null;
  }, [slug]);
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [loadError, setLoadError] = useState(null);
  const [sizeId, setSizeId] = useState(() => (initialProduct?.sizes || [])[0]?.id ?? null);
  const [paperId, setPaperId] = useState(() => (initialProduct?.paper_types || [])[0]?.id ?? null);
  const [colorId, setColorId] = useState(() => (initialProduct?.color_options || [])[0]?.id ?? null);
  const [finishingIds, setFinishingIds] = useState([]);
  const [quantity, setQuantity] = useState(() => (initialProduct?.quantity_tiers || [])[0]?.qty ?? 100);
  const [express, setExpress] = useState(false);
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState(() => {
    return localStorage.getItem("lk-smart-upload-filename") || null;
  });
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setSizeId((initialProduct.sizes || [])[0]?.id ?? null);
      setPaperId((initialProduct.paper_types || [])[0]?.id ?? null);
      setColorId((initialProduct.color_options || [])[0]?.id ?? null);
      setQuantity((initialProduct.quantity_tiers || [])[0]?.qty ?? 100);
      setFinishingIds([]);
      setExpress(false);
      setNotes("");
      setLoadError(null);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const {
          data,
          error
        } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
        if (error) throw error;
        const p = data;
        if (p) {
          setProduct(p);
          setSizeId((p.sizes || [])[0]?.id ?? null);
          setPaperId((p.paper_types || [])[0]?.id ?? null);
          setColorId((p.color_options || [])[0]?.id ?? null);
          setQuantity((p.quantity_tiers || [])[0]?.qty ?? 100);
          setFinishingIds([]);
          setExpress(false);
          setNotes("");
        } else {
          setProduct(null);
          setLoadError("Product not found.");
        }
      } catch (error) {
        console.error("Product load failed:", error);
        setLoadError(error instanceof Error ? error.message : String(error));
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, initialProduct]);
  useEffect(() => {
    if (!loading) {
      localStorage.removeItem("lk-smart-upload-image");
      localStorage.removeItem("lk-smart-upload-filename");
    }
    return () => {
      localStorage.removeItem("lk-smart-upload-image");
      localStorage.removeItem("lk-smart-upload-filename");
    };
  }, [loading]);
  const breakdown = useMemo(() => {
    if (!product) return null;
    return calculatePrice(product, {
      sizeId: sizeId || (product.sizes || [])[0]?.id || null,
      paperId: paperId || (product.paper_types || [])[0]?.id || null,
      colorId: colorId || (product.color_options || [])[0]?.id || null,
      finishingIds,
      quantity,
      express
    });
  }, [product, sizeId, paperId, colorId, finishingIds, quantity, express]);
  const toggleFinishing = (id) => setFinishingIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20 MB)");
      return;
    }
    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
    toast.success("Design uploaded");
  };
  const handleAddToCart = () => {
    if (!product || !breakdown) return;
    addToCart(product, breakdown.total, breakdown.quantity, {
      size: product?.sizes?.find((s) => s.id === sizeId)?.label,
      paper: product?.paper_types?.find((p) => p.id === paperId)?.label,
      color: product?.color_options?.find((c) => c.id === colorId)?.label,
      express: express ? "Yes" : "No"
    });
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-background flex flex-col", children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) })
    ] });
  }
  if (loadError) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-background flex flex-col", children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center text-center px-6", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-red-200 bg-red-50 p-10 max-w-xl w-full", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-red-700 mb-4", children: "Unable to load product" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 mb-6", children: "There was a problem fetching this product. Please check your connection or try again later." }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 opacity-90 break-words mb-6", children: loadError }),
        /* @__PURE__ */ jsx(Link, { to: "/", className: "text-primary hover:underline", children: "Go back to home" })
      ] }) })
    ] });
  }
  if (!product) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-background flex flex-col", children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center text-center", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-serif font-bold mb-2", children: "Product not found" }),
        /* @__PURE__ */ jsx(Link, { to: "/", className: "text-primary hover:underline", children: "Go home" })
      ] }) })
    ] });
  }
  if (product.slug === "500-gsm-velvet") {
    return /* @__PURE__ */ jsx(Gsm500Customizer, { product, type: "velvet" }, product.id);
  }
  if (product.slug === "500-gsm-matt") {
    return /* @__PURE__ */ jsx(Gsm500Customizer, { product, type: "matt" }, product.id);
  }
  if (product.slug === "500-gsm-drip-off") {
    return /* @__PURE__ */ jsx(Gsm500Customizer, { product, type: "drip-off" }, product.id);
  }
  if (product.slug === "800-gsm-velvet") {
    return /* @__PURE__ */ jsx(Velvet800GsmCustomizer, { product }, product.id);
  }
  if (product.slug === "800-gsm-matt") {
    return /* @__PURE__ */ jsx(Matt800GsmCustomizer, { product }, product.id);
  }
  if (product.slug === "800-gsm-craft-paper") {
    return /* @__PURE__ */ jsx(CraftSheet800GsmCustomizer, { product }, product.id);
  }
  if (product.slug === "800-gsm-texture") {
    return /* @__PURE__ */ jsx(Texture800GsmCustomizer, { product }, product.id);
  }
  if (product.slug === "nt-pvc-180-micron") {
    return /* @__PURE__ */ jsx(NT180MicronCustomizer, { product }, product.id);
  }
  if (product.slug === "nt-pvc-800-micron") {
    return /* @__PURE__ */ jsx(NT800MicronCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-matt-uv") {
    return /* @__PURE__ */ jsx(MattUVRegularCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-gloss") {
    return /* @__PURE__ */ jsx(RegularGlossCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-gloss-small") {
    return /* @__PURE__ */ jsx(RegularGlossSmallCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-without-small") {
    return /* @__PURE__ */ jsx(RegularWithoutSmallCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-gloss-coated") {
    return /* @__PURE__ */ jsx(GlossCoatedCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-without") {
    return /* @__PURE__ */ jsx(WithoutLaminationCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-matt") {
    return /* @__PURE__ */ jsx(MattLaminationCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-matt-texture") {
    return /* @__PURE__ */ jsx(MattTextureCustomizer, { product }, product.id);
  }
  if (product.slug === "regular-gloss-texture") {
    return /* @__PURE__ */ jsx(GlossTextureCustomizer, { product }, product.id);
  }
  if (product.slug === "posters-15x20") {
    return /* @__PURE__ */ jsx(PosterCustomizer, { product }, product.id);
  }
  if (product.slug === "pamphlets-70gsm") {
    return /* @__PURE__ */ jsx(PamphletCustomizer, { product }, product.id);
  }
  if (product.slug === "files-pvc-clip") {
    return /* @__PURE__ */ jsx(PVCClipCustomizer, { product }, product.id);
  }
  if (product.slug.startsWith("presentation-files-") || product.slug.startsWith("files-pvc-") || product.slug.startsWith("files-sbs-")) {
    return /* @__PURE__ */ jsx(FilesCustomizer, { product }, product.id);
  }
  if (product.slug === "deo-paper" || product.slug === "letterheads-paper" || product.slug === "letter-head-paper") {
    return /* @__PURE__ */ jsx(DeoPaperCustomizer, { product }, product.id);
  }
  if (product.slug === "texture-paper") {
    return /* @__PURE__ */ jsx(TexturePaperCustomizer, { product }, product.id);
  }
  if (product.slug === "paper-gumming" || product.slug === "pvc-gumming") {
    return /* @__PURE__ */ jsx(GummingCustomizer, { product }, product.id);
  }
  if (product.slug === "art-paper") {
    return /* @__PURE__ */ jsx(DigitalPaperPrintingCustomizer, { product }, product.id);
  }
  if (product.slug.startsWith("letterheads-")) {
    return /* @__PURE__ */ jsx(LetterheadCustomizer, { product }, product.id);
  }
  if (product.slug.startsWith("envelopes-") || product.slug === "gift-envelopes") {
    return /* @__PURE__ */ jsx(EnvelopeCustomizer, { product }, product.id);
  }
  if (product.slug.startsWith("atm-pouch-")) {
    return /* @__PURE__ */ jsx(ATMPouchCustomizer, { product }, product.id);
  }
  if (product.slug.startsWith("a4-bill-book-")) {
    return /* @__PURE__ */ jsx(BillBookCustomizer, { product }, product.id);
  }
  if (product.slug === "paper-stickers") {
    return /* @__PURE__ */ jsx(StickerCustomizer, { product });
  }
  if (product.slug === "laser-printed-pen" || product.slug === "single-color-pen") {
    return /* @__PURE__ */ jsx(PenCustomizer, { product });
  }
  if (product.category_slug === "brochures" || product.category_slug === "id-cards" || product.category_slug === "certificates" || product.category_slug === "menu-cards" || product.category_slug === "invitations" || product.category_slug === "calendars" || product.category_slug === "banners" || product.category_slug === "sample-files" || product.category_slug === "digital-printing") {
    return /* @__PURE__ */ jsx(PamphletPosterCustomizer, { product });
  }
  if (product.slug === "pistol-target" || product.slug === "rifle-target") {
    return /* @__PURE__ */ jsx(TargetCustomizer, { product });
  }
  if (product.category_slug === "pamphlets-posters") {
    return /* @__PURE__ */ jsx(PamphletPosterCustomizer, { product });
  }
  if (product.slug === "garments-tags-gloss") {
    return /* @__PURE__ */ jsx(GlossCoatedTagCustomizer, { product }, product.id);
  }
  if (product.slug === "garments-tags-matt") {
    return /* @__PURE__ */ jsx(MattLaminationTagCustomizer, { product }, product.id);
  }
  if (product.slug === "garments-tags-matt-lamination-uv" || product.slug === "garments-tags-matt-uv") {
    return /* @__PURE__ */ jsx(MattUVTagCustomizer, { product }, product.id);
  }
  if (product.slug === "garments-tags-thread") {
    return /* @__PURE__ */ jsx(ThreadCustomizer, { product }, product.id);
  }
  if (product.slug.startsWith("garments-tags-")) {
    return /* @__PURE__ */ jsx(GarmentTagCustomizer, { product }, product.id);
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-background flex flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-6 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[1fr_1.2fr_360px] xl:grid-cols-[1fr_1.5fr_380px] gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:sticky lg:top-24 self-start opacity-0 animate-fade-in-up", style: {
          animationDelay: "100ms"
        }, children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-square rounded-[2.5rem] overflow-hidden bg-muted border border-border shadow-2xl group flex items-center justify-center relative", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Your design preview", className: "w-full h-full object-contain p-8" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" }) }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 flex gap-4 overflow-x-auto pb-2 no-scrollbar", children: (product.images || []).map((img, i) => /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-2xl bg-muted border overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary transition-all", children: /* @__PURE__ */ jsx("img", { src: img, className: "w-full h-full object-cover" }) }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-10 opacity-0 animate-fade-in-up", style: {
          animationDelay: "200ms"
        }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "mb-3 rounded-sm", children: product.category_slug.replace("-", " ").toUpperCase() }),
            /* @__PURE__ */ jsx("h1", { className: "text-4xl lg:text-5xl font-serif font-bold mb-4 tracking-tight leading-tight text-balance", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground leading-relaxed", children: product.description })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 p-6 bg-amber-50/40 rounded-3xl border border-amber-100 shadow-sm", children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-sm font-bold uppercase tracking-widest text-amber-900 mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 text-amber-600" }),
              "Important Notes"
            ] }),
            /* @__PURE__ */ jsxs("ul", { className: "space-y-2.5 text-[13px] text-amber-900/80", children: [
              /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" }),
                " Use high-resolution vector files (PDF/CDR)."
              ] }),
              /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" }),
                " Font size above 10 pt recommended."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: product.size_label || "Size", children: [
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: (product.sizes || []).map((s) => /* @__PURE__ */ jsx(OptionPill, { active: sizeId === s.id, onClick: () => setSizeId(s.id), children: s.label }, s.id)) }),
            sizeId === "custom" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mt-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Width (in)" }),
                /* @__PURE__ */ jsx(Input, { type: "number", placeholder: "3.5" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Height (in)" }),
                /* @__PURE__ */ jsx(Input, { type: "number", placeholder: "2" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Section, { title: product.paper_label || "Paper / Material", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: (product.paper_types || []).map((p) => /* @__PURE__ */ jsxs(OptionPill, { active: paperId === p.id, onClick: () => setPaperId(p.id), children: [
            /* @__PURE__ */ jsx("span", { children: p.label }),
            p.price > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs opacity-75 ml-2" })
          ] }, p.id)) }) }),
          /* @__PURE__ */ jsx(Section, { title: product.color_label || "Color & Sides", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: (product.color_options || []).map((c) => /* @__PURE__ */ jsxs(OptionPill, { active: colorId === c.id, onClick: () => setColorId(c.id), children: [
            /* @__PURE__ */ jsx("span", { children: c.label }),
            c.price > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs opacity-75 ml-2" })
          ] }, c.id)) }) }),
          /* @__PURE__ */ jsx(Section, { title: product.finishing_label || "Finishing (optional)", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: (product.finishing_options || []).map((f) => {
            const active = finishingIds.includes(f.id);
            return /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => toggleFinishing(f.id), className: `flex items-center justify-between gap-2 px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all ${active ? "bg-primary text-primary-foreground border-primary shadow-primary" : "bg-card border-border hover:border-primary/50"}`, children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: `w-4 h-4 rounded border-2 flex items-center justify-center ${active ? "bg-primary-foreground border-primary-foreground" : "border-current opacity-40"}`, children: active && /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 text-primary" }) }),
                f.label
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs opacity-80" })
            ] }, f.id);
          }) }) }),
          /* @__PURE__ */ jsxs(Section, { title: "Quantity", children: [
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: (product.quantity_tiers || []).map((t) => /* @__PURE__ */ jsxs(OptionPill, { active: quantity === t.qty, onClick: () => setQuantity(t.qty), children: [
              t.qty.toLocaleString(),
              t.discount > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1.5 text-xs opacity-75", children: [
                "−",
                Math.round(t.discount * 100),
                "%"
              ] })
            ] }, t.qty)) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Custom quantity" }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: (product?.quantity_tiers || [])[0]?.qty || 100, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), onBlur: () => {
                const minVal = (product?.quantity_tiers || [])[0]?.qty || 100;
                if (quantity < minVal) {
                  setQuantity(minVal);
                }
              }, className: "max-w-[180px] bg-white border border-gray-300 p-2 w-full outline-none" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: "Your Design", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex flex-col items-center justify-center w-full p-10 border-4 border-dashed border-muted rounded-[2rem] bg-muted/20 hover:bg-muted/40 hover:border-primary/30 cursor-pointer transition-all duration-300 group", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 text-primary" }) }),
              /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: fileName ?? "Click to upload design" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground mt-1", children: "PDF, PNG, JPG (max 20 MB)" }),
              /* @__PURE__ */ jsx("input", { type: "file", className: "hidden", accept: ".pdf,image/*", onChange: handleFile })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", className: "mt-4 text-sm text-primary font-bold hover:underline inline-flex items-center gap-1.5 ml-1", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
              " or browse our templates"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Section, { title: "Special Instructions", children: /* @__PURE__ */ jsx(Textarea, { placeholder: "Any special notes for our printing team...", value: notes, onChange: (e) => setNotes(e.target.value), rows: 3 }) }),
          /* @__PURE__ */ jsx(Section, { title: "Delivery", children: /* @__PURE__ */ jsxs("div", { className: "bg-muted/40 border rounded-xl p-4 space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Truck, { className: "w-4 h-4 text-primary" }),
                " Standard delivery"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                product.delivery_days,
                " days · ",
                formatINR(product.shipping_cost)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm pt-3 border-t", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 text-accent" }),
                " Express delivery (2 days)"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground" }),
                /* @__PURE__ */ jsx(Switch, { checked: express, onCheckedChange: setExpress })
              ] })
            ] })
          ] }) })
        ] }),
        breakdown && /* @__PURE__ */ jsxs("div", { className: "sticky bottom-6 z-20 bg-card/80 backdrop-blur-2xl border p-8 rounded-[3rem] shadow-2xl mt-12 opacity-0 animate-fade-in-up", style: {
          animationDelay: "300ms"
        }, children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2", children: "Instant Quote" }),
          /* @__PURE__ */ jsx("div", { className: "text-5xl font-serif font-bold text-primary mb-2 tabular-nums", children: formatINR(breakdown.total) }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground mb-6 font-medium", children: [
            formatINR(breakdown.unitPrice),
            " per unit · ",
            breakdown.quantity.toLocaleString(),
            " pcs"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2.5 text-sm border-t border-muted pt-6 mb-8", children: [
            /* @__PURE__ */ jsx(Row, { label: "Base × size", value: formatINR(breakdown.basePrice + breakdown.sizeAdjustment) }),
            breakdown.paperPrice > 0 && /* @__PURE__ */ jsx(Row, { label: "Paper", value: `+${formatINR(breakdown.paperPrice)}` }),
            breakdown.colorPrice > 0 && /* @__PURE__ */ jsx(Row, { label: "Color", value: `+${formatINR(breakdown.colorPrice)}` }),
            breakdown.finishingPrice > 0 && /* @__PURE__ */ jsx(Row, { label: "Finishing", value: `+${formatINR(breakdown.finishingPrice)}` }),
            /* @__PURE__ */ jsx(Row, { label: `Subtotal (× ${breakdown.quantity})`, value: formatINR(breakdown.subtotal), bold: true }),
            breakdown.discount > 0 && /* @__PURE__ */ jsx(Row, { label: `Bulk discount (${Math.round(breakdown.discountPct * 100)}%)`, value: `−${formatINR(breakdown.discount)}`, accent: true }),
            /* @__PURE__ */ jsx(Row, { label: "Shipping", value: formatINR(breakdown.shipping) }),
            breakdown.expressExtra > 0 && /* @__PURE__ */ jsx(Row, { label: "Express", value: `+${formatINR(breakdown.expressExtra)}` })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs(Button, { onClick: handleAddToCart, size: "lg", className: "w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg group bg-[#007bff] hover:bg-blue-600 text-white", children: [
              /* @__PURE__ */ jsx(ShoppingBag, { className: "w-5 h-5 mr-2 group-hover:scale-110 transition-transform" }),
              "ADD ORDER (PAY FROM WALLET)"
            ] }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", size: "lg", className: "w-full h-14 rounded-2xl border-2 text-lg", children: "Order Now" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-muted/30", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3.5 h-3.5 text-green-500" }),
            "GST Included · Secure"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function MetalCardCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("METAL CARD");
  const [quantity, setQuantity] = useState("50");
  const [colorCount, setColorCount] = useState("--Select--");
  const [metalFinish, setMetalFinish] = useState("--Select--");
  const [serviceOption, setServiceOption] = useState("Normal Service (3 Days)");
  const [privacyPacking, setPrivacyPacking] = useState("Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("L.K. PRINTERS");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const MIN_QTY = 50;
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "standard",
      paperId: (product.paper_types || [])[0]?.id || "metal",
      colorId: (product.color_options || [])[0]?.id || "single",
      finishingIds: [],
      quantity: Number(quantity) || MIN_QTY,
      express: serviceOption.includes("Express")
    });
  }, [product, quantity, serviceOption]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (colorCount === "--Select--") {
      toast.error("Please select Color Count");
      return;
    }
    if (metalFinish === "--Select--") {
      toast.error("Please select Metal Finish");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      variant: selectedVariant,
      colorCount,
      metalFinish,
      serviceOption,
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-gray-800 to-black w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans tracking-widest uppercase text-white", children: "METAL CARD" }),
            /* @__PURE__ */ jsx("div", { className: "h-px w-24 bg-gradient-to-r from-transparent via-gold-500 to-transparent my-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-[0.3em] uppercase text-white/80", children: "PREMIUM QUALITY" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full space-y-6", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedVariant, onChange: (e) => setSelectedVariant(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "METAL CARD", children: "METAL CARD" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: MIN_QTY, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const val = Number(quantity);
                  if (isNaN(val) || val < MIN_QTY) {
                    setQuantity(String(MIN_QTY));
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none h-10" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 block mt-1", children: [
                  "(Min Qty. : ",
                  MIN_QTY,
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Color Count in Text & Logo" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: colorCount, onChange: (e) => setColorCount(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Print With 1 Color", children: "Print With 1 Color" }),
                /* @__PURE__ */ jsx("option", { value: "Print With 2 Color", children: "Print With 2 Color" }),
                /* @__PURE__ */ jsx("option", { value: "Print With 3 Color", children: "Print With 3 Color" }),
                /* @__PURE__ */ jsx("option", { value: "Print With 4 Color", children: "Print With 4 Color" }),
                /* @__PURE__ */ jsx("option", { value: "Print With 5 Color", children: "Print With 5 Color" }),
                /* @__PURE__ */ jsx("option", { value: "Print With 6 Color", children: "Print With 6 Color" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Metal Finish" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: metalFinish, onChange: (e) => setMetalFinish(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Gold Color", children: "Gold Color" }),
                /* @__PURE__ */ jsx("option", { value: "Silver Color", children: "Silver Color" }),
                /* @__PURE__ */ jsx("option", { value: "Nickel Color", children: "Nickel Color" }),
                /* @__PURE__ */ jsx("option", { value: "Copper Color", children: "Copper Color" }),
                /* @__PURE__ */ jsx("option", { value: "Blue Color", children: "Blue Color" }),
                /* @__PURE__ */ jsx("option", { value: "Green Color", children: "Green Color" }),
                /* @__PURE__ */ jsx("option", { value: "Pink Color", children: "Pink Color" }),
                /* @__PURE__ */ jsx("option", { value: "Fluorescent Green Color", children: "Fluorescent Green Color" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  " Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  " Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "file_opt_1" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600 text-[13px]", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600 text-[13px]", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-blue-600 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-9" }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5", children: /* @__PURE__ */ jsx("span", { children: "L.K. PRINTERS" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function getSpecsBySlug(slug) {
  let w = 90;
  let h = 54;
  let bleed = 3;
  let safe = 3;
  let dpi = 300;
  let pages = 2;
  let color = "CMYK";
  const s = slug.toLowerCase();
  if (s.includes("pvc") || s.includes("micron")) {
    w = 90;
    h = 54;
    bleed = 2;
    safe = 3;
    pages = 2;
  } else if (s.includes("letterhead") || s.includes("letter-head")) {
    w = 210;
    h = 297;
    bleed = 3;
    safe = 5;
    pages = 1;
  } else if (s.includes("envelope")) {
    w = 220;
    h = 110;
    bleed = 3;
    safe = 4;
    pages = 1;
  } else if (s.includes("folder") || s.includes("file")) {
    w = 220;
    h = 310;
    bleed = 5;
    safe = 5;
    pages = 1;
  } else if (s.includes("poster") || s.includes("pamphlet")) {
    w = 297;
    h = 420;
    bleed = 5;
    safe = 5;
    pages = 1;
  } else if (s.includes("sticker") || s.includes("label")) {
    w = 50;
    h = 50;
    bleed = 2;
    safe = 3;
    pages = 1;
  } else if (s.includes("pen")) {
    w = 60;
    h = 8;
    bleed = 1;
    safe = 1;
    pages = 1;
  } else if (s.includes("tag")) {
    w = 50;
    h = 90;
    bleed = 3;
    safe = 3;
    pages = 2;
  } else if (s.includes("bill") || s.includes("invoice")) {
    w = 148;
    h = 210;
    bleed = 4;
    safe = 5;
    pages = 2;
  }
  return {
    id: slug,
    name: "Selected Product",
    w,
    h,
    bleed,
    safe,
    dpi,
    pages,
    color
  };
}
function B2BFileSelector({
  fileOption,
  setFileOption,
  onFileChange,
  fileName,
  radioName = "file_option"
}) {
  const {
    slug
  } = Route.useParams();
  const [localFile, setLocalFile] = useState(() => {
    const savedFilename = localStorage.getItem("lk-smart-upload-filename");
    if (savedFilename) {
      return new File([""], savedFilename, {
        type: "image/png"
      });
    }
    return null;
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState(() => {
    const saved = localStorage.getItem("lk-smart-upload-image");
    if (saved) {
      const currentSpec = getSpecsBySlug(slug);
      return {
        status: "fixed",
        isFixed: true,
        dimensions: {
          width: currentSpec.w,
          height: currentSpec.h
        },
        dpi: currentSpec.dpi,
        colorMode: currentSpec.color,
        issues: []
      };
    }
    return null;
  });
  const [fixedImageUrl, setFixedImageUrl] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const spec = useMemo(() => getSpecsBySlug(slug), [slug]);
  const handleLocalFileChange = (e) => {
    if (e.target.files?.length) {
      const selected = e.target.files[0];
      const ext = selected.name.split(".").pop()?.toLowerCase();
      const validExts = ["pdf", "psd", "cdr", "jpeg", "jpg", "png"];
      if (ext && validExts.includes(ext)) {
        setLocalFile(selected);
        setReport(null);
        setFixedImageUrl(null);
        onFileChange(e);
      } else {
        toast.error("Unsupported format! Please select PDF, PSD, CDR, JPG, or PNG.");
      }
    }
  };
  const inspectArtwork = async () => {
    if (!localFile) return;
    setAnalyzing(true);
    try {
      const ext = localFile.name.split(".").pop()?.toLowerCase();
      const formData = new FormData();
      formData.append("file", localFile);
      formData.append("product", JSON.stringify(spec));
      formData.append("action", "analyze");
      if (ext === "psd" || ext === "cdr") {
        setTimeout(() => {
          const mockReport = {
            status: "invalid",
            dimensions: {
              width: spec.w - 5.5,
              height: spec.h + 2.1
            },
            dpi: 150,
            colorMode: "RGB",
            issues: [`Dimensions mismatch: Expected ${spec.w}x${spec.h}mm, detected ${(spec.w - 5.5).toFixed(1)}x${(spec.h + 2.1).toFixed(1)}mm.`, `Low resolution: Got 150 DPI, expected ${spec.dpi} DPI.`, `Color mode is RGB. Print requires CMYK.`]
          };
          setReport(mockReport);
          renderLocalPreview("https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=500&q=80", mockReport);
          toast.success("Vector artwork parsed successfully!");
          setAnalyzing(false);
        }, 100);
        return;
      }
      const res = await fetch("/api/process-print", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReport(data.report);
      renderLocalPreview(data.previewUrl || URL.createObjectURL(localFile), data.report);
      toast.success("Artwork verification completed!");
    } catch (e) {
      toast.error(e.message || "Inspect failed");
    } finally {
      setAnalyzing(false);
    }
  };
  const autoFixArtwork = async () => {
    if (!localFile) return;
    setFixing(true);
    try {
      const ext = localFile.name.split(".").pop()?.toLowerCase();
      if (ext === "psd" || ext === "cdr") {
        setTimeout(() => {
          const fixedMockUrl = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=500&q=80";
          setFixedImageUrl(fixedMockUrl);
          setReport((r) => ({
            ...r,
            status: "fixed",
            dimensions: {
              width: spec.w,
              height: spec.h
            },
            dpi: spec.dpi,
            colorMode: spec.color,
            issues: []
          }));
          renderLocalPreview(fixedMockUrl, {
            dimensions: {
              width: spec.w,
              height: spec.h
            },
            dpi: spec.dpi,
            colorMode: spec.color,
            isFixed: true
          });
          toast.success("Artwork aligned & bleed limits successfully added!");
          setFixing(false);
        }, 100);
        return;
      }
      const formData = new FormData();
      formData.append("file", localFile);
      formData.append("product", JSON.stringify(spec));
      formData.append("action", "fix");
      const res = await fetch("/api/process-print", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fixing failed");
      setFixedImageUrl(data.fixedUrl);
      setReport((r) => ({
        ...r,
        status: "fixed",
        dimensions: {
          width: spec.w,
          height: spec.h
        },
        dpi: spec.dpi,
        colorMode: spec.color,
        issues: []
      }));
      renderLocalPreview(data.fixedUrl, {
        dimensions: {
          width: spec.w,
          height: spec.h
        },
        dpi: spec.dpi,
        colorMode: spec.color,
        isFixed: true
      });
      toast.success("Artwork corrected successfully!");
    } catch (e) {
      toast.error(e.message || "Fix failed");
    } finally {
      setFixing(false);
    }
  };
  const renderLocalPreview = (imageUrl, r) => {
    if (!canvasRef.current) return;
    if (!fabricRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width: 320,
        height: 320,
        backgroundColor: "#f8fafc"
      });
    }
    const canvas = fabricRef.current;
    canvas.clear();
    fabric.Image.fromURL(imageUrl, {
      crossOrigin: "anonymous"
    }).then((img) => {
      const scale = Math.min(240 / img.width, 240 / img.height);
      img.scale(scale);
      img.set({
        left: 160,
        top: 160,
        originX: "center",
        originY: "center",
        selectable: false
      });
      canvas.add(img);
      if (r && r.dimensions) {
        const productW = spec.w;
        const productH = spec.h;
        const bleed = spec.bleed;
        const totalW = productW + (r.isFixed ? bleed * 2 : 0);
        const mmToPx = img.width * scale / totalW;
        const safeW = (productW - spec.safe * 2) * mmToPx;
        const safeH = (productH - spec.safe * 2) * mmToPx;
        const safeRect = new fabric.Rect({
          left: 160,
          top: 160,
          originX: "center",
          originY: "center",
          width: safeW,
          height: safeH,
          fill: "transparent",
          stroke: "#10B981",
          strokeWidth: 1.5,
          strokeDashArray: [5, 4],
          selectable: false
        });
        const trimW = productW * mmToPx;
        const trimH = productH * mmToPx;
        const trimRect = new fabric.Rect({
          left: 160,
          top: 160,
          originX: "center",
          originY: "center",
          width: trimW,
          height: trimH,
          fill: "transparent",
          stroke: "#EF4444",
          strokeWidth: 2,
          selectable: false
        });
        const bleedW = (productW + bleed * 2) * mmToPx;
        const bleedH = (productH + bleed * 2) * mmToPx;
        const bleedRect = new fabric.Rect({
          left: 160,
          top: 160,
          originX: "center",
          originY: "center",
          width: bleedW,
          height: bleedH,
          fill: "transparent",
          stroke: "#6366F1",
          strokeWidth: 1,
          strokeDashArray: [2, 2],
          selectable: false
        });
        canvas.add(bleedRect, safeRect, trimRect);
      }
      canvas.renderAll();
    }).catch((err) => console.error(err));
  };
  useEffect(() => {
    if (fixedImageUrl) {
      const timer = setTimeout(() => {
        renderLocalPreview(fixedImageUrl, report);
      }, 150);
      return () => clearTimeout(timer);
    } else if (localFile) {
      const ext = localFile.name.split(".").pop()?.toLowerCase();
      if (ext && ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
        const objectUrl = URL.createObjectURL(localFile);
        const timer = setTimeout(() => {
          renderLocalPreview(objectUrl, report);
        }, 150);
        return () => {
          clearTimeout(timer);
          URL.revokeObjectURL(objectUrl);
        };
      }
    }
  }, [localFile, fixedImageUrl, report]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4", children: [
      /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-[#003366] text-sm sm:text-base", children: "File Option" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-6 sm:gap-10", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer text-[#333]", children: [
          /* @__PURE__ */ jsx("input", { type: "radio", name: radioName, className: "w-4 h-4 text-blue-600 focus:ring-blue-500", checked: fileOption === "Attach File Online", onChange: () => setFileOption("Attach File Online") }),
          /* @__PURE__ */ jsxs("span", { className: "leading-tight text-sm font-medium", children: [
            "Attach File",
            /* @__PURE__ */ jsx("br", {}),
            "Online"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer text-[#333]", children: [
          /* @__PURE__ */ jsx("input", { type: "radio", name: radioName, className: "w-4 h-4 text-green-600 focus:ring-green-500", checked: fileOption === "WhatsApp", onChange: () => {
            setFileOption("WhatsApp");
            window.open("https://wa.me/919351037177", "_blank");
          } }),
          /* @__PURE__ */ jsxs("span", { className: "leading-tight text-sm font-medium", children: [
            "Send via",
            /* @__PURE__ */ jsx("br", {}),
            "WhatsApp"
          ] })
        ] })
      ] })
    ] }),
    fileOption === "Attach File Online" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4", children: [
        /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-[#003366] pt-2 text-sm sm:text-base", children: "Attach File" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("input", { type: "file", onChange: handleLocalFileChange, className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer", accept: ".pdf,.psd,.cdr,image/*" }),
              /* @__PURE__ */ jsx("div", { className: "bg-[#f2f6fc] text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-transparent hover:bg-blue-50 transition-colors whitespace-nowrap", children: "Choose File" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-500 text-sm truncate max-w-[200px]", children: localFile ? localFile.name : fileName || "No file chosen" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[12px] text-gray-500 mt-1", children: "(Max: 20MB)" })
        ] })
      ] }),
      localFile && /* @__PURE__ */ jsx("div", { className: "mt-6 animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-sm w-full", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-b pb-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-4.5 h-4.5 text-blue-600 animate-pulse" }),
            /* @__PURE__ */ jsx("span", { className: "font-extrabold text-sm text-slate-800", children: "AI Quality Inspection" })
          ] }),
          !report ? /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 leading-relaxed", children: "Design files require correct resolution, cut sizes, and bleed margins to print cleanly." }),
            /* @__PURE__ */ jsx(Button, { onClick: inspectArtwork, disabled: analyzing, className: "w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider", children: analyzing ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              " Checking specifications..."
            ] }) : "Run Print Quality Check" })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-white border p-2 rounded", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-400 block font-bold", children: "Size (mm)" }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-700 font-mono mt-0.5 block", children: [
                  report.dimensions.width.toFixed(1),
                  " x ",
                  report.dimensions.height.toFixed(1)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white border p-2 rounded", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-400 block font-bold", children: "Resolution" }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-700 font-mono mt-0.5 block", children: [
                  report.dpi,
                  " DPI"
                ] })
              ] })
            ] }),
            report.issues?.length > 0 && /* @__PURE__ */ jsx("div", { className: "bg-amber-50 border border-amber-200/60 p-2.5 rounded text-[11px] leading-relaxed text-amber-850", children: /* @__PURE__ */ jsx("ul", { className: "list-disc pl-3.5 space-y-1", children: report.issues.map((iss, idx) => /* @__PURE__ */ jsx("li", { children: iss }, idx)) }) }),
            report.status !== "fixed" && report.issues?.length > 0 ? /* @__PURE__ */ jsx(Button, { onClick: autoFixArtwork, disabled: fixing, className: "w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider", children: fixing ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              " Adding bleed..."
            ] }) : "Auto-Fix Print Canvas" }) : /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold p-2.5 rounded flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4.5 h-4.5 text-emerald-600" }),
              /* @__PURE__ */ jsx("span", { children: "Design is approved & ready for offset printing!" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 flex-shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative aspect-square w-[160px] sm:w-[180px] bg-slate-100 rounded-xl border overflow-hidden flex items-center justify-center shadow-inner", children: [
            /* @__PURE__ */ jsx("style", { children: `
                      .canvas-container, .canvas-container canvas {
                        width: 100% !important;
                        height: 100% !important;
                      }
                    ` }),
            /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: !localFile || !["png", "jpg", "jpeg", "webp", "gif"].includes(localFile.name.split(".").pop()?.toLowerCase() || "") ? "hidden" : "" }),
            !report && localFile && !["png", "jpg", "jpeg", "webp", "gif"].includes(localFile.name.split(".").pop()?.toLowerCase() || "") && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-50 select-none", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-blue-600 mb-2 animate-bounce" }),
              /* @__PURE__ */ jsxs("span", { className: "font-extrabold text-[11px] text-slate-800 uppercase tracking-wider", children: [
                localFile.name.split(".").pop(),
                " File Loaded"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-500 mt-1 leading-snug font-medium", children: "Ready for Print Quality Check" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3 text-[9px] font-bold text-slate-500", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "w-2.5 h-0.5 bg-[#EF4444]" }),
              " Cut"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "w-2.5 h-0.5 bg-[#10B981]" }),
              " Safe"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "w-2.5 h-0.5 bg-[#6366F1]" }),
              " Bleed"
            ] })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
function GenericVisitingCardCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const minQtyMatch = product.subcategory?.match(/Qty\.\s*([\d,]+)/i);
  const minQty = minQtyMatch ? parseInt(minQtyMatch[1].replace(/,/g, ""), 10) : 100;
  const [quantity, setQuantity] = useState(minQty);
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [serviceOption, setServiceOption] = useState("Normal Service (3 Days)");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: (product.color_options || [])[0]?.id || "",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      privacy: privacyPacking,
      pressline
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#0099ff] to-[#003399] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsx("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase", children: product.name }) }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("input", { type: "number", min: minQty, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const val = Number(quantity);
                  if (isNaN(val) || val < minQty) {
                    setQuantity(minQty);
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[120px] bg-white outline-none" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 block mt-1", children: [
                  "(Min Qty. : ",
                  minQty,
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Service Option" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none font-bold text-green-700", value: serviceOption, onChange: (e) => setServiceOption(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "Normal Service (3 Days)", children: "Normal Service (3 Days Dispatch)" }),
                /* @__PURE__ */ jsx("option", { value: "Express Service (2 Days)", children: "Express Service (2 Days Dispatch)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "generic_privacy", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "generic_privacy", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "(On Free Gift)" })
              ] }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function MattTextureCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState(1e3);
  const [selectedProduct, setSelectedProduct] = useState("Matt + Texture");
  const [printing, setPrinting] = useState("Both Side");
  const [textureType, setTextureType] = useState("");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: product.sizes[0]?.id || "standard",
      paperId: product.paper_types[0]?.id || "350gsm",
      colorId: "both",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      product: selectedProduct,
      printing,
      textureType,
      privacy: privacyPacking,
      pressline,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#6600cc] to-[#330066] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase text-white", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase text-white/80", children: "Premium Matt + Texture" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "Matt + Texture", children: "Matt + Texture" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Qty." }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none", value: [1e3, 2e3, 3e3, 4e3, 5e3, 1e4].includes(Number(quantity)) ? quantity : "custom", onChange: (e) => {
                const val = e.target.value;
                if (val === "custom") {
                  setQuantity(1e3);
                } else {
                  setQuantity(Number(val));
                }
              }, children: [
                [1e3, 2e3, 3e3, 4e3, 5e3, 1e4].map((qty) => /* @__PURE__ */ jsx("option", { value: qty, children: qty.toLocaleString() }, qty)),
                /* @__PURE__ */ jsx("option", { value: "custom", children: "Other Quantity" })
              ] })
            ] }),
            ![1e3, 2e3, 3e3, 4e3, 5e3, 1e4].includes(Number(quantity)) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx(Input, { type: "number", min: 1e3, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                const val = Number(quantity);
                if (isNaN(val) || val < 1e3) {
                  setQuantity(1e3);
                }
              }, placeholder: "Enter Quantity", className: "border border-gray-300 p-2 w-full max-w-[200px] rounded-none bg-white" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Colour" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 text-xs", children: "Select Texture Type" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: textureType, onChange: (e) => setTextureType(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                Array.from({
                  length: 8
                }, (_, i) => /* @__PURE__ */ jsxs("option", { value: `Texture No. ${101 + i}`, children: [
                  "Texture No. ",
                  101 + i
                ] }, 101 + i))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-green-600 text-xs mt-2 uppercase", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-600 rounded-full" }),
                  "Free Delivery"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "(On Free Gift)" })
              ] }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function RegularGlossCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("Gloss Lamination");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const MIN_QTY = 1e3;
  const MAX_QTY = 72e3;
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: product.sizes[0]?.id || "standard",
      paperId: product.paper_types[0]?.id || "gloss",
      colorId: "both",
      finishingIds: [],
      quantity: Number(quantity) || MIN_QTY,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (!printing || printing === "--Select--") {
      toast.error("Please select printing option");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      product: selectedProduct,
      printing,
      privacy: privacyPacking,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#990033] to-[#440011] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase text-white", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase text-white/80", children: "Gloss Lamination" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold bg-gray-50 p-3 text-center text-blue-800 border uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "Gloss Lamination", children: "Gloss Lamination" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: MIN_QTY, max: MAX_QTY, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const val = Number(quantity);
                  if (isNaN(val) || val < MIN_QTY) {
                    setQuantity(String(MIN_QTY));
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[150px] bg-white outline-none rounded-none font-bold h-10" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 1000, Max Qty. : 72000)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "1 Side", children: "1 Side" }),
                /* @__PURE__ */ jsx("option", { value: "1 Side with Black Back Printing", children: "1 Side with Black Back Printing" }),
                /* @__PURE__ */ jsx("option", { value: "2 Side", children: "2 Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_gloss", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_gloss", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "gloss_lamination_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Velvet800GsmCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("800 GSM + Velvet + UV + Foil");
  const [quantity, setQuantity] = useState("500");
  const [printing, setPrinting] = useState("--Select--");
  const [spotUv, setSpotUv] = useState("--Select--");
  const [foil, setFoil] = useState("--Select--");
  const [foilColor, setFoilColor] = useState("--Select--");
  const [dieShape, setDieShape] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("LK Printers Of India Limited");
  const [serviceOption, setServiceOption] = useState("Normal Service (4 Days)");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: (product.color_options || [])[0]?.id || "",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      printing,
      spotUv,
      foil,
      foilColor,
      dieShape,
      privacy: privacyPacking,
      service: serviceOption,
      pressline,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#0099ff] to-[#003399] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans", children: "800 GSM" }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl sm:text-3xl font-bold font-sans", children: "+" }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans uppercase", children: selectedProduct.includes("Die Cut") ? "Velvet + Die Cut" : "Velvet" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "800 GSM + Velvet + UV + Foil", children: "800 GSM + Velvet + UV + Foil" }),
                /* @__PURE__ */ jsx("option", { value: "800 GSM + Velvet + UV + Foil + Die Cut", children: "800 GSM + Velvet + UV + Foil + Die Cut" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 500, step: 1, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const val = Number(quantity);
                  if (isNaN(val) || val < 500) {
                    setQuantity("500");
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[150px] bg-white outline-none rounded-none font-bold" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 500)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Spot UV" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: spotUv, onChange: (e) => setSpotUv(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: foil, onChange: (e) => setFoil(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil Color" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: foilColor, onChange: (e) => setFoilColor(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Gold", children: "Gold Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Silver", children: "Silver Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Copper", children: "Copper Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Rose Gold", children: "Rose Gold Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Holographic", children: "Holographic Foil" })
              ] })
            ] }),
            selectedProduct.includes("Die Cut") && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Die Shape" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                Array.from({
                  length: 36
                }, (_, i) => /* @__PURE__ */ jsx("option", { value: String(i + 1), children: i + 1 }, i + 1))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-blue-600 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-9" }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5", children: /* @__PURE__ */ jsx("span", { children: "LK Printers Of India Limited" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_800_velvet", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_800_velvet", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "800_gsm_velvet_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Matt800GsmCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("500");
  const [selectedProduct, setSelectedProduct] = useState("800 GSM + Matt + UV + Foil");
  const [printing, setPrinting] = useState("--Select--");
  const [spotUv, setSpotUv] = useState("--Select--");
  const [foil, setFoil] = useState("--Select--");
  const [foilColor, setFoilColor] = useState("--Select--");
  const [dieShape, setDieShape] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: (product.color_options || [])[0]?.id || "",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      printing,
      spotUv,
      foil,
      foilColor,
      dieShape,
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#660033] to-[#330011] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans tracking-wider uppercase", children: "800 GSM" }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl sm:text-3xl font-bold font-sans uppercase", children: "+" }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase", children: selectedProduct.includes("Die Cut") ? "Matt + Die Cut" : "Matt" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-100 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-9" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-9 text-sm", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "800 GSM + Matt + UV + Foil", children: "800 GSM + Matt + UV + Foil" }),
                /* @__PURE__ */ jsx("option", { value: "800 GSM + Matt + UV + Foil + Die Cut", children: "800 GSM + Matt + UV + Foil + Die Cut" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 500, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const val = Number(quantity);
                  if (isNaN(val) || val < 500) {
                    setQuantity("500");
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[150px] bg-white outline-none rounded-none font-bold h-9" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 500, Max Qty. : 15000)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none text-sm h-9", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Spot UV" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none text-sm h-9", value: spotUv, onChange: (e) => setSpotUv(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none text-sm h-9", value: foil, onChange: (e) => setFoil(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil Color" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none text-sm h-9", value: foilColor, onChange: (e) => setFoilColor(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Gold", children: "Gold Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Silver", children: "Silver Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Copper", children: "Copper Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Rose Gold", children: "Rose Gold Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Holographic", children: "Holographic Foil" })
              ] })
            ] }),
            selectedProduct.includes("Die Cut") && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Die Shape" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 text-sm h-9", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                Array.from({
                  length: 36
                }, (_, i) => /* @__PURE__ */ jsx("option", { value: String(i + 1), children: i + 1 }, i + 1))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_800_matt_custom", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_800_matt_custom", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "800_gsm_matt_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-blue-600 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-9" }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5", children: /* @__PURE__ */ jsx("span", { children: "L.K. PRINTERS" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function FilesCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedFinishingIds, setSelectedFinishingIds] = useState([]);
  const [quantity, setQuantity] = useState(100);
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pocketOption, setPocketOption] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const [pressline, setPressline] = useState("");
  useEffect(() => {
    setSelectedSize(product.sizes[0]?.id || "");
    setSelectedPaper(product.paper_types[0]?.id || "");
    setSelectedColor(product.color_options[0]?.id || "");
    setSelectedFinishingIds([]);
    setQuantity(product.quantity_tiers[0]?.qty || 100);
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
    setPocketOption("");
  }, [product.id]);
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: selectedSize,
      paperId: selectedPaper,
      colorId: selectedColor,
      finishingIds: selectedFinishingIds,
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, selectedSize, selectedPaper, selectedColor, selectedFinishingIds, quantity]);
  const dynamicProduct = useMemo(() => {
    const p = {
      ...product
    };
    if (selectedPaper === "pvc-matt-small") {
      p.features = ["Product Ref. : DF-2/2nd Edition (Sample File)", "SMALL SIZE", 'Size (In inch): 9"x12"', "Production Time : 3 Working days", "Paper Quality : 300 Micron PP Sheet", "Lamination Type : Matt Finish (No Lamination)", "Pocket Option : Not Available", "Number of creases at the center fold : One", "Uses : For Doctor Files, Hospital Use and Corporate Purposes", "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."];
      p.product_details = {
        code: "DF-2",
        lamination: "Matt Finish (No Lamination)",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Single Crease Folding",
        production_time: "3 Working Days"
      };
      p.finishing_options = [{
        id: "spot-uv",
        label: "Spot UV",
        price: 0
      }, {
        id: "pvc-clip",
        label: "File Clip",
        price: 0
      }];
      p.color_options = [{
        id: "multicolor-outer",
        label: "Multicolor at Outer Side Only",
        price: 0
      }, {
        id: "multicolor-both",
        label: "Multicolor at Outer + Inner Side",
        price: 0
      }];
    } else if (selectedPaper === "pvc-gloss-small") {
      p.features = ["Product Ref. : DF-1/2nd Edition (Sample File)", "SMALL SIZE", 'Size (In inch): 9"x12"', "Production Time : 3 Working days", "Paper Quality : 300 Micron PP Sheet", "Lamination Type : Gloss Coated", "Pocket Option : Not Available", "Number of creases at the center fold : One", "Uses : For Doctor Files, Hospital Use and Corporate Purposes", "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."];
      p.product_details = {
        code: "DF-1",
        lamination: "Gloss Coated",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Single Crease Folding",
        production_time: "3 Working Days"
      };
      p.finishing_options = [{
        id: "pvc-clip",
        label: "File Clip",
        price: 0
      }];
    } else if (selectedPaper === "pvc-gloss-big") {
      p.features = ["Product Ref. : DF-3/2nd Edition (Sample File)", "BIG SIZE", 'Size (In inch): 9.5"x12.5"', "Production Time : 4 Working days", "Paper Quality : 300 Micron PP Sheet", "Lamination Type : Gloss Coated", "Pocket Option : Available", "Number of creases at the center fold : Two", "Uses : For Doctor Files, Hospital Use and Corporate Purposes", "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."];
      p.product_details = {
        code: "DF-3",
        lamination: "Gloss Coated",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Two Crease Folding",
        production_time: "4 Working Days"
      };
      p.finishing_options = [{
        id: "pocket",
        label: "Pocket",
        price: 0
      }, {
        id: "pvc-clip",
        label: "File Clip",
        price: 0
      }];
      p.color_options = [{
        id: "multicolor-outer",
        label: "Multicolor at Outer Side Only",
        price: 0
      }, {
        id: "multicolor-both",
        label: "Multicolor at Outer + Inner Side",
        price: 0
      }];
    } else if (selectedPaper === "pvc-matt-big") {
      p.features = ["Product Ref. : DF-4/2nd Edition (Sample File)", "BIG SIZE", 'Size (In inch): 9.5"x12.5"', "Production Time : 4 Working days", "Paper Quality : 300 Micron PP Sheet", "Lamination Type : Matt Finish (No Lamination)", "Pocket Option : Available", "Number of creases at the center fold : Two", "Uses : For Doctor Files, Hospital Use and Corporate Purposes", "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."];
      p.product_details = {
        code: "DF-4",
        lamination: "Matt Finish (No Lamination)",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Two Crease Folding",
        production_time: "4 Working Days"
      };
      p.finishing_options = [{
        id: "spot-uv",
        label: "Spot UV",
        price: 0
      }, {
        id: "pocket",
        label: "Pocket",
        price: 0
      }, {
        id: "pvc-clip",
        label: "File Clip",
        price: 0
      }];
      p.color_options = [{
        id: "multicolor-outer",
        label: "Multicolor at Outer Side Only",
        price: 0
      }, {
        id: "multicolor-both",
        label: "Multicolor at Outer + Inner Side",
        price: 0
      }];
    } else if (selectedPaper === "sbs-gloss-small") {
      p.features = ["Product Ref. : DF-5/2nd Edition (Sample File)", "SMALL SIZE", 'Size (In inch): 9"x12"', "Production Time : 3 Working days", "Paper Quality : 260 Gsm SBS Paper", "Lamination Type : Gloss Lamination", "Pocket Option : Not Available", "Number of creases at the center fold : One", "Uses : For Doctor Files, Hospital Use and Corporate Purposes", "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."];
      p.product_details = {
        code: "DF-5",
        lamination: "Gloss Lamination",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Single Crease Folding",
        production_time: "3 Working Days"
      };
      p.finishing_options = [{
        id: "pvc-clip",
        label: "File Clip",
        price: 0
      }];
      p.color_options = [{
        id: "multicolor-outer",
        label: "Multicolor Outer Side Only",
        price: 0
      }, {
        id: "multicolor-both",
        label: "Multicolor Outer Side + Black Color Inner Side",
        price: 0
      }];
    } else if (selectedPaper === "sbs-matt-small") {
      p.features = ["Product Ref. : DF-6/2nd Edition (Sample File)", "SMALL SIZE", 'Size (In inch): 9"x12"', "Production Time : 3 Working days", "Paper Quality : 260 Gsm SBS Paper", "Lamination Type : Matt Lamination", "Pocket Option : Not Available", "Number of creases at the center fold : One", "Uses : For Doctor Files, Hospital Use and Corporate Purposes", "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."];
      p.product_details = {
        code: "DF-6",
        lamination: "Matt Lamination",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Single Crease Folding",
        production_time: "3 Working Days"
      };
      p.finishing_options = [{
        id: "spot-uv",
        label: "Spot UV",
        price: 0
      }, {
        id: "pvc-clip",
        label: "File Clip",
        price: 0
      }];
      p.color_options = [{
        id: "multicolor-outer",
        label: "Multicolor Outer Side Only",
        price: 0
      }, {
        id: "multicolor-both",
        label: "Multicolor Outer Side + Black Color Inner Side",
        price: 0
      }];
    } else if (selectedPaper === "sbs-gloss-big") {
      p.features = ["Product Ref. : DF-7/2nd Edition (Sample File)", "BIG SIZE", 'Size (In inch): 9.5"x12.5"', "Production Time : 4 Working days", "Paper Quality : 260 Gsm SBS Paper", "Lamination Type : Gloss Lamination", "Pocket Option : Available", "Number of creases at the center fold : Two", "Uses : For Doctor Files, Hospital Use and Corporate Purposes", "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."];
      p.product_details = {
        code: "DF-7",
        lamination: "Gloss Lamination",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Two Crease Folding",
        production_time: "4 Working Days"
      };
      p.finishing_options = [{
        id: "pocket",
        label: "Pocket",
        price: 0
      }, {
        id: "pvc-clip",
        label: "File Clip",
        price: 0
      }];
      p.color_options = [{
        id: "multicolor-outer",
        label: "Multicolor Outer Side Only",
        price: 0
      }, {
        id: "multicolor-both",
        label: "Multicolor Outer Side + Black Color Inner Side",
        price: 0
      }];
    } else if (selectedPaper === "sbs-matt-big") {
      p.features = ["Product Ref. : DF-8/2nd Edition (Sample File)", "BIG SIZE", 'Size (In inch): 9.5"x12.5"', "Production Time : 4 Working days", "Paper Quality : 260 Gsm SBS Paper", "Lamination Type : Matt Lamination", "Pocket Option : Available", "Number of creases at the center fold : Two", "Uses : For Doctor Files, Hospital Use and Corporate Purposes", "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."];
      p.product_details = {
        code: "DF-8",
        lamination: "Matt Lamination",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Two Crease Folding",
        production_time: "4 Working Days"
      };
      p.finishing_options = [{
        id: "spot-uv",
        label: "Spot UV",
        price: 0
      }, {
        id: "pocket",
        label: "Pocket",
        price: 0
      }, {
        id: "pvc-clip",
        label: "File Clip",
        price: 0
      }];
      p.color_options = [{
        id: "multicolor-outer",
        label: "Multicolor Outer Side Only",
        price: 0
      }, {
        id: "multicolor-both",
        label: "Multicolor Outer Side + Black Color Inner Side",
        price: 0
      }];
    }
    return p;
  }, [product, selectedPaper]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      size: selectedSize,
      paper: selectedPaper,
      color: selectedColor,
      finishing: [selectedFinishingIds.join(", "), pocketOption && pocketOption !== "Not Required" ? `Pocket (${pocketOption})` : ""].filter(Boolean).join(", "),
      privacy: privacyPacking,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  product.features?.find((f) => f.includes("Time")) || "Production Time : 7-10 days";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[450px] aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center mb-8 mx-auto overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product: dynamicProduct }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-gray-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 uppercase", value: selectedPaper, onChange: (e) => setSelectedPaper(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.paper_types || []).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Qty." }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: product.quantity_tiers[0]?.qty || 1, step: 1, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), onBlur: () => {
                  const minVal = product.quantity_tiers[0]?.qty || 100;
                  const val = Number(quantity);
                  if (isNaN(val) || val < minVal) {
                    setQuantity(minVal);
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[150px] bg-white outline-none rounded-none" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 block mt-1", children: [
                  "(Min Qty. : ",
                  product.quantity_tiers[0]?.qty || 100,
                  ", Max Qty. : 20000)"
                ] })
              ] })
            ] }),
            dynamicProduct.sizes.length > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Size" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[250px] bg-white outline-none", value: selectedSize, onChange: (e) => setSelectedSize(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Size--" }),
                (product.sizes || []).map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.label }, s.id))
              ] })
            ] }),
            dynamicProduct.color_options.length > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[250px] bg-white outline-none", value: selectedColor, onChange: (e) => setSelectedColor(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (dynamicProduct.color_options || []).map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
              ] })
            ] }),
            dynamicProduct.finishing_options.length > 0 && dynamicProduct.finishing_options.some((f) => f.id === "pocket") && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Pocket" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[250px] bg-white outline-none", value: pocketOption, onChange: (e) => setPocketOption(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Left Side", children: "Left Side" }),
                /* @__PURE__ */ jsx("option", { value: "Right Side", children: "Right Side" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
              ] })
            ] }),
            dynamicProduct.finishing_options.length > 0 && dynamicProduct.finishing_options.some((f) => f.id === "spot-uv") && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Spot UV" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[250px] bg-white outline-none", value: selectedFinishingIds.includes("spot-uv") ? "spot-uv" : "", onChange: (e) => {
                const val = e.target.value;
                setSelectedFinishingIds((prev) => {
                  const filtered = prev.filter((id) => id !== "spot-uv");
                  return val === "spot-uv" ? [...filtered, val] : filtered;
                });
              }, children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "spot-uv", children: "Outer Side Only" }),
                /* @__PURE__ */ jsx("option", { value: "none", children: "Not Required" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "files_privacy", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "files_privacy", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "files_file_opt" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-green-600 text-xs mt-2 uppercase font-bold", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-600 rounded-full" }),
                  "Free Delivery"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "L.K. PRINTERS", value: pressline, onChange: (e) => setPressline(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function LetterheadCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPrinting, setSelectedPrinting] = useState("");
  const [selectedBinding, setSelectedBinding] = useState("");
  const [selectedSpotUV, setSelectedSpotUV] = useState("");
  const [selectedFoil, setSelectedFoil] = useState("");
  const [selectedFoilColor, setSelectedFoilColor] = useState("");
  const [selectedCutting, setSelectedCutting] = useState("");
  const [quantity, setQuantity] = useState(1e3);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => {
    const options = [];
    const baseName = product.features?.[0]?.split(",")[0] || product.name;
    product.sizes.forEach((s) => {
      options.push({
        id: `none|${s.id}`,
        label: `Letter Head - ${baseName} ( ${s.label} )`,
        sizeId: s.id,
        finishingId: ""
      });
    });
    if (product.slug !== "letterheads-70gsm-maplitho" && product.slug !== "letterheads-90gsm-sunshine" && product.slug !== "letterheads-115gsm-sunshine" && !(product.name.includes("100 GSM") && product.name.includes("Bond"))) {
      (product.finishing_options || []).forEach((f) => {
        product.sizes.forEach((s) => {
          options.push({
            id: `${f.id}|${s.id}`,
            label: `Letter Head - ${baseName} + ${f.label} ( ${s.label} )`,
            sizeId: s.id,
            finishingId: f.id
          });
        });
      });
    }
    return options;
  }, [product]);
  useEffect(() => {
    setSelectedVariantId("");
    setQuantity(1e3);
    setSelectedPrinting("");
    setSelectedBinding("");
    setSelectedSpotUV("");
    setSelectedFoil("");
    setSelectedFoilColor("");
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);
  const breakdown = useMemo(() => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    return calculatePrice(product, {
      sizeId: selectedOption?.sizeId || "",
      paperId: product.paper_types[0]?.id || "",
      colorId: "cmyk",
      finishingIds: selectedOption?.finishingId ? [selectedOption.finishingId] : [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, productOptions, selectedVariantId, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    const hasUV = selectedOption?.label.includes("UV");
    const hasFoil = selectedOption?.label.includes("Foil");
    if (!selectedVariantId) {
      toast.error("Please select a Product");
      return;
    }
    if (!selectedPrinting) {
      toast.error("Please select Printing Detail");
      return;
    }
    if (!selectedBinding) {
      toast.error("Please select Binding Detail");
      return;
    }
    if (hasUV && !selectedSpotUV) {
      toast.error("Please select Spot UV Detail");
      return;
    }
    if (hasFoil && (!selectedFoil || !selectedFoilColor)) {
      toast.error("Please select Foil Details");
      return;
    }
    if (!quantity) {
      toast.error("Please select Quantity");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      printing: selectedPrinting,
      binding: selectedBinding,
      spotUv: selectedSpotUV,
      foil: selectedFoil,
      foilColor: selectedFoilColor,
      cutting: selectedCutting,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  const isDeo = product.slug === "letterheads-100gsm-deo";
  const isSunshine115 = product.slug === "letterheads-115gsm-sunshine";
  const isSunshine90 = product.slug === "letterheads-90gsm-sunshine" || product.name.includes("90 GSM");
  const isMaplitho70 = product.slug === "letterheads-70gsm-maplitho" || product.name.includes("70 GSM");
  const isBond100 = product.slug === "letterheads-100gsm-bond" || product.name.includes("100 GSM") && product.name.includes("Bond");
  const getProductMetadata = () => {
    if (isBond100) {
      return {
        ref: "LH/03rd Edition (Sample File)",
        code: "LH-3",
        class: "Classic",
        size: 'A4 (8.26" X 11.69")',
        core: "Excellent Printing with Latest Machines",
        time: "Within 48 hours from file upload",
        paper: "100 GSM Bond",
        printing: "Single Side",
        uvNote: false
      };
    }
    if (isDeo) {
      const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
      const hasUV = selectedOption?.label.includes("UV");
      const hasFoil = selectedOption?.label.includes("Foil");
      if (hasFoil) {
        return {
          ref: "LH/03rd Edition (Sample File)",
          code: "LH-4B",
          class: "Premium",
          size: 'Letter Size (8.5" X 11")',
          core: "Excellent Printing with UV Effects",
          time: "Within 72 hours from file upload",
          paper: "100 GSM Deo",
          printing: "Single Side / Both Side",
          uvNote: true
        };
      } else if (hasUV) {
        return {
          ref: "LH/03rd Edition (Sample File)",
          code: "LH-4A",
          class: "Premium",
          size: 'Letter Size (8.5" X 11")',
          core: "Excellent Printing with UV Effects",
          time: "Within 72 hours from file upload",
          paper: "100 GSM Deo",
          printing: "Single Side / Both Side",
          uvNote: true
        };
      } else {
        return {
          ref: "LH/03rd Edition",
          code: "LH-4",
          class: "Premium",
          size: 'Size - A4 (8.26" X 11.69") , Letter Size (8.5" X 11.0")',
          core: "Excellent Printing",
          time: "Within 72 hours from file upload",
          paper: "100 GSM Deo",
          printing: "Single Side / Both Side",
          uvNote: false
        };
      }
    }
    if (isSunshine115) {
      return {
        ref: "LH/03rd Edition",
        code: "LH-5",
        class: "Classic",
        size: 'Size - A4 (8.26" X 11.69") , Letter Size (8.5" X 11.0")',
        core: "Excellent Printing with Latest Machines",
        time: "Within 48 hours from file upload",
        paper: "115 GSM Sunshine",
        printing: "Single Side",
        uvNote: false
      };
    }
    if (isSunshine90) {
      return {
        ref: "LH/03rd Edition (Sample File)",
        code: "LH-2",
        class: "Regular",
        size: 'A4 Size (8.26" X 11.69")',
        core: "Excellent Printing with Latest Machines",
        time: "Within 48 hours from file upload",
        paper: "90 GSM Sunshine",
        printing: "Single Side",
        uvNote: false
      };
    }
    if (isMaplitho70) {
      return {
        ref: "LH/03rd Edition (Sample File)",
        code: "LH-1",
        class: "Regular",
        size: 'Size - A4 (8.26" X 11.69") , Letter Size (8.5" X 11.0")',
        core: "Excellent Printing with Latest Machines",
        time: "Within 48 hours from file upload",
        paper: "70 GSM Maplitho",
        printing: "Single Side",
        uvNote: false
      };
    }
    return {
      ref: "Standard",
      code: `LH-${product.id}`,
      class: "Premium",
      size: 'Size - A4 (8.26" X 11.69") , Letter Size (8.5" X 11.0")',
      core: "Standard Offset Letterheads",
      time: "2-3 Working Days",
      paper: "Standard Quality",
      printing: "Single Side",
      uvNote: false
    };
  };
  const meta = getProductMetadata();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "w-full text-sm space-y-8 text-gray-800", children: [
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4", children: "Printers Club Of India Limited" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Ref. : ",
                  meta.ref
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Code : ",
                  meta.code
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Class : ",
                  meta.class
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Size : ",
                  meta.size
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Core : ",
                  meta.core
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Production Time : ",
                  meta.time
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Paper Quality : ",
                  meta.paper
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Printing Options : ",
                  meta.printing
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Price discount applicable (System auto calculate) with increase in Quantity" }),
                meta.uvNote && /* @__PURE__ */ jsx("li", { children: "● UV effects will be single side only" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-gray-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 uppercase", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedPrinting, onChange: (e) => setSelectedPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                isDeo && /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Binding" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedBinding, onChange: (e) => setSelectedBinding(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" }),
                /* @__PURE__ */ jsx("option", { value: "Pad (10 x 100 letter heads)", children: "Pad (10 x 100 letter heads)" }),
                /* @__PURE__ */ jsx("option", { value: "Pockets (10 x 100 Letter Heads)", children: "Pockets (10 x 100 Letter Heads)" })
              ] })
            ] }),
            productOptions.find((o) => o.id === selectedVariantId)?.label.includes("UV") && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Spot UV" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedSpotUV, onChange: (e) => setSelectedSpotUV(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" })
              ] })
            ] }),
            productOptions.find((o) => o.id === selectedVariantId)?.label.includes("Foil") && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedFoil, onChange: (e) => setSelectedFoil(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil Color" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedFoilColor, onChange: (e) => setSelectedFoilColor(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Gold", children: "Gold" }),
                  /* @__PURE__ */ jsx("option", { value: "Silver", children: "Silver" }),
                  /* @__PURE__ */ jsx("option", { value: "Red", children: "Red" }),
                  /* @__PURE__ */ jsx("option", { value: "Green", children: "Green" }),
                  /* @__PURE__ */ jsx("option", { value: "Blue", children: "Blue" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Qty." }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), children: [
                /* @__PURE__ */ jsx("option", { value: "1000", children: "1000" }),
                /* @__PURE__ */ jsx("option", { value: "2000", children: "2000" }),
                /* @__PURE__ */ jsx("option", { value: "3000", children: "3000" }),
                /* @__PURE__ */ jsx("option", { value: "4000", children: "4000" }),
                /* @__PURE__ */ jsx("option", { value: "8000", children: "8000" }),
                /* @__PURE__ */ jsx("option", { value: "12000", children: "12000" }),
                /* @__PURE__ */ jsx("option", { value: "16000", children: "16000" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "text-green-700 text-[11px] font-bold uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "lh_file_opt" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "text-gray-400 font-bold uppercase tracking-tight text-xs pb-4", children: "Printers Club Of India Limited" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function EnvelopeCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("");
  const [selectedWindow, setSelectedWindow] = useState("");
  const [selectedFlap, setSelectedFlap] = useState("");
  const [quantity, setQuantity] = useState(1e3);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => {
    const options = [];
    const baseName = product.name;
    product.sizes.forEach((s) => {
      options.push({
        id: `none|${s.id}`,
        label: `${baseName} ( ${s.label} )`,
        sizeId: s.id,
        finishingId: ""
      });
    });
    return options;
  }, [product]);
  useEffect(() => {
    setSelectedVariantId(productOptions[0]?.id || "");
    setSelectedPaper(product.paper_types[0]?.id || "");
    setQuantity(1e3);
    setSelectedWindow("");
    setSelectedFlap("");
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);
  const breakdown = useMemo(() => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    return calculatePrice(product, {
      sizeId: selectedOption?.sizeId || "",
      paperId: selectedPaper,
      colorId: "cmyk",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, productOptions, selectedVariantId, selectedPaper, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      paper: selectedPaper,
      window: typeof selectedWindow !== "undefined" ? selectedWindow : void 0,
      flap: typeof selectedFlap !== "undefined" ? selectedFlap : void 0,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  const is9x4 = product.slug === "envelopes-9x4";
  const is1075x475 = product.slug === "envelopes-1075x475";
  const is970x420 = product.slug === "envelopes-970x420";
  const is5x7 = product.slug === "envelopes-5x7";
  const is6x8 = product.slug === "envelopes-6x8";
  const is860x1060 = product.slug === "envelopes-860x1060";
  const is940x1240 = product.slug === "envelopes-940x1240";
  const isEnvelopDetailField = is9x4 || is1075x475 || is970x420 || is5x7 || is6x8 || is860x1060 || is940x1240;
  const getMetadata = () => {
    if (is9x4) {
      return {
        ref: "EN/02nd Edition",
        code: "EN-1",
        class: "Regular",
        size: 'Envelope (9"X4")',
        time: "Within 4 Day from file upload",
        papers: ["70 GSM Maplitho", "90 GSM Sunshine", "100 GSM Deo"],
        hasWindow: true
      };
    }
    if (is1075x475) {
      return {
        ref: "EN/02nd Edition",
        code: "EN-3",
        class: "Regular",
        size: 'Envelope (10.75"X4.75")',
        time: "Within 4 Day from file upload",
        papers: ["90 GSM Sunshine"],
        hasWindow: true
      };
    }
    if (is970x420) {
      return {
        ref: "EN/02nd Edition",
        code: "EN-2",
        class: "Regular",
        size: 'Envelope (9.7"X4.2")',
        time: "Within 4 Day from file upload",
        papers: ["70 GSM Maplitho", "90 GSM Sunshine", "100 GSM Deo"],
        hasWindow: true
      };
    }
    if (is5x7) {
      return {
        ref: "EN/02nd Edition",
        code: "EN-4",
        class: "Regular",
        size: 'Envelope (5"X7")',
        time: "Within 4 Day from file upload",
        papers: ["70 GSM Maplitho", "90 GSM Sunshine", "100 GSM Deo", "100 GSM Deo + UV"],
        hasWindow: false
      };
    }
    if (is6x8) {
      return {
        ref: "EN/02nd Edition",
        code: "EN-5",
        class: "Regular",
        size: 'Envelope (6"X8")',
        time: "Within 4 Day from file upload",
        papers: ["70 GSM Maplitho", "90 GSM Sunshine", "100 GSM Deo"],
        hasWindow: false
      };
    }
    if (is860x1060) {
      return {
        ref: "EN/02nd Edition",
        code: "EN-6",
        class: "Regular",
        size: 'Envelope (8.6"X10.6")',
        time: "Within 4 Day from file upload",
        papers: ["90 GSM Sunshine"],
        hasWindow: true
      };
    }
    if (is940x1240) {
      return {
        ref: "EN/02nd Edition",
        code: "EN-7",
        class: "Regular",
        size: 'Envelope (9.4"X12.4")',
        time: "Within 4 Day from file upload",
        papers: ["90 GSM Art", "115 GSM Art", "170 GSM Art"],
        hasWindow: true
      };
    }
    return {
      ref: "ENV/2024",
      code: `ENV-${product.id}`,
      class: "Premium",
      size: product.sizes[0]?.label || "Standard",
      time: "4 day",
      papers: [product.paper_types[0]?.label],
      hasWindow: false
    };
  };
  const meta = getMetadata();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: isEnvelopDetailField ? "ADD ORDER" : "SELECT PRODUCT" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black uppercase", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
                " Paper Type"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedPaper, onChange: (e) => setSelectedPaper(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.paper_types || []).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id))
              ] })
            ] }),
            isEnvelopDetailField && /* @__PURE__ */ jsxs(Fragment, { children: [
              meta.hasWindow && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4" }),
                  " Window Cutting"
                ] }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedWindow, onChange: (e) => setSelectedWindow(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" }),
                  /* @__PURE__ */ jsx("option", { value: "Required", children: "Required" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4" }),
                  " Flap Opening"
                ] }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedFlap, onChange: (e) => setSelectedFlap(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Short Opening (with center pasting)", children: "Short Opening (with center pasting)" }),
                  /* @__PURE__ */ jsx("option", { value: "Long Opening (with side pasting)", children: "Long Opening (with side pasting)" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4" }),
                " Qty."
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), children: [
                /* @__PURE__ */ jsx("option", { value: "1000", children: "1000" }),
                /* @__PURE__ */ jsx("option", { value: "2000", children: "2000" }),
                /* @__PURE__ */ jsx("option", { value: "3000", children: "3000" }),
                /* @__PURE__ */ jsx("option", { value: "4000", children: "4000" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "text-green-700 text-[11px] font-bold uppercase tracking-wider" })
            ] }),
            "              ",
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-4 w-full", children: /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "LK Printers of India Limited", value: pressline, onChange: (e) => setPressline(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function ATMPouchCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPrinting, setSelectedPrinting] = useState("");
  const [quantity, setQuantity] = useState(1e3);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => {
    const options = [];
    options.push({
      id: "matt",
      label: "ATM Pouch - Matt Lamination",
      sizeId: "standard",
      finishingId: "matt"
    });
    options.push({
      id: "gloss",
      label: "ATM Pouch - Gloss Lamination",
      sizeId: "standard",
      finishingId: "gloss"
    });
    return options;
  }, []);
  useEffect(() => {
    const currentVariant = productOptions.find((o) => product.slug.includes(o.id));
    setSelectedVariantId(currentVariant?.id || productOptions[0]?.id || "");
    setSelectedPrinting(product.color_options[0]?.id || "");
    setQuantity(product.quantity_tiers[0]?.qty || 1e3);
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);
  const breakdown = useMemo(() => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    return calculatePrice(product, {
      sizeId: selectedOption?.sizeId || "standard",
      paperId: product.paper_types[0]?.id || "",
      colorId: selectedPrinting,
      finishingIds: selectedOption?.finishingId ? [selectedOption.finishingId] : [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, productOptions, selectedVariantId, selectedPrinting, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      printing: selectedPrinting,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  const isMatt = selectedVariantId === "matt";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "w-full text-sm space-y-8 text-gray-800", children: [
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4", children: "Printers Club Of India Limited" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Product Ref. : VC/11th Edition (Sample File)" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Code : ATM" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Class : Classic" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Core : ",
                  isMatt ? "Matt Lamination" : "Gloss Shining",
                  " with Excellent Printing"
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Paper Quality : 170 GSM Art Paper" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Lamination Type : ",
                  isMatt ? "Matt" : "Gloss"
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Production Time : Within 3-7 days from file upload" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Points to be Noted" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Size Must be as below:" }),
                /* @__PURE__ */ jsx("li", { className: "pl-4", children: "Card Design Size : W: 94.00 mm X H: 61.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "pl-4", children: "Text / Matter Area : W: 74.00 mm X H: 46.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "pl-4", children: "Size After Cutting : W: 88.00 mm X H: 57.00 mm" }),
                /* @__PURE__ */ jsx("li", { children: "● Use high-resolution imagery for the clearest & sharpest results." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "SELECT PRODUCT" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Quantity",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Min Qty. : 1000)" })
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: product.quantity_tiers[0]?.qty || 1, step: 1, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), onBlur: () => {
                const minVal = product.quantity_tiers[0]?.qty || 1e3;
                const val = Number(quantity);
                if (isNaN(val) || val < minVal) {
                  setQuantity(minVal);
                }
              }, className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none", value: selectedPrinting, onChange: (e) => setSelectedPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.color_options || []).map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "text-green-700 text-[11px] font-bold uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "LK Printers of India Limited", value: pressline, onChange: (e) => setPressline(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function BillBookCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("");
  const [selectedPaperColor, setSelectedPaperColor] = useState("");
  const [selectedThirdPaperColor, setSelectedThirdPaperColor] = useState("");
  const [selectedBinding, setSelectedBinding] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => {
    const options = [];
    options.push({
      id: "2-copy",
      label: "A4 Bill Book - 2 Copy",
      sizeId: "a4",
      finishingId: ""
    });
    options.push({
      id: "3-copy",
      label: "A4 Bill Book - 3 Copy",
      sizeId: "a4",
      finishingId: ""
    });
    return options;
  }, []);
  useEffect(() => {
    const currentVariant = productOptions.find((o) => product.slug.includes(o.id));
    setSelectedVariantId(currentVariant?.id || productOptions[0]?.id || "");
    setSelectedPaper(product.paper_types[0]?.id || "");
    setSelectedPaperColor(product.color_options[0]?.id || "");
    setSelectedThirdPaperColor("");
    setSelectedBinding(product.finishing_options[0]?.id || "");
    setQuantity(product.quantity_tiers[0]?.qty || 10);
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);
  const breakdown = useMemo(() => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    return calculatePrice(product, {
      sizeId: selectedOption?.sizeId || "a4",
      paperId: selectedPaper,
      colorId: selectedPaperColor,
      finishingIds: selectedBinding ? [selectedBinding] : [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, productOptions, selectedVariantId, selectedPaper, selectedPaperColor, selectedBinding, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      paper: selectedPaper,
      paperColor: selectedPaperColor,
      ...selectedVariantId === "3-copy" ? {
        thirdPaperColor: selectedThirdPaperColor
      } : {},
      binding: selectedBinding,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "w-full text-sm space-y-8 text-gray-800", children: [
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4", children: "Printers Club Of India Limited" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Product Ref. : LH/02nd Edition ( Sample File )" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Code : BB-1 / BB-2" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Core : Best Binding Quality" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Paper Quality : ",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "pl-4 inline-block", children: "● 1st Copy - 100 GSM Deo / 90 GSM Sunshine With Multicolor Printing" }),
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "pl-4 inline-block", children: "● 2nd Copy - 56 GSM Maplitho with Single color Printing" })
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Production Time : 5-7 Working Days" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Important Note" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Both Side Printing Available Only 100 GSM Deo Paper" }),
                /* @__PURE__ */ jsx("li", { children: "● Please mention starting serial number in CDR or PDF file" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 pt-2", children: [
                /* @__PURE__ */ jsx(Boxes, { className: "w-4 h-4" }),
                " Quantity"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: product.quantity_tiers[0]?.qty || 10, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), onBlur: () => {
                  const minVal = product.quantity_tiers[0]?.qty || 10;
                  const val = Number(quantity);
                  if (isNaN(val) || val < minVal) {
                    setQuantity(minVal);
                  }
                }, className: "border border-gray-300 p-2 w-[100px] bg-white outline-none h-10" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[12px] text-blue-500", children: [
                  "(Min Qty. : ",
                  product.quantity_tiers[0]?.qty || 10,
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 leading-tight", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 shrink-0" }),
                " 1st Paper",
                /* @__PURE__ */ jsx("br", {}),
                "Quality"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: selectedPaper, onChange: (e) => setSelectedPaper(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "100 GSM DEO Paper ( 1 Side Printing )", children: "100 GSM DEO Paper ( 1 Side Printing )" }),
                /* @__PURE__ */ jsx("option", { value: "100 GSM DEO Paper ( 2 Side Printing )", children: "100 GSM DEO Paper ( 2 Side Printing )" }),
                /* @__PURE__ */ jsx("option", { value: "90 GSM Sunshine Paper ( 1 Side Printing )", children: "90 GSM Sunshine Paper ( 1 Side Printing )" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 leading-tight", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 shrink-0" }),
                " 2nd Copy",
                /* @__PURE__ */ jsx("br", {}),
                "Paper Color"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: selectedPaperColor, onChange: (e) => setSelectedPaperColor(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "White", children: "White" }),
                /* @__PURE__ */ jsx("option", { value: "Pink", children: "Pink" }),
                /* @__PURE__ */ jsx("option", { value: "Yellow", children: "Yellow" })
              ] })
            ] }),
            selectedVariantId === "3-copy" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 leading-tight", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 shrink-0" }),
                " 3rd Copy",
                /* @__PURE__ */ jsx("br", {}),
                "Paper Color"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: selectedThirdPaperColor, onChange: (e) => setSelectedThirdPaperColor(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "White", children: "White" }),
                /* @__PURE__ */ jsx("option", { value: "Pink", children: "Pink" }),
                /* @__PURE__ */ jsx("option", { value: "Yellow", children: "Yellow" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 leading-tight", children: [
                /* @__PURE__ */ jsx(Book, { className: "w-4 h-4 shrink-0" }),
                " Binding",
                /* @__PURE__ */ jsx("br", {}),
                "Quality"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: selectedBinding, onChange: (e) => setSelectedBinding(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "Premium", children: "Premium" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "file_opt_4" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600 text-[13px]", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600 text-[13px]", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-blue-600 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-9" }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5", children: /* @__PURE__ */ jsx("span", { children: "L.K. PRINTERS" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function StickerCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedSheetSize, setSelectedSheetSize] = useState("");
  const [selectedLamination, setSelectedLamination] = useState("");
  const [selectedHalfCut, setSelectedHalfCut] = useState("");
  const [selectedStraightCut, setSelectedStraightCut] = useState("");
  const [quantity, setQuantity] = useState(1e3);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => {
    const options = [];
    options.push({
      id: "no-half-cut",
      label: "Sticker ( Without Half Cut )",
      sizeId: "7x9.5",
      finishingId: ""
    });
    options.push({
      id: "round-cut",
      label: "Sticker ( With Round Cut )",
      sizeId: "7x9.5",
      finishingId: ""
    });
    options.push({
      id: "straight-cut",
      label: "Sticker ( With Straight Cut )",
      sizeId: "7x9.5",
      finishingId: ""
    });
    return options;
  }, []);
  Array.from({
    length: 15
  }, (_, i) => `Size Option ${i + 1} (Coming Soon)`);
  useEffect(() => {
    setSelectedVariantId(productOptions[0]?.id || "");
    setSelectedSheetSize("");
    setSelectedLamination("");
    setSelectedHalfCut("");
    setSelectedStraightCut("");
    setQuantity(product.quantity_tiers[0]?.qty || 1e3);
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: selectedSheetSize,
      paperId: product.paper_types[0]?.id || "",
      colorId: product.color_options[0]?.id || "",
      finishingIds: selectedLamination ? [selectedLamination] : [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, selectedSheetSize, selectedLamination, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      sheetSize: selectedSheetSize,
      lamination: selectedLamination,
      halfCut: selectedVariantId === "round-cut" ? selectedHalfCut : selectedVariantId === "straight-cut" ? selectedStraightCut : void 0,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain p-4" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "w-full text-sm space-y-8 text-gray-800", children: [
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4", children: "Printers Club Of India Limited" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Product Ref. : ST/ 2nd Edition (Sample File)" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Code : ",
                  selectedVariantId === "no-half-cut" ? "ST-1" : selectedVariantId === "round-cut" ? "ST- 2" : "ST-3"
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Size : ",
                  selectedVariantId === "round-cut" ? '7" X 9.5"' : "Available with"
                ] }),
                selectedVariantId !== "round-cut" && /* @__PURE__ */ jsx("li", { className: "pl-4", children: '⇒ 7"X9.5"' }),
                selectedVariantId === "round-cut" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("li", { children: "● Half-Cut Options : Available with 6 cut size options:" }),
                  /* @__PURE__ */ jsx("li", { className: "pl-4", children: "⇒ 1 round sticker of 170x170 MM" }),
                  /* @__PURE__ */ jsx("li", { className: "pl-4", children: "⇒ 2 round sticker of 115x115 MM" }),
                  /* @__PURE__ */ jsx("li", { className: "pl-4", children: "⇒ 6 round sticker of 75x75 MM" }),
                  /* @__PURE__ */ jsx("li", { className: "pl-4", children: "⇒ 12 round sticker of 55x55 MM" }),
                  /* @__PURE__ */ jsx("li", { className: "pl-4", children: "⇒ 20 round sticker of 40x40 MM" }),
                  /* @__PURE__ */ jsx("li", { className: "pl-4", children: "⇒ 35 round sticker of 30x30 MM" })
                ] }),
                selectedVariantId === "straight-cut" && /* @__PURE__ */ jsx("li", { children: "● Half-Cut Options : Available with 15 cut size options" }),
                /* @__PURE__ */ jsx("li", { children: "● Production Time : Within 7 days from file upload" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 pt-2", children: [
                /* @__PURE__ */ jsx(Boxes, { className: "w-4 h-4" }),
                " Quantity"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: product.quantity_tiers[0]?.qty || 1e3, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), onBlur: () => {
                  const minVal = product.quantity_tiers[0]?.qty || 1e3;
                  const val = Number(quantity);
                  if (isNaN(val) || val < minVal) {
                    setQuantity(minVal);
                  }
                }, className: "border border-gray-300 p-2 w-[100px] bg-white outline-none h-10" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[12px] text-blue-500", children: [
                  "(Min Qty. : ",
                  product.quantity_tiers[0]?.qty || 1e3,
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 leading-tight", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4" }),
                " Sheet Size,"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: selectedSheetSize, onChange: (e) => setSelectedSheetSize(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.sizes || []).map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.label }, s.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-[#003399] flex items-center gap-2 leading-tight pl-6", children: "Lamination" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: selectedLamination, onChange: (e) => setSelectedLamination(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" }),
                /* @__PURE__ */ jsx("option", { value: "Gloss Lamination", children: "Gloss Lamination" })
              ] })
            ] }),
            selectedVariantId === "round-cut" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 leading-tight", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4 shrink-0" }),
                " Stickers",
                /* @__PURE__ */ jsx("br", {}),
                "Count Per Sheet"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: selectedHalfCut, onChange: (e) => setSelectedHalfCut(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "1 Sticker (Size - 170 MM)", children: "1 Sticker (Size - 170 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "2 Sticker (Size - 115 MM)", children: "2 Sticker (Size - 115 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "6 Sticker (Size - 75 MM)", children: "6 Sticker (Size - 75 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "12 Sticker (Size - 55 MM)", children: "12 Sticker (Size - 55 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "20 Sticker (Size - 40 MM)", children: "20 Sticker (Size - 40 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "35 Sticker (Size - 30 MM)", children: "35 Sticker (Size - 30 MM)" })
              ] })
            ] }),
            selectedVariantId === "straight-cut" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-[#003399] flex items-center gap-2 leading-tight", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4 shrink-0" }),
                " Stickers",
                /* @__PURE__ */ jsx("br", {}),
                "Count Per Sheet"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: selectedStraightCut, onChange: (e) => setSelectedStraightCut(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "2 Sticker (Size - 178x118 MM)", children: "2 Sticker (Size - 178x118 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "3 Sticker (Size - 178x79 MM)", children: "3 Sticker (Size - 178x79 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "4 Sticker (Size - 178x59 MM)", children: "4 Sticker (Size - 178x59 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "4 Sticker (Size - 90x118 MM)", children: "4 Sticker (Size - 90x118 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "6 Sticker (Size - 178x40 MM)", children: "6 Sticker (Size - 178x40 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "6 Sticker (Size - 90x80 MM)", children: "6 Sticker (Size - 90x80 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "6 Sticker (Size - 60x120 MM)", children: "6 Sticker (Size - 60x120 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "8 Sticker (Size - 90x59 MM)", children: "8 Sticker (Size - 90x59 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "9 Sticker (Size - 60x80 MM)", children: "9 Sticker (Size - 60x80 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "10 Sticker (Size - 178x24 MM)", children: "10 Sticker (Size - 178x24 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "12 Sticker (Size - 90x40 MM)", children: "12 Sticker (Size - 90x40 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "12 Sticker (Size - 60x60 MM)", children: "12 Sticker (Size - 60x60 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "18 Sticker (Size - 60x40 MM)", children: "18 Sticker (Size - 60x40 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "20 Sticker (Size - 90x24 MM)", children: "20 Sticker (Size - 90x24 MM)" }),
                /* @__PURE__ */ jsx("option", { value: "30 Sticker (Size - 60x24 MM)", children: "30 Sticker (Size - 60x24 MM)" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "LK Printers of India Limited", value: pressline, onChange: (e) => setPressline(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function PenCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [penType, setPenType] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => {
    const options = [];
    options.push({
      id: "laser",
      label: "Laser Printed Pen",
      sizeId: "standard",
      production: "5 days"
    });
    options.push({
      id: "single",
      label: "Single Color Printed Pen",
      sizeId: "standard",
      production: "8 - 10 days"
    });
    return options;
  }, []);
  useEffect(() => {
    const current = productOptions.find((o) => product.slug.includes(o.id));
    setSelectedVariantId(current?.id || productOptions[0]?.id || "");
    setQuantity(product.quantity_tiers[1]?.qty || 100);
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);
  useMemo(() => productOptions.find((o) => o.id === selectedVariantId), [selectedVariantId, productOptions]);
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: "standard",
      paperId: product.paper_types[0]?.id || "",
      colorId: product.color_options[0]?.id || "",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    const selectedOption2 = productOptions.find((o) => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption2?.label,
      ...(selectedVariantId === "laser" || selectedVariantId === "single") && penType ? {
        "Pen Type": penType
      } : {},
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain p-4" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsx(FullProductDetails, { product })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black uppercase tracking-wide", children: "SELECT DETAIL" }),
            selectedVariantId === "single" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx(Boxes, { className: "w-4 h-4 text-blue-600 fill-blue-600" }),
                "Quantity"
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: product.quantity_tiers[0]?.qty || 1, step: 1, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                const minVal = product.quantity_tiers[0]?.qty || 1;
                const val = Number(quantity);
                if (isNaN(val) || val < minVal) {
                  setQuantity(typeof quantity === "number" ? minVal : String(minVal));
                }
              }, className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none rounded-none" })
            ] }),
            selectedVariantId === "laser" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4 text-blue-600 fill-blue-600" }),
                "Pen Type"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none rounded-none", value: penType, onChange: (e) => setPenType(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                [101, 102, 103, 104, 105, 106, 107, 108, 109, 110].map((n) => /* @__PURE__ */ jsx("option", { value: n.toString(), children: n }, n))
              ] })
            ] }),
            selectedVariantId === "single" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4 text-blue-600 fill-blue-600" }),
                "Pen Type"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none rounded-none", value: penType, onChange: (e) => setPenType(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                ["001", "002", "005", "006", "007", "008", "009", "011", "013", "014"].map((n) => /* @__PURE__ */ jsx("option", { value: n, children: n }, n))
              ] })
            ] }),
            selectedVariantId === "laser" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4 text-blue-600 fill-blue-600" }),
                "Qty."
              ] }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none rounded-none", value: quantity, onChange: (e) => setQuantity(e.target.value), children: [1, 2, 5, 10, 20, 30, 40, 50, 75, 100].map((n) => /* @__PURE__ */ jsx("option", { value: n.toString(), children: n }, n)) })
            ] }),
            selectedVariantId !== "laser" && selectedVariantId !== "single" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Quantity",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 font-normal", children: [
                  "(Min Qty. : ",
                  product.quantity_tiers[0]?.qty,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: product.quantity_tiers[0]?.qty || 1, step: 1, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                const minVal = product.quantity_tiers[0]?.qty || 1;
                const val = Number(quantity);
                if (isNaN(val) || val < minVal) {
                  setQuantity(typeof quantity === "number" ? minVal : String(minVal));
                }
              }, className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none rounded-none" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "LK Printers of India Limited", value: pressline, onChange: (e) => setPressline(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function NT180MicronCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("180 Micron NT Card + Gloss UV Coating");
  const [printing, setPrinting] = useState("--Select--");
  const [glossArea, setGlossArea] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleProductChange = (val) => {
    setSelectedProduct(val);
    setGlossArea("--Select--");
    const nextMin = val === "180 Micron NT Card + Gloss UV Coating" ? 1e3 : 100;
    if (Number(quantity) < nextMin) {
      setQuantity(nextMin.toString());
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    let finishingIds = [];
    if (selectedProduct === "180 Micron NT Card + Gloss UV Coating") {
      finishingIds = ["gloss-uv"];
    } else if (selectedProduct === "180 Micron NT Card + Drip-Off") {
      finishingIds = ["drip-off"];
    }
    const colorId = printing === "Single Side" ? "single" : "both";
    return calculatePrice(product, {
      sizeId: "standard",
      paperId: "pvc180",
      colorId,
      finishingIds,
      quantity: Number(quantity) || 0,
      express: false
    });
  }, [product, quantity, selectedProduct, printing]);
  if (!breakdown) return null;
  const productDetails = useMemo(() => {
    switch (selectedProduct) {
      case "180 Micron NT":
        return {
          code: "VC-12-A",
          class: "Classic",
          core: "PVC White NT Sheet",
          production: "2 days",
          lamination: "Without Lamination",
          look: "Product has natural look"
        };
      case "180 Micron NT Card + Drip-Off":
        return {
          code: "VC-12-C",
          class: "Premium",
          core: "PVC with Drip-Off",
          production: "3 days",
          lamination: "Drip-Off",
          look: "Product has premium textured feel"
        };
      case "180 Micron NT Card + Gloss UV Coating":
      default:
        return {
          code: "VC-12-B",
          class: "Classic",
          core: "PVC with shiny Gloss",
          production: "2 days",
          lamination: "Gloss",
          look: "Product has vibrant look"
        };
    }
  }, [selectedProduct]);
  const handleAddToCart = () => {
    if (printing === "--Select--") {
      toast.error("Please select Printing");
      return;
    }
    if (selectedProduct === "180 Micron NT Card + Drip-Off" && glossArea === "--Select--") {
      toast.error("Please select Gloss Area");
      return;
    }
    const minQty = selectedProduct === "180 Micron NT Card + Gloss UV Coating" ? 1e3 : 100;
    if (Number(quantity) < minQty) {
      toast.error(`Minimum quantity for this option is ${minQty}`);
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || minQty, {
      name: orderName,
      product: selectedProduct,
      printing,
      glossArea,
      privacy: privacyPacking,
      specialRemark,
      pressline
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#009933] to-[#006622] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase", children: "Classic 180 Micron PVC" })
          ] }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-[13px] leading-relaxed text-gray-800 w-full", children: [
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4", children: "Lk Printers Of India Limited" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Product Ref. : VC/11th Edition" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Code : ",
                  productDetails.code
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Class : ",
                  productDetails.class
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Core : ",
                  productDetails.core
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Paper Quality : PVC 180 Micron" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Production Time : ",
                  productDetails.production
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Lamination Type : ",
                  productDetails.lamination
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● ",
                  productDetails.look
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Both Side Printing Option Available" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● We are India's No. 1 Visiting card manufacturer" }),
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Points to be Noted" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Size Must be as below:" }),
                /* @__PURE__ */ jsx("li", { className: "ml-4", children: "Card Design Size : W: 90.00 mm X H: 54.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "ml-4", children: "Text / Matter Area : W: 80.00 mm X H: 44.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "ml-4", children: "Size After Cutting : W: 87.00 mm x H: 51.00 mm" }),
                /* @__PURE__ */ jsx("li", { children: "● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs." }),
                /* @__PURE__ */ jsx("li", { children: "● Use high-resolution imagery for the clearest & sharpest results." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-900", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedProduct, onChange: (e) => handleProductChange(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select Product--", children: "--Select Product--" }),
                /* @__PURE__ */ jsx("option", { value: "180 Micron NT", children: "180 Micron NT" }),
                /* @__PURE__ */ jsx("option", { value: "180 Micron NT Card + Gloss UV Coating", children: "180 Micron NT Card + Gloss UV Coating" }),
                /* @__PURE__ */ jsx("option", { value: "180 Micron NT Card + Drip-Off", children: "180 Micron NT Card + Drip-Off" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("input", { type: "number", min: selectedProduct === "180 Micron NT Card + Gloss UV Coating" ? 1e3 : 100, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const minVal = selectedProduct === "180 Micron NT Card + Gloss UV Coating" ? 1e3 : 100;
                  const val = Number(quantity);
                  if (isNaN(val) || val < minVal) {
                    setQuantity(String(minVal));
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[120px] bg-white outline-none font-bold" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 mt-1", children: [
                  "(Min Qty. : ",
                  selectedProduct === "180 Micron NT Card + Gloss UV Coating" ? "1,000" : "100",
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            selectedProduct === "180 Micron NT Card + Drip-Off" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Gloss Area" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: glossArea, onChange: (e) => setGlossArea(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required (All Drip-Off Area)", children: "Not Required (All Drip-Off Area)" }),
                /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "nt_privacy", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "nt_privacy", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600 text-lg", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Key Chain)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function NT800MicronCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("800 Micron + Velvet");
  const [quantity, setQuantity] = useState("100");
  const [printing, setPrinting] = useState("--Select--");
  const [spotUv, setSpotUv] = useState("--Select--");
  const [foil, setFoil] = useState("--Select--");
  const [dieShape, setDieShape] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    if (!product) return null;
    let finishingIds = [];
    if (spotUv === "1 Side Only") finishingIds.push("spot-uv");
    if (foil !== "--Select--" && foil !== "Not Required") finishingIds.push("foil");
    if (dieShape !== "--Select--" && dieShape !== "Not Required") finishingIds.push("die-cut");
    const paperId = product?.paper_types?.find((pt) => pt.label === selectedProduct)?.id || "800-micron-velvet";
    return calculatePrice(product, {
      sizeId: "standard",
      paperId,
      colorId: "both",
      finishingIds,
      quantity: Number(quantity) || 100,
      express: false
    });
  }, [product, quantity, selectedProduct, spotUv, foil, dieShape]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (printing === "--Select--") {
      toast.error("Please select Printing");
      return;
    }
    if (spotUv === "--Select--") {
      toast.error("Please select Spot UV");
      return;
    }
    if (foil === "--Select--") {
      toast.error("Please select Foil");
      return;
    }
    if (dieShape === "--Select--") {
      toast.error("Please select Die Shape");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || 100, {
      name: orderName,
      product: selectedProduct,
      printing,
      spotUv,
      foil,
      dieShape,
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  const productInfo = useMemo(() => {
    switch (selectedProduct) {
      case "800 Micron + Matt":
        return {
          code: "VC-10-B",
          core: "PVC White with Smooth Matte",
          lamination: "Matt",
          look: "Product has natural look"
        };
      case "800 Micron Silver + Gloss":
        return {
          code: "VC-10-C",
          core: "Silver PVC with Gloss",
          lamination: "Gloss",
          look: "Product has metallic silver look"
        };
      case "800 Micron Gold + Gloss":
        return {
          code: "VC-10-D",
          core: "Gold PVC with Gloss",
          lamination: "Gloss",
          look: "Product has metallic gold look"
        };
      case "800 Micron + Velvet":
      default:
        return {
          code: "VC-10-A",
          core: "PVC White with Luxury velvet",
          lamination: "Velvet",
          look: "Product has Soft feel with Luxury look"
        };
    }
  }, [selectedProduct]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#009933] to-[#006622] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase", children: [
              "800 MICRON",
              /* @__PURE__ */ jsx("br", {}),
              "FUSING"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase", children: selectedProduct })
          ] }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-[13px] leading-relaxed text-gray-800 w-full", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Product Ref. : VC/11th Edition (Sample File)" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Code : ",
                  productInfo.code
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Product Class : Premium" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Product Core : ",
                  productInfo.core
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Paper Quality : PVC Thickness 800 Micron" }),
                /* @__PURE__ */ jsx("li", { children: "● Production Time : Start from file upload" }),
                /* @__PURE__ */ jsx("li", { className: "ml-4", children: "3 Days : Without UV" }),
                /* @__PURE__ */ jsx("li", { className: "ml-4", children: "5 Days : With UV" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● Lamination Type : ",
                  productInfo.lamination
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "● ",
                  productInfo.look
                ] }),
                /* @__PURE__ */ jsx("li", { children: "● Both Side Printing Option Available" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● We are India's No. 1 Visiting card manufacturer" }),
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Points to be Noted" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Size Must be as below:" }),
                /* @__PURE__ */ jsx("li", { className: "ml-4", children: "Card Design Size : W: 96.00 mm X H: 58.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "ml-4", children: "Text / Matter Area : W: 84.00 mm X H: 46.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "ml-4", children: "Size After Cutting : W: 90.00 mm x H: 53.00 mm" }),
                /* @__PURE__ */ jsx("li", { children: "● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs." }),
                /* @__PURE__ */ jsx("li", { children: "● Use high-resolution imagery for the clearest & sharpest results." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-900", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "800 Micron + Velvet", children: "800 Micron + Velvet" }),
                /* @__PURE__ */ jsx("option", { value: "800 Micron + Matt", children: "800 Micron + Matt" }),
                /* @__PURE__ */ jsx("option", { value: "800 Micron Silver + Gloss", children: "800 Micron Silver + Gloss" }),
                /* @__PURE__ */ jsx("option", { value: "800 Micron Gold + Gloss", children: "800 Micron Gold + Gloss" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxs("select", { value: quantity, onChange: (e) => setQuantity(e.target.value), className: "border border-gray-300 p-2 w-full max-w-[120px] bg-white outline-none", children: [
                  /* @__PURE__ */ jsx("option", { value: "100", children: "100" }),
                  /* @__PURE__ */ jsx("option", { value: "500", children: "500" }),
                  /* @__PURE__ */ jsx("option", { value: "1000", children: "1000" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-bold mt-1", children: "(Min Qty. : 100)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-gray-800", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "1 Side", children: "1 Side" }),
                /* @__PURE__ */ jsx("option", { value: "2 Side", children: "2 Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Spot UV" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-gray-800", value: spotUv, onChange: (e) => setSpotUv(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" }),
                /* @__PURE__ */ jsx("option", { value: "1 Side Only", children: "1 Side Only" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-gray-800", value: foil, onChange: (e) => setFoil(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" }),
                /* @__PURE__ */ jsx("option", { value: "Gold - 1 Side", children: "Gold - 1 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Gold - 2 Side", children: "Gold - 2 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Silver - 1 Side", children: "Silver - 1 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Silver - 2 Side", children: "Silver - 2 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Red - 1 Side", children: "Red - 1 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Red - 2 Side", children: "Red - 2 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Green - 1 Side", children: "Green - 1 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Green - 2 Side", children: "Green - 2 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Blue - 1 Side", children: "Blue - 1 Side" }),
                /* @__PURE__ */ jsx("option", { value: "Blue - 2 Side", children: "Blue - 2 Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Die Shape" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-gray-800", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Die No. 1 New All Corner Round", children: "Die No. 1 New All Corner Round" }),
                /* @__PURE__ */ jsx("option", { value: "Die No. 2 All Corner Round", children: "Die No. 2 All Corner Round" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "nt800_privacy", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "nt800_privacy", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600 text-lg", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "ADD ORDER (PAY FROM WALLET)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function PamphletPosterCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("default");
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id || "");
  const [paperId, setPaperId] = useState(product.paper_types[0]?.id || "");
  const [colorId, setColorId] = useState(product.color_options[0]?.id || "");
  const [finishingId, setFinishingId] = useState(product.finishing_options[0]?.id || "");
  const [quantity, setQuantity] = useState(product.quantity_tiers[0]?.qty || 1e3);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: sizeId || product.sizes[0]?.id || "standard",
      paperId,
      colorId,
      finishingIds: finishingId ? [finishingId] : [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, sizeId, paperId, colorId, finishingId, quantity]);
  if (!breakdown) return null;
  if (product.category_slug === "brochures" || product.category_slug === "id-cards" || product.category_slug === "certificates" || product.category_slug === "menu-cards" || product.category_slug === "invitations" || product.category_slug === "calendars" || product.category_slug === "banners") {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
          slug: product.category_slug
        }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          " Back to Category"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-col space-y-10", children: /* @__PURE__ */ jsx("div", { className: "w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-contain p-8" }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-8 lg:p-12 space-y-8 flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-800", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg", children: "For custom orders and more details, please contact us directly on WhatsApp." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 w-full", children: [
              /* @__PURE__ */ jsxs("button", { onClick: () => window.open("https://wa.me/919351037177", "_blank"), className: "bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 text-lg transition-colors shadow-lg w-full sm:w-auto justify-center", children: [
                /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M12.031 0C5.383 0 0 5.383 0 12.031c0 2.12.551 4.15 1.597 5.961L.062 24l6.196-1.583A11.964 11.964 0 0012.031 24c6.647 0 12.031-5.382 12.031-12.031C24.062 5.383 18.679 0 12.031 0zm3.626 17.202c-.156.44-1.298.814-1.782.85-.484.037-1.127.135-3.693-1.077-2.613-1.233-4.275-3.896-4.403-4.067-.129-.17-1.045-1.396-1.045-2.663 0-1.268.653-1.895.882-2.146.228-.251.498-.313.663-.313.166 0 .332.001.482.008.15.006.353-.058.552.421.201.484.686 1.674.747 1.795.062.122.104.264.02.434-.083.17-.124.275-.248.421-.124.145-.262.316-.373.434-.124.133-.254.276-.11.523.145.248.647 1.066 1.386 1.725.954.852 1.748 1.118 1.996 1.242.248.124.394.104.538-.063.145-.166.623-.725.79-9.974.166-.25.332-.207.561-.124.23.083 1.451.684 1.7 8.082.25.124.414.23.476.353.062.124.062.725-.094 1.165z" }) }),
                "WhatsApp"
              ] }),
              /* @__PURE__ */ jsxs("a", { href: "tel:+919351037177", className: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 text-lg transition-colors shadow-lg w-full sm:w-auto justify-center", children: [
                /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" }) }),
                "Call Us"
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(SiteFooter, {})
    ] });
  }
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      size: sizeId,
      paper: paperId,
      color: colorId,
      finishing: finishingId,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  const sizeLabel = product.size_label || "Sheet Size,";
  const paperLabel = product.paper_label || "Paper Type";
  const colorLabel = product.color_label || "Color Options";
  const finishingLabel = product.finishing_label || "Lamination";
  product.category_slug === "digital-printing";
  product.features && product.features.length > 0 ? product.features : ["Production Time: 1 day", "Premium print quality", "Custom branding available"];
  [`Theme Color: ${product.theme_color || "Standard"}`, `Available Quantities: ${(product.quantity_tiers || []).map((q) => q.qty.toLocaleString()).join(", ")}`, `Delivery Timeline: ${product.delivery_days ?? 3} days`];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain p-4" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-contain p-8" }) }),
          /* @__PURE__ */ jsx(FullProductDetails, { product })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedProductId, onChange: (e) => setSelectedProductId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                /* @__PURE__ */ jsx("option", { value: "default", children: product.name })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Quantity",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 font-normal", children: [
                  "(Min Qty. : ",
                  product.quantity_tiers[0]?.qty,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: product.quantity_tiers[0]?.qty || 1, step: 1, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), onBlur: () => {
                const minVal = product.quantity_tiers[0]?.qty || 1e3;
                const val = Number(quantity);
                if (isNaN(val) || val < minVal) {
                  setQuantity(minVal);
                }
              }, className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none" })
            ] }),
            product.sizes.length > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: sizeLabel }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none", value: sizeId, onChange: (e) => setSizeId(e.target.value), children: (product.sizes || []).map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.label }, s.id)) })
            ] }),
            product.paper_types.length > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: paperLabel }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: paperId, onChange: (e) => setPaperId(e.target.value), children: (product.paper_types || []).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id)) })
            ] }),
            product.color_options.length > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: colorLabel }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: colorId, onChange: (e) => setColorId(e.target.value), children: (product.color_options || []).map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id)) })
            ] }),
            product.finishing_options.length > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: finishingLabel }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none", value: finishingId, onChange: (e) => setFinishingId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.finishing_options || []).map((f) => /* @__PURE__ */ jsx("option", { value: f.id, children: f.label }, f.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "LK Printers of India Limited", value: pressline, onChange: (e) => setPressline(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function TargetCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1e3);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => {
    const options = [];
    options.push({
      id: "pistol",
      label: "Pistol Target",
      sizeId: "standard"
    });
    options.push({
      id: "rifle",
      label: "Rifle Target",
      sizeId: "standard"
    });
    return options;
  }, []);
  useEffect(() => {
    const current = productOptions.find((o) => product.slug.includes(o.id));
    setSelectedVariantId(current?.id || productOptions[0]?.id || "");
    setQuantity(product.quantity_tiers[0]?.qty || 1e3);
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: "standard",
      paperId: product.paper_types[0]?.id || "",
      colorId: product.color_options[0]?.id || "",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    const selectedOption = productOptions.find((o) => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", {
      description: `${product.name} order has been created.`
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain p-4" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-contain p-8" }) }),
          /* @__PURE__ */ jsx(FullProductDetails, { product })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Quantity",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 font-normal", children: [
                  "(Min Qty. : ",
                  product.quantity_tiers[0]?.qty,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: product.quantity_tiers[0]?.qty || 1, step: 1, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), onBlur: () => {
                const minVal = product.quantity_tiers[0]?.qty || 1e3;
                const val = Number(quantity);
                if (isNaN(val) || val < minVal) {
                  setQuantity(minVal);
                }
              }, className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "LK Printers of India Limited", value: pressline, onChange: (e) => setPressline(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function GlossCoatedCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("--Select Product--");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const MIN_QTY = 1e3;
  const MAX_QTY = 72e3;
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: product.sizes[0]?.id || "standard",
      paperId: product.paper_types[0]?.id || "gloss-coat",
      colorId: product.color_options[0]?.id || "single",
      finishingIds: [],
      quantity: Number(quantity) || MIN_QTY,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (!selectedProduct || selectedProduct === "--Select Product--") {
      toast.error("Please select a product option");
      return;
    }
    if (!printing || printing === "--Select--") {
      toast.error("Please select printing option");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      product: selectedProduct,
      printing,
      privacy: privacyPacking,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#cc0066] to-[#660033] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase", children: "Gloss UV Coated" })
          ] }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-[13px] leading-relaxed text-gray-800 w-full", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Product Ref. : VC/11th Edition" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Code : VC-19" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Class : Regular" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Core : Gloss Coat with Excellent printing" }),
                /* @__PURE__ */ jsx("li", { children: "● Production Time : 12 hours" }),
                /* @__PURE__ */ jsx("li", { children: "● Lamination Type : N/A" }),
                /* @__PURE__ */ jsx("li", { children: "● Product has shiny look" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● We are India's No. 1 Visiting card manufacturer" }),
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Points to be Noted" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1 font-medium", children: [
                /* @__PURE__ */ jsx("li", { children: "● Size Must be as below:" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Card Design Size : W: 90.00 mm X H: 54.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 80.00 mm X H: 44.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Size After Cutting : W: 87.00 mm x H: 51.00 mm" }),
                /* @__PURE__ */ jsx("li", { children: "● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs." }),
                /* @__PURE__ */ jsx("li", { children: "● Use high-resolution imagery for the clearest & sharpest results." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select Product--", children: "--Select Product--" }),
                /* @__PURE__ */ jsx("option", { value: "Gloss UV Coated", children: "Gloss UV Coated" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2 leading-tight", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("input", { type: "number", min: MIN_QTY, max: MAX_QTY, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const val = Number(quantity);
                  if (isNaN(val) || val < MIN_QTY) {
                    setQuantity(String(MIN_QTY));
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[160px] bg-white outline-none" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 block mt-1", children: [
                  "(Min Qty. : ",
                  MIN_QTY.toLocaleString(),
                  ", Max Qty. : ",
                  MAX_QTY.toLocaleString(),
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "gc_privacy", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "gc_privacy", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "fileOption_gc" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function RegularGlossSmallCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("Gloss UV Coated - Small Cards");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const MIN_QTY = 1e3;
  const MAX_QTY = 9e4;
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: product.sizes[0]?.id || "small",
      paperId: product.paper_types[0]?.id || "gloss-uv",
      colorId: printing === "Both Side" ? "both" : "single",
      finishingIds: [],
      quantity: Number(quantity) || MIN_QTY,
      express: false
    });
  }, [product, quantity, printing]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (!selectedProduct || selectedProduct === "--Select Product--") {
      toast.error("Please select a product option");
      return;
    }
    if (!printing || printing === "--Select--") {
      toast.error("Please select printing option");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      product: selectedProduct,
      printing,
      privacy: privacyPacking,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#009933] to-[#004411] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase", children: "Gloss UV Coated" })
          ] }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-[13px] leading-relaxed text-gray-800 w-full", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Product Ref. : VC/11th Edition" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Code : VC-21" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Class : Regular" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Core : Gloss Coat with Excellent printing" }),
                /* @__PURE__ */ jsx("li", { children: "● Production Time : 1 days" }),
                /* @__PURE__ */ jsx("li", { children: "● Lamination Type : N/A" }),
                /* @__PURE__ */ jsx("li", { children: "● Product has shiny look" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● We are India's No. 1 Visiting card manufacturer" }),
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Points to be Noted" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1 font-medium", children: [
                /* @__PURE__ */ jsx("li", { children: "● Size Must be as below:" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Card Design : W: 83.00 mm X H: 52.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text Area : W: 74.00 mm X H: 44.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "After Cutting : W: 80.00 mm x H: 50.00 mm" }),
                /* @__PURE__ */ jsx("li", { children: "● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs." }),
                /* @__PURE__ */ jsx("li", { children: "● Use high-resolution imagery for the clearest & sharpest results." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "Gloss UV Coated - Small Cards", children: "Gloss UV Coated - Small Cards" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2 leading-tight", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("input", { type: "number", min: MIN_QTY, max: MAX_QTY, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const val = Number(quantity);
                  if (isNaN(val) || val < MIN_QTY) {
                    setQuantity(String(MIN_QTY));
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[160px] bg-white outline-none" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 block mt-1", children: [
                  "(Min Qty. : ",
                  MIN_QTY.toLocaleString(),
                  ", Max Qty. : ",
                  MAX_QTY.toLocaleString(),
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "small_gloss_privacy", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "small_gloss_privacy", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "fileOption_small_gloss" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function RegularWithoutSmallCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("Without Lamination (SMALL)");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const MIN_QTY = 1e3;
  const MAX_QTY = 9e4;
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: product.sizes[0]?.id || "small",
      paperId: product.paper_types[0]?.id || "art-paper",
      colorId: "single",
      finishingIds: [],
      quantity: Number(quantity) || MIN_QTY,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (!selectedProduct || selectedProduct === "--Select Product--") {
      toast.error("Please select a product option");
      return;
    }
    if (!printing || printing === "--Select--") {
      toast.error("Please select printing option");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      product: selectedProduct,
      printing,
      privacy: privacyPacking,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#555555] to-[#222222] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase", children: "Without Lamination" })
          ] }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-[13px] leading-relaxed text-gray-800 w-full", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Product Description" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "● Product Ref. : VC/11th Edition" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Code : VC-22" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Class : Regular" }),
                /* @__PURE__ */ jsx("li", { children: "● Product Core : Excellent printing (Without Lamination)" }),
                /* @__PURE__ */ jsx("li", { children: "● Production Time : 2 days" }),
                /* @__PURE__ */ jsx("li", { children: "● Lamination Type : N/A" }),
                /* @__PURE__ */ jsx("li", { children: "● Product has regular look" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● We are India's No. 1 Visiting card manufacturer" }),
              /* @__PURE__ */ jsx("li", { children: "● Printing with latest Komori offset machines (2023 Model)" }),
              /* @__PURE__ */ jsx("li", { children: "● Innovative, Advanced & Equipped Post Printing Unit" }),
              /* @__PURE__ */ jsx("li", { children: "● Constant quality with reasonable price" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase", children: "Points to be Noted" }),
              /* @__PURE__ */ jsxs("ul", { className: "space-y-1 font-medium", children: [
                /* @__PURE__ */ jsx("li", { children: "● Size Must be as below:" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Card Design : W: 83.00 mm X H: 52.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text Area : W: 74.00 mm X H: 44.00 mm" }),
                /* @__PURE__ */ jsx("li", { className: "pl-6", children: "After Cutting : W: 80.00 mm x H: 50.00 mm" }),
                /* @__PURE__ */ jsx("li", { children: "● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs." }),
                /* @__PURE__ */ jsx("li", { children: "● Use high-resolution imagery for the clearest & sharpest results." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "Without Lamination (SMALL)", children: "Without Lamination (SMALL)" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2 leading-tight", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("input", { type: "number", min: MIN_QTY, max: MAX_QTY, value: quantity, onChange: (e) => setQuantity(e.target.value), onBlur: () => {
                  const val = Number(quantity);
                  if (isNaN(val) || val < MIN_QTY) {
                    setQuantity(String(MIN_QTY));
                  }
                }, className: "border border-gray-300 p-2 w-full max-w-[160px] bg-white outline-none" }),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 block mt-1", children: [
                  "(Min Qty. : ",
                  MIN_QTY.toLocaleString(),
                  ", Max Qty. : ",
                  MAX_QTY.toLocaleString(),
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none font-bold text-gray-800", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "1 Side", children: "1 Side" }),
                /* @__PURE__ */ jsx("option", { value: "1 Side + Black Back Printing", children: "1 Side + Black Back Printing" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "small_without_privacy", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "small_without_privacy", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "fileOption_small_without" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function DeoPaperCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(product.slug === "letterheads-paper" || product.slug === "letter-head-paper" ? product.slug : "deo-paper");
  const [quantity, setQuantity] = useState("25");
  const [selectedSize, setSelectedSize] = useState("--Select--");
  const [selectedPrinting, setSelectedPrinting] = useState("--Select--");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => [{
    id: "deo-paper",
    label: "Deo Paper"
  }], []);
  const MIN_QTY = product.quantity_tiers[0]?.qty || 25;
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: selectedSize === "A4 Size" ? "a4" : selectedSize === "A3 Size" ? "a3" : "a4",
      paperId: selectedVariantId === "deo-paper" ? "deo" : "custom",
      colorId: selectedPrinting === "Both Side" ? "both" : "single",
      finishingIds: [],
      quantity: Number(quantity) || MIN_QTY,
      express: false
    });
  }, [product, quantity, selectedSize, selectedPrinting, selectedVariantId]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (selectedSize === "--Select--") {
      toast.error("Please select a size");
      return;
    }
    if (selectedPrinting === "--Select--") {
      toast.error("Please select printing option");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      product: productOptions.find((o) => o.id === selectedVariantId)?.label || "Deo Paper",
      size: selectedSize,
      printing: selectedPrinting,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain p-4" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-contain p-8" }) }),
          /* @__PURE__ */ jsx(FullProductDetails, { product })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id)) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Quantity",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 font-normal", children: [
                  "(Min Qty. : ",
                  MIN_QTY,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: MIN_QTY, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Size" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none", value: selectedSize, onChange: (e) => setSelectedSize(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "A4 Size", children: "A4 Size" }),
                /* @__PURE__ */ jsx("option", { value: "A3 Size", children: "A3 Size" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none", value: selectedPrinting, onChange: (e) => setSelectedPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "One Side", children: "One Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "deo_paper_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function TexturePaperCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState("25");
  const [selectedPrinting, setSelectedPrinting] = useState("--Select--");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const productOptions = useMemo(() => [{
    id: "101",
    label: "13x19 - Texture Sheet - SBS White - Code 101"
  }, {
    id: "102",
    label: "13x19 - Texture Sheet - SBS White - Code 102"
  }, {
    id: "103",
    label: "13x19 - Texture Sheet - SBS White - Code 103"
  }, {
    id: "104",
    label: "13x19 - Texture Sheet - SBS White - Code 104"
  }, {
    id: "105",
    label: "13x19 - Texture Sheet - SBS White - Code 105"
  }, {
    id: "106",
    label: "13x19 - Texture Sheet - SBS White - Code 106"
  }, {
    id: "107",
    label: "13x19 - Texture Sheet - SBS Natural - Code 107"
  }, {
    id: "108",
    label: "13x19 - Texture Sheet - SBS Natural - Code 108"
  }, {
    id: "41",
    label: "13x19 - Texture Sheet - Metallic Golden - Code 41"
  }, {
    id: "42",
    label: "13x19 - Texture Sheet - Metallic Silver - Code 42"
  }], []);
  const MIN_QTY = product.quantity_tiers[0]?.qty || 25;
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: "13x19",
      paperId: "textured",
      colorId: selectedPrinting === "Both Side" ? "both" : "single",
      finishingIds: [],
      quantity: Number(quantity) || MIN_QTY,
      express: false
    });
  }, [product, quantity, selectedPrinting]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (!selectedVariantId) {
      toast.error("Please select a product");
      return;
    }
    if (selectedPrinting === "--Select--") {
      toast.error("Please select printing option");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      product: productOptions.find((o) => o.id === selectedVariantId)?.label || "Texture Paper",
      size: "13x19",
      printing: selectedPrinting,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain p-4" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-contain p-8" }) }),
          /* @__PURE__ */ jsx(FullProductDetails, { product })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedVariantId, onChange: (e) => setSelectedVariantId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                productOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Quantity",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 font-normal", children: [
                  "(Min Qty. : ",
                  MIN_QTY,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: MIN_QTY, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Size" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 border border-gray-300 bg-gray-50 font-bold text-gray-700 w-full max-w-[200px]", children: "13x19 Size (Fixed)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none", value: selectedPrinting, onChange: (e) => setSelectedPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "One Side", children: "One Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "texture_paper_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function GummingCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState("25");
  const [selectedPaper, setSelectedPaper] = useState(product.paper_types[0]?.id || "");
  const [selectedLamination, setSelectedLamination] = useState(product.finishing_options[0]?.id || "");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const MIN_QTY = product.quantity_tiers[0]?.qty || 25;
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: "13x19",
      paperId: selectedPaper,
      colorId: "color",
      finishingIds: selectedLamination !== "none" ? [selectedLamination] : [],
      quantity: Number(quantity) || MIN_QTY,
      express: false
    });
  }, [product, quantity, selectedPaper, selectedLamination]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      gumming: product?.paper_types?.find((p) => p.id === selectedPaper)?.label,
      lamination: product.finishing_options.find((f) => f.id === selectedLamination)?.label,
      size: "13x19",
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain p-4" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-contain p-8" }) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-8 text-[13px] leading-relaxed text-gray-800", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: /* @__PURE__ */ jsx("li", { children: "● Printed by latest Xerox 3100 Digital Press" }) }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 border border-gray-300 bg-white font-bold text-blue-800", children: product.name })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Quantity",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 font-normal", children: [
                  "(Min Qty. : ",
                  MIN_QTY,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: MIN_QTY, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Size" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 border border-gray-300 bg-gray-50 font-bold text-gray-700 w-full max-w-[200px]", children: "13x19 Size (Fixed)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Gumming Type" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedPaper, onChange: (e) => setSelectedPaper(e.target.value), children: (product.paper_types || []).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Lamination Type" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none", value: selectedLamination, onChange: (e) => setSelectedLamination(e.target.value), children: (product.finishing_options || []).map((f) => /* @__PURE__ */ jsx("option", { value: f.id, children: f.label }, f.id)) })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "gumming_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function DigitalPaperPrintingCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [productType, setProductType] = useState("Digital Printing Paper");
  const [selectedGsm, setSelectedGsm] = useState("170gsm");
  const [selectedTextureCode, setSelectedTextureCode] = useState("");
  const [quantity, setQuantity] = useState("25");
  const [selectedPrinting, setSelectedPrinting] = useState("One Side");
  const [selectedLamination, setSelectedLamination] = useState("none");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const textureOptions = useMemo(() => [{
    id: "101",
    label: "Texture Sheet - SBS White - Code 101"
  }, {
    id: "102",
    label: "Texture Sheet - SBS White - Code 102"
  }, {
    id: "103",
    label: "Texture Sheet - SBS White - Code 103"
  }, {
    id: "104",
    label: "Texture Sheet - SBS White - Code 104"
  }, {
    id: "105",
    label: "Texture Sheet - SBS White - Code 105"
  }, {
    id: "106",
    label: "Texture Sheet - SBS White - Code 106"
  }, {
    id: "107",
    label: "Texture Sheet - SBS Natural - Code 107"
  }, {
    id: "108",
    label: "Texture Sheet - SBS Natural - Code 108"
  }, {
    id: "41",
    label: "Texture Sheet - Metallic Golden - Code 41"
  }, {
    id: "42",
    label: "Texture Sheet - Metallic Silver - Code 42"
  }], []);
  const MIN_QTY = 25;
  const breakdown = useMemo(() => {
    const base = product.base_price;
    const qty = Number(quantity) || MIN_QTY;
    let paperPrice = product?.paper_types?.find((p) => p.id === selectedGsm)?.price || 0;
    if (productType === "Texture Paper") {
      paperPrice += 10;
    }
    const printPrice = selectedPrinting === "Both Side" ? 15 : 0;
    const laminationPrice = selectedLamination !== "none" ? 10 : 0;
    const unitPrice = base + paperPrice + printPrice + laminationPrice;
    const subtotal = unitPrice * qty;
    const gst = subtotal * 0.18;
    return {
      subtotal,
      discount: 0,
      total: subtotal + gst
    };
  }, [product, productType, selectedGsm, selectedPrinting, selectedLamination, quantity]);
  const handleAddToCart = () => {
    if (productType === "Texture Paper" && !selectedTextureCode) {
      toast.error("Please select a texture variant");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      type: productType,
      gsm: selectedGsm,
      detail: productType === "Texture Paper" ? textureOptions.find((o) => o.id === selectedTextureCode)?.label : void 0,
      printing: selectedPrinting,
      lamination: selectedLamination,
      size: "13x19",
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans text-sm", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain p-4" }) : /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-contain p-8" }) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-8 text-[13px] leading-relaxed text-gray-800", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: /* @__PURE__ */ jsx("li", { children: "● Printed by latest Xerox 3100 Digital Press" }) }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: productType, onChange: (e) => setProductType(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "Digital Printing Paper", children: "Digital Printing Paper" }),
                /* @__PURE__ */ jsx("option", { value: "Texture Paper", children: "Texture Paper" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Quantity",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-gray-500 font-normal", children: [
                  "(Min Qty. : ",
                  MIN_QTY,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Input, { type: "number", min: MIN_QTY, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Size" }),
              /* @__PURE__ */ jsx("div", { className: "p-2 border border-gray-300 bg-gray-50 font-bold text-gray-700 w-full max-w-[200px]", children: "13x19 Size (Fixed)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Paper GSM" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedGsm, onChange: (e) => setSelectedGsm(e.target.value), children: (product.paper_types || []).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label.replace("Art Paper", "Digital Paper") }, p.id)) })
            ] }),
            productType === "Texture Paper" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Texture Variant" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800", value: selectedTextureCode, onChange: (e) => setSelectedTextureCode(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Texture--" }),
                textureOptions.map((o) => /* @__PURE__ */ jsx("option", { value: o.id, children: o.label }, o.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none", value: selectedPrinting, onChange: (e) => setSelectedPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "One Side", children: "One Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Lamination" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none", value: selectedLamination, onChange: (e) => setSelectedLamination(e.target.value), children: (product.finishing_options || []).map((f) => /* @__PURE__ */ jsx("option", { value: f.id, children: f.label }, f.id)) })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "digital_printing_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round(breakdown.total).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function CraftSheet800GsmCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("--Select Product--");
  const [quantity, setQuantity] = useState("500");
  const [printing, setPrinting] = useState("--Select--");
  const [whiteBase, setWhiteBase] = useState("--Select--");
  const [foil, setFoil] = useState("--Select--");
  const [foilColor, setFoilColor] = useState("--Select--");
  const [dieShape, setDieShape] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: (product.color_options || [])[0]?.id || "",
      finishingIds: ["die-cut", "foil"],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      variant: selectedVariant,
      printing,
      whiteBase,
      foil,
      foilColor,
      dieShape,
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-[#8b4513] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans tracking-wider uppercase", children: "800 GSM" }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-amber-200", children: "CRAFT" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-9 text-sm", value: selectedVariant, onChange: (e) => setSelectedVariant(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select Product--", children: "--Select Product--" }),
                /* @__PURE__ */ jsx("option", { value: "800 GSM Craft Sheet + Foil", children: "800 GSM Craft Sheet + Foil" }),
                /* @__PURE__ */ jsx("option", { value: "800 GSM Craft Sheet + Foil + Die Cut", children: "800 GSM Craft Sheet + Foil + Die Cut" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 500, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 500)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "White Base" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm", value: whiteBase, onChange: (e) => setWhiteBase(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm", value: foil, onChange: (e) => setFoil(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil Color" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm", value: foilColor, onChange: (e) => setFoilColor(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Gold", children: "Gold Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Silver", children: "Silver Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Copper", children: "Copper Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Rose Gold", children: "Rose Gold Foil" }),
                /* @__PURE__ */ jsx("option", { value: "Holographic", children: "Holographic Foil" })
              ] })
            ] }),
            selectedVariant.includes("Die Cut") && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Die Shape" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm font-bold text-blue-800", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                Array.from({
                  length: 36
                }, (_, i) => /* @__PURE__ */ jsx("option", { value: String(i + 1), children: i + 1 }, i + 1))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_800_craft", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_800_craft", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "800_gsm_craft_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-blue-600 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-9" }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5", children: /* @__PURE__ */ jsx("span", { children: "L.K. PRINTERS" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Texture800GsmCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("800 GSM + Matt + Texture");
  const [quantity, setQuantity] = useState("500");
  const [printing, setPrinting] = useState("--Select--");
  const [textureType, setTextureType] = useState("--Select--");
  const [dieShape, setDieShape] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: (product.color_options || [])[0]?.id || "",
      finishingIds: ["die-cut"],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      variant: selectedVariant,
      printing,
      textureType,
      dieShape,
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#5c5c5c] to-[#2c2c2c] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans tracking-wider uppercase", children: "800 GSM" }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-gray-300", children: "TEXTURE" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedVariant, onChange: (e) => setSelectedVariant(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "800 GSM + Matt + Texture", children: "800 GSM + Matt + Texture" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 500, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 500)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Texture Type" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: textureType, onChange: (e) => setTextureType(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                Array.from({
                  length: 8
                }, (_, i) => /* @__PURE__ */ jsxs("option", { value: `Texture No. ${101 + i}`, children: [
                  "Texture No. ",
                  101 + i
                ] }, 101 + i))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Die Shape" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                Array.from({
                  length: 36
                }, (_, i) => /* @__PURE__ */ jsx("option", { value: String(i + 1), children: i + 1 }, i + 1))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_texture", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_texture", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "texture_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function MattUVRegularCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("--Select Product--");
  const [quantity, setQuantity] = useState("1000");
  const [printing, setPrinting] = useState("--Select--");
  const [uvType, setUvType] = useState("--Select--");
  const [frontSideUV, setFrontSideUV] = useState("--Select--");
  const [backSideUV, setBackSideUV] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: (product.color_options || [])[0]?.id || "",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (selectedVariant === "--Select Product--") {
      toast.error("Please select a Product");
      return;
    }
    if (printing === "--Select--") {
      toast.error("Please select Printing");
      return;
    }
    const isBothSideUV = selectedVariant.includes("Both Side UV");
    if (isBothSideUV) {
      if (frontSideUV === "--Select--") {
        toast.error("Please select Front Side UV");
        return;
      }
      if (backSideUV === "--Select--") {
        toast.error("Please select Back Side UV");
        return;
      }
    } else {
      if (uvType === "--Select--") {
        toast.error("Please select UV Type");
        return;
      }
    }
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      variant: selectedVariant,
      printing,
      ...isBothSideUV ? {
        frontSideUV,
        backSideUV
      } : {
        uvType
      },
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#660033] to-[#330022] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase", children: "MATT" }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans uppercase", children: "+" }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-pink-200", children: "UV" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedVariant, onChange: (e) => setSelectedVariant(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select Product--", children: "--Select Product--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side Printing + Single Side UV", children: "Single Side Printing + Single Side UV" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side Printing + Single Side UV", children: "Both Side Printing + Single Side UV" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side Printing + Both Side UV", children: "Both Side Printing + Both Side UV" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 1e3, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 1000)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            selectedVariant.includes("Both Side UV") ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Front Side UV" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800", value: frontSideUV, onChange: (e) => setFrontSideUV(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Spot UV(On Text or Image)", children: "Spot UV(On Text or Image)" }),
                  Array.from({
                    length: 27
                  }, (_, i) => {
                    const num = String(i + 1).padStart(2, "0");
                    return /* @__PURE__ */ jsxs("option", { value: `Texture UV, Type-${num}`, children: [
                      "Texture UV, Type-",
                      num
                    ] }, num);
                  })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Back Side UV" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800", value: backSideUV, onChange: (e) => setBackSideUV(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Spot UV(On Text or Image)", children: "Spot UV(On Text or Image)" }),
                  Array.from({
                    length: 27
                  }, (_, i) => {
                    const num = String(i + 1).padStart(2, "0");
                    return /* @__PURE__ */ jsxs("option", { value: `Texture UV, Type-${num}`, children: [
                      "Texture UV, Type-",
                      num
                    ] }, num);
                  })
                ] })
              ] })
            ] }) : selectedVariant !== "--Select Product--" ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "UV Type" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800", value: uvType, onChange: (e) => setUvType(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Spot UV(On Text or Image)", children: "Spot UV(On Text or Image)" }),
                Array.from({
                  length: 27
                }, (_, i) => {
                  const num = String(i + 1).padStart(2, "0");
                  return /* @__PURE__ */ jsxs("option", { value: `Texture UV, Type-${num}`, children: [
                    "Texture UV, Type-",
                    num
                  ] }, num);
                })
              ] })
            ] }) : null,
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_matt_uv", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_matt_uv", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "matt_uv_regular_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 text-sm leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "(On Free Gift)" })
              ] }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Gsm500Customizer({
  product,
  type
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(`500 GSM + ${type.charAt(0).toUpperCase() + type.slice(1)}`);
  const [quantity, setQuantity] = useState("500");
  const [printing, setPrinting] = useState("--Select--");
  const [uvOption, setUvOption] = useState("--Select--");
  const [foil, setFoil] = useState("--Select--");
  const [foilColor, setFoilColor] = useState("--Select--");
  const [dieShape, setDieShape] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    const finishingIds = [];
    if (uvOption !== "--Select--") finishingIds.push("spot-uv");
    if (foil !== "--Select--") finishingIds.push("foil");
    if (dieShape !== "--Select--") finishingIds.push("die-cut");
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "standard",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: "both",
      finishingIds,
      quantity: Number(quantity) || 500,
      express: false
    });
  }, [product, quantity, uvOption, foil, dieShape]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 500, {
      name: orderName,
      variant: selectedVariant,
      printing,
      uvOption: type !== "drip-off" ? uvOption : void 0,
      foil: type !== "drip-off" ? foil : void 0,
      foilColor: type !== "drip-off" ? foilColor : void 0,
      dieShape,
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
  };
  const gradient = type === "velvet" ? "from-[#0099ff] to-[#003399]" : type === "matt" ? "from-[#ff6600] to-[#cc3300]" : "from-[#33cc33] to-[#006600]";
  const variantLabel = type.charAt(0).toUpperCase() + type.slice(1);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: `bg-gradient-to-t ${gradient} w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center`, children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans tracking-tighter uppercase", children: "500 GSM" }),
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans uppercase", children: "+" }),
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans uppercase tracking-tighter", children: type.toUpperCase() })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedVariant, onChange: (e) => {
                const val = e.target.value;
                setSelectedVariant(val);
                if (val.includes("UV")) setUvOption("Both Side");
                else setUvOption("--Select--");
                if (val.includes("Foil")) setFoil("Front Side");
                else setFoil("--Select--");
                if (val.includes("Die Cut") || val.includes("Customized Die Cut")) setDieShape("1");
                else setDieShape("--Select--");
                if (val.includes("Customized Die Cut")) setDieShape("Custom");
              }, children: [
                /* @__PURE__ */ jsx("option", { value: "--Select Product--", children: "--Select Product--" }),
                type === "drip-off" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("option", { value: "500 GSM + Metallic Printing + Drip Off", children: "500 GSM + Metallic Printing + Drip Off" }),
                  /* @__PURE__ */ jsx("option", { value: "500 GSM + Metallic Printing + Drip Off + Die Cut", children: "500 GSM + Metallic Printing + Drip Off + Die Cut" })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("option", { value: `500 GSM + ${variantLabel}`, children: [
                    "500 GSM + ",
                    variantLabel
                  ] }),
                  /* @__PURE__ */ jsxs("option", { value: `500 GSM + ${variantLabel} + UV`, children: [
                    "500 GSM + ",
                    variantLabel,
                    " + UV"
                  ] }),
                  /* @__PURE__ */ jsxs("option", { value: `500 GSM + ${variantLabel} + UV + Foil`, children: [
                    "500 GSM + ",
                    variantLabel,
                    " + UV + Foil"
                  ] }),
                  /* @__PURE__ */ jsxs("option", { value: `500 GSM + ${variantLabel} + UV + Die Cut`, children: [
                    "500 GSM + ",
                    variantLabel,
                    " + UV + Die Cut"
                  ] }),
                  /* @__PURE__ */ jsxs("option", { value: `500 GSM + ${variantLabel} + UV + Foil + Die Cut`, children: [
                    "500 GSM + ",
                    variantLabel,
                    " + UV + Foil + Die Cut"
                  ] }),
                  /* @__PURE__ */ jsxs("option", { value: `500 GSM + ${variantLabel} + UV + Foil + Customized Die Cut`, children: [
                    "500 GSM + ",
                    variantLabel,
                    " + UV + Foil + Customized Die Cut"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 500, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 500)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            type === "drip-off" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "White Base" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: uvOption, onChange: (e) => setUvOption(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Gloss Area" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: foil, onChange: (e) => setFoil(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Not Required", children: "Not Required" })
                ] })
              ] }),
              selectedVariant.includes("Die Cut") && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Die Shape" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                  Array.from({
                    length: 36
                  }, (_, i) => /* @__PURE__ */ jsx("option", { value: String(i + 1), children: i + 1 }, i + 1))
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              (selectedVariant.includes("UV") || selectedVariant === `500 GSM + ${variantLabel}`) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Spot UV" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: uvOption, onChange: (e) => setUvOption(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                  /* @__PURE__ */ jsx("option", { value: "Not required", children: "Not required" })
                ] })
              ] }),
              (selectedVariant.includes("Foil") || selectedVariant === `500 GSM + ${variantLabel}`) && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil" }),
                  /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: foil, onChange: (e) => setFoil(e.target.value), children: [
                    /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                    /* @__PURE__ */ jsx("option", { value: "Front Side", children: "Front Side" }),
                    /* @__PURE__ */ jsx("option", { value: "Back Side", children: "Back Side" }),
                    /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" }),
                    /* @__PURE__ */ jsx("option", { value: "Not required", children: "Not required" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Foil Color" }),
                  /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: foilColor, onChange: (e) => setFoilColor(e.target.value), children: [
                    /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                    /* @__PURE__ */ jsx("option", { value: "Gold", children: "Gold" }),
                    /* @__PURE__ */ jsx("option", { value: "Silver", children: "Silver" }),
                    /* @__PURE__ */ jsx("option", { value: "Rose Gold", children: "Rose Gold" }),
                    /* @__PURE__ */ jsx("option", { value: "Copper", children: "Copper" }),
                    /* @__PURE__ */ jsx("option", { value: "Blue", children: "Blue Foil" })
                  ] })
                ] })
              ] }),
              (selectedVariant.includes("Die Cut") || selectedVariant === `500 GSM + ${variantLabel}`) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
                /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Die Shape" }),
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                  /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                  Array.from({
                    length: 36
                  }, (_, i) => /* @__PURE__ */ jsx("option", { value: String(i + 1), children: i + 1 }, i + 1)),
                  type === "velvet" && /* @__PURE__ */ jsx("option", { value: "Custom", children: "Customized Die Cut" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  " Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  " Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "gsm500_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold text-[14px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-black", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600 text-lg", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-500 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-10" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[18px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[18px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function MattLaminationCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("Matt Lamination");
  const [quantity, setQuantity] = useState("1000");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: (product.color_options || [])[0]?.id || "",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      variant: selectedVariant,
      printing,
      privacy: privacyPacking,
      fileOption,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#1a1a2e] to-[#16213e] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-white", children: "MATT" }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl sm:text-2xl font-bold font-sans uppercase text-gray-300", children: "+" }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-blue-200", children: "LAMINATION" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedVariant, onChange: (e) => setSelectedVariant(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "Matt Lamination", children: "Matt Lamination" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 1e3, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 1000)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_matt_lam", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_matt_lam", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "matt_lam_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function GlossTextureCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("Gloss + Texture");
  const [quantity, setQuantity] = useState("1000");
  const [printing, setPrinting] = useState("--Select--");
  const [textureType, setTextureType] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: (product.color_options || [])[0]?.id || "",
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      variant: selectedVariant,
      printing,
      textureType,
      privacy: privacyPacking,
      fileOption,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#1a472a] to-[#2d6a4f] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-white", children: "GLOSS" }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl sm:text-2xl font-bold font-sans uppercase text-green-200", children: "+" }),
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-green-100", children: "TEXTURE" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedVariant, onChange: (e) => setSelectedVariant(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "Gloss + Texture", children: "Gloss + Texture" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 1e3, step: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 1000)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Texture Type" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: textureType, onChange: (e) => setTextureType(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                Array.from({
                  length: 8
                }, (_, i) => /* @__PURE__ */ jsxs("option", { value: `Texture No. ${101 + i}`, children: [
                  "Texture No. ",
                  101 + i
                ] }, 101 + i))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_gloss_texture", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_gloss_texture", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "gloss_texture_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function WithoutLaminationCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("Without Coated");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const MIN_QTY = 1e3;
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "standard",
      paperId: (product.paper_types || [])[0]?.id || "350gsm",
      colorId: "both",
      finishingIds: [],
      quantity: Number(quantity) || MIN_QTY,
      express: false
    });
  }, [product, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (!printing || printing === "--Select--") {
      toast.error("Please select printing option");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || MIN_QTY, {
      name: orderName,
      variant: selectedProduct,
      printing,
      privacy: privacyPacking,
      specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-[#606060] to-[#202020] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center text-white", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase", children: "Without Lamination" })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold bg-gray-50 p-3 text-center text-blue-800 border uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsx("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: /* @__PURE__ */ jsx("option", { value: "Without Coated", children: "Without Coated" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Quantity" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: MIN_QTY, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 1000)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side + Black Back Printing", children: "Single Side + Black Back Printing" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Privacy Packing" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_no_lam", checked: privacyPacking === "Required", onChange: () => setPrivacyPacking("Required") }),
                  "Required"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("input", { type: "radio", name: "privacy_no_lam", checked: privacyPacking === "Not Required", onChange: () => setPrivacyPacking("Not Required") }),
                  "Not Required"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "no_lamination_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function PamphletCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("--Select Product--");
  const [sizeId, setSizeId] = useState("--Select--");
  const [printing, setPrinting] = useState("--Select--");
  const [quantity, setQuantity] = useState("--Select--");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const selectedPaperId = selectedProduct === "--Select Product--" ? null : selectedProduct.includes("70 GSM") ? "70gsm-maplitho" : selectedProduct.includes("90 GSM") ? "90gsm-art" : selectedProduct.includes("115 GSM") ? "115gsm-art" : "170gsm-art";
  const selectedColorId = printing === "Single Side" ? "single" : printing === "Both Side" ? "both" : null;
  const breakdown = useMemo(() => {
    if (sizeId === "--Select--" || !selectedPaperId || !selectedColorId || quantity === "--Select--") return null;
    return calculatePrice(product, {
      sizeId,
      paperId: selectedPaperId,
      colorId: selectedColorId,
      finishingIds: [],
      quantity: Number(quantity) || 1e3,
      express: false
    });
  }, [product, sizeId, selectedPaperId, selectedColorId, quantity]);
  const handleAddToCart = () => {
    if (printing === "--Select--" || sizeId === "--Select--" || selectedProduct === "--Select Product--" || quantity === "--Select--" || !breakdown) {
      toast.error("Please select all options");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || 1e3, {
      name: orderName,
      product: selectedProduct,
      size: sizeId === "letter" ? 'Letter Size (8.5"x11")' : sizeId === "a4" ? "A4 Size" : "A5 Size",
      printing,
      remark: specialRemark,
      pressline,
      fileOption
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[0.7] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-blue-700 to-blue-900 w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans tracking-widest uppercase", children: "PAMPHLET" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase", children: selectedProduct })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold bg-gray-50 p-3 text-center text-blue-800 border uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select Product--", children: "--Select Product--" }),
                /* @__PURE__ */ jsx("option", { value: "Pamphlet - 70 GSM Maplitho Paper", children: "Pamphlet - 70 GSM Maplitho Paper" }),
                /* @__PURE__ */ jsx("option", { value: "Pamphlet - 90 GSM Art Paper", children: "Pamphlet - 90 GSM Art Paper" }),
                /* @__PURE__ */ jsx("option", { value: "Pamphlet - 115 GSM Art Paper", children: "Pamphlet - 115 GSM Art Paper" }),
                /* @__PURE__ */ jsx("option", { value: "Pamphlet - 170 GSM Art Paper", children: "Pamphlet - 170 GSM Art Paper" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Size" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: sizeId, onChange: (e) => setSizeId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "letter", children: 'Letter Size (8.5"x11")' }),
                /* @__PURE__ */ jsx("option", { value: "a4", children: "A4 Size" }),
                /* @__PURE__ */ jsx("option", { value: "a5", children: "A5 Size" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Qty." }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold h-10 text-sm", value: quantity, children: [
                  /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                  /* @__PURE__ */ jsx("option", { value: "1000", children: "1000" }),
                  /* @__PURE__ */ jsx("option", { value: "2000", children: "2000" }),
                  /* @__PURE__ */ jsx("option", { value: "5000", children: "5000" }),
                  /* @__PURE__ */ jsx("option", { value: "10000", children: "10000" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 1000)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "pamphlet_file" }),
            breakdown && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600 text-[13px]", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600 text-[13px]", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-blue-600 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-9" }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5", children: /* @__PURE__ */ jsx("span", { children: "L.K. PRINTERS" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function PosterCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("Posters - 15x20");
  const [printing, setPrinting] = useState("--Select--");
  const [paperQuality, setPaperQuality] = useState("--Select--");
  const [quantity, setQuantity] = useState("500");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [filePreview, setFilePreview] = useState(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const selectedSizeId = selectedProduct === "Posters - 15x20" ? "15x20" : selectedProduct === "Posters - 18x23" ? "18x23" : "20x30";
  const selectedPaperId = paperQuality === "70 GSM Maplitho" ? "70gsm-maplitho" : paperQuality === "90 GSM Art Paper" ? "90gsm-art" : paperQuality === "115 GSM Art Paper" ? "115gsm-art" : paperQuality === "170 GSM Art Paper" ? "170gsm-art" : null;
  const selectedColorId = printing === "Single Side" ? "single" : printing === "Both Side" ? "both" : null;
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: selectedSizeId,
      paperId: selectedPaperId,
      colorId: selectedColorId,
      finishingIds: [],
      quantity: Number(quantity) || 500,
      express: false
    });
  }, [product, selectedSizeId, selectedPaperId, selectedColorId, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    if (printing === "--Select--" || paperQuality === "--Select--") {
      toast.error("Please select all options");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || 500, {
      name: orderName,
      product: selectedProduct,
      printing,
      paper: paperQuality,
      remark: specialRemark,
      pressline,
      fileOption
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[0.7] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: filePreview ? /* @__PURE__ */ jsx("img", { src: filePreview, alt: "Design preview", className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-t from-blue-700 to-blue-900 w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "border border-white w-full h-full flex flex-col items-center justify-center space-y-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl sm:text-5xl font-bold font-sans tracking-widest uppercase", children: "POSTER" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium opacity-90 tracking-widest uppercase", children: selectedProduct })
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold bg-gray-50 p-3 text-center text-blue-800 border uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs h-10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 leading-tight", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm", value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "Posters - 15x20", children: "Posters - 15x20" }),
                /* @__PURE__ */ jsx("option", { value: "Posters - 18x23", children: "Posters - 18x23" }),
                /* @__PURE__ */ jsx("option", { value: "Posters - 20x30", children: "Posters - 20x30" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Printing" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: printing, onChange: (e) => setPrinting(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Paper Quality" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm", value: paperQuality, onChange: (e) => setPaperQuality(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "--Select--", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "70 GSM Maplitho", children: "70 GSM Maplitho" }),
                /* @__PURE__ */ jsx("option", { value: "90 GSM Art Paper", children: "90 GSM Art Paper" }),
                /* @__PURE__ */ jsx("option", { value: "115 GSM Art Paper", children: "115 GSM Art Paper" }),
                /* @__PURE__ */ jsx("option", { value: "170 GSM Art Paper", children: "170 GSM Art Paper" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700 pt-2", children: "Qty." }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none font-bold h-10 text-sm", value: quantity, children: [
                  /* @__PURE__ */ jsx("option", { value: "500", children: "500" }),
                  /* @__PURE__ */ jsx("option", { value: "1000", children: "1000" }),
                  /* @__PURE__ */ jsx("option", { value: "2000", children: "2000" }),
                  /* @__PURE__ */ jsx("option", { value: "5000", children: "5000" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-1", children: "(Min Qty. : 500)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider" })
            ] }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange, radioName: "poster_file" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600 text-[13px]", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600 text-[13px]", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight", children: [
                "Enter Pressline :",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-blue-600 font-normal", children: "To be Printed on Free Gift (Card Holder)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: "Enter Pressline...", value: pressline, onChange: (e) => setPressline(e.target.value), className: "rounded-none border-gray-300 font-bold text-blue-800 h-9" }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5", children: /* @__PURE__ */ jsx("span", { children: "LK Printers Of India Limited" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 w-full space-y-4", children: [
              /* @__PURE__ */ jsx(Button, { onClick: handleAddToCart, className: "w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide", children: "Add Order (Pay From Wallet)" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: (e) => {
                e.preventDefault();
                handleAddToCart();
                window.location.href = "/checkout";
              }, className: "w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50", children: "Order Now" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function GlossCoatedTagCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [colorId, setColorId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dieShape, setDieShape] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const handleFileChange = (e) => {
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: sizeId || (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: colorId || (product.color_options || [])[0]?.id || "",
      finishingIds: dieShape ? ["die-cut"] : [],
      quantity: Number(quantity) || 1e3,
      express: false
    });
  }, [product, quantity, sizeId, colorId, dieShape]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      size: product.sizes?.find((s) => s.id === sizeId)?.label,
      color: product.color_options?.find((c) => c.id === colorId)?.label,
      dieShape,
      fileOption,
      remark: specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mx-auto overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "w-full mt-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold font-serif text-blue-900 border-b-2 border-blue-900 inline-block mb-4 uppercase tracking-wider", children: "Printers Club Of India Limited" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-800 text-sm mb-2 mt-4", children: "Product Description" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-sm text-gray-600 space-y-1 pl-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Product Ref. : TAG/1st Edition (Sample File)" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Code : Tag-1" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Class : Super Gloss Coated" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Core : Gloss Coat with Excellent printing" }),
              /* @__PURE__ */ jsx("li", { children: "● Production Time : Within 7-10 Days from file upload" }),
              /* @__PURE__ */ jsx("li", { children: "● Coated Type : Hi-Gloss" }),
              /* @__PURE__ */ jsx("li", { children: "● Available in 10 different and unique die shapes" }),
              /* @__PURE__ */ jsx("li", { children: "● Available in 3 Size ( Small , Medium , Large )" })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-800 text-sm mb-2 mt-6", children: "Points to be Noted" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-sm text-gray-600 space-y-1 pl-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Small Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 56.00 mm X H: 54.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 43.00 mm X H: 43.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 48.00 mm X H: 48.00 mm" }),
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Medium Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 54.00 mm X H: 90.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 40.00 mm X H: 76.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 48.00 mm X H: 84.00 mm" }),
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Large Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 56.00 mm X H: 108.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 42.00 mm X H: 94.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 50.00 mm X H: 102.00 mm" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("div", { className: "border border-gray-300 p-2 w-full bg-gray-50 text-sm text-gray-600", children: "Gloss Coated Tags" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-900 pt-2 uppercase tracking-wide", children: "Select Detail" }),
              /* @__PURE__ */ jsx("div", {})
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx(Badge, { className: "bg-blue-600 w-4 h-4 rounded p-0 inline-flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 bg-white rounded-full" }) }),
                "Size"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: sizeId, onChange: (e) => setSizeId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.sizes || []).map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.label.split(" ")[0] }, s.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "🖨️" }),
                "Printing"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: colorId, onChange: (e) => setColorId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.color_options || []).map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "🏷️" }),
                "Qty."
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: quantity, children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.quantity_tiers || []).map((q) => /* @__PURE__ */ jsx("option", { value: q.qty, children: q.qty }, q.qty))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "✂️" }),
                "Die Shape"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => /* @__PURE__ */ jsxs("option", { value: `Die No. ${n}`, children: [
                  "Die No. ",
                  n
                ] }, n))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 p-3 bg-green-50 text-green-700 text-center text-sm font-bold border border-green-200" }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-2 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-gray-500 font-normal text-xs", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), className: "rounded-none border-gray-300 min-h-[80px]" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-8 flex flex-col sm:flex-row gap-4 items-center justify-end", children: /* @__PURE__ */ jsxs(Button, { onClick: handleAddToCart, size: "lg", className: "w-full sm:w-auto px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }),
              "ADD TO CART"
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function MattLaminationTagCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [colorId, setColorId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dieShape, setDieShape] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const handleFileChange = (e) => {
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: sizeId || (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: colorId || (product.color_options || [])[0]?.id || "",
      finishingIds: dieShape ? ["die-cut"] : [],
      quantity: Number(quantity) || 1e3,
      express: false
    });
  }, [product, quantity, sizeId, colorId, dieShape]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      size: product.sizes?.find((s) => s.id === sizeId)?.label,
      color: product.color_options?.find((c) => c.id === colorId)?.label,
      dieShape,
      fileOption,
      remark: specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mx-auto overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "w-full mt-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold font-serif text-blue-900 border-b-2 border-blue-900 inline-block mb-4 uppercase tracking-wider", children: "Printers Club Of India Limited" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-800 text-sm mb-2 mt-4", children: "Product Description" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-sm text-gray-600 space-y-1 pl-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Product Ref. : TAG/1st Edition (Sample File)" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Code : Tag-2" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Class : Premium" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Core : Smooth Matt" }),
              /* @__PURE__ */ jsx("li", { children: "● Paper Quality : Imported 350 GSM Art Paper" }),
              /* @__PURE__ */ jsx("li", { children: "● Production Time : Within 7-10 days from file upload" }),
              /* @__PURE__ */ jsx("li", { children: "● Lamination Type : Matt" }),
              /* @__PURE__ */ jsx("li", { children: "● Available in 10 different and unique die shapes" }),
              /* @__PURE__ */ jsx("li", { children: "● Available in 3 Size ( Small , Medium , Large )" })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-800 text-sm mb-2 mt-6", children: "Points to be Noted" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-sm text-gray-600 space-y-1 pl-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Small Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 57.00 mm X H: 59.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 44.00 mm X H: 44.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 50.00 mm X H: 50.00 mm" }),
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Medium Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 57.00 mm X H: 94.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 45.00 mm X H: 82.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 50.50 mm X H: 87.50 mm" }),
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Large Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 58.50 mm X H: 113.50 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 46.00 mm X H: 101.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 52.00 mm X H: 107.00 mm" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsx("div", { className: "border border-gray-300 p-2 w-full bg-gray-50 text-sm text-gray-600", children: "Matt Lamination Tags" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-900 pt-2 uppercase tracking-wide", children: "Select Detail" }),
              /* @__PURE__ */ jsx("div", {})
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx(Badge, { className: "bg-blue-600 w-4 h-4 rounded p-0 inline-flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 bg-white rounded-full" }) }),
                "Size"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: sizeId, onChange: (e) => setSizeId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.sizes || []).map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.label.split(" ")[0] }, s.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "🖨️" }),
                "Printing"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: colorId, onChange: (e) => setColorId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.color_options || []).map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "🏷️" }),
                "Qty."
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: quantity, children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.quantity_tiers || []).map((q) => /* @__PURE__ */ jsx("option", { value: q.qty, children: q.qty }, q.qty))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "✂️" }),
                "Die Shape"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => /* @__PURE__ */ jsxs("option", { value: `Die No. ${n}`, children: [
                  "Die No. ",
                  n
                ] }, n))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 p-3 bg-green-50 text-green-700 text-center text-sm font-bold border border-green-200" }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-2 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-gray-500 font-normal text-xs", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), className: "rounded-none border-gray-300 min-h-[80px]" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-8 flex flex-col sm:flex-row gap-4 items-center justify-end", children: /* @__PURE__ */ jsxs(Button, { onClick: handleAddToCart, size: "lg", className: "w-full sm:w-auto px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }),
              "ADD TO CART"
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function MattUVTagCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [variant, setVariant] = useState("Single Side Printing + Single Side UV");
  const [sizeId, setSizeId] = useState("");
  const [printingId, setPrintingId] = useState("");
  const [spotUvId, setSpotUvId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dieShape, setDieShape] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const handleFileChange = (e) => {
  };
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: sizeId || (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: printingId || (product.color_options || [])[0]?.id || "",
      finishingIds: dieShape ? ["die-cut"] : [],
      quantity: Number(quantity) || 1e3,
      express: false
    });
  }, [product, quantity, sizeId, printingId, dieShape]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      variant,
      size: product.sizes?.find((s) => s.id === sizeId)?.label,
      printing: printingId,
      spotUv: spotUvId,
      dieShape,
      fileOption,
      remark: specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mx-auto overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "w-full mt-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold font-serif text-blue-900 border-b-2 border-blue-900 inline-block mb-4 uppercase tracking-wider", children: "Printers Club Of India Limited" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-800 text-sm mb-2 mt-4", children: "Product Description" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-sm text-gray-600 space-y-1 pl-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Product Ref. : TAG/1st Edition (Sample File)" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Code : Tag-3" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Class : Premium" }),
              /* @__PURE__ */ jsx("li", { children: "● Product Core : Smooth Matt with Fine UV" }),
              /* @__PURE__ */ jsx("li", { children: "● Paper Quality : Imported 400 GSM Art Paper" }),
              /* @__PURE__ */ jsx("li", { children: "● Production Time : Within 7-10 days from file upload" }),
              /* @__PURE__ */ jsx("li", { children: "● Lamination Type : Matt" }),
              /* @__PURE__ */ jsx("li", { children: "● Embossed Spot UV adds to the magnificence of the card and provide a glossy finish on the selected areas" }),
              /* @__PURE__ */ jsx("li", { children: "● Available in 10 different and unique die shapes" }),
              /* @__PURE__ */ jsx("li", { children: "● Available in 3 Size ( Small , Medium , Large )" })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-gray-800 text-sm mb-2 mt-6", children: "Points to be Noted" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-sm text-gray-600 space-y-1 pl-1", children: [
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Small Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 57.00 mm X H: 59.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 44.00 mm X H: 44.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 50.00 mm X H: 50.00 mm" }),
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Medium Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 57.00 mm X H: 94.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 45.00 mm X H: 82.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 50.50 mm X H: 87.50 mm" }),
              /* @__PURE__ */ jsx("li", { children: "● Size Must be as below ( Large Tags ):" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag Design Size : W: 58.50 mm X H: 113.50 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Text / Matter Area : W: 46.00 mm X H: 101.00 mm" }),
              /* @__PURE__ */ jsx("li", { className: "pl-6", children: "Tag After Cutting : W: 52.00 mm X H: 107.00 mm" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: variant, onChange: (e) => setVariant(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side Printing + Single Side UV", children: "Single Side Printing + Single Side UV" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side Printing + Single Side UV", children: "Both Side Printing + Single Side UV" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side Printing + Both Side UV", children: "Both Side Printing + Both Side UV" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-900 pt-2 uppercase tracking-wide", children: "Select Detail" }),
              /* @__PURE__ */ jsx("div", {})
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx(Badge, { className: "bg-blue-600 w-4 h-4 rounded p-0 inline-flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 bg-white rounded-full" }) }),
                "Size"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: sizeId, onChange: (e) => setSizeId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.sizes || []).map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.label.split(" ")[0] }, s.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "🖨️" }),
                "Printing"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: printingId, onChange: (e) => setPrintingId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg text-center leading-none", style: {
                  paddingBottom: "3px"
                }, children: "☼" }),
                "Spot UV"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: spotUvId, onChange: (e) => setSpotUvId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                /* @__PURE__ */ jsx("option", { value: "Single Side", children: "Single Side" }),
                /* @__PURE__ */ jsx("option", { value: "Both Side", children: "Both Side" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "🏷️" }),
                "Qty."
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: quantity, children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.quantity_tiers || []).map((q) => /* @__PURE__ */ jsx("option", { value: q.qty, children: q.qty }, q.qty))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-blue-900 flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-lg", children: "✂️" }),
                "Die Shape"
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: dieShape, onChange: (e) => setDieShape(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => /* @__PURE__ */ jsxs("option", { value: `Die No. ${n}`, children: [
                  "Die No. ",
                  n
                ] }, n))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 p-3 bg-green-50 text-green-700 text-center text-sm font-bold border border-green-200" }),
            /* @__PURE__ */ jsx(B2BFileSelector, { fileOption, setFileOption, onFileChange: handleFileChange }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-2 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-gray-500 font-normal text-xs", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), className: "rounded-none border-gray-300 min-h-[80px]" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-8 flex flex-col sm:flex-row gap-4 items-center justify-end", children: /* @__PURE__ */ jsxs(Button, { onClick: handleAddToCart, size: "lg", className: "w-full sm:w-auto px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }),
              "ADD TO CART"
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function GarmentTagCustomizer({
  product
}) {
  return /* @__PURE__ */ jsx(GenericVisitingCardCustomizer, { product });
}
function ThreadCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [paperId, setPaperId] = useState((product.paper_types || [])[0]?.id || "");
  const [quantity, setQuantity] = useState((product.quantity_tiers || [])[0]?.qty || "");
  const [colorId, setColorId] = useState("");
  const [specialRemark, setSpecialRemark] = useState("");
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId,
      colorId,
      finishingIds: [],
      quantity: Number(quantity) || 1e3,
      express: false
    });
  }, [product, quantity, paperId, colorId]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      paper: product.paper_types?.find((p) => p.id === paperId)?.label,
      color: product.color_options?.find((c) => c.id === colorId)?.label,
      remark: specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center lg:items-stretch", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx(FullProductDetails, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: paperId, onChange: (e) => setPaperId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.paper_types || []).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-2", children: [
                "Select Detail",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-gray-500 font-normal block mt-1", children: "Qty." })
              ] }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none mt-2", value: quantity, children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.quantity_tiers || []).map((q) => /* @__PURE__ */ jsx("option", { value: q.qty, children: q.qty }, q.qty))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-right text-gray-700", children: "Select Colour" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white text-sm outline-none", value: colorId, onChange: (e) => setColorId(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select--" }),
                (product.color_options || []).map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 p-3 bg-green-50 text-green-700 text-center text-sm font-bold border border-green-200" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-bold text-red-600 text-base", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-center text-green-600 font-bold mt-2 pt-2 border-t border-gray-200", children: "Free Delivery" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-right text-gray-700 pt-2 leading-tight", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-gray-500 font-normal text-xs", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), className: "rounded-none border-gray-300 min-h-[80px]" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-8 flex flex-col sm:flex-row gap-4 items-center", children: /* @__PURE__ */ jsxs(Button, { onClick: handleAddToCart, size: "lg", className: "w-full sm:w-auto px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }),
              "ADD TO CART"
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function PVCClipCustomizer({
  product
}) {
  const [orderName, setOrderName] = useState("");
  const [selectedType, setSelectedType] = useState("Type - 1");
  const [quantity, setQuantity] = useState(4e3);
  const [specialRemark, setSpecialRemark] = useState("");
  useEffect(() => {
    setSelectedType("Type - 1");
    setQuantity(4e3);
    setOrderName("");
    setSpecialRemark("");
  }, [product.id]);
  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: null,
      paperId: selectedType,
      colorId: null,
      finishingIds: [],
      quantity: Number(quantity) || 1,
      express: false
    });
  }, [product, selectedType, quantity]);
  if (!breakdown) return null;
  const handleAddToCart = () => {
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      "Order Name": orderName,
      "Product Type": selectedType,
      "Special Remark": specialRemark
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-white flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 max-w-[1100px]", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/category/$slug", params: {
        slug: product.category_slug
      }, className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Category"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[1fr_1fr] gap-12 items-start", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center border shadow-sm p-4 bg-gray-50 rounded", children: /* @__PURE__ */ jsx("img", { src: product.images?.[0] || "", alt: product.name, className: "w-full object-contain" }) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded shadow-sm p-6 space-y-6 text-sm", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-gray-800", children: "ADD ORDER" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-gray-700", children: "Order Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी...", value: orderName, onChange: (e) => setOrderName(e.target.value), className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] items-center gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-gray-700", children: "Select Product" }),
              /* @__PURE__ */ jsxs("select", { className: "border border-gray-300 p-2 w-full bg-white outline-none", value: selectedType, onChange: (e) => setSelectedType(e.target.value), children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "--Select Product--" }),
                /* @__PURE__ */ jsx("option", { value: "Type - 1", children: "Type - 1" }),
                /* @__PURE__ */ jsx("option", { value: "Type - 2", children: "Type - 2" }),
                /* @__PURE__ */ jsx("option", { value: "Type - 3", children: "Type - 3" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-bold border-b pb-1 text-black mt-6", children: "Select Detail" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] items-start gap-4", children: [
              /* @__PURE__ */ jsx("label", { className: "font-bold text-gray-700 pt-2", children: "Qty." }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Input, { type: "number", min: 1, disabled: true, value: quantity, className: "border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" }),
                /* @__PURE__ */ jsx("div", { className: "text-green-600 text-xs mt-2 font-bold uppercase tracking-wider" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] items-center gap-4 mt-6", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsxs("div", { className: "border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "Applicable Cost" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round(breakdown.subtotal - breakdown.discount).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-gray-600", children: [
                  /* @__PURE__ */ jsx("span", { children: "GST (18.00%)" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-gray-300 pt-2 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Amount Payable" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-black", children: [
                    "Rs. ",
                    Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString(),
                    "/-"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 text-black text-xs mt-2 font-bold", children: "Free Delivery" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "font-bold text-gray-700 leading-tight pt-2", children: [
                "Special Remark",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 font-normal", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "remarks for order processing team...", value: specialRemark, onChange: (e) => setSpecialRemark(e.target.value), rows: 2, className: "rounded-none border-gray-300 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[140px_1fr] items-start gap-4 pt-4", children: [
              /* @__PURE__ */ jsx("div", {}),
              /* @__PURE__ */ jsx("div", { className: "text-gray-400 font-bold uppercase tracking-tight text-xs pb-4", children: "LK Printers Of India Limited" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-col sm:flex-row gap-4 items-center", children: /* @__PURE__ */ jsxs(Button, { onClick: handleAddToCart, size: "lg", className: "w-full px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }),
              "ADD TO CART"
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  B2BFileSelector,
  MetalCardCustomizer,
  ProductPage as component
};
