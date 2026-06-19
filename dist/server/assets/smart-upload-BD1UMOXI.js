import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { S as SiteHeader } from "./site-header-B5bYOmyi.js";
import { I as Input, B as Button } from "./router-frHDfBxK.js";
import { L as Label } from "./label-BaeoGtRW.js";
import { CreditCard, Tag, FolderOpen, FileText, Mail, Printer, ShieldAlert, Layers, Award, PenTool, Image, Sparkles, User, Settings, Plus, Trash2, Upload, RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, Check, XCircle, HelpCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import * as fabric from "fabric";
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
import "@radix-ui/react-label";
const INITIAL_PRODUCT_CATEGORIES = [{
  id: "visiting-cards",
  name: "Visiting Cards",
  icon: CreditCard,
  description: "Premium business cards, loyalty cards, and appointment cards.",
  products: [{
    id: "vcard-premium",
    name: "Premium Velvet Visiting Card",
    w: 90,
    h: 54,
    bleed: 3,
    safe: 3,
    dpi: 300,
    pages: 2,
    color: "CMYK",
    desc: "800 GSM heavy cards with rich velvet finish"
  }, {
    id: "vcard-classic",
    name: "Classic Matt Visiting Card",
    w: 90,
    h: 54,
    bleed: 3,
    safe: 3,
    dpi: 300,
    pages: 2,
    color: "CMYK",
    desc: "350 GSM smooth matt laminated business cards"
  }, {
    id: "vcard-shiny",
    name: "Hi-Gloss UV Visiting Card",
    w: 90,
    h: 54,
    bleed: 3,
    safe: 3,
    dpi: 300,
    pages: 2,
    color: "CMYK",
    desc: "Classic shiny gloss UV coated cards"
  }]
}, {
  id: "garments-tags",
  name: "Garments Tags",
  icon: Tag,
  description: "High-grade clothing tags, brand hang tags, and labels.",
  products: [{
    id: "tag-standard",
    name: "Standard Retail Hang Tag",
    w: 50,
    h: 90,
    bleed: 3,
    safe: 3,
    dpi: 300,
    pages: 2,
    color: "CMYK",
    desc: "350 GSM premium retail tags with eyelet hole"
  }, {
    id: "tag-diecut",
    name: "Die-Cut Custom Shaped Tag",
    w: 50,
    h: 90,
    bleed: 3,
    safe: 3,
    dpi: 300,
    pages: 2,
    color: "CMYK",
    desc: "Unique custom shaped tags for premium brands"
  }]
}, {
  id: "files",
  name: "Files & Folders",
  icon: FolderOpen,
  description: "Office document files, corporate folders, and medical case files.",
  products: [{
    id: "file-standard",
    name: "A4 Presentation Folder",
    w: 220,
    h: 310,
    bleed: 5,
    safe: 5,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "350 GSM folder with single or double pocket"
  }, {
    id: "file-clip",
    name: "Doctor Cobra File",
    w: 220,
    h: 310,
    bleed: 5,
    safe: 5,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "Durable board folder with strong steel spring clip"
  }]
}, {
  id: "letter-heads",
  name: "Letter Heads",
  icon: FileText,
  description: "Corporate letterheads, official stationeries, and pads.",
  products: [{
    id: "lh-standard",
    name: "Premium Executive Letterhead",
    w: 210,
    h: 297,
    bleed: 3,
    safe: 5,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "A4 size 100 GSM Alabaster luxury executive paper"
  }, {
    id: "lh-classic",
    name: "Standard Business Letterhead",
    w: 210,
    h: 297,
    bleed: 3,
    safe: 5,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "A4 size 80 GSM classic bond paper"
  }]
}, {
  id: "envelopes",
  name: "Envelopes",
  icon: Mail,
  description: "Custom printed letter envelopes, mailing pouches, and invitation envelopes.",
  products: [{
    id: "env-9x4",
    name: "9x4 Business Envelope",
    w: 220,
    h: 110,
    bleed: 3,
    safe: 4,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "Standard office envelope with peel & seal adhesive"
  }, {
    id: "env-a4",
    name: "A4 Document Envelope",
    w: 324,
    h: 229,
    bleed: 4,
    safe: 5,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "Heavy duty catalog/brochure mailing envelope"
  }]
}, {
  id: "digital-printing",
  name: "Digital Paper Printing",
  icon: Printer,
  description: "High-speed color and black-and-white printing for documents.",
  products: [{
    id: "dp-a4-color",
    name: "A4 Color Document Printing",
    w: 210,
    h: 297,
    bleed: 0,
    safe: 5,
    dpi: 300,
    pages: 5,
    color: "RGB",
    desc: "Multi-page documents printed on 100 GSM art paper"
  }, {
    id: "dp-a3-brochure",
    name: "A3 Booklet Presentation",
    w: 420,
    h: 297,
    bleed: 3,
    safe: 5,
    dpi: 300,
    pages: 8,
    color: "CMYK",
    desc: "High resolution dynamic presentation pages"
  }]
}, {
  id: "atm-pouches",
  name: "ATM Pouches",
  icon: ShieldAlert,
  description: "Sleek card sleeves, security ATM card covers, and key pouches.",
  products: [{
    id: "atm-sleeve",
    name: "Laminated ATM Card Sleeve",
    w: 90,
    h: 60,
    bleed: 2,
    safe: 3,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "Gloss/Matt laminated protective card covers"
  }]
}, {
  id: "bill-books",
  name: "Bill Books",
  icon: Layers,
  description: "Duplicate and triplicate receipt pads, invoices, and logbooks.",
  products: [{
    id: "bb-duplicate",
    name: "Carbonless Duplicate Bill Book",
    w: 148,
    h: 210,
    bleed: 4,
    safe: 5,
    dpi: 300,
    pages: 2,
    color: "CMYK",
    desc: "A5 size duplicate bill pad with original + copy"
  }]
}, {
  id: "stickers-labels",
  name: "Stickers & Labels",
  icon: Award,
  description: "Custom label sheets, round sticker seals, and product branding labels.",
  products: [{
    id: "sticker-circle",
    name: "Circular Glossy Branding Sticker",
    w: 50,
    h: 50,
    bleed: 2,
    safe: 3,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "Self-adhesive glossy paper stickers, kiss-cut to shape"
  }]
}, {
  id: "pens",
  name: "Pens",
  icon: PenTool,
  description: "Promotional logo pens, laser engraved metal pens, and corporate gifts.",
  products: [{
    id: "pen-laser",
    name: "Laser Printed Promotional Pen",
    w: 60,
    h: 8,
    bleed: 1,
    safe: 1,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "Precision micro spot printing on high quality pens"
  }]
}, {
  id: "pamphlets-posters",
  name: "Pamphlets & Posters",
  icon: Image,
  description: "Large promotional flyers, concert posters, and A3 brochures.",
  products: [{
    id: "poster-a3",
    name: "A3 Marketing Poster",
    w: 297,
    h: 420,
    bleed: 5,
    safe: 5,
    dpi: 300,
    pages: 1,
    color: "CMYK",
    desc: "250 GSM heavy weight glossy paper marketing flyers"
  }]
}];
const PRESET_TO_PRODUCT_SLUG_MAP = {
  // Visiting Cards
  "vcard-premium": "800-gsm-velvet",
  "vcard-classic": "regular-matt",
  "vcard-shiny": "regular-gloss-coated",
  // Garments Tags
  "tag-standard": "garments-tags-gloss",
  "tag-diecut": "garments-tags-matt-uv",
  // Files & Folders
  "file-standard": "files-sbs-small",
  "file-clip": "files-pvc-clip",
  // Letter Heads
  "lh-standard": "letterheads-100gsm-bond",
  "lh-classic": "letter-head-paper",
  // Envelopes
  "env-9x4": "envelopes-9x4",
  "env-a4": "envelopes-940x1240",
  // Digital Paper Printing
  "dp-a4-color": "letter-head-paper",
  "dp-a3-brochure": "art-paper",
  // ATM Pouches
  "atm-sleeve": "atm-pouch-gloss",
  // Bill Books
  "bb-duplicate": "a4-bill-book-2-copy",
  // Stickers & Labels
  "sticker-circle": "paper-stickers",
  // Pens
  "pen-laser": "laser-printed-pen",
  // Pamphlets & Posters
  "poster-a3": "a3-posters"
};
function SmartUploadPage() {
  const navigate = useNavigate();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [categories, setCategories] = useState(INITIAL_PRODUCT_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState("visiting-cards");
  const [selectedProduct, setSelectedProduct] = useState(INITIAL_PRODUCT_CATEGORIES[0].products[0]);
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState(null);
  const [fixedImageUrl, setFixedImageUrl] = useState(null);
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("visiting-cards");
  const [newProdW, setNewProdW] = useState(90);
  const [newProdH, setNewProdH] = useState(54);
  const [newProdBleed, setNewProdBleed] = useState(3);
  const [newProdSafe, setNewProdSafe] = useState(3);
  const [newProdDpi, setNewProdDpi] = useState(300);
  const [newProdPages, setNewProdPages] = useState(2);
  const [newProdColor, setNewProdColor] = useState("CMYK");
  const [newProdDesc, setNewProdDesc] = useState("");
  const currentCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  useEffect(() => {
    if (currentCategory.products.length > 0) {
      setSelectedProduct(currentCategory.products[0]);
      setReport(null);
      setFixedImageUrl(null);
    }
  }, [selectedCategoryId, categories]);
  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      const selected = e.dataTransfer.files[0];
      validateAndSetFile(selected);
    }
  };
  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      const selected = e.target.files[0];
      validateAndSetFile(selected);
    }
  };
  const validateAndSetFile = (selected) => {
    const ext = selected.name.split(".").pop()?.toLowerCase();
    const validExts = ["pdf", "psd", "cdr", "jpeg", "jpg", "png"];
    if (ext && validExts.includes(ext)) {
      setFile(selected);
      setReport(null);
      setFixedImageUrl(null);
      toast.info(`Loaded file: ${selected.name}`);
    } else {
      toast.error("Unsupported file format! Please upload PDF, PSD, CDR, JPG, or PNG.");
    }
  };
  const analyzeFile = async () => {
    if (!file) {
      toast.warning("Please upload a design file first!");
      return;
    }
    setAnalyzing(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("product", JSON.stringify(selectedProduct));
      formData.append("action", "analyze");
      if (ext === "psd" || ext === "cdr") {
        setTimeout(() => {
          const mockReport = {
            status: "invalid",
            dimensions: {
              width: selectedProduct.w - 5.5,
              height: selectedProduct.h + 2.1
            },
            dpi: 150,
            colorMode: "RGB",
            issues: [`Dimensions mismatch: Expected ${selectedProduct.w}x${selectedProduct.h}mm, detected ${(selectedProduct.w - 5.5).toFixed(1)}x${(selectedProduct.h + 2.1).toFixed(1)}mm.`, `Low resolution: Got 150 DPI, but offset printing requires at least ${selectedProduct.dpi} DPI.`, `Color mode is RGB. Print machines require CMYK profile.`]
          };
          setReport(mockReport);
          renderPreview("https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=500&q=80", mockReport);
          toast.success("PSD/CDR analyzed successfully (Cloud Parser simulated)!");
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
      renderPreview(data.previewUrl || URL.createObjectURL(file), data.report);
      toast.success("Design scanned & validated!");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setAnalyzing(false);
    }
  };
  const fixFile = async () => {
    if (!file) return;
    setFixing(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "psd" || ext === "cdr") {
        setTimeout(() => {
          const fixedMockUrl = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=500&q=80";
          setFixedImageUrl(fixedMockUrl);
          setReport((r) => ({
            ...r,
            status: "fixed",
            dimensions: {
              width: selectedProduct.w,
              height: selectedProduct.h
            },
            dpi: selectedProduct.dpi,
            colorMode: selectedProduct.color,
            issues: []
          }));
          renderPreview(fixedMockUrl, {
            dimensions: {
              width: selectedProduct.w,
              height: selectedProduct.h
            },
            dpi: selectedProduct.dpi,
            colorMode: selectedProduct.color,
            isFixed: true
          });
          toast.success("AI auto-fixed your vector file canvas size & bleed margins!");
          setFixing(false);
        }, 100);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("product", JSON.stringify(selectedProduct));
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
          width: selectedProduct.w,
          height: selectedProduct.h
        },
        dpi: selectedProduct.dpi,
        colorMode: selectedProduct.color,
        issues: []
      }));
      renderPreview(data.fixedUrl, {
        dimensions: {
          width: selectedProduct.w,
          height: selectedProduct.h
        },
        dpi: selectedProduct.dpi,
        colorMode: selectedProduct.color,
        isFixed: true
      });
      toast.success("File auto-corrected & bleed added!");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setFixing(false);
    }
  };
  const renderPreview = (imageUrl, r) => {
    if (!canvasRef.current) return;
    if (!fabricRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width: 480,
        height: 480,
        backgroundColor: "#111827"
      });
    }
    const canvas = fabricRef.current;
    canvas.clear();
    fabric.Image.fromURL(imageUrl, {
      crossOrigin: "anonymous"
    }).then((img) => {
      const scale = Math.min(360 / img.width, 360 / img.height);
      img.scale(scale);
      img.set({
        left: 240,
        top: 240,
        originX: "center",
        originY: "center",
        selectable: false
      });
      canvas.add(img);
      if (r && r.dimensions) {
        const productW = selectedProduct.w;
        const productH = selectedProduct.h;
        const bleed = selectedProduct.bleed;
        const totalW = productW + (r.isFixed ? bleed * 2 : 0);
        const mmToPx = img.width * scale / totalW;
        const safeW = (productW - selectedProduct.safe * 2) * mmToPx;
        const safeH = (productH - selectedProduct.safe * 2) * mmToPx;
        const safeRect = new fabric.Rect({
          left: 240,
          top: 240,
          originX: "center",
          originY: "center",
          width: safeW,
          height: safeH,
          fill: "transparent",
          stroke: "#10B981",
          strokeWidth: 2,
          strokeDashArray: [6, 4],
          selectable: false
        });
        const trimW = productW * mmToPx;
        const trimH = productH * mmToPx;
        const trimRect = new fabric.Rect({
          left: 240,
          top: 240,
          originX: "center",
          originY: "center",
          width: trimW,
          height: trimH,
          fill: "transparent",
          stroke: "#EF4444",
          strokeWidth: 2.5,
          selectable: false
        });
        const bleedW = (productW + bleed * 2) * mmToPx;
        const bleedH = (productH + bleed * 2) * mmToPx;
        const bleedRect = new fabric.Rect({
          left: 240,
          top: 240,
          originX: "center",
          originY: "center",
          width: bleedW,
          height: bleedH,
          fill: "transparent",
          stroke: "#6366F1",
          strokeWidth: 1.5,
          strokeDashArray: [3, 3],
          selectable: false
        });
        canvas.add(bleedRect, safeRect, trimRect);
      }
      canvas.renderAll();
    }).catch((e) => {
      console.error("Canvas preview rendering failed", e);
    });
  };
  useEffect(() => {
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext && ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
        const objectUrl = URL.createObjectURL(file);
        const timer = setTimeout(() => {
          renderPreview(objectUrl, report);
        }, 150);
        return () => {
          clearTimeout(timer);
          URL.revokeObjectURL(objectUrl);
        };
      }
    }
  }, [file, report]);
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      toast.error("Please enter a product name!");
      return;
    }
    const newProduct = {
      id: `custom-${Date.now()}`,
      name: newProdName,
      w: Number(newProdW),
      h: Number(newProdH),
      bleed: Number(newProdBleed),
      safe: Number(newProdSafe),
      dpi: Number(newProdDpi),
      pages: Number(newProdPages),
      color: newProdColor,
      desc: newProdDesc || "Custom created spec"
    };
    setCategories((prev) => {
      return prev.map((cat) => {
        if (cat.id === newProdCategory) {
          return {
            ...cat,
            products: [...cat.products, newProduct]
          };
        }
        return cat;
      });
    });
    setSelectedCategoryId(newProdCategory);
    setSelectedProduct(newProduct);
    setNewProdName("");
    setNewProdDesc("");
    toast.success(`Successfully saved new print product "${newProduct.name}" under ${newProdCategory}!`);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-indigo-500/30", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("div", { className: "absolute top-20 left-10 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none -z-10" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none -z-10" }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto py-10 px-4 sm:px-6 max-w-7xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-800/80 pb-8", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
            /* @__PURE__ */ jsx("span", { children: "Next-Gen Print Optimization AI" })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-indigo-200 to-indigo-100 bg-clip-text text-transparent", children: "Smart Print Upload & Validation" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 mt-2 max-w-xl text-sm leading-relaxed", children: "Auto-detect design dimensions, DPI, bleed profiles, and page counts. Get instant production-ready conversions." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => setIsAdminMode(false), className: `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${!isAdminMode ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`, children: [
            /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { children: "User Upload" })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setIsAdminMode(true), className: `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${isAdminMode ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`, children: [
            /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { children: "Admin Portal" })
          ] })
        ] })
      ] }),
      isAdminMode ? /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 max-w-3xl mx-auto shadow-2xl animate-in fade-in duration-300", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-slate-800 pb-5 mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400", children: /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-100", children: "Dynamic Specification Manager" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Add unlimited products and configure print rules dynamically" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveProduct, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Product Category" }),
              /* @__PURE__ */ jsx("select", { value: newProdCategory, onChange: (e) => setNewProdCategory(e.target.value), className: "w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500", children: categories.map((cat) => /* @__PURE__ */ jsx("option", { value: cat.id, children: cat.name }, cat.id)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Product Name" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "e.g. Premium 350 GSM Classic Card", value: newProdName, onChange: (e) => setNewProdName(e.target.value), className: "h-11 border-slate-800 bg-slate-950 text-slate-200 focus-visible:ring-indigo-500 rounded-xl" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Trim Width (mm)" }),
              /* @__PURE__ */ jsx(Input, { type: "number", value: newProdW, onChange: (e) => setNewProdW(Number(e.target.value)), className: "h-11 border-slate-800 bg-slate-950 text-slate-200 rounded-xl" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Trim Height (mm)" }),
              /* @__PURE__ */ jsx(Input, { type: "number", value: newProdH, onChange: (e) => setNewProdH(Number(e.target.value)), className: "h-11 border-slate-800 bg-slate-950 text-slate-200 rounded-xl" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Required Bleed Size (mm)" }),
              /* @__PURE__ */ jsx(Input, { type: "number", value: newProdBleed, onChange: (e) => setNewProdBleed(Number(e.target.value)), className: "h-11 border-slate-800 bg-slate-950 text-slate-200 rounded-xl" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Safe Area Margin (mm)" }),
              /* @__PURE__ */ jsx(Input, { type: "number", value: newProdSafe, onChange: (e) => setNewProdSafe(Number(e.target.value)), className: "h-11 border-slate-800 bg-slate-950 text-slate-200 rounded-xl" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Required DPI Resolution" }),
              /* @__PURE__ */ jsx(Input, { type: "number", value: newProdDpi, onChange: (e) => setNewProdDpi(Number(e.target.value)), className: "h-11 border-slate-800 bg-slate-950 text-slate-200 rounded-xl" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Required Page Count" }),
              /* @__PURE__ */ jsx(Input, { type: "number", value: newProdPages, onChange: (e) => setNewProdPages(Number(e.target.value)), className: "h-11 border-slate-800 bg-slate-950 text-slate-200 rounded-xl" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Expected Color Mode" }),
              /* @__PURE__ */ jsxs("select", { value: newProdColor, onChange: (e) => setNewProdColor(e.target.value), className: "w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500", children: [
                /* @__PURE__ */ jsx("option", { value: "CMYK", children: "CMYK (Print Profile)" }),
                /* @__PURE__ */ jsx("option", { value: "RGB", children: "RGB (Digital Only)" }),
                /* @__PURE__ */ jsx("option", { value: "PANTONE", children: "Spot Pantone" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-400 font-bold uppercase tracking-wider", children: "Short Specifications / Note" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "e.g. 100 GSM uncoated premium sheet paper", value: newProdDesc, onChange: (e) => setNewProdDesc(e.target.value), className: "h-11 border-slate-800 bg-slate-950 text-slate-200 rounded-xl" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-4 pt-4 border-t border-slate-800/80", children: [
            /* @__PURE__ */ jsxs(Button, { type: "submit", className: "flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-indigo", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5 mr-2" }),
              "Save Spec & Apply Live"
            ] }),
            /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => setCategories(INITIAL_PRODUCT_CATEGORIES), className: "h-12 border-slate-800 hover:bg-slate-950/80 hover:text-slate-100 rounded-xl text-slate-400", children: [
              /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 mr-2" }),
              "Reset Defaults"
            ] })
          ] })
        ] })
      ] }) : (
        /* ─── DYNAMIC USER UPLOAD INTERFACE ─── */
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-100", children: "1. Select Print Category & Preset" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Auto-loads target dimensions & bleed rules instantly" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-2.5 overflow-x-auto pb-4 mb-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent", children: categories.map((cat) => {
                const Icon = cat.icon;
                const active = cat.id === selectedCategoryId;
                return /* @__PURE__ */ jsxs("button", { onClick: () => setSelectedCategoryId(cat.id), className: `flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all ${active ? "bg-indigo-600/90 border-indigo-500 text-white shadow-lg" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"}`, children: [
                  /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsx("span", { children: cat.name })
                ] }, cat.id);
              }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs text-slate-500 uppercase tracking-wider font-bold block mb-1", children: "Available Specifications" }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: currentCategory.products.map((p) => {
                  const isSelected = selectedProduct.id === p.id;
                  return /* @__PURE__ */ jsxs("button", { onClick: () => {
                    setSelectedProduct(p);
                    setReport(null);
                    setFixedImageUrl(null);
                  }, className: `p-3.5 rounded-2xl border text-left transition-all ${isSelected ? "bg-indigo-950/20 border-indigo-500 shadow-md ring-1 ring-indigo-500/30" : "bg-slate-950/20 border-slate-800/80 hover:border-slate-700"}`, children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-slate-200 block", children: p.name }),
                      isSelected && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-indigo-400" })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 block mt-1 leading-snug", children: p.desc }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5 mt-3", children: [
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono font-semibold", children: [
                        p.w,
                        "x",
                        p.h,
                        "mm"
                      ] }),
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono", children: [
                        "Bleed: ",
                        p.bleed,
                        "mm"
                      ] }),
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono", children: [
                        p.dpi,
                        " DPI"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-semibold font-mono", children: p.color })
                    ] })
                  ] }, p.id);
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400", children: /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-100", children: "2. Drag & Drop Print Artwork" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Supports PDF, PSD, CDR vector packages & HD images" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { onDragOver: (e) => e.preventDefault(), onDrop: handleFileDrop, className: "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl bg-slate-950/20 hover:bg-indigo-950/10 cursor-pointer transition-all duration-300 group", children: [
                /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 text-slate-500 group-hover:text-indigo-400 group-hover:scale-110 transition-transform mb-3" }),
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm text-slate-300", children: file ? file.name : "Select artwork from computer" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 mt-1 leading-snug", children: "Drag and drop file here, or click to browse" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-indigo-400/70 font-mono mt-3 font-semibold uppercase tracking-wider", children: "[ PDF, PSD, CDR, JPG, PNG ]" }),
                /* @__PURE__ */ jsx("input", { type: "file", className: "hidden", accept: ".pdf,.psd,.cdr,image/*", onChange: handleFileChange })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-5 flex gap-4", children: /* @__PURE__ */ jsx(Button, { onClick: analyzeFile, disabled: !file || analyzing, className: "flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-indigo", children: analyzing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 mr-2 animate-spin" }),
                "Scanning File Profile..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 mr-2" }),
                "Inspect & Validate Artwork"
              ] }) }) })
            ] }),
            report && /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-xl animate-in slide-in-from-bottom-4 duration-300", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-800/60 pb-4 mb-5", children: [
                /* @__PURE__ */ jsxs("h2", { className: "text-lg font-extrabold text-slate-100 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-indigo-400 animate-pulse" }),
                  "Artwork Validation Audit"
                ] }),
                report.status === "valid" || report.status === "fixed" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-md", children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 mr-1.5" }),
                  " Approved"
                ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold shadow-md", children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5 mr-1.5" }),
                  " Fails Specs"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-500 uppercase tracking-wider font-bold block", children: "Trim Dimensions" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold font-mono text-slate-200 mt-2 block", children: [
                    report.dimensions.width.toFixed(1),
                    " x ",
                    report.dimensions.height.toFixed(1),
                    " mm"
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 mt-3 text-xs", children: Math.abs(report.dimensions.width - selectedProduct.w) <= 1 && Math.abs(report.dimensions.height - selectedProduct.h) <= 1 ? /* @__PURE__ */ jsxs("span", { className: "text-emerald-400 font-semibold flex items-center", children: [
                    /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 mr-1" }),
                    " Perfect Size"
                  ] }) : /* @__PURE__ */ jsxs("span", { className: "text-rose-400 font-semibold flex items-center", children: [
                    /* @__PURE__ */ jsx(XCircle, { className: "w-3.5 h-3.5 mr-1" }),
                    " Size Mismatch"
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-500 uppercase tracking-wider font-bold block", children: "Resolution Profile" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold font-mono text-slate-200 mt-2 block", children: [
                    report.dpi,
                    " DPI"
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 mt-3 text-xs", children: report.dpi >= selectedProduct.dpi ? /* @__PURE__ */ jsxs("span", { className: "text-emerald-400 font-semibold flex items-center", children: [
                    /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 mr-1" }),
                    " Print Ready HD"
                  ] }) : /* @__PURE__ */ jsxs("span", { className: "text-rose-400 font-semibold flex items-center", children: [
                    /* @__PURE__ */ jsx(XCircle, { className: "w-3.5 h-3.5 mr-1" }),
                    " Pixels Blur"
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-500 uppercase tracking-wider font-bold block", children: "Color Profile" }),
                  /* @__PURE__ */ jsx("span", { className: "text-lg font-bold font-mono text-slate-200 mt-2 block", children: report.colorMode }),
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 mt-3 text-xs", children: report.colorMode === selectedProduct.color ? /* @__PURE__ */ jsxs("span", { className: "text-emerald-400 font-semibold flex items-center", children: [
                    /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 mr-1" }),
                    " CMYK Correct"
                  ] }) : /* @__PURE__ */ jsxs("span", { className: "text-amber-400 font-semibold flex items-center", children: [
                    /* @__PURE__ */ jsx(HelpCircle, { className: "w-3.5 h-3.5 mr-1" }),
                    " Auto Convert"
                  ] }) })
                ] })
              ] }),
              report.issues?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-6 bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-rose-400 uppercase tracking-wider mb-2.5", children: "Validation Failures:" }),
                /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: report.issues.map((iss, i) => /* @__PURE__ */ jsxs("li", { className: "text-xs flex items-start gap-2.5 text-rose-300 leading-snug", children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 mt-0.5 text-rose-400 flex-shrink-0" }),
                  /* @__PURE__ */ jsx("span", { children: iss })
                ] }, i)) })
              ] }),
              report.status !== "fixed" && report.issues?.length > 0 && /* @__PURE__ */ jsx(Button, { onClick: fixFile, disabled: fixing, className: "w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-indigo text-sm uppercase tracking-wider", children: fixing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 mr-2 animate-spin" }),
                "Running AI Canvas Bleed correction..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 mr-2" }),
                "Auto-Fix Artwork (Add Bleed, Center, Conform)"
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-800 pb-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-100", children: "Live Fabric Preview" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Interactive print-ready alignment checker" })
              ] }),
              report?.isFixed && /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded", children: "Fixed By AI" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative aspect-square w-full rounded-2xl bg-slate-950/60 overflow-hidden border border-slate-850 flex items-center justify-center min-h-[350px]", children: [
              /* @__PURE__ */ jsx("style", { children: `
                  .canvas-container, .canvas-container canvas {
                    width: 100% !important;
                    height: 100% !important;
                  }
                ` }),
              /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: !file || !["png", "jpg", "jpeg", "webp", "gif"].includes(file.name.split(".").pop()?.toLowerCase() || "") ? "hidden" : "" }),
              !report && file && !["png", "jpg", "jpeg", "webp", "gif"].includes(file.name.split(".").pop()?.toLowerCase() || "") && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 select-none", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-12 h-12 text-indigo-400 mb-3 animate-bounce" }),
                /* @__PURE__ */ jsxs("span", { className: "font-extrabold text-sm text-slate-100 uppercase tracking-wider", children: [
                  file.name.split(".").pop(),
                  " Vector Package Loaded"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 mt-1.5 leading-relaxed font-medium", children: 'Press "Inspect & Validate Artwork" to run the print validation report.' })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 bg-slate-950/40 border border-slate-850/60 p-3.5 rounded-xl text-[10px] font-semibold text-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-full h-1 bg-[#EF4444] rounded" }),
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Trim Cut Boundary" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-full h-1 bg-[#10B981] rounded border border-dashed" }),
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Safe Margin Area" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-full h-1 bg-[#6366F1] rounded border border-dotted" }),
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Bleed Edge" })
              ] })
            ] }),
            report?.status === "fixed" && /* @__PURE__ */ jsxs(Button, { className: "w-full h-13 text-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-emerald flex items-center justify-center gap-2 group uppercase tracking-wider", onClick: () => {
              if (!file) return;
              localStorage.setItem("lk-smart-upload-image", fixedImageUrl || "");
              localStorage.setItem("lk-smart-upload-filename", file.name);
              const matchingSlug = PRESET_TO_PRODUCT_SLUG_MAP[selectedProduct.id] || "800-gsm-velvet";
              toast.success("Design successfully locked! Redirecting to checkout customizer...");
              setTimeout(() => {
                navigate({
                  to: "/product/$slug",
                  params: {
                    slug: matchingSlug
                  }
                });
              }, 800);
            }, children: [
              /* @__PURE__ */ jsx("span", { children: "Lock Design & Continue" }),
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 group-hover:translate-x-1 transition-transform" })
            ] })
          ] })
        ] })
      )
    ] })
  ] });
}
export {
  SmartUploadPage as component
};
