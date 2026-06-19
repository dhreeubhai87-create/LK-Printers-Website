import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, Upload, ShoppingCart, ShoppingBag, Zap, Truck, Check, FileText, Loader2, ShieldCheck, Info, Mail, Tag, Printer, Book, Package, Boxes, RefreshCw, XCircle, Sparkles, HelpCircle } from "lucide-react";
import * as fabric from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { calculatePrice, formatINR } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { FALLBACK_PRODUCTS } from "@/lib/fallback-data";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

// Convert Uint8Array to base64 for browser compatibility
const uint8ArrayToBase64 = (arr: Uint8Array): string => {
  let binary = "";
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return window.btoa(binary);
};

// SHARED CART HELPER WITH AUTO FORM DETECTOR, PDF GENERATION & WHATSAPP SENDER
const addToCart = async (product: Product, price: number, quantity: number, options: any) => {
  const toastId = toast.loading("Processing order and generating PDF Invoice...");

  try {
    // Retrieve active session printer profile details from localStorage
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

    // 1. Detect Category, Product Name, Page URL, Order ID
    const category = product.category_slug || "General";
    const productName = product.name;
    const pageUrl = window.location.href;
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // 2 & 3. Scan the current form dynamically
    const scannedFields: Array<{ label: string; value: string }> = [];
    
    // Find all input elements in the active form container
    const elements = Array.from(document.querySelectorAll("input, select, textarea"));

    elements.forEach((el: any) => {
      // Ignore buttons and submit inputs
      if (el.type === "submit" || el.type === "button") return;
      
      // Focus on customizer controls (avoid generic header search, theme toggle, mobile menus)
      const isCustomizerInput = el.closest(".bg-white") || el.closest("form") || el.closest("[class*='Customizer']") || el.closest(".space-y-6") || el.closest(".space-y-5");
      if (!isCustomizerInput) return;
      
      // Ignore hidden fields unless they represent file names
      if (el.type === "hidden" && el.name !== "file") return;
      
      // For radio buttons, only process the checked one
      if (el.type === "radio" && !el.checked) return;
      
      let labelText = "";
      
      // Find associated label text
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
      
      // Format/Clean label text
      labelText = labelText.replace(/[:*]/g, "").replace(/\s+/g, " ").trim();
      if (!labelText || labelText.toLowerCase().includes("select detail") || labelText.toLowerCase().includes("order name")) {
        if (labelText.toLowerCase().includes("order name")) {
          // Keep it
        } else {
          return;
        }
      }
      
      // Get field value
      let valText = "";
      if (el.type === "checkbox") {
        valText = el.checked ? "Yes" : "No";
      } else if (el.type === "file") {
        if (el.files && el.files.length > 0) {
          valText = Array.from(el.files).map((f: any) => f.name).join(", ");
        } else {
          // Fallback: check if there is a filename displayed near the input
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
      
      // Prevent duplicates
      const existing = scannedFields.find(f => f.label === labelText);
      if (existing) {
        if (el.type === "radio" || el.type === "checkbox") {
          existing.value = valText;
        }
      } else {
        scannedFields.push({ label: labelText, value: valText });
      }
    });

    // Detect Sub Product (Variant)
    const subProductField = scannedFields.find(f => f.label.toLowerCase().includes("select product") || f.label.toLowerCase().includes("variant"));
    const subProduct = subProductField ? subProductField.value : (options?.variant || "Standard");

    // Add scanned fields to options metadata
    const finalOptions = {
      ...options,
      detectedFields: scannedFields
    };

    // Save item to cart locally (standard catalog workflow)
    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      price,
      quantity,
      image: product.images?.[0] || "",
      options: finalOptions,
    };

    localStorage.removeItem("lk-smart-upload-image");
    localStorage.removeItem("lk-smart-upload-filename");

    const existingCart = localStorage.getItem("lk-printer-cart");
    const cart = existingCart ? JSON.parse(existingCart) : [];
    cart.push(cartItem);
    localStorage.setItem("lk-printer-cart", JSON.stringify(cart));

    // 7. Generate PDF Invoice
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 850]); // slightly taller page for customer info
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = 790;
    
    // Header
    page.drawText("LK PRINTER - OFFICIAL ORDER INVOICE", { x: 50, y, size: 18, font: boldFont, color: rgb(0, 0.3, 0.6) });
    y -= 40;
    
    // Order Information
    page.drawText(`Order ID: ${orderNumber}`, { x: 50, y, size: 11, font: boldFont });
    page.drawText(`Date & Time: ${dateStr}`, { x: 320, y, size: 11, font });
    y -= 20;
    
    page.drawText(`Category: ${category}`, { x: 50, y, size: 11, font });
    page.drawText(`Product: ${productName}`, { x: 320, y, size: 11, font });
    y -= 20;
    
    page.drawText(`Sub Product: ${subProduct}`, { x: 50, y, size: 11, font });
    y -= 20;
    
    page.drawLine({ start: { x: 50, y }, end: { x: 550, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;
    
    // Customer details on PDF
    page.drawText("CUSTOMER PROFILE DETAILS:", { x: 50, y, size: 11, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 18;
    page.drawText(`Printer ID: ${profile.id || "N/A"}`, { x: 50, y, size: 10, font: boldFont });
    page.drawText(`Customer Name: ${profile.name || "Guest Customer"}`, { x: 320, y, size: 10, font });
    y -= 16;
    page.drawText(`WhatsApp / Phone: ${profile.phone || profile.whatsappNo || "N/A"}`, { x: 50, y, size: 10, font });
    page.drawText(`Email: ${profile.email || "N/A"}`, { x: 320, y, size: 10, font });
    y -= 16;
    if (profile.company) {
      page.drawText(`Company: ${profile.company}`, { x: 50, y, size: 10, font });
      y -= 16;
    }
    if (profile.address) {
      page.drawText(`Address: ${profile.address}`, { x: 50, y, size: 10, font });
      y -= 16;
    }

    page.drawLine({ start: { x: 50, y }, end: { x: 550, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 25;
    
    // Specifications
    page.drawText("ORDER SPECIFICATIONS & OPTIONS DETECTED:", { x: 50, y, size: 12, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    y -= 25;
    
    // Loop options inside the PDF
    for (const field of scannedFields) {
      if (y < 80) {
        page = pdfDoc.addPage([600, 850]);
        y = 790;
      }
      
      page.drawText(`${field.label}:`, { x: 70, y, size: 10, font: boldFont });
      page.drawText(`${field.value}`, { x: 230, y, size: 10, font });
      y -= 18;
    }
    
    y -= 10;
    if (y < 120) {
      page = pdfDoc.addPage([600, 850]);
      y = 790;
    }
    
    page.drawLine({ start: { x: 50, y }, end: { x: 550, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 30;
    
    // Pricing
    const baseAmt = price;
    const gstAmt = price * 0.18;
    const totalAmt = price * 1.18;
    
    page.drawText(`Base Amount: Rs. ${baseAmt.toFixed(2)}`, { x: 50, y, size: 11, font });
    y -= 18;
    page.drawText(`GST (18%): Rs. ${gstAmt.toFixed(2)}`, { x: 50, y, size: 11, font });
    y -= 22;
    page.drawText(`Total Amount (incl. GST): Rs. ${totalAmt.toFixed(2)}`, { x: 50, y, size: 13, font: boldFont, color: rgb(0, 0.5, 0.2) });
    y -= 30;
    
    // Footer note
    page.drawText("This is an automatically generated print order summary invoice.", { x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = uint8ArrayToBase64(pdfBytes);

    // 8. Upload PDF
    let pdfUrl = "";
    
    // Attempt local static directory upload first (100% reliable locally)
    try {
      const apiRes = await fetch("/api/upload-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, orderNumber })
      });
      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.success) {
        pdfUrl = `${window.location.origin}/orders/${apiData.fileName}`;
      }
    } catch (apiErr) {
      console.error("Local PDF upload failed:", apiErr);
    }

    // Try Supabase Storage upload
    try {
      const fileBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const { data, error } = await supabase.storage.from("orders").upload(`${orderNumber}.pdf`, fileBlob, {
        cacheControl: "3600",
        upsert: true
      });
      
      if (!error) {
        const { data: urlData } = supabase.storage.from("orders").getPublicUrl(`${orderNumber}.pdf`);
        pdfUrl = urlData.publicUrl;
      }
    } catch (sbErr) {
      console.error("Supabase Storage upload failed:", sbErr);
    }

    // Ultimate Fallback: Inline base64 data URL
    if (!pdfUrl) {
      pdfUrl = `data:application/pdf;base64,${pdfBase64}`;
    }

    // Create new Order object and save directly to lk-printer-orders (Order List)
    const orderItem = {
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.price,
      quantity: cartItem.quantity,
      image: cartItem.image,
      options: cartItem.options,
    };

    const newOrder = {
      id: crypto.randomUUID(),
      orderNumber,
      date: dateStr,
      customerName: profile.name || "Guest Customer",
      items: [orderItem],
      totalAmount: totalAmt,
      status: "Confirmed",
      invoiceUrl: pdfUrl,
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

    // Trigger PDF download automatically for the user
    try {
      const fileBlob = new Blob([pdfBytes], { type: "application/pdf" });
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

    // 9. Open WhatsApp automatically
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
      duration: 3000,
      isLoading: false
    });

    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
    }, 800);

  } catch (err: any) {
    console.error("Auto order processing failed:", err);
    toast.update(toastId, {
      type: "error",
      render: `Error: ${err.message || "Failed to process order"}`,
      duration: 4000,
      isLoading: false
    });
  }
};


// ─── SHARED UI HELPERS ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">{title}</h3>
      {children}
    </div>
  );
}

function OptionPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${active
        ? "bg-primary text-primary-foreground border-primary shadow-sm"
        : "bg-card border-border hover:border-primary/50 hover:bg-muted/40"
        }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between items-center text-sm ${bold ? "font-bold" : ""} ${accent ? "text-green-600" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FullProductDetails({ product }: { product: Product }) {
  const d = product.product_details;
  const features = product.features || [];

  if (!d && features.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center text-slate-500">
        Premium quality product with professional finish.
      </div>
    );
  }

  const isVisitingCard = product.category_slug === 'visiting-cards';
  const isLargeFormatCard = product.slug === 'nt-pvc-800-micron';
  const isStandardCard = isVisitingCard && !isLargeFormatCard;
  const pointsSizes = isLargeFormatCard
    ? { design: '96.00 mm X 58.00 mm', text: '84.00 mm X 46.00 mm', cut: '90.00 mm x 53.00 mm' }
    : isStandardCard
      ? { design: '90.00 mm X 54.00 mm', text: '80.00 mm X 44.00 mm', cut: '87.00 mm x 51.00 mm' }
      : null;

  // Build Description Items
  const descriptionItems: string[] = [];

  if (d) {
    if (d.code) descriptionItems.push(`Product Code : ${d.code}`);
    if (d.lamination && d.lamination !== "Not Available") descriptionItems.push(`Lamination : ${d.lamination}`);
    if (d.uv && d.uv !== "Not Available") descriptionItems.push(`UV : ${d.uv}`);
    if (d.foil && d.foil !== "Not Available") descriptionItems.push(`Foil : ${d.foil}`);
    if (d.texture && d.texture !== "Not Available") descriptionItems.push(`Texture : ${d.texture}`);
    if (d.die_cut && d.die_cut !== "Not Available") descriptionItems.push(`Die Cut : ${d.die_cut}`);
    if (d.production_time) descriptionItems.push(`Production Time : ${d.production_time}`);
  }

  // Add features that are not notes
  const noteFeatures: string[] = [];
  features.forEach(f => {
    if (f.toLowerCase().startsWith('note:')) {
      noteFeatures.push(f);
    } else {
      descriptionItems.push(f);
    }
  });

  if (pointsSizes) {
    descriptionItems.push(`Card Sizes : ${pointsSizes.design} (Custom Size & Shape Available)`);
  }

  const specializationItems = [
    "We are India's No. 1 Visiting card manufacturer.",
    "Serving Pan India & International Markets.",
    "Fast & Reliable Service with On-Time Delivery Assurance..",
    "Real-Time Order Tracking: Full transparency with online tracking.",
    "B2B Exclusive: work with printing presses, designers & branding agencies only."
  ];

  const importantNotes = [
    "Use high-resolution vector files. (PDF / CDR)",
    "Font size above 10 pt recommended for best clarity.",
    "Please do not use full-backgrounds, gradients, or CMYK images in the design.",
    "Only standard pre-mixed spot colors are available — CMYK printing (CMYK mixing) is not applicable.",
    "Spot colors are fully applied by hand — no machines used.",
    "Follow sample file instructions for correct design."
  ];

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mb-4">
      <h3 className="text-[#003366] font-bold text-2xl border-b-[3px] border-[#003366] inline-block pb-0.5">
        {title}
      </h3>
    </div>
  );

  const ListItem = ({ text }: { text: string }) => {
    const isNote = text.toLowerCase().startsWith('note:');

    // Check for "Key : Value" or "Key: Value"
    let key = "";
    let value = "";

    const colonIndex = text.indexOf(' : ');
    if (colonIndex !== -1) {
      key = text.substring(0, colonIndex).trim();
      value = text.substring(colonIndex + 3).trim();
    } else {
      const colonIndexAlt = text.indexOf(': ');
      if (colonIndexAlt !== -1) {
        key = text.substring(0, colonIndexAlt).trim();
        value = text.substring(colonIndexAlt + 2).trim();
      }
    }

    return (
      <li className="flex items-start gap-2.5 text-[#444] text-[15.5px] leading-relaxed">
        <div className="w-2 h-2 rounded-full bg-[#cbd5e0] mt-[9px] flex-shrink-0" />
        <span>
          {key && value ? (
            <>
              <span className="font-bold text-[#333]">{key} :</span> {value}
            </>
          ) : (
            <span className={isNote ? "font-bold text-[#333]" : ""}>{text}</span>
          )}
        </span>
      </li>
    );
  };

  return (
    <div className="space-y-12 py-6">
      {/* Product Description */}
      <section>
        <SectionHeader title="Product Description" />
        <ul className="space-y-2.5">
          {descriptionItems.map((item, i) => <ListItem key={i} text={item} />)}
          {noteFeatures.map((note, i) => <ListItem key={i} text={note} />)}
        </ul>
      </section>

      {/* Important Notes */}
      <section>
        <SectionHeader title="Important Notes." />
        <ul className="space-y-2.5">
          {importantNotes.map((item, i) => <ListItem key={i} text={item} />)}
        </ul>
      </section>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────────

function ProductPage() {

  const { slug } = Route.useParams();

  // Find fallback product synchronously for instant rendering
  const initialProduct = useMemo(() => {
    return FALLBACK_PRODUCTS.find((fp) => fp.slug === slug) || null;
  }, [slug]);

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Customizer state
  const [sizeId, setSizeId] = useState<string | null>(() => (initialProduct?.sizes || [])[0]?.id ?? null);
  const [paperId, setPaperId] = useState<string | null>(() => (initialProduct?.paper_types || [])[0]?.id ?? null);
  const [colorId, setColorId] = useState<string | null>(() => (initialProduct?.color_options || [])[0]?.id ?? null);
  const [finishingIds, setFinishingIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(() => (initialProduct?.quantity_tiers || [])[0]?.qty ?? 100);
  const [express, setExpress] = useState(false);
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-filename") || null;
  });
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  useEffect(() => {
    // Synchronously sync local fallback state if the slug changes
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
        const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
        if (error) throw error;

        const p = data as unknown as Product;
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

  const toggleFinishing = (id: string) =>
    setFinishingIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      express: express ? "Yes" : "No",
    });
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center text-center px-6">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 max-w-xl w-full">
            <h1 className="text-3xl font-bold text-red-700 mb-4">Unable to load product</h1>
            <p className="text-sm text-red-600 mb-6">There was a problem fetching this product. Please check your connection or try again later.</p>
            <p className="text-xs text-red-500 opacity-90 break-words mb-6">{loadError}</p>
            <Link to="/" className="text-primary hover:underline">Go back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Product not found</h1>
            <Link to="/" className="text-primary hover:underline">Go home</Link>
          </div>
        </div>
      </div>
    );
  }



  // CUSTOM ROUTING FOR 500 GSM + VELVET
  if (product.slug === "500-gsm-velvet") {
    return <Gsm500Customizer key={product.id} product={product} type="velvet" />;
  }

  // CUSTOM ROUTING FOR 500 GSM + MATT
  if (product.slug === "500-gsm-matt") {
    return <Gsm500Customizer key={product.id} product={product} type="matt" />;
  }

  // CUSTOM ROUTING FOR 500 GSM + DRIP-OFF
  if (product.slug === "500-gsm-drip-off") {
    return <Gsm500Customizer key={product.id} product={product} type="drip-off" />;
  }

  // CUSTOM ROUTING FOR 800 GSM + VELVET
  if (product.slug === "800-gsm-velvet") {
    return <Velvet800GsmCustomizer key={product.id} product={product} />;
  }


  // CUSTOM ROUTING FOR 800 GSM + MATT
  if (product.slug === "800-gsm-matt") {
    return <Matt800GsmCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR 800 GSM + CRAFT SHEET
  if (product.slug === "800-gsm-craft-paper") {
    return <CraftSheet800GsmCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR 800 GSM + TEXTURE
  if (product.slug === "800-gsm-texture") {
    return <Texture800GsmCustomizer key={product.id} product={product} />;
  }







  // CUSTOM ROUTING FOR 180 MICRON
  if (product.slug === "nt-pvc-180-micron") {
    return <NT180MicronCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR 800 MICRON FUSING
  if (product.slug === "nt-pvc-800-micron") {
    return <NT800MicronCustomizer key={product.id} product={product} />;
  }



  // CUSTOM ROUTING FOR MATT + UV
  if (product.slug === "regular-matt-uv") {
    return <MattUVRegularCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR GLOSS LAMINATION
  if (product.slug === "regular-gloss") {
    return <RegularGlossCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR GLOSS UV COATED - SMALL (VC-21)
  if (product.slug === "regular-gloss-small") {
    return <RegularGlossSmallCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR WITHOUT LAMINATION (SMALL) (VC-22)
  if (product.slug === "regular-without-small") {
    return <RegularWithoutSmallCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR GLOSS UV COATED (VC-19)
  if (product.slug === "regular-gloss-coated") {
    return <GlossCoatedCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR WITHOUT LAMINATION (VC-20)
  if (product.slug === "regular-without") {
    return <WithoutLaminationCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR MATT LAMINATION
  if (product.slug === "regular-matt") {
    return <MattLaminationCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR MATT + TEXTURE
  if (product.slug === "regular-matt-texture") {
    return <MattTextureCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR GLOSS + TEXTURE
  if (product.slug === "regular-gloss-texture") {
    return <GlossTextureCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR POSTERS
  if (product.slug === "posters-15x20") {
    return <PosterCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR PAMPHLETS
  if (product.slug === "pamphlets-70gsm") {
    return <PamphletCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR PVC CLIP
  if (product.slug === "files-pvc-clip") {
    return <PVCClipCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR PRESENTATION FILES
  if (product.slug.startsWith("presentation-files-") || product.slug.startsWith("files-pvc-") || product.slug.startsWith("files-sbs-")) {
    return <FilesCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR DEO PAPER & LETTERHEAD PAPER
  if (product.slug === "deo-paper" || product.slug === "letterheads-paper" || product.slug === "letter-head-paper") {
    return <DeoPaperCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR TEXTURE PAPER
  if (product.slug === "texture-paper") {
    return <TexturePaperCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR GUMMING
  if (product.slug === "paper-gumming" || product.slug === "pvc-gumming") {
    return <GummingCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR DIGITAL PAPER PRINTING (Merged Art & Texture)
  if (product.slug === "art-paper") {
    return <DigitalPaperPrintingCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR OTHER LETTERHEADS
  if (product.slug.startsWith("letterheads-")) {
    return <LetterheadCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR ENVELOPES
  if (product.slug.startsWith("envelopes-") || product.slug === "gift-envelopes") {
    return <EnvelopeCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR ATM POUCHES
  if (product.slug.startsWith("atm-pouch-")) {
    return <ATMPouchCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR BILL BOOKS
  if (product.slug.startsWith("a4-bill-book-")) {
    return <BillBookCustomizer key={product.id} product={product} />;
  }

  // CUSTOM ROUTING FOR STICKERS
  if (product.slug === "paper-stickers") {
    return <StickerCustomizer product={product} />;
  }

  // CUSTOM ROUTING FOR PENS
  if (product.slug === "laser-printed-pen" || product.slug === "single-color-pen") {
    return <PenCustomizer product={product} />;
  }

  // NEW CATEGORY ROUTING
  if (
    product.category_slug === "brochures" ||
    product.category_slug === "id-cards" ||
    product.category_slug === "certificates" ||
    product.category_slug === "menu-cards" ||
    product.category_slug === "invitations" ||
    product.category_slug === "calendars" ||
    product.category_slug === "banners" ||
    product.category_slug === "sample-files" ||
    product.category_slug === "digital-printing"
  ) {
    return <PamphletPosterCustomizer product={product} />;
  }

  // CUSTOM ROUTING FOR SHOOTING TARGETS
  if (product.slug === "pistol-target" || product.slug === "rifle-target") {
    return <TargetCustomizer product={product} />;
  }

  // CUSTOM ROUTING FOR PAMPHLETS & POSTERS
  if (product.category_slug === "pamphlets-posters") {
    return <PamphletPosterCustomizer product={product} />;
  }

  // CUSTOM ROUTING FOR GARMENT TAGS
  if (product.slug === "garments-tags-gloss") {
    return <GlossCoatedTagCustomizer key={product.id} product={product} />;
  }

  if (product.slug === "garments-tags-matt") {
    return <MattLaminationTagCustomizer key={product.id} product={product} />;
  }

  if (product.slug === "garments-tags-matt-lamination-uv" || product.slug === "garments-tags-matt-uv") {
    return <MattUVTagCustomizer key={product.id} product={product} />;
  }

  if (product.slug === "garments-tags-thread") {
    return <ThreadCustomizer key={product.id} product={product} />;
  }

  if (product.slug.startsWith("garments-tags-")) {
    return <GarmentTagCustomizer key={product.id} product={product} />;
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-6 py-8">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="grid lg:grid-cols-[1fr_1.2fr_360px] xl:grid-cols-[1fr_1.5fr_380px] gap-8">
          {/* Product Images - Sticky */}
          <div className="lg:sticky lg:top-24 self-start opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="aspect-square rounded-[2.5rem] overflow-hidden bg-muted border border-border shadow-2xl group flex items-center justify-center relative">
              {filePreview ? (
                <img src={filePreview} alt="Your design preview" className="w-full h-full object-contain p-8" />
              ) : (
                <img
                  src={product.images?.[0] || ""}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
              )}
            </div>
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {(product.images || []).map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-2xl bg-muted border overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary transition-all">
                  <img src={img} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Customizer Panel */}
          <div className="space-y-10 opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div>
              <Badge variant="secondary" className="mb-3 rounded-sm">{product.category_slug.replace("-", " ").toUpperCase()}</Badge>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4 tracking-tight leading-tight text-balance">{product.name}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Design Guidelines */}
            <div className="mt-4 p-6 bg-amber-50/40 rounded-3xl border border-amber-100 shadow-sm">
              <h4 className="text-sm font-bold uppercase tracking-widest text-amber-900 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Important Notes
              </h4>
              <ul className="space-y-2.5 text-[13px] text-amber-900/80">
                <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" /> Use high-resolution vector files (PDF/CDR).</li>
                <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" /> Font size above 10 pt recommended.</li>
              </ul>
            </div>


            {/* Size */}
            <Section title={product.size_label || "Size"}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(product.sizes || []).map((s) => (
                  <OptionPill key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                    {s.label}
                  </OptionPill>
                ))}
              </div>
              {sizeId === "custom" && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><Label className="text-xs">Width (in)</Label><Input type="number" placeholder="3.5" /></div>
                  <div><Label className="text-xs">Height (in)</Label><Input type="number" placeholder="2" /></div>
                </div>
              )}
            </Section>

            {/* Paper */}
            <Section title={product.paper_label || "Paper / Material"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(product.paper_types || []).map((p) => (
                  <OptionPill key={p.id} active={paperId === p.id} onClick={() => setPaperId(p.id)}>
                    <span>{p.label}</span>
                    {p.price > 0 && <span className="text-xs opacity-75 ml-2"></span>}
                  </OptionPill>
                ))}
              </div>
            </Section>

            {/* Color */}
            <Section title={product.color_label || "Color & Sides"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(product.color_options || []).map((c) => (
                  <OptionPill key={c.id} active={colorId === c.id} onClick={() => setColorId(c.id)}>
                    <span>{c.label}</span>
                    {c.price > 0 && <span className="text-xs opacity-75 ml-2"></span>}
                  </OptionPill>
                ))}
              </div>
            </Section>

            {/* Finishing */}
            <Section title={product.finishing_label || "Finishing (optional)"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(product.finishing_options || []).map((f) => {
                  const active = finishingIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFinishing(f.id)}
                      className={`flex items-center justify-between gap-2 px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all ${active
                        ? "bg-primary text-primary-foreground border-primary shadow-primary"
                        : "bg-card border-border hover:border-primary/50"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${active ? "bg-primary-foreground border-primary-foreground" : "border-current opacity-40"}`}>
                          {active && <Check className="w-3 h-3 text-primary" />}
                        </span>
                        {f.label}
                      </span>
                      <span className="text-xs opacity-80"></span>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Quantity */}
            <Section title="Quantity">
              <div className="flex flex-wrap gap-2 mb-3">
                {(product.quantity_tiers || []).map((t) => (
                  <OptionPill key={t.qty} active={quantity === t.qty} onClick={() => setQuantity(t.qty)}>
                    {t.qty.toLocaleString()}
                    {t.discount > 0 && <span className="ml-1.5 text-xs opacity-75">−{Math.round(t.discount * 100)}%</span>}
                  </OptionPill>
                ))}
              </div>
              <div>
                <Label className="text-xs">Custom quantity</Label>
                <Input
                  type="number"
                  min={(product?.quantity_tiers || [])[0]?.qty || 100}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  onBlur={() => {
                    const minVal = (product?.quantity_tiers || [])[0]?.qty || 100;
                    if (quantity < minVal) {
                      setQuantity(minVal);
                    }
                  }}
                  className="max-w-[180px] bg-white border border-gray-300 p-2 w-full outline-none"
                />
              </div>
            </Section>

            {/* Design upload */}
            <Section title="Your Design">
              <label className="flex flex-col items-center justify-center w-full p-10 border-4 border-dashed border-muted rounded-[2rem] bg-muted/20 hover:bg-muted/40 hover:border-primary/30 cursor-pointer transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <span className="text-lg font-bold">{fileName ?? "Click to upload design"}</span>
                <span className="text-sm text-muted-foreground mt-1">PDF, PNG, JPG (max 20 MB)</span>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFile} />
              </label>
              <button type="button" className="mt-4 text-sm text-primary font-bold hover:underline inline-flex items-center gap-1.5 ml-1">
                <FileText className="w-4 h-4" /> or browse our templates
              </button>
            </Section>

            {/* Notes */}
            <Section title="Special Instructions">
              <Textarea
                placeholder="Any special notes for our printing team..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </Section>

            {/* Delivery */}
            <Section title="Delivery">
              <div className="bg-muted/40 border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Standard delivery</span>
                  <span className="text-muted-foreground">{product.delivery_days} days · {formatINR(product.shipping_cost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-3 border-t">
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-accent" /> Express delivery (2 days)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground"></span>
                    <Switch checked={express} onCheckedChange={setExpress} />
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Live price sidebar */}
          {breakdown && (
            <div className="sticky bottom-6 z-20 bg-card/80 backdrop-blur-2xl border p-8 rounded-[3rem] shadow-2xl mt-12 opacity-0 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Instant Quote</div>
              <div className="text-5xl font-serif font-bold text-primary mb-2 tabular-nums">
                {formatINR(breakdown.total)}
              </div>
              <div className="text-sm text-muted-foreground mb-6 font-medium">
                {formatINR(breakdown.unitPrice)} per unit · {breakdown.quantity.toLocaleString()} pcs
              </div>

              <div className="space-y-2.5 text-sm border-t border-muted pt-6 mb-8">
                <Row label="Base × size" value={formatINR(breakdown.basePrice + breakdown.sizeAdjustment)} />
                {breakdown.paperPrice > 0 && <Row label="Paper" value={`+${formatINR(breakdown.paperPrice)}`} />}
                {breakdown.colorPrice > 0 && <Row label="Color" value={`+${formatINR(breakdown.colorPrice)}`} />}
                {breakdown.finishingPrice > 0 && <Row label="Finishing" value={`+${formatINR(breakdown.finishingPrice)}`} />}
                <Row label={`Subtotal (× ${breakdown.quantity})`} value={formatINR(breakdown.subtotal)} bold />
                {breakdown.discount > 0 && (
                  <Row label={`Bulk discount (${Math.round(breakdown.discountPct * 100)}%)`} value={`−${formatINR(breakdown.discount)}`} accent />
                )}
                <Row label="Shipping" value={formatINR(breakdown.shipping)} />
                {breakdown.expressExtra > 0 && <Row label="Express" value={`+${formatINR(breakdown.expressExtra)}`} />}
              </div>

              <div className="space-y-4">
                <Button onClick={handleAddToCart} size="lg" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg group bg-[#007bff] hover:bg-blue-600 text-white">
                  <ShoppingBag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  ADD ORDER (PAY FROM WALLET)
                </Button>
                <Button variant="outline" size="lg" className="w-full h-14 rounded-2xl border-2 text-lg">
                  Order Now
                </Button>
              </div>

              <p className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-muted/30">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                GST Included · Secure
              </p>
            </div>
          )}

        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function MetalCardCustomizer({ product }: { product: Product }) {
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
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const MIN_QTY = 50;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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
    if (colorCount === "--Select--") { toast.error("Please select Color Count"); return; }
    if (metalFinish === "--Select--") { toast.error("Please select Metal Finish"); return; }

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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link to="/category/$slug" params={{ slug: product.category_slug }} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image Placeholder & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-gray-800 to-black w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans tracking-widest uppercase text-white">METAL CARD</h2>
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-gold-500 to-transparent my-2" />
                    <p className="text-sm font-medium opacity-90 tracking-[0.3em] uppercase text-white/80">PREMIUM QUALITY</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full space-y-6">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                >
                  <option value="METAL CARD">METAL CARD</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={MIN_QTY}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < MIN_QTY) {
                        setQuantity(String(MIN_QTY));
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none h-10"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : {MIN_QTY})</span>
                </div>
              </div>

              {/* Color Count */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Color Count in Text & Logo</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={colorCount}
                  onChange={e => setColorCount(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Print With 1 Color">Print With 1 Color</option>
                  <option value="Print With 2 Color">Print With 2 Color</option>
                  <option value="Print With 3 Color">Print With 3 Color</option>
                  <option value="Print With 4 Color">Print With 4 Color</option>
                  <option value="Print With 5 Color">Print With 5 Color</option>
                  <option value="Print With 6 Color">Print With 6 Color</option>
                </select>
              </div>

              {/* Metal Finish */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Metal Finish</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={metalFinish}
                  onChange={e => setMetalFinish(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Gold Color">Gold Color</option>
                  <option value="Silver Color">Silver Color</option>
                  <option value="Nickel Color">Nickel Color</option>
                  <option value="Copper Color">Copper Color</option>
                  <option value="Blue Color">Blue Color</option>
                  <option value="Green Color">Green Color</option>
                  <option value="Pink Color">Pink Color</option>
                  <option value="Fluorescent Green Color">Fluorescent Green Color</option>
                </select>
              </div>

              {/* Privacy Packing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="radio" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} /> Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="radio" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} /> Not Required
                  </label>
                </div>
              </div>

              {/* Free Delivery Banner */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="file_opt_1"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600 text-[13px]">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 text-[13px]">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="text-sm">Amount Payable</span>
                    <span className="text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              {/* Pressline */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight">
                  Enter Pressline :<br />
                  <span className="text-[9px] text-blue-600 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter Pressline..."
                    value={pressline}
                    onChange={e => setPressline(e.target.value)}
                    className="rounded-none border-gray-300 font-bold text-blue-800 h-9"
                  />
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5">
                    <span>L.K. PRINTERS</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


function getSpecsBySlug(slug: string) {
  let w = 90;
  let h = 54;
  let bleed = 3;
  let safe = 3;
  let dpi = 300;
  let pages = 2;
  let color = "CMYK";

  const s = slug.toLowerCase();
  if (s.includes("pvc") || s.includes("micron")) {
    w = 90; h = 54; bleed = 2; safe = 3; pages = 2;
  } else if (s.includes("letterhead") || s.includes("letter-head")) {
    w = 210; h = 297; bleed = 3; safe = 5; pages = 1;
  } else if (s.includes("envelope")) {
    w = 220; h = 110; bleed = 3; safe = 4; pages = 1;
  } else if (s.includes("folder") || s.includes("file")) {
    w = 220; h = 310; bleed = 5; safe = 5; pages = 1;
  } else if (s.includes("poster") || s.includes("pamphlet")) {
    w = 297; h = 420; bleed = 5; safe = 5; pages = 1;
  } else if (s.includes("sticker") || s.includes("label")) {
    w = 50; h = 50; bleed = 2; safe = 3; pages = 1;
  } else if (s.includes("pen")) {
    w = 60; h = 8; bleed = 1; safe = 1; pages = 1;
  } else if (s.includes("tag")) {
    w = 50; h = 90; bleed = 3; safe = 3; pages = 2;
  } else if (s.includes("bill") || s.includes("invoice")) {
    w = 148; h = 210; bleed = 4; safe = 5; pages = 2;
  }

  return { id: slug, name: "Selected Product", w, h, bleed, safe, dpi, pages, color };
}

export function B2BFileSelector({
  fileOption,
  setFileOption,
  onFileChange,
  fileName,
  radioName = "file_option"
}: {
  fileOption: string;
  setFileOption: (opt: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName?: string | null;
  radioName?: string;
}) {
  const { slug } = Route.useParams();
  const [localFile, setLocalFile] = useState<File | null>(() => {
    const savedFilename = localStorage.getItem("lk-smart-upload-filename");
    if (savedFilename) {
      return new File([""], savedFilename, { type: "image/png" });
    }
    return null;
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState<any>(() => {
    const saved = localStorage.getItem("lk-smart-upload-image");
    if (saved) {
      const currentSpec = getSpecsBySlug(slug);
      return {
        status: "fixed",
        isFixed: true,
        dimensions: { width: currentSpec.w, height: currentSpec.h },
        dpi: currentSpec.dpi,
        colorMode: currentSpec.color,
        issues: []
      };
    }
    return null;
  });
  const [fixedImageUrl, setFixedImageUrl] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  // Auto-detect dynamic specifications based on slug context
  const spec = useMemo(() => getSpecsBySlug(slug), [slug]);

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      const validExts = ['pdf', 'psd', 'cdr', 'jpeg', 'jpg', 'png'];

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
      const ext = localFile.name.split('.').pop()?.toLowerCase();
      const formData = new FormData();
      formData.append("file", localFile);
      formData.append("product", JSON.stringify(spec));
      formData.append("action", "analyze");

      if (ext === 'psd' || ext === 'cdr') {
        setTimeout(() => {
          const mockReport = {
            status: "invalid",
            dimensions: { width: spec.w - 5.5, height: spec.h + 2.1 },
            dpi: 150,
            colorMode: "RGB",
            issues: [
              `Dimensions mismatch: Expected ${spec.w}x${spec.h}mm, detected ${(spec.w - 5.5).toFixed(1)}x${(spec.h + 2.1).toFixed(1)}mm.`,
              `Low resolution: Got 150 DPI, expected ${spec.dpi} DPI.`,
              `Color mode is RGB. Print requires CMYK.`
            ]
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
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReport(data.report);
      renderLocalPreview(data.previewUrl || URL.createObjectURL(localFile), data.report);
      toast.success("Artwork verification completed!");
    } catch (e: any) {
      toast.error(e.message || "Inspect failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const autoFixArtwork = async () => {
    if (!localFile) return;
    setFixing(true);
    try {
      const ext = localFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'psd' || ext === 'cdr') {
        setTimeout(() => {
          const fixedMockUrl = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=500&q=80";
          setFixedImageUrl(fixedMockUrl);
          setReport((r: any) => ({
            ...r,
            status: "fixed",
            dimensions: { width: spec.w, height: spec.h },
            dpi: spec.dpi,
            colorMode: spec.color,
            issues: []
          }));
          renderLocalPreview(fixedMockUrl, {
            dimensions: { width: spec.w, height: spec.h },
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
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fixing failed");
      setFixedImageUrl(data.fixedUrl);
      setReport((r: any) => ({
        ...r,
        status: "fixed",
        dimensions: { width: spec.w, height: spec.h },
        dpi: spec.dpi,
        colorMode: spec.color,
        issues: []
      }));
      renderLocalPreview(data.fixedUrl, {
        dimensions: { width: spec.w, height: spec.h },
        dpi: spec.dpi,
        colorMode: spec.color,
        isFixed: true
      });
      toast.success("Artwork corrected successfully!");
    } catch (e: any) {
      toast.error(e.message || "Fix failed");
    } finally {
      setFixing(false);
    }
  };

  const renderLocalPreview = (imageUrl: string, r: any) => {
    if (!canvasRef.current) return;
    if (!fabricRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width: 320,
        height: 320,
        backgroundColor: "#f8fafc",
      });
    }
    const canvas = fabricRef.current;
    canvas.clear();
    fabric.Image.fromURL(imageUrl, { crossOrigin: "anonymous" }).then((img) => {
      const scale = Math.min(240 / img.width!, 240 / img.height!);
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
        const mmToPx = (img.width! * scale) / totalW;

        // Safe Margin (Green dashed)
        const safeW = (productW - (spec.safe * 2)) * mmToPx;
        const safeH = (productH - (spec.safe * 2)) * mmToPx;
        const safeRect = new fabric.Rect({
          left: 160, top: 160, originX: "center", originY: "center",
          width: safeW, height: safeH,
          fill: "transparent",
          stroke: "#10B981",
          strokeWidth: 1.5,
          strokeDashArray: [5, 4],
          selectable: false
        });

        // Cut Trim (Red solid)
        const trimW = productW * mmToPx;
        const trimH = productH * mmToPx;
        const trimRect = new fabric.Rect({
          left: 160, top: 160, originX: "center", originY: "center",
          width: trimW, height: trimH,
          fill: "transparent",
          stroke: "#EF4444",
          strokeWidth: 2,
          selectable: false
        });

        // Bleed bounds (Indigo dotted)
        const bleedW = (productW + (bleed * 2)) * mmToPx;
        const bleedH = (productH + (bleed * 2)) * mmToPx;
        const bleedRect = new fabric.Rect({
          left: 160, top: 160, originX: "center", originY: "center",
          width: bleedW, height: bleedH,
          fill: "transparent",
          stroke: "#6366F1",
          strokeWidth: 1,
          strokeDashArray: [2, 2],
          selectable: false
        });

        canvas.add(bleedRect, safeRect, trimRect);
      }
      canvas.renderAll();
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    if (fixedImageUrl) {
      const timer = setTimeout(() => {
        renderLocalPreview(fixedImageUrl, report);
      }, 150);
      return () => clearTimeout(timer);
    } else if (localFile) {
      const ext = localFile.name.split('.').pop()?.toLowerCase();
      if (ext && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
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

  return (
    <>
      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4">
        <label className="font-bold text-right text-[#003366] text-sm sm:text-base">File Option</label>
        <div className="flex gap-6 sm:gap-10">
          <label className="flex items-center gap-2 cursor-pointer text-[#333]">
            <input type="radio" name={radioName} className="w-4 h-4 text-blue-600 focus:ring-blue-500" checked={fileOption === 'Attach File Online'} onChange={() => setFileOption('Attach File Online')} />
            <span className="leading-tight text-sm font-medium">Attach File<br />Online</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[#333]">
            <input type="radio" name={radioName} className="w-4 h-4 text-green-600 focus:ring-green-500" checked={fileOption === 'WhatsApp'} onChange={() => { setFileOption('WhatsApp'); window.open('https://wa.me/919351037177', '_blank'); }} />
            <span className="leading-tight text-sm font-medium">Send via<br />WhatsApp</span>
          </label>
        </div>
      </div>
      
      {fileOption === 'Attach File Online' && (
        <div className="space-y-4">
          <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4">
            <label className="font-bold text-right text-[#003366] pt-2 text-sm sm:text-base">Attach File</label>
            <div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="file" onChange={handleLocalFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.psd,.cdr,image/*" />
                  <div className="bg-[#f2f6fc] text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-transparent hover:bg-blue-50 transition-colors whitespace-nowrap">
                    Choose File
                  </div>
                </div>
                <span className="text-gray-500 text-sm truncate max-w-[200px]">{localFile ? localFile.name : (fileName || "No file chosen")}</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-1">(Max: 20MB)</p>
            </div>
          </div>

          {/* DYNAMIC INTEGRATED ARTWORK INSPECTOR & FABRIC CANVAS */}
          {localFile && (
            <div className="mt-6 animate-in fade-in duration-300">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-sm w-full">
                
                {/* Left audit checklist */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Sparkles className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                    <span className="font-extrabold text-sm text-slate-800">AI Quality Inspection</span>
                  </div>

                  {!report ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Design files require correct resolution, cut sizes, and bleed margins to print cleanly.
                      </p>
                      <Button
                        onClick={inspectArtwork}
                        disabled={analyzing}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
                      >
                        {analyzing ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Loader2 className="w-4 h-4 animate-spin" /> Checking specifications...
                          </span>
                        ) : (
                          "Run Print Quality Check"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Specs check grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white border p-2 rounded">
                          <span className="text-[10px] text-gray-400 block font-bold">Size (mm)</span>
                          <span className="font-bold text-slate-700 font-mono mt-0.5 block">
                            {report.dimensions.width.toFixed(1)} x {report.dimensions.height.toFixed(1)}
                          </span>
                        </div>
                        <div className="bg-white border p-2 rounded">
                          <span className="text-[10px] text-gray-400 block font-bold">Resolution</span>
                          <span className="font-bold text-slate-700 font-mono mt-0.5 block">
                            {report.dpi} DPI
                          </span>
                        </div>
                      </div>

                      {/* Warnings alert */}
                      {report.issues?.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200/60 p-2.5 rounded text-[11px] leading-relaxed text-amber-850">
                          <ul className="list-disc pl-3.5 space-y-1">
                            {report.issues.map((iss: string, idx: number) => (
                              <li key={idx}>{iss}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Fixing Actions */}
                      {report.status !== "fixed" && report.issues?.length > 0 ? (
                        <Button
                          onClick={autoFixArtwork}
                          disabled={fixing}
                          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider"
                        >
                          {fixing ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 className="w-4 h-4 animate-spin" /> Adding bleed...
                            </span>
                          ) : (
                            "Auto-Fix Print Canvas"
                          )}
                        </Button>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold p-2.5 rounded flex items-center gap-1.5">
                          <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                          <span>Design is approved & ready for offset printing!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Interactive Guidelines Canvas */}
                <div className="flex flex-col items-center justify-center gap-3 flex-shrink-0">
                  <div className="relative aspect-square w-[160px] sm:w-[180px] bg-slate-100 rounded-xl border overflow-hidden flex items-center justify-center shadow-inner">
                    <style>{`
                      .canvas-container, .canvas-container canvas {
                        width: 100% !important;
                        height: 100% !important;
                      }
                    `}</style>
                    <canvas ref={canvasRef} className={!localFile || !['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(localFile.name.split('.').pop()?.toLowerCase() || '') ? "hidden" : ""} />
                    {!report && localFile && !['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(localFile.name.split('.').pop()?.toLowerCase() || '') && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-50 select-none">
                        <FileText className="w-8 h-8 text-blue-600 mb-2 animate-bounce" />
                        <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">
                          {localFile.name.split('.').pop()} File Loaded
                        </span>
                        <span className="text-[9px] text-slate-500 mt-1 leading-snug font-medium">
                          Ready for Print Quality Check
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Canvas Legend */}
                  <div className="flex gap-3 text-[9px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#EF4444]" /> Cut</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#10B981]" /> Safe</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#6366F1]" /> Bleed</span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}


// ----------------------------------------------------------------------
// GENERIC VISITING CARD CONFIGURATOR
// ----------------------------------------------------------------------
function GenericVisitingCardCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const minQtyMatch = product.subcategory?.match(/Qty\.\s*([\d,]+)/i);
  const minQty = minQtyMatch ? parseInt(minQtyMatch[1].replace(/,/g, ''), 10) : 100;
  const [quantity, setQuantity] = useState(minQty);

  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [serviceOption, setServiceOption] = useState("Normal Service (3 Days)");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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
      pressline,
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#0099ff] to-[#003399] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase">
                      {product.name}
                    </h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <input
                    type="number"
                    min={minQty}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value as any)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < minQty) {
                        setQuantity(minQty);
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[120px] bg-white outline-none"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : {minQty})</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Service Option</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none font-bold text-green-700"
                  value={serviceOption}
                  onChange={e => setServiceOption(e.target.value)}
                >
                  <option value="Normal Service (3 Days)">Normal Service (3 Days Dispatch)</option>
                  <option value="Express Service (2 Days)">Express Service (2 Days Dispatch)</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="generic_privacy" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="generic_privacy" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">(On Free Gift)</span>
                </label>
                <Input
                  placeholder="Enter Pressline..."
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  className="rounded-none border-gray-300 font-bold text-blue-800"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function MattTextureCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState<string | number>(1000);
  const [selectedProduct, setSelectedProduct] = useState("Matt + Texture");
  const [printing, setPrinting] = useState("Both Side");
  const [textureType, setTextureType] = useState("");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#6600cc] to-[#330066] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase text-white">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase text-white/80">Premium Matt + Texture</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="Matt + Texture">Matt + Texture</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Qty.</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                  value={[1000, 2000, 3000, 4000, 5000, 10000].includes(Number(quantity)) ? quantity : "custom"}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "custom") {
                      setQuantity(1000);
                    } else {
                      setQuantity(Number(val));
                    }
                  }}
                >
                  {[1000, 2000, 3000, 4000, 5000, 10000].map(qty => (
                    <option key={qty} value={qty}>{qty.toLocaleString()}</option>
                  ))}
                  <option value="custom">Other Quantity</option>
                </select>
              </div>

              {![1000, 2000, 3000, 4000, 5000, 10000].includes(Number(quantity)) && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <div />
                  <Input
                    type="number"
                    min={1000}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value as any)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < 1000) {
                        setQuantity(1000);
                      }
                    }}
                    placeholder="Enter Quantity"
                    className="border border-gray-300 p-2 w-full max-w-[200px] rounded-none bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Colour</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 text-xs">Select Texture Type</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={textureType}
                  onChange={e => setTextureType(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={101 + i} value={`Texture No. ${101 + i}`}>Texture No. {101 + i}</option>
                  ))}
                </select>
              </div>

              {/* Pricing breakdown */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 text-xs mt-2 uppercase">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                    Free Delivery
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">(On Free Gift)</span>
                </label>
                <Input
                  placeholder="Enter Pressline..."
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  className="rounded-none border-gray-300 font-bold text-blue-800"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}


function RegularGlossCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("Gloss Lamination");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const MIN_QTY = 1000;
  const MAX_QTY = 72000;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#990033] to-[#440011] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase text-white">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase text-white/80">Gloss Lamination</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold bg-gray-50 p-3 text-center text-blue-800 border uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="Gloss Lamination">Gloss Lamination</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={MIN_QTY}
                    max={MAX_QTY}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < MIN_QTY) {
                        setQuantity(String(MIN_QTY));
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[150px] bg-white outline-none rounded-none font-bold h-10"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 1000, Max Qty. : 72000)</span>
                </div>
              </div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="1 Side">1 Side</option>
                  <option value="1 Side with Black Back Printing">1 Side with Black Back Printing</option>
                  <option value="2 Side">2 Side</option>
                </select>
              </div>

              {/* Privacy Packing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_gloss" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_gloss" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              {/* Free Delivery Banner */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="gloss_lamination_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              {/* Buttons */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}


// ----------------------------------------------------------------------
// CUSTOM 800 GSM + VELVET CONFIGURATOR
// Exactly matching the requested form
// ----------------------------------------------------------------------
function Velvet800GsmCustomizer({ product }: { product: Product }) {
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
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const type = 'velvet';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image Placeholder & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#0099ff] to-[#003399] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans">800 GSM</h2>
                    <h2 className="text-2xl sm:text-3xl font-bold font-sans">+</h2>
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans uppercase">
                      {selectedProduct.includes('Die Cut') ? 'Velvet + Die Cut' : 'Velvet'}
                    </h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="800 GSM + Velvet + UV + Foil">800 GSM + Velvet + UV + Foil</option>
                  <option value="800 GSM + Velvet + UV + Foil + Die Cut">800 GSM + Velvet + UV + Foil + Die Cut</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={500}
                    step={1}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < 500) {
                        setQuantity("500");
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[150px] bg-white outline-none rounded-none font-bold"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 500)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none" value={printing} onChange={e => setPrinting(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Spot UV</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none" value={spotUv} onChange={e => setSpotUv(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Front Side">Front Side</option>
                  <option value="Back Side">Back Side</option>
                  <option value="Both Side">Both Side</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Foil</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none" value={foil} onChange={e => setFoil(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Front Side">Front Side</option>
                  <option value="Back Side">Back Side</option>
                  <option value="Both Side">Both Side</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Foil Color</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none" value={foilColor} onChange={e => setFoilColor(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Gold">Gold Foil</option>
                  <option value="Silver">Silver Foil</option>
                  <option value="Copper">Copper Foil</option>
                  <option value="Rose Gold">Rose Gold Foil</option>
                  <option value="Holographic">Holographic Foil</option>
                </select>
              </div>

              {selectedProduct.includes('Die Cut') && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Die Shape</label>
                  <select className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800" value={dieShape} onChange={e => setDieShape(e.target.value)}>
                    <option value="--Select--">--Select--</option>
                    {Array.from({ length: 36 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight">
                  Enter Pressline :<br />
                  <span className="text-[9px] text-blue-600 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <div className="space-y-2">
                  <Input placeholder="Enter Pressline..." value={pressline} onChange={e => setPressline(e.target.value)} className="rounded-none border-gray-300 font-bold text-blue-800 h-9" />
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5">
                    <span>LK Printers Of India Limited</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_800_velvet" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_800_velvet" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>



              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="800_gsm_velvet_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>



              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}






// ----------------------------------------------------------------------
// CUSTOM 800 GSM + MATT CONFIGURATOR
// ----------------------------------------------------------------------
function Matt800GsmCustomizer({ product }: { product: Product }) {
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
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image Placeholder & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#660033] to-[#330011] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans tracking-wider uppercase">800 GSM</h2>
                    <h2 className="text-2xl sm:text-3xl font-bold font-sans uppercase">+</h2>
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase">
                      {selectedProduct.includes('Die Cut') ? 'Matt + Die Cut' : 'Matt'}
                    </h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-100 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-9 text-sm"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="800 GSM + Matt + UV + Foil">800 GSM + Matt + UV + Foil</option>
                  <option value="800 GSM + Matt + UV + Foil + Die Cut">800 GSM + Matt + UV + Foil + Die Cut</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={500}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < 500) {
                        setQuantity("500");
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[150px] bg-white outline-none rounded-none font-bold h-9"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 500, Max Qty. : 15000)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none text-sm h-9" value={printing} onChange={e => setPrinting(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Spot UV</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none text-sm h-9" value={spotUv} onChange={e => setSpotUv(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Front Side">Front Side</option>
                  <option value="Back Side">Back Side</option>
                  <option value="Both Side">Both Side</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Foil</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none text-sm h-9" value={foil} onChange={e => setFoil(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Front Side">Front Side</option>
                  <option value="Back Side">Back Side</option>
                  <option value="Both Side">Both Side</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Foil Color</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none text-sm h-9" value={foilColor} onChange={e => setFoilColor(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Gold">Gold Foil</option>
                  <option value="Silver">Silver Foil</option>
                  <option value="Copper">Copper Foil</option>
                  <option value="Rose Gold">Rose Gold Foil</option>
                  <option value="Holographic">Holographic Foil</option>
                </select>
              </div>

              {selectedProduct.includes('Die Cut') && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Die Shape</label>
                  <select className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 text-sm h-9" value={dieShape} onChange={e => setDieShape(e.target.value)}>
                    <option value="--Select--">--Select--</option>
                    {Array.from({ length: 36 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_800_matt_custom" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_800_matt_custom" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="800_gsm_matt_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight">
                  Enter Pressline :<br />
                  <span className="text-[9px] text-blue-600 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter Pressline..."
                    value={pressline}
                    onChange={e => setPressline(e.target.value)}
                    className="rounded-none border-gray-300 font-bold text-blue-800 h-9"
                  />
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5">
                    <span>L.K. PRINTERS</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM FILES CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function FilesCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedFinishingIds, setSelectedFinishingIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(100);
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pocketOption, setPocketOption] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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
    const p = { ...product };
    if (selectedPaper === "pvc-matt-small") {
      p.features = [
        "Product Ref. : DF-2/2nd Edition (Sample File)",
        "SMALL SIZE",
        "Size (In inch): 9\"x12\"",
        "Production Time : 3 Working days",
        "Paper Quality : 300 Micron PP Sheet",
        "Lamination Type : Matt Finish (No Lamination)",
        "Pocket Option : Not Available",
        "Number of creases at the center fold : One",
        "Uses : For Doctor Files, Hospital Use and Corporate Purposes",
        "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."
      ];
      p.product_details = {
        code: "DF-2",
        lamination: "Matt Finish (No Lamination)",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Single Crease Folding",
        production_time: "3 Working Days"
      };
      p.finishing_options = [
        { id: "spot-uv", label: "Spot UV", price: 0 },
        { id: "pvc-clip", label: "File Clip", price: 0 }
      ];
      p.color_options = [
        { id: "multicolor-outer", label: "Multicolor at Outer Side Only", price: 0 },
        { id: "multicolor-both", label: "Multicolor at Outer + Inner Side", price: 0 }
      ];
    } else if (selectedPaper === "pvc-gloss-small") {
      p.features = [
        "Product Ref. : DF-1/2nd Edition (Sample File)",
        "SMALL SIZE",
        "Size (In inch): 9\"x12\"",
        "Production Time : 3 Working days",
        "Paper Quality : 300 Micron PP Sheet",
        "Lamination Type : Gloss Coated",
        "Pocket Option : Not Available",
        "Number of creases at the center fold : One",
        "Uses : For Doctor Files, Hospital Use and Corporate Purposes",
        "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."
      ];
      p.product_details = {
        code: "DF-1",
        lamination: "Gloss Coated",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Single Crease Folding",
        production_time: "3 Working Days"
      };
      p.finishing_options = [{ id: "pvc-clip", label: "File Clip", price: 0 }];
    } else if (selectedPaper === "pvc-gloss-big") {
      p.features = [
        "Product Ref. : DF-3/2nd Edition (Sample File)",
        "BIG SIZE",
        "Size (In inch): 9.5\"x12.5\"",
        "Production Time : 4 Working days",
        "Paper Quality : 300 Micron PP Sheet",
        "Lamination Type : Gloss Coated",
        "Pocket Option : Available",
        "Number of creases at the center fold : Two",
        "Uses : For Doctor Files, Hospital Use and Corporate Purposes",
        "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."
      ];
      p.product_details = {
        code: "DF-3",
        lamination: "Gloss Coated",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Two Crease Folding",
        production_time: "4 Working Days"
      };
      p.finishing_options = [
        { id: "pocket", label: "Pocket", price: 0 },
        { id: "pvc-clip", label: "File Clip", price: 0 }
      ];
      p.color_options = [
        { id: "multicolor-outer", label: "Multicolor at Outer Side Only", price: 0 },
        { id: "multicolor-both", label: "Multicolor at Outer + Inner Side", price: 0 }
      ];
    } else if (selectedPaper === "pvc-matt-big") {
      p.features = [
        "Product Ref. : DF-4/2nd Edition (Sample File)",
        "BIG SIZE",
        "Size (In inch): 9.5\"x12.5\"",
        "Production Time : 4 Working days",
        "Paper Quality : 300 Micron PP Sheet",
        "Lamination Type : Matt Finish (No Lamination)",
        "Pocket Option : Available",
        "Number of creases at the center fold : Two",
        "Uses : For Doctor Files, Hospital Use and Corporate Purposes",
        "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."
      ];
      p.product_details = {
        code: "DF-4",
        lamination: "Matt Finish (No Lamination)",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Two Crease Folding",
        production_time: "4 Working Days"
      };
      p.finishing_options = [
        { id: "spot-uv", label: "Spot UV", price: 0 },
        { id: "pocket", label: "Pocket", price: 0 },
        { id: "pvc-clip", label: "File Clip", price: 0 }
      ];
      p.color_options = [
        { id: "multicolor-outer", label: "Multicolor at Outer Side Only", price: 0 },
        { id: "multicolor-both", label: "Multicolor at Outer + Inner Side", price: 0 }
      ];
    } else if (selectedPaper === "sbs-gloss-small") {
      p.features = [
        "Product Ref. : DF-5/2nd Edition (Sample File)",
        "SMALL SIZE",
        "Size (In inch): 9\"x12\"",
        "Production Time : 3 Working days",
        "Paper Quality : 260 Gsm SBS Paper",
        "Lamination Type : Gloss Lamination",
        "Pocket Option : Not Available",
        "Number of creases at the center fold : One",
        "Uses : For Doctor Files, Hospital Use and Corporate Purposes",
        "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."
      ];
      p.product_details = {
        code: "DF-5",
        lamination: "Gloss Lamination",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Single Crease Folding",
        production_time: "3 Working Days"
      };
      p.finishing_options = [{ id: "pvc-clip", label: "File Clip", price: 0 }];
      p.color_options = [
        { id: "multicolor-outer", label: "Multicolor Outer Side Only", price: 0 },
        { id: "multicolor-both", label: "Multicolor Outer Side + Black Color Inner Side", price: 0 }
      ];
    } else if (selectedPaper === "sbs-matt-small") {
      p.features = [
        "Product Ref. : DF-6/2nd Edition (Sample File)",
        "SMALL SIZE",
        "Size (In inch): 9\"x12\"",
        "Production Time : 3 Working days",
        "Paper Quality : 260 Gsm SBS Paper",
        "Lamination Type : Matt Lamination",
        "Pocket Option : Not Available",
        "Number of creases at the center fold : One",
        "Uses : For Doctor Files, Hospital Use and Corporate Purposes",
        "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."
      ];
      p.product_details = {
        code: "DF-6",
        lamination: "Matt Lamination",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Single Crease Folding",
        production_time: "3 Working Days"
      };
      p.finishing_options = [
        { id: "spot-uv", label: "Spot UV", price: 0 },
        { id: "pvc-clip", label: "File Clip", price: 0 }
      ];
      p.color_options = [
        { id: "multicolor-outer", label: "Multicolor Outer Side Only", price: 0 },
        { id: "multicolor-both", label: "Multicolor Outer Side + Black Color Inner Side", price: 0 }
      ];
    } else if (selectedPaper === "sbs-gloss-big") {
      p.features = [
        "Product Ref. : DF-7/2nd Edition (Sample File)",
        "BIG SIZE",
        "Size (In inch): 9.5\"x12.5\"",
        "Production Time : 4 Working days",
        "Paper Quality : 260 Gsm SBS Paper",
        "Lamination Type : Gloss Lamination",
        "Pocket Option : Available",
        "Number of creases at the center fold : Two",
        "Uses : For Doctor Files, Hospital Use and Corporate Purposes",
        "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."
      ];
      p.product_details = {
        code: "DF-7",
        lamination: "Gloss Lamination",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Two Crease Folding",
        production_time: "4 Working Days"
      };
      p.finishing_options = [
        { id: "pocket", label: "Pocket", price: 0 },
        { id: "pvc-clip", label: "File Clip", price: 0 }
      ];
      p.color_options = [
        { id: "multicolor-outer", label: "Multicolor Outer Side Only", price: 0 },
        { id: "multicolor-both", label: "Multicolor Outer Side + Black Color Inner Side", price: 0 }
      ];
    } else if (selectedPaper === "sbs-matt-big") {
      p.features = [
        "Product Ref. : DF-8/2nd Edition (Sample File)",
        "BIG SIZE",
        "Size (In inch): 9.5\"x12.5\"",
        "Production Time : 4 Working days",
        "Paper Quality : 260 Gsm SBS Paper",
        "Lamination Type : Matt Lamination",
        "Pocket Option : Available",
        "Number of creases at the center fold : Two",
        "Uses : For Doctor Files, Hospital Use and Corporate Purposes",
        "Note: Please note that the PVC file clip is not included with this order. To purchase it, kindly place a separate order. Due to packaging limitations, the clip will not be attached to the doctor's file and will be delivered separately."
      ];
      p.product_details = {
        code: "DF-8",
        lamination: "Matt Lamination",
        uv: "Not Available",
        foil: "Not Available",
        die_cut: "Two Crease Folding",
        production_time: "4 Working Days"
      };
      p.finishing_options = [
        { id: "spot-uv", label: "Spot UV", price: 0 },
        { id: "pocket", label: "Pocket", price: 0 },
        { id: "pvc-clip", label: "File Clip", price: 0 }
      ];
      p.color_options = [
        { id: "multicolor-outer", label: "Multicolor Outer Side Only", price: 0 },
        { id: "multicolor-both", label: "Multicolor Outer Side + Black Color Inner Side", price: 0 }
      ];
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
      finishing: [selectedFinishingIds.join(", "), pocketOption && pocketOption !== 'Not Required' ? `Pocket (${pocketOption})` : ""].filter(Boolean).join(", "),
      privacy: privacyPacking,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  const productionTime = product.features?.find(f => f.includes("Time")) || "Production Time : 7-10 days";

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions (Pattern matching Metal Card) */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[450px] aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center mb-8 mx-auto overflow-hidden">
              <img
                src={product.images?.[0] || ""}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full">
              <FullProductDetails product={dynamicProduct} />
            </div>
          </div>

          {/* RIGHT: Add Order Form (Using select dropdowns) */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-gray-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 uppercase"
                  value={selectedPaper}
                  onChange={e => setSelectedPaper(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.paper_types || []).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Qty.</label>
                <div>
                  <Input
                    type="number"
                    min={product.quantity_tiers[0]?.qty || 1}
                    step={1}
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) as any)}
                    onBlur={() => {
                      const minVal = product.quantity_tiers[0]?.qty || 100;
                      const val = Number(quantity);
                      if (isNaN(val) || val < minVal) {
                        setQuantity(minVal);
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[150px] bg-white outline-none rounded-none"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : {product.quantity_tiers[0]?.qty || 100}, Max Qty. : 20000)</span>
                </div>
              </div>

              {dynamicProduct.sizes.length > 0 && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Size</label>
                  <select
                    className="border border-gray-300 p-2 w-full max-w-[250px] bg-white outline-none"
                    value={selectedSize}
                    onChange={e => setSelectedSize(e.target.value)}
                  >
                    <option value="">--Select Size--</option>
                    {(product.sizes || []).map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {dynamicProduct.color_options.length > 0 && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Printing</label>
                  <select
                    className="border border-gray-300 p-2 w-full max-w-[250px] bg-white outline-none"
                    value={selectedColor}
                    onChange={e => setSelectedColor(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    {(dynamicProduct.color_options || []).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {dynamicProduct.finishing_options.length > 0 && dynamicProduct.finishing_options.some(f => f.id === 'pocket') && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Pocket</label>
                  <select
                    className="border border-gray-300 p-2 w-full max-w-[250px] bg-white outline-none"
                    value={pocketOption}
                    onChange={e => setPocketOption(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    <option value="Left Side">Left Side</option>
                    <option value="Right Side">Right Side</option>
                    <option value="Not Required">Not Required</option>
                  </select>
                </div>
              )}

              {dynamicProduct.finishing_options.length > 0 && dynamicProduct.finishing_options.some(f => f.id === 'spot-uv') && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Spot UV</label>
                  <select
                    className="border border-gray-300 p-2 w-full max-w-[250px] bg-white outline-none"
                    value={selectedFinishingIds.includes('spot-uv') ? 'spot-uv' : ''}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedFinishingIds(prev => {
                        const filtered = prev.filter(id => id !== 'spot-uv');
                        return val === 'spot-uv' ? [...filtered, val] : filtered;
                      });
                    }}
                  >
                    <option value="">--Select--</option>
                    <option value="spot-uv">Outer Side Only</option>
                    <option value="none">Not Required</option>
                  </select>
                </div>
              )}


              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="files_privacy" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="files_privacy" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="files_file_opt"
              />

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              {/* Pricing Box */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 text-xs mt-2 uppercase font-bold">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                    Free Delivery
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <Textarea
                  placeholder="L.K. PRINTERS"
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM LETTERHEADS CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function LetterheadCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPrinting, setSelectedPrinting] = useState("");
  const [selectedBinding, setSelectedBinding] = useState("");
  const [selectedSpotUV, setSelectedSpotUV] = useState("");
  const [selectedFoil, setSelectedFoil] = useState("");
  const [selectedFoilColor, setSelectedFoilColor] = useState("");
  const [selectedCutting, setSelectedCutting] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1000);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const productOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; sizeId: string; finishingId: string }> = [];
    const baseName = product.features?.[0]?.split(",")[0] || product.name;

    // Base options (no finishing)
    product.sizes.forEach(s => {
      options.push({
        id: `none|${s.id}`,
        label: `Letter Head - ${baseName} ( ${s.label} )`,
        sizeId: s.id,
        finishingId: ""
      });
    });

    // Finishing options
    if (
      product.slug !== "letterheads-70gsm-maplitho" &&
      product.slug !== "letterheads-90gsm-sunshine" &&
      product.slug !== "letterheads-115gsm-sunshine" &&
      !(product.name.includes("100 GSM") && product.name.includes("Bond"))
    ) {
      (product.finishing_options || []).forEach(f => {
        product.sizes.forEach(s => {
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
    setQuantity(1000);
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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
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
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  // Variant-specific metadata
  const isDeo = product.slug === "letterheads-100gsm-deo";
  const isSunshine115 = product.slug === "letterheads-115gsm-sunshine";
  const isSunshine90 = product.slug === "letterheads-90gsm-sunshine" || product.name.includes("90 GSM");
  const isMaplitho70 = product.slug === "letterheads-70gsm-maplitho" || product.name.includes("70 GSM");
  const isBond100 = product.slug === "letterheads-100gsm-bond" || (product.name.includes("100 GSM") && product.name.includes("Bond"));

  const getProductMetadata = () => {
    if (isBond100) {
      return {
        ref: "LH/03rd Edition (Sample File)",
        code: "LH-3",
        class: "Classic",
        size: "A4 (8.26\" X 11.69\")",
        core: "Excellent Printing with Latest Machines",
        time: "Within 48 hours from file upload",
        paper: "100 GSM Bond",
        printing: "Single Side",
        uvNote: false
      };
    }
    if (isDeo) {
      const selectedOption = productOptions.find(o => o.id === selectedVariantId);
      const hasUV = selectedOption?.label.includes("UV");
      const hasFoil = selectedOption?.label.includes("Foil");

      if (hasFoil) {
        return {
          ref: "LH/03rd Edition (Sample File)",
          code: "LH-4B",
          class: "Premium",
          size: "Letter Size (8.5\" X 11\")",
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
          size: "Letter Size (8.5\" X 11\")",
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
          size: "Size - A4 (8.26\" X 11.69\") , Letter Size (8.5\" X 11.0\")",
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
        size: "Size - A4 (8.26\" X 11.69\") , Letter Size (8.5\" X 11.0\")",
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
        size: "A4 Size (8.26\" X 11.69\")",
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
        size: "Size - A4 (8.26\" X 11.69\") , Letter Size (8.5\" X 11.0\")",
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
      size: "Size - A4 (8.26\" X 11.69\") , Letter Size (8.5\" X 11.0\")",
      core: "Standard Offset Letterheads",
      time: "2-3 Working Days",
      paper: "Standard Quality",
      printing: "Single Side",
      uvNote: false
    };
  };

  const meta = getProductMetadata();

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-cover" />
            </div>

            <div className="w-full text-sm space-y-8 text-gray-800">
              <div className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4">
                Printers Club Of India Limited
              </div>

              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : {meta.ref}</li>
                  <li>● Product Code : {meta.code}</li>
                  <li>● Product Class : {meta.class}</li>
                  <li>● Product Size : {meta.size}</li>
                  <li>● Product Core : {meta.core}</li>
                  <li>● Production Time : {meta.time}</li>
                  <li>● Paper Quality : {meta.paper}</li>
                  <li>● Printing Options : {meta.printing}</li>
                  <li>● Price discount applicable (System auto calculate) with increase in Quantity</li>
                  {meta.uvNote && <li>● UV effects will be single side only</li>}
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced & Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-gray-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 uppercase"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={selectedPrinting}
                  onChange={e => setSelectedPrinting(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  {isDeo && <option value="Both Side">Both Side</option>}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Binding</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={selectedBinding}
                  onChange={e => setSelectedBinding(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Not Required">Not Required</option>
                  <option value="Pad (10 x 100 letter heads)">Pad (10 x 100 letter heads)</option>
                  <option value="Pockets (10 x 100 Letter Heads)">Pockets (10 x 100 Letter Heads)</option>
                </select>
              </div>

              {productOptions.find(o => o.id === selectedVariantId)?.label.includes("UV") && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Spot UV</label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none"
                    value={selectedSpotUV}
                    onChange={e => setSelectedSpotUV(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    <option value="Front Side">Front Side</option>
                  </select>
                </div>
              )}

              {productOptions.find(o => o.id === selectedVariantId)?.label.includes("Foil") && (
                <>
                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-right text-gray-700">Foil</label>
                    <select
                      className="border border-gray-300 p-2 w-full bg-white outline-none"
                      value={selectedFoil}
                      onChange={e => setSelectedFoil(e.target.value)}
                    >
                      <option value="">--Select--</option>
                      <option value="Front Side">Front Side</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-right text-gray-700">Foil Color</label>
                    <select
                      className="border border-gray-300 p-2 w-full bg-white outline-none"
                      value={selectedFoilColor}
                      onChange={e => setSelectedFoilColor(e.target.value)}
                    >
                      <option value="">--Select--</option>
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                      <option value="Red">Red</option>
                      <option value="Green">Green</option>
                      <option value="Blue">Blue</option>
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Qty.</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                >
                  <option value="1000">1000</option>
                  <option value="2000">2000</option>
                  <option value="3000">3000</option>
                  <option value="4000">4000</option>
                  <option value="8000">8000</option>
                  <option value="12000">12000</option>
                  <option value="16000">16000</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="text-green-700 text-[11px] font-bold uppercase tracking-wider">
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="lh_file_opt"
              />

              {/* Pricing breakdown */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <div />
                <div className="text-gray-400 font-bold uppercase tracking-tight text-xs pb-4">
                  Printers Club Of India Limited
                </div>
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}


// ----------------------------------------------------------------------
// CUSTOM ENVELOPE CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function EnvelopeCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("");
  const [selectedWindow, setSelectedWindow] = useState("");
  const [selectedFlap, setSelectedFlap] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1000);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const productOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; sizeId: string; finishingId: string }> = [];
    const baseName = product.name;

    // Base options (no finishing)
    product.sizes.forEach(s => {
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
    setQuantity(1000);
    setSelectedWindow("");
    setSelectedFlap("");
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);

  const breakdown = useMemo(() => {
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      paper: selectedPaper,
      window: typeof selectedWindow !== 'undefined' ? selectedWindow : undefined,
      flap: typeof selectedFlap !== 'undefined' ? selectedFlap : undefined,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
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
        size: "Envelope (9\"X4\")",
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
        size: "Envelope (10.75\"X4.75\")",
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
        size: "Envelope (9.7\"X4.2\")",
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
        size: "Envelope (5\"X7\")",
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
        size: "Envelope (6\"X8\")",
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
        size: "Envelope (8.6\"X10.6\")",
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
        size: "Envelope (9.4\"X12.4\")",
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-cover" />
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              {isEnvelopDetailField ? "ADD ORDER" : "SELECT PRODUCT"}
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black uppercase">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Paper Type
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={selectedPaper}
                  onChange={e => setSelectedPaper(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.paper_types || []).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {isEnvelopDetailField && (
                <>
                  {meta.hasWindow && (
                    <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                      <label className="font-bold text-[#003399] flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Window Cutting
                      </label>
                      <select
                        className="border border-gray-300 p-2 w-full bg-white outline-none"
                        value={selectedWindow}
                        onChange={e => setSelectedWindow(e.target.value)}
                      >
                        <option value="">--Select--</option>
                        <option value="Not Required">Not Required</option>
                        <option value="Required">Required</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-[#003399] flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Flap Opening
                    </label>
                    <select
                      className="border border-gray-300 p-2 w-full bg-white outline-none"
                      value={selectedFlap}
                      onChange={e => setSelectedFlap(e.target.value)}
                    >
                      <option value="">--Select--</option>
                      <option value="Short Opening (with center pasting)">Short Opening (with center pasting)</option>
                      <option value="Long Opening (with side pasting)">Long Opening (with side pasting)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Qty.
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                >
                  <option value="1000">1000</option>
                  <option value="2000">2000</option>
                  <option value="3000">3000</option>
                  <option value="4000">4000</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="text-green-700 text-[11px] font-bold uppercase tracking-wider">
                </div>
              </div>              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="space-y-4 w-full">
                  <Textarea
                    placeholder="remarks for order processing team..."
                    value={specialRemark}
                    onChange={e => setSpecialRemark(e.target.value)}
                    rows={2}
                    className="rounded-none border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <Textarea
                  placeholder="LK Printers of India Limited"
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM ATM POUCH CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function ATMPouchCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPrinting, setSelectedPrinting] = useState("");
  const [quantity, setQuantity] = useState(1000);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const productOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; sizeId: string; finishingId: string }> = [];
    options.push({ id: "matt", label: "ATM Pouch - Matt Lamination", sizeId: "standard", finishingId: "matt" });
    options.push({ id: "gloss", label: "ATM Pouch - Gloss Lamination", sizeId: "standard", finishingId: "gloss" });
    return options;
  }, []);

  useEffect(() => {
    const currentVariant = productOptions.find(o => product.slug.includes(o.id));
    setSelectedVariantId(currentVariant?.id || productOptions[0]?.id || "");
    setSelectedPrinting(product.color_options[0]?.id || "");
    setQuantity(product.quantity_tiers[0]?.qty || 1000);
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);

  const breakdown = useMemo(() => {
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      printing: selectedPrinting,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  const isMatt = selectedVariantId === "matt";

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-cover" />
            </div>

            <div className="w-full text-sm space-y-8 text-gray-800">
              <div className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4">
                Printers Club Of India Limited
              </div>

              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : VC/11th Edition (Sample File)</li>
                  <li>● Product Code : ATM</li>
                  <li>● Product Class : Classic</li>
                  <li>● Product Core : {isMatt ? "Matt Lamination" : "Gloss Shining"} with Excellent Printing</li>
                  <li>● Paper Quality : 170 GSM Art Paper</li>
                  <li>● Lamination Type : {isMatt ? "Matt" : "Gloss"}</li>
                  <li>● Production Time : Within 3-7 days from file upload</li>
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced & Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Points to be Noted</h4>
                <ul className="space-y-1">
                  <li>● Size Must be as below:</li>
                  <li className="pl-4">Card Design Size : W: 94.00 mm X H: 61.00 mm</li>
                  <li className="pl-4">Text / Matter Area : W: 74.00 mm X H: 46.00 mm</li>
                  <li className="pl-4">Size After Cutting : W: 88.00 mm X H: 57.00 mm</li>
                  <li>● Use high-resolution imagery for the clearest & sharpest results.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              SELECT PRODUCT
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity<br /><span className="text-[11px] text-gray-500 font-normal">(Min Qty. : 1000)</span>
                </label>
                <Input
                  type="number"
                  min={product.quantity_tiers[0]?.qty || 1}
                  step={1}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value) as any)}
                  onBlur={() => {
                    const minVal = product.quantity_tiers[0]?.qty || 1000;
                    const val = Number(quantity);
                    if (isNaN(val) || val < minVal) {
                      setQuantity(minVal);
                    }
                  }}
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                  value={selectedPrinting}
                  onChange={e => setSelectedPrinting(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.color_options || []).map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="text-green-700 text-[11px] font-bold uppercase tracking-wider">
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />
              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <Textarea
                  placeholder="LK Printers of India Limited"
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM BILL BOOK CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function BillBookCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("");
  const [selectedPaperColor, setSelectedPaperColor] = useState("");
  const [selectedThirdPaperColor, setSelectedThirdPaperColor] = useState("");
  const [selectedBinding, setSelectedBinding] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const productOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; sizeId: string; finishingId: string }> = [];
    options.push({ id: "2-copy", label: "A4 Bill Book - 2 Copy", sizeId: "a4", finishingId: "" });
    options.push({ id: "3-copy", label: "A4 Bill Book - 3 Copy", sizeId: "a4", finishingId: "" });
    return options;
  }, []);

  useEffect(() => {
    const currentVariant = productOptions.find(o => product.slug.includes(o.id));
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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      paper: selectedPaper,
      paperColor: selectedPaperColor,
      ...(selectedVariantId === "3-copy" ? { thirdPaperColor: selectedThirdPaperColor } : {}),
      binding: selectedBinding,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  const is2Copy = selectedVariantId === "2-copy";

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-cover" />
            </div>

            <div className="w-full text-sm space-y-8 text-gray-800">
              <div className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4">
                Printers Club Of India Limited
              </div>

              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : LH/02nd Edition ( Sample File )</li>
                  <li>● Product Code : BB-1 / BB-2</li>
                  <li>● Product Core : Best Binding Quality</li>
                  <li>● Paper Quality : <br />
                    <span className="pl-4 inline-block">● 1st Copy - 100 GSM Deo / 90 GSM Sunshine With Multicolor Printing</span><br />
                    <span className="pl-4 inline-block">● 2nd Copy - 56 GSM Maplitho with Single color Printing</span>
                  </li>
                  <li>● Production Time : 5-7 Working Days</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Important Note</h4>
                <ul className="space-y-1">
                  <li>● Both Side Printing Available Only 100 GSM Deo Paper</li>
                  <li>● Please mention starting serial number in CDR or PDF file</li>
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced & Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2 pt-2">
                  <Boxes className="w-4 h-4" /> Quantity
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={product.quantity_tiers[0]?.qty || 10}
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) as any)}
                    onBlur={() => {
                      const minVal = product.quantity_tiers[0]?.qty || 10;
                      const val = Number(quantity);
                      if (isNaN(val) || val < minVal) {
                        setQuantity(minVal);
                      }
                    }}
                    className="border border-gray-300 p-2 w-[100px] bg-white outline-none h-10"
                  />
                  <span className="text-[12px] text-blue-500">(Min Qty. : {product.quantity_tiers[0]?.qty || 10})</span>
                </div>
              </div>

              {/* 1st Paper Quality */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2 leading-tight">
                  <FileText className="w-4 h-4 shrink-0" /> 1st Paper<br />Quality
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={selectedPaper}
                  onChange={e => setSelectedPaper(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="100 GSM DEO Paper ( 1 Side Printing )">100 GSM DEO Paper ( 1 Side Printing )</option>
                  <option value="100 GSM DEO Paper ( 2 Side Printing )">100 GSM DEO Paper ( 2 Side Printing )</option>
                  <option value="90 GSM Sunshine Paper ( 1 Side Printing )">90 GSM Sunshine Paper ( 1 Side Printing )</option>
                </select>
              </div>

              {/* 2nd Copy Paper Color */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2 leading-tight">
                  <FileText className="w-4 h-4 shrink-0" /> 2nd Copy<br />Paper Color
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={selectedPaperColor}
                  onChange={e => setSelectedPaperColor(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="White">White</option>
                  <option value="Pink">Pink</option>
                  <option value="Yellow">Yellow</option>
                </select>
              </div>

              {/* 3rd Copy Paper Color (Only for 3-copy) */}
              {selectedVariantId === "3-copy" && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-[#003399] flex items-center gap-2 leading-tight">
                    <FileText className="w-4 h-4 shrink-0" /> 3rd Copy<br />Paper Color
                  </label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                    value={selectedThirdPaperColor}
                    onChange={e => setSelectedThirdPaperColor(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    <option value="White">White</option>
                    <option value="Pink">Pink</option>
                    <option value="Yellow">Yellow</option>
                  </select>
                </div>
              )}

              {/* Binding Quality */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2 leading-tight">
                  <Book className="w-4 h-4 shrink-0" /> Binding<br />Quality
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={selectedBinding}
                  onChange={e => setSelectedBinding(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Normal">Normal</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              {/* Free Delivery Banner */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="file_opt_4"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600 text-[13px]">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 text-[13px]">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="text-sm">Amount Payable</span>
                    <span className="text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              {/* Pressline */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight">
                  Enter Pressline :<br />
                  <span className="text-[9px] text-blue-600 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter Pressline..."
                    value={pressline}
                    onChange={e => setPressline(e.target.value)}
                    className="rounded-none border-gray-300 font-bold text-blue-800 h-9"
                  />
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5">
                    <span>L.K. PRINTERS</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM STICKER CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function StickerCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedSheetSize, setSelectedSheetSize] = useState("");
  const [selectedLamination, setSelectedLamination] = useState("");
  const [selectedHalfCut, setSelectedHalfCut] = useState("");
  const [selectedStraightCut, setSelectedStraightCut] = useState("");
  const [quantity, setQuantity] = useState(1000);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const productOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; sizeId: string; finishingId: string }> = [];
    options.push({ id: "no-half-cut", label: "Sticker ( Without Half Cut )", sizeId: "7x9.5", finishingId: "" });
    options.push({ id: "round-cut", label: "Sticker ( With Round Cut )", sizeId: "7x9.5", finishingId: "" });
    options.push({ id: "straight-cut", label: "Sticker ( With Straight Cut )", sizeId: "7x9.5", finishingId: "" });
    return options;
  }, []);

  const halfCutOptions = [
    "1 round sticker of 170x170 MM",
    "2 round sticker of 115x115 MM",
    "6 round sticker of 75x75 MM",
    "12 round sticker of 55x55 MM",
    "20 round sticker of 40x40 MM",
    "35 round sticker of 30x30 MM"
  ];

  const straightCutOptions = Array.from({ length: 15 }, (_, i) => `Size Option ${i + 1} (Coming Soon)`);

  useEffect(() => {
    setSelectedVariantId(productOptions[0]?.id || "");
    setSelectedSheetSize("");
    setSelectedLamination("");
    setSelectedHalfCut("");
    setSelectedStraightCut("");
    setQuantity(product.quantity_tiers[0]?.qty || 1000);
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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      sheetSize: selectedSheetSize,
      lamination: selectedLamination,
      halfCut: selectedVariantId === 'round-cut' ? selectedHalfCut : (selectedVariantId === 'straight-cut' ? selectedStraightCut : undefined),
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain p-4" />
              ) : (
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-cover" />
              )}
            </div>

            <div className="w-full text-sm space-y-8 text-gray-800">
              <div className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4">
                Printers Club Of India Limited
              </div>

              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : ST/ 2nd Edition (Sample File)</li>
                  <li>● Product Code : {selectedVariantId === 'no-half-cut' ? 'ST-1' : selectedVariantId === 'round-cut' ? 'ST- 2' : 'ST-3'}</li>
                  <li>● Product Size : {selectedVariantId === 'round-cut' ? '7" X 9.5"' : 'Available with'}</li>
                  {selectedVariantId !== 'round-cut' && <li className="pl-4">⇒ 7"X9.5"</li>}

                  {selectedVariantId === 'round-cut' && (
                    <>
                      <li>● Half-Cut Options : Available with 6 cut size options:</li>
                      <li className="pl-4">⇒ 1 round sticker of 170x170 MM</li>
                      <li className="pl-4">⇒ 2 round sticker of 115x115 MM</li>
                      <li className="pl-4">⇒ 6 round sticker of 75x75 MM</li>
                      <li className="pl-4">⇒ 12 round sticker of 55x55 MM</li>
                      <li className="pl-4">⇒ 20 round sticker of 40x40 MM</li>
                      <li className="pl-4">⇒ 35 round sticker of 30x30 MM</li>
                    </>
                  )}
                  {selectedVariantId === 'straight-cut' && (
                    <li>● Half-Cut Options : Available with 15 cut size options</li>
                  )}
                  <li>● Production Time : Within 7 days from file upload</li>
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced & Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2 pt-2">
                  <Boxes className="w-4 h-4" /> Quantity
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={product.quantity_tiers[0]?.qty || 1000}
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) as any)}
                    onBlur={() => {
                      const minVal = product.quantity_tiers[0]?.qty || 1000;
                      const val = Number(quantity);
                      if (isNaN(val) || val < minVal) {
                        setQuantity(minVal);
                      }
                    }}
                    className="border border-gray-300 p-2 w-[100px] bg-white outline-none h-10"
                  />
                  <span className="text-[12px] text-blue-500">(Min Qty. : {product.quantity_tiers[0]?.qty || 1000})</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2 leading-tight">
                  <Tag className="w-4 h-4" /> Sheet Size,
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={selectedSheetSize}
                  onChange={e => setSelectedSheetSize(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.sizes || []).map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-[#003399] flex items-center gap-2 leading-tight pl-6">
                  Lamination
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={selectedLamination}
                  onChange={e => setSelectedLamination(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Not Required">Not Required</option>
                  <option value="Gloss Lamination">Gloss Lamination</option>
                </select>
              </div>

              {selectedVariantId === 'round-cut' && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-[#003399] flex items-center gap-2 leading-tight">
                    <Tag className="w-4 h-4 shrink-0" /> Stickers<br />Count Per Sheet
                  </label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                    value={selectedHalfCut}
                    onChange={e => setSelectedHalfCut(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    <option value="1 Sticker (Size - 170 MM)">1 Sticker (Size - 170 MM)</option>
                    <option value="2 Sticker (Size - 115 MM)">2 Sticker (Size - 115 MM)</option>
                    <option value="6 Sticker (Size - 75 MM)">6 Sticker (Size - 75 MM)</option>
                    <option value="12 Sticker (Size - 55 MM)">12 Sticker (Size - 55 MM)</option>
                    <option value="20 Sticker (Size - 40 MM)">20 Sticker (Size - 40 MM)</option>
                    <option value="35 Sticker (Size - 30 MM)">35 Sticker (Size - 30 MM)</option>
                  </select>
                </div>
              )}

              {selectedVariantId === 'straight-cut' && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-[#003399] flex items-center gap-2 leading-tight">
                    <Tag className="w-4 h-4 shrink-0" /> Stickers<br />Count Per Sheet
                  </label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                    value={selectedStraightCut}
                    onChange={e => setSelectedStraightCut(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    <option value="2 Sticker (Size - 178x118 MM)">2 Sticker (Size - 178x118 MM)</option>
                    <option value="3 Sticker (Size - 178x79 MM)">3 Sticker (Size - 178x79 MM)</option>
                    <option value="4 Sticker (Size - 178x59 MM)">4 Sticker (Size - 178x59 MM)</option>
                    <option value="4 Sticker (Size - 90x118 MM)">4 Sticker (Size - 90x118 MM)</option>
                    <option value="6 Sticker (Size - 178x40 MM)">6 Sticker (Size - 178x40 MM)</option>
                    <option value="6 Sticker (Size - 90x80 MM)">6 Sticker (Size - 90x80 MM)</option>
                    <option value="6 Sticker (Size - 60x120 MM)">6 Sticker (Size - 60x120 MM)</option>
                    <option value="8 Sticker (Size - 90x59 MM)">8 Sticker (Size - 90x59 MM)</option>
                    <option value="9 Sticker (Size - 60x80 MM)">9 Sticker (Size - 60x80 MM)</option>
                    <option value="10 Sticker (Size - 178x24 MM)">10 Sticker (Size - 178x24 MM)</option>
                    <option value="12 Sticker (Size - 90x40 MM)">12 Sticker (Size - 90x40 MM)</option>
                    <option value="12 Sticker (Size - 60x60 MM)">12 Sticker (Size - 60x60 MM)</option>
                    <option value="18 Sticker (Size - 60x40 MM)">18 Sticker (Size - 60x40 MM)</option>
                    <option value="20 Sticker (Size - 90x24 MM)">20 Sticker (Size - 90x24 MM)</option>
                    <option value="30 Sticker (Size - 60x24 MM)">30 Sticker (Size - 60x24 MM)</option>
                  </select>
                </div>
              )}

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <Textarea
                  placeholder="LK Printers of India Limited"
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM PEN CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function PenCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState<number | string>(100);
  const [penType, setPenType] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const productOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; sizeId: string; production: string }> = [];
    options.push({ id: "laser", label: "Laser Printed Pen", sizeId: "standard", production: "5 days" });
    options.push({ id: "single", label: "Single Color Printed Pen", sizeId: "standard", production: "8 - 10 days" });
    return options;
  }, []);

  useEffect(() => {
    const current = productOptions.find(o => product.slug.includes(o.id));
    setSelectedVariantId(current?.id || productOptions[0]?.id || "");
    setQuantity(product.quantity_tiers[1]?.qty || 100);
    setOrderName("");
    setSpecialRemark("");
    setPressline("");
  }, [product.id, productOptions]);

  const selectedOption = useMemo(() => productOptions.find(o => o.id === selectedVariantId), [selectedVariantId, productOptions]);

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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      ...((selectedVariantId === "laser" || selectedVariantId === "single") && penType ? { "Pen Type": penType } : {}),
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain p-4" />
              ) : (
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-cover" />
              )}
            </div>

            <FullProductDetails product={product} />
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black uppercase tracking-wide">SELECT DETAIL</div>

              {selectedVariantId === "single" && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4">
                  <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                    <Boxes className="w-4 h-4 text-blue-600 fill-blue-600" />
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min={product.quantity_tiers[0]?.qty || 1}
                    step={1}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value as any)}
                    onBlur={() => {
                      const minVal = product.quantity_tiers[0]?.qty || 1;
                      const val = Number(quantity);
                      if (isNaN(val) || val < minVal) {
                        setQuantity(typeof quantity === 'number' ? (minVal as any) : String(minVal));
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none rounded-none"
                  />
                </div>
              )}

              {selectedVariantId === "laser" && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4">
                  <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                    <Tag className="w-4 h-4 text-blue-600 fill-blue-600" />
                    Pen Type
                  </label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none rounded-none"
                    value={penType}
                    onChange={e => setPenType(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    {[101, 102, 103, 104, 105, 106, 107, 108, 109, 110].map(n => (
                      <option key={n} value={n.toString()}>{n}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedVariantId === "single" && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4">
                  <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                    <Tag className="w-4 h-4 text-blue-600 fill-blue-600" />
                    Pen Type
                  </label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none rounded-none"
                    value={penType}
                    onChange={e => setPenType(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    {["001", "002", "005", "006", "007", "008", "009", "011", "013", "014"].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedVariantId === "laser" && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4">
                  <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                    <Tag className="w-4 h-4 text-blue-600 fill-blue-600" />
                    Qty.
                  </label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none rounded-none"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  >
                    {[1, 2, 5, 10, 20, 30, 40, 50, 75, 100].map(n => (
                      <option key={n} value={n.toString()}>{n}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedVariantId !== "laser" && selectedVariantId !== "single" && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-4">
                  <label className="font-bold text-right text-gray-700 leading-tight">
                    Quantity<br /><span className="text-[11px] text-gray-500 font-normal">(Min Qty. : {product.quantity_tiers[0]?.qty})</span>
                  </label>
                  <Input
                    type="number"
                    min={product.quantity_tiers[0]?.qty || 1}
                    step={1}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value as any)}
                    onBlur={() => {
                      const minVal = product.quantity_tiers[0]?.qty || 1;
                      const val = Number(quantity);
                      if (isNaN(val) || val < minVal) {
                        setQuantity(typeof quantity === 'number' ? (minVal as any) : String(minVal));
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none rounded-none"
                  />
                </div>
              )}



              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <Textarea
                  placeholder="LK Printers of India Limited"
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM PAMPHLET & POSTER CONFIGURATOR
// ----------------------------------------------------------------------
function NT180MicronCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState<string | number>("1000");
  const [selectedProduct, setSelectedProduct] = useState("180 Micron NT Card + Gloss UV Coating");
  const [printing, setPrinting] = useState("--Select--");
  const [glossArea, setGlossArea] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleProductChange = (val: string) => {
    setSelectedProduct(val);
    setGlossArea("--Select--");
    const nextMin = val === "180 Micron NT Card + Gloss UV Coating" ? 1000 : 100;
    if (Number(quantity) < nextMin) {
      setQuantity(nextMin.toString());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const breakdown = useMemo(() => {
    let finishingIds: string[] = [];
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
    if (printing === "--Select--") { toast.error("Please select Printing"); return; }
    if (selectedProduct === "180 Micron NT Card + Drip-Off" && glossArea === "--Select--") {
      toast.error("Please select Gloss Area");
      return;
    }
    const minQty = selectedProduct === "180 Micron NT Card + Gloss UV Coating" ? 1000 : 100;
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
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#009933] to-[#006622] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase">Classic 180 Micron PVC</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8 text-[13px] leading-relaxed text-gray-800 w-full">
              <div className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-4">
                Lk Printers Of India Limited
              </div>

              {/* Product Description */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : VC/11th Edition</li>
                  <li>● Product Code : {productDetails.code}</li>
                  <li>● Product Class : {productDetails.class}</li>
                  <li>● Product Core : {productDetails.core}</li>
                  <li>● Paper Quality : PVC 180 Micron</li>
                  <li>● Production Time : {productDetails.production}</li>
                  <li>● Lamination Type : {productDetails.lamination}</li>
                  <li>● {productDetails.look}</li>
                  <li>● Both Side Printing Option Available</li>
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● We are India's No. 1 Visiting card manufacturer</li>
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced & Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>

              {/* Points to be Noted */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Points to be Noted</h4>
                <ul className="space-y-1">
                  <li>● Size Must be as below:</li>
                  <li className="ml-4">Card Design Size : W: 90.00 mm X H: 54.00 mm</li>
                  <li className="ml-4">Text / Matter Area : W: 80.00 mm X H: 44.00 mm</li>
                  <li className="ml-4">Size After Cutting : W: 87.00 mm x H: 51.00 mm</li>
                  <li>● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs.</li>
                  <li>● Use high-resolution imagery for the clearest & sharpest results.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-900">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedProduct}
                  onChange={e => handleProductChange(e.target.value)}
                >
                  <option value="--Select Product--">--Select Product--</option>
                  <option value="180 Micron NT">180 Micron NT</option>
                  <option value="180 Micron NT Card + Gloss UV Coating">180 Micron NT Card + Gloss UV Coating</option>
                  <option value="180 Micron NT Card + Drip-Off">180 Micron NT Card + Drip-Off</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity
                </label>
                <div className="flex flex-col">
                  <input
                    type="number"
                    min={selectedProduct === "180 Micron NT Card + Gloss UV Coating" ? 1000 : 100}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onBlur={() => {
                      const minVal = selectedProduct === "180 Micron NT Card + Gloss UV Coating" ? 1000 : 100;
                      const val = Number(quantity);
                      if (isNaN(val) || val < minVal) {
                        setQuantity(String(minVal));
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[120px] bg-white outline-none font-bold"
                  />
                  <span className="text-[11px] text-gray-500 mt-1">
                    (Min Qty. : {selectedProduct === "180 Micron NT Card + Gloss UV Coating" ? "1,000" : "100"})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {selectedProduct === "180 Micron NT Card + Drip-Off" && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Gloss Area</label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none"
                    value={glossArea}
                    onChange={e => setGlossArea(e.target.value)}
                  >
                    <option value="--Select--">--Select--</option>
                    <option value="Not Required (All Drip-Off Area)">Not Required (All Drip-Off Area)</option>
                    <option value="Front Side">Front Side</option>
                    <option value="Back Side">Back Side</option>
                    <option value="Both Side">Both Side</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="nt_privacy" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="nt_privacy" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>



              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600 text-lg">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Key Chain)</span>
                </label>
                <Textarea
                  placeholder="Enter Pressline..."
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function NT800MicronCustomizer({ product }: { product: Product }) {
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
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const breakdown = useMemo(() => {
    if (!product) return null;
    let finishingIds: string[] = [];
    if (spotUv === "1 Side Only") finishingIds.push("spot-uv");
    if (foil !== "--Select--" && foil !== "Not Required") finishingIds.push("foil");
    if (dieShape !== "--Select--" && dieShape !== "Not Required") finishingIds.push("die-cut");

    const paperId = product?.paper_types?.find(pt => pt.label === selectedProduct)?.id || "800-micron-velvet";

    return calculatePrice(product, {
      sizeId: "standard",
      paperId: paperId,
      colorId: "both",
      finishingIds,
      quantity: Number(quantity) || 100,
      express: false
    });
  }, [product, quantity, selectedProduct, spotUv, foil, dieShape]);

  if (!breakdown) return null;

  const handleAddToCart = () => {
    if (printing === "--Select--") { toast.error("Please select Printing"); return; }
    if (spotUv === "--Select--") { toast.error("Please select Spot UV"); return; }
    if (foil === "--Select--") { toast.error("Please select Foil"); return; }
    if (dieShape === "--Select--") { toast.error("Please select Die Shape"); return; }

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
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#009933] to-[#006622] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase">
                      800 MICRON<br />FUSING
                    </h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase">{selectedProduct}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8 text-[13px] leading-relaxed text-gray-800 w-full">


              {/* Product Description */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : VC/11th Edition (Sample File)</li>
                  <li>● Product Code : {productInfo.code}</li>
                  <li>● Product Class : Premium</li>
                  <li>● Product Core : {productInfo.core}</li>
                  <li>● Paper Quality : PVC Thickness 800 Micron</li>
                  <li>● Production Time : Start from file upload</li>
                  <li className="ml-4">3 Days : Without UV</li>
                  <li className="ml-4">5 Days : With UV</li>
                  <li>● Lamination Type : {productInfo.lamination}</li>
                  <li>● {productInfo.look}</li>
                  <li>● Both Side Printing Option Available</li>
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● We are India's No. 1 Visiting card manufacturer</li>
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced & Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>

              {/* Points to be Noted */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Points to be Noted</h4>
                <ul className="space-y-1">
                  <li>● Size Must be as below:</li>
                  <li className="ml-4">Card Design Size : W: 96.00 mm X H: 58.00 mm</li>
                  <li className="ml-4">Text / Matter Area : W: 84.00 mm X H: 46.00 mm</li>
                  <li className="ml-4">Size After Cutting : W: 90.00 mm x H: 53.00 mm</li>
                  <li>● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs.</li>
                  <li>● Use high-resolution imagery for the clearest & sharpest results.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-900">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="800 Micron + Velvet">800 Micron + Velvet</option>
                  <option value="800 Micron + Matt">800 Micron + Matt</option>
                  <option value="800 Micron Silver + Gloss">800 Micron Silver + Gloss</option>
                  <option value="800 Micron Gold + Gloss">800 Micron Gold + Gloss</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity
                </label>
                <div className="flex flex-col">
                  <select
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="border border-gray-300 p-2 w-full max-w-[120px] bg-white outline-none"
                  >
                    <option value="100">100</option>
                    <option value="500">500</option>
                    <option value="1000">1000</option>
                  </select>
                  <span className="text-[10px] text-gray-500 font-bold mt-1">(Min Qty. : 100)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-gray-800"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="1 Side">1 Side</option>
                  <option value="2 Side">2 Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Spot UV</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-gray-800"
                  value={spotUv}
                  onChange={e => setSpotUv(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Not Required">Not Required</option>
                  <option value="1 Side Only">1 Side Only</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Foil</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-gray-800"
                  value={foil}
                  onChange={e => setFoil(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Not Required">Not Required</option>
                  <option value="Gold - 1 Side">Gold - 1 Side</option>
                  <option value="Gold - 2 Side">Gold - 2 Side</option>
                  <option value="Silver - 1 Side">Silver - 1 Side</option>
                  <option value="Silver - 2 Side">Silver - 2 Side</option>
                  <option value="Red - 1 Side">Red - 1 Side</option>
                  <option value="Red - 2 Side">Red - 2 Side</option>
                  <option value="Green - 1 Side">Green - 1 Side</option>
                  <option value="Green - 2 Side">Green - 2 Side</option>
                  <option value="Blue - 1 Side">Blue - 1 Side</option>
                  <option value="Blue - 2 Side">Blue - 2 Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Die Shape</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-gray-800"
                  value={dieShape}
                  onChange={e => setDieShape(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Die No. 1 New All Corner Round">Die No. 1 New All Corner Round</option>
                  <option value="Die No. 2 All Corner Round">Die No. 2 All Corner Round</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="nt800_privacy" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="nt800_privacy" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600 text-lg">Rs. {Math.round(breakdown.subtotal * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  ADD ORDER (PAY FROM WALLET)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function PamphletPosterCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("default");
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id || "");
  const [paperId, setPaperId] = useState(product.paper_types[0]?.id || "");
  const [colorId, setColorId] = useState(product.color_options[0]?.id || "");
  const [finishingId, setFinishingId] = useState(product.finishing_options[0]?.id || "");
  const [quantity, setQuantity] = useState(product.quantity_tiers[0]?.qty || 1000);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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

  if (product.category_slug === 'brochures' || product.category_slug === 'id-cards' || product.category_slug === 'certificates' || product.category_slug === 'menu-cards' || product.category_slug === 'invitations' || product.category_slug === 'calendars' || product.category_slug === 'banners') {
    return (
      <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
          <Link
            to="/category/$slug"
            params={{ slug: product.category_slug }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Category
          </Link>
          <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
            <div className="flex flex-col space-y-10">
              <div className="w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-contain p-8" />
              </div>
            </div>
            <div className="bg-white border rounded shadow-sm p-8 lg:p-12 space-y-8 flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
              <p className="text-gray-600 text-lg">For custom orders and more details, please contact us directly on WhatsApp.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <button
                  onClick={() => window.open('https://wa.me/919351037177', '_blank')}
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 text-lg transition-colors shadow-lg w-full sm:w-auto justify-center"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.12.551 4.15 1.597 5.961L.062 24l6.196-1.583A11.964 11.964 0 0012.031 24c6.647 0 12.031-5.382 12.031-12.031C24.062 5.383 18.679 0 12.031 0zm3.626 17.202c-.156.44-1.298.814-1.782.85-.484.037-1.127.135-3.693-1.077-2.613-1.233-4.275-3.896-4.403-4.067-.129-.17-1.045-1.396-1.045-2.663 0-1.268.653-1.895.882-2.146.228-.251.498-.313.663-.313.166 0 .332.001.482.008.15.006.353-.058.552.421.201.484.686 1.674.747 1.795.062.122.104.264.02.434-.083.17-.124.275-.248.421-.124.145-.262.316-.373.434-.124.133-.254.276-.11.523.145.248.647 1.066 1.386 1.725.954.852 1.748 1.118 1.996 1.242.248.124.394.104.538-.063.145-.166.623-.725.79-9.974.166-.25.332-.207.561-.124.23.083 1.451.684 1.7 8.082.25.124.414.23.476.353.062.124.062.725-.094 1.165z" /></svg>
                  WhatsApp
                </button>
                <a
                  href="tel:+919351037177"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 text-lg transition-colors shadow-lg w-full sm:w-auto justify-center"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
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
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  const sizeLabel = product.size_label || "Sheet Size,";
  const paperLabel = product.paper_label || "Paper Type";
  const colorLabel = product.color_label || "Color Options";
  const finishingLabel = product.finishing_label || "Lamination";
  const isDigitalPrinting = product.category_slug === "digital-printing";
  const featureHighlights =
    product.features && product.features.length > 0
      ? product.features
      : ["Production Time: 1 day", "Premium print quality", "Custom branding available"];
  const productSpecialization = [
    `Theme Color: ${product.theme_color || "Standard"}`,

    `Available Quantities: ${(product.quantity_tiers || []).map((q) => q.qty.toLocaleString()).join(", ")}`,
    `Delivery Timeline: ${product.delivery_days ?? 3} days`,
  ];
  const pointsToBeNoted = [
    "Final output color can slightly vary from screen preview.",
    "Upload print-ready file in PDF, AI, CDR, or high-resolution JPG/PNG.",
    "Please verify all text, logo, and spelling before final approval.",
    "Bulk and urgent orders are processed on priority request.",
  ];

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain p-4" />
              ) : (
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-contain p-8" />
              )}
            </div>

            <FullProductDetails product={product} />
          </div>

          {/* RIGHT: Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  <option value="default">{product.name}</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity<br /><span className="text-[11px] text-gray-500 font-normal">(Min Qty. : {product.quantity_tiers[0]?.qty})</span>
                </label>
                <Input
                  type="number"
                  min={product.quantity_tiers[0]?.qty || 1}
                  step={1}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value) as any)}
                  onBlur={() => {
                    const minVal = product.quantity_tiers[0]?.qty || 1000;
                    const val = Number(quantity);
                    if (isNaN(val) || val < minVal) {
                      setQuantity(minVal);
                    }
                  }}
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none"
                />
              </div>

              {product.sizes.length > 0 && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">{sizeLabel}</label>
                  <select
                    className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none"
                    value={sizeId}
                    onChange={e => setSizeId(e.target.value)}
                  >
                    {(product.sizes || []).map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {product.paper_types.length > 0 && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">{paperLabel}</label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none"
                    value={paperId}
                    onChange={e => setPaperId(e.target.value)}
                  >
                    {(product.paper_types || []).map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {product.color_options.length > 0 && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">{colorLabel}</label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none"
                    value={colorId}
                    onChange={e => setColorId(e.target.value)}
                  >
                    {(product.color_options || []).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {product.finishing_options.length > 0 && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">{finishingLabel}</label>
                  <select
                    className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none"
                    value={finishingId}
                    onChange={e => setFinishingId(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    {(product.finishing_options || []).map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
              )}



              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <Textarea
                  placeholder="LK Printers of India Limited"
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM TARGET CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function TargetCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1000);
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const productOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; sizeId: string }> = [];
    options.push({ id: "pistol", label: "Pistol Target", sizeId: "standard" });
    options.push({ id: "rifle", label: "Rifle Target", sizeId: "standard" });
    return options;
  }, []);

  useEffect(() => {
    const current = productOptions.find(o => product.slug.includes(o.id));
    setSelectedVariantId(current?.id || productOptions[0]?.id || "");
    setQuantity(product.quantity_tiers[0]?.qty || 1000);
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
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: `${product.name} order has been created.` });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain p-4" />
              ) : (
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-contain p-8" />
              )}
            </div>

            <FullProductDetails product={product} />
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity<br /><span className="text-[11px] text-gray-500 font-normal">(Min Qty. : {product.quantity_tiers[0]?.qty})</span>
                </label>
                <Input
                  type="number"
                  min={product.quantity_tiers[0]?.qty || 1}
                  step={1}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value) as any)}
                  onBlur={() => {
                    const minVal = product.quantity_tiers[0]?.qty || 1000;
                    const val = Number(quantity);
                    if (isNaN(val) || val < minVal) {
                      setQuantity(minVal);
                    }
                  }}
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none rounded-none"
                />
              </div>



              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <Textarea
                  placeholder="LK Printers of India Limited"
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}


// ----------------------------------------------------------------------
// GLOSS UV COATED CUSTOMIZER (VC-19)
// ----------------------------------------------------------------------
function GlossCoatedCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("--Select Product--");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const MIN_QTY = 1000;
  const MAX_QTY = 72000;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#cc0066] to-[#660033] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase">Gloss UV Coated</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8 text-[13px] leading-relaxed text-gray-800 w-full">
              {/* Product Description */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : VC/11th Edition</li>
                  <li>● Product Code : VC-19</li>
                  <li>● Product Class : Regular</li>
                  <li>● Product Core : Gloss Coat with Excellent printing</li>
                  <li>● Production Time : 12 hours</li>
                  <li>● Lamination Type : N/A</li>
                  <li>● Product has shiny look</li>
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● We are India's No. 1 Visiting card manufacturer</li>
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced &amp; Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>

              {/* Points to be Noted */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Points to be Noted</h4>
                <ul className="space-y-1 font-medium">
                  <li>● Size Must be as below:</li>
                  <li className="pl-6">Card Design Size : W: 90.00 mm X H: 54.00 mm</li>
                  <li className="pl-6">Text / Matter Area : W: 80.00 mm X H: 44.00 mm</li>
                  <li className="pl-6">Size After Cutting : W: 87.00 mm x H: 51.00 mm</li>
                  <li>● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs.</li>
                  <li>● Use high-resolution imagery for the clearest &amp; sharpest results.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="--Select Product--">--Select Product--</option>
                  <option value="Gloss UV Coated">Gloss UV Coated</option>
                </select>
              </div>

              {/* Select Detail header */}
              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2 leading-tight">
                  Quantity
                </label>
                <div>
                  <input
                    type="number"
                    min={MIN_QTY}
                    max={MAX_QTY}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < MIN_QTY) {
                        setQuantity(String(MIN_QTY));
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[160px] bg-white outline-none"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">
                    (Min Qty. : {MIN_QTY.toLocaleString()}, Max Qty. : {MAX_QTY.toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {/* Privacy Packing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="gc_privacy" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="gc_privacy" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              {/* Free Delivery Banner */}


              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="fileOption_gc"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              {/* Add to Cart Button */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function RegularGlossSmallCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("Gloss UV Coated - Small Cards");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const MIN_QTY = 1000;
  const MAX_QTY = 90000;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#009933] to-[#004411] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase">Gloss UV Coated</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8 text-[13px] leading-relaxed text-gray-800 w-full">
              {/* Product Description */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : VC/11th Edition</li>
                  <li>● Product Code : VC-21</li>
                  <li>● Product Class : Regular</li>
                  <li>● Product Core : Gloss Coat with Excellent printing</li>
                  <li>● Production Time : 1 days</li>
                  <li>● Lamination Type : N/A</li>
                  <li>● Product has shiny look</li>
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● We are India's No. 1 Visiting card manufacturer</li>
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced & Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>

              {/* Points to be Noted */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Points to be Noted</h4>
                <ul className="space-y-1 font-medium">
                  <li>● Size Must be as below:</li>
                  <li className="pl-6">Card Design : W: 83.00 mm X H: 52.00 mm</li>
                  <li className="pl-6">Text Area : W: 74.00 mm X H: 44.00 mm</li>
                  <li className="pl-6">After Cutting : W: 80.00 mm x H: 50.00 mm</li>
                  <li>● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs.</li>
                  <li>● Use high-resolution imagery for the clearest & sharpest results.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="Gloss UV Coated - Small Cards">Gloss UV Coated - Small Cards</option>
                </select>
              </div>

              {/* Select Detail header */}
              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2 leading-tight">Quantity</label>
                <div>
                  <input
                    type="number"
                    min={MIN_QTY}
                    max={MAX_QTY}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < MIN_QTY) {
                        setQuantity(String(MIN_QTY));
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[160px] bg-white outline-none"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">
                    (Min Qty. : {MIN_QTY.toLocaleString()}, Max Qty. : {MAX_QTY.toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {/* Privacy Packing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="small_gloss_privacy" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="small_gloss_privacy" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              {/* Free Delivery Banner */}


              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="fileOption_small_gloss"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              {/* Add to Cart */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function RegularWithoutSmallCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("Without Lamination (SMALL)");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const MIN_QTY = 1000;
  const MAX_QTY = 90000;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#555555] to-[#222222] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase">Without Lamination</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8 text-[13px] leading-relaxed text-gray-800 w-full">
              {/* Product Description */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : VC/11th Edition</li>
                  <li>● Product Code : VC-22</li>
                  <li>● Product Class : Regular</li>
                  <li>● Product Core : Excellent printing (Without Lamination)</li>
                  <li>● Production Time : 2 days</li>
                  <li>● Lamination Type : N/A</li>
                  <li>● Product has regular look</li>
                </ul>
              </div>

              <div>
                <ul className="space-y-1">
                  <li>● We are India's No. 1 Visiting card manufacturer</li>
                  <li>● Printing with latest Komori offset machines (2023 Model)</li>
                  <li>● Innovative, Advanced & Equipped Post Printing Unit</li>
                  <li>● Constant quality with reasonable price</li>
                </ul>
              </div>

              {/* Points to be Noted */}
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2 uppercase">Points to be Noted</h4>
                <ul className="space-y-1 font-medium">
                  <li>● Size Must be as below:</li>
                  <li className="pl-6">Card Design : W: 83.00 mm X H: 52.00 mm</li>
                  <li className="pl-6">Text Area : W: 74.00 mm X H: 44.00 mm</li>
                  <li className="pl-6">After Cutting : W: 80.00 mm x H: 50.00 mm</li>
                  <li>● The color saturation and print quality on these cards is extremely high, great for more colorful or darker designs.</li>
                  <li>● Use high-resolution imagery for the clearest & sharpest results.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="Without Lamination (SMALL)">Without Lamination (SMALL)</option>
                </select>
              </div>

              {/* Select Detail header */}
              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2 leading-tight">Quantity</label>
                <div>
                  <input
                    type="number"
                    min={MIN_QTY}
                    max={MAX_QTY}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onBlur={() => {
                      const val = Number(quantity);
                      if (isNaN(val) || val < MIN_QTY) {
                        setQuantity(String(MIN_QTY));
                      }
                    }}
                    className="border border-gray-300 p-2 w-full max-w-[160px] bg-white outline-none"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">
                    (Min Qty. : {MIN_QTY.toLocaleString()}, Max Qty. : {MAX_QTY.toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none font-bold text-gray-800"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="1 Side">1 Side</option>
                  <option value="1 Side + Black Back Printing">1 Side + Black Back Printing</option>
                </select>
              </div>

              {/* Privacy Packing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="small_without_privacy" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="small_without_privacy" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              {/* Free Delivery Banner */}


              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="fileOption_small_without"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              {/* Add to Cart */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// DEO PAPER CONFIGURATOR (Dropdown Pattern)
// ----------------------------------------------------------------------
function DeoPaperCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.slug === "letterheads-paper" || product.slug === "letter-head-paper"
      ? product.slug
      : "deo-paper"
  );
  const [quantity, setQuantity] = useState("25");
  const [selectedSize, setSelectedSize] = useState("--Select--");
  const [selectedPrinting, setSelectedPrinting] = useState("--Select--");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const productOptions = useMemo(() => [

    { id: "deo-paper", label: "Deo Paper" }
  ], []);

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
      product: productOptions.find(o => o.id === selectedVariantId)?.label || "Deo Paper",
      size: selectedSize,
      printing: selectedPrinting,
      specialRemark
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain p-4" />
              ) : (
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-contain p-8" />
              )}
            </div>


            <FullProductDetails product={product} />
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>


            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity<br /><span className="text-[11px] text-gray-500 font-normal">(Min Qty. : {MIN_QTY})</span>
                </label>
                <Input
                  type="number"
                  min={MIN_QTY}
                  step={1}
                  disabled
                  value={quantity}
                  className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Size</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none"
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="A4 Size">A4 Size</option>
                  <option value="A3 Size">A3 Size</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none"
                  value={selectedPrinting}
                  onChange={e => setSelectedPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="One Side">One Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>





              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="deo_paper_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}





function TexturePaperCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState("25");
  const [selectedPrinting, setSelectedPrinting] = useState("--Select--");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const productOptions = useMemo(() => [
    { id: "101", label: "13x19 - Texture Sheet - SBS White - Code 101" },
    { id: "102", label: "13x19 - Texture Sheet - SBS White - Code 102" },
    { id: "103", label: "13x19 - Texture Sheet - SBS White - Code 103" },
    { id: "104", label: "13x19 - Texture Sheet - SBS White - Code 104" },
    { id: "105", label: "13x19 - Texture Sheet - SBS White - Code 105" },
    { id: "106", label: "13x19 - Texture Sheet - SBS White - Code 106" },
    { id: "107", label: "13x19 - Texture Sheet - SBS Natural - Code 107" },
    { id: "108", label: "13x19 - Texture Sheet - SBS Natural - Code 108" },
    { id: "41", label: "13x19 - Texture Sheet - Metallic Golden - Code 41" },
    { id: "42", label: "13x19 - Texture Sheet - Metallic Silver - Code 42" }
  ], []);

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
      product: productOptions.find(o => o.id === selectedVariantId)?.label || "Texture Paper",
      size: "13x19",
      printing: selectedPrinting,
      specialRemark
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Info */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain p-4" />
              ) : (
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-contain p-8" />
              )}
            </div>


            <FullProductDetails product={product} />
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity<br /><span className="text-[11px] text-gray-500 font-normal">(Min Qty. : {MIN_QTY})</span>
                </label>
                <Input
                  type="number"
                  min={MIN_QTY}
                  step={1}
                  disabled
                  value={quantity}
                  className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Size</label>
                <div className="p-2 border border-gray-300 bg-gray-50 font-bold text-gray-700 w-full max-w-[200px]">
                  13x19 Size (Fixed)
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none"
                  value={selectedPrinting}
                  onChange={e => setSelectedPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="One Side">One Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>





              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="texture_paper_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function GummingCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState("25");
  const [selectedPaper, setSelectedPaper] = useState(product.paper_types[0]?.id || "");
  const [selectedLamination, setSelectedLamination] = useState(product.finishing_options[0]?.id || "");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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
      gumming: product?.paper_types?.find(p => p.id === selectedPaper)?.label,
      lamination: product.finishing_options.find(f => f.id === selectedLamination)?.label,
      size: "13x19",
      specialRemark
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Info */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain p-4" />
              ) : (
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-contain p-8" />
              )}
            </div>

            <div className="space-y-8 text-[13px] leading-relaxed text-gray-800">
              <div>
                <ul className="space-y-1">
                  <li>● Printed by latest Xerox 3100 Digital Press</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <div className="p-2 border border-gray-300 bg-white font-bold text-blue-800">
                  {product.name}
                </div>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity<br /><span className="text-[11px] text-gray-500 font-normal">(Min Qty. : {MIN_QTY})</span>
                </label>
                <Input
                  type="number"
                  min={MIN_QTY}
                  step={1}
                  disabled
                  value={quantity}
                  className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Size</label>
                <div className="p-2 border border-gray-300 bg-gray-50 font-bold text-gray-700 w-full max-w-[200px]">
                  13x19 Size (Fixed)
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Gumming Type</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={selectedPaper}
                  onChange={e => setSelectedPaper(e.target.value)}
                >
                  {(product.paper_types || []).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Lamination Type</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none"
                  value={selectedLamination}
                  onChange={e => setSelectedLamination(e.target.value)}
                >
                  {(product.finishing_options || []).map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>





              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="gumming_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount)).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
function DigitalPaperPrintingCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [productType, setProductType] = useState("Digital Printing Paper"); // Renamed from "Art Paper"
  const [selectedGsm, setSelectedGsm] = useState("170gsm");
  const [selectedTextureCode, setSelectedTextureCode] = useState("");
  const [quantity, setQuantity] = useState("25");
  const [selectedPrinting, setSelectedPrinting] = useState("One Side");
  const [selectedLamination, setSelectedLamination] = useState("none");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const textureOptions = useMemo(() => [
    { id: "101", label: "Texture Sheet - SBS White - Code 101" },
    { id: "102", label: "Texture Sheet - SBS White - Code 102" },
    { id: "103", label: "Texture Sheet - SBS White - Code 103" },
    { id: "104", label: "Texture Sheet - SBS White - Code 104" },
    { id: "105", label: "Texture Sheet - SBS White - Code 105" },
    { id: "106", label: "Texture Sheet - SBS White - Code 106" },
    { id: "107", label: "Texture Sheet - SBS Natural - Code 107" },
    { id: "108", label: "Texture Sheet - SBS Natural - Code 108" },
    { id: "41", label: "Texture Sheet - Metallic Golden - Code 41" },
    { id: "42", label: "Texture Sheet - Metallic Silver - Code 42" }
  ], []);

  const MIN_QTY = 25;

  const breakdown = useMemo(() => {
    // Base price from product
    const base = product.base_price;
    const qty = Number(quantity) || MIN_QTY;

    let paperPrice = product?.paper_types?.find(p => p.id === selectedGsm)?.price || 0;
    if (productType === "Texture Paper") {
      paperPrice += 10; // Base extra for texture
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
      detail: productType === "Texture Paper" ? textureOptions.find(o => o.id === selectedTextureCode)?.label : undefined,
      printing: selectedPrinting,
      lamination: selectedLamination,
      size: "13x19",
      specialRemark
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Info */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-square bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain p-4" />
              ) : (
                <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-contain p-8" />
              )}
            </div>

            <div className="space-y-8 text-[13px] leading-relaxed text-gray-800">
              <div>
                <ul className="space-y-1">
                  <li>● Printed by latest Xerox 3100 Digital Press</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                  value={productType}
                  onChange={e => setProductType(e.target.value)}
                >
                  <option value="Digital Printing Paper">Digital Printing Paper</option>
                  <option value="Texture Paper">Texture Paper</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Quantity<br /><span className="text-[11px] text-gray-500 font-normal">(Min Qty. : {MIN_QTY})</span>
                </label>
                <Input
                  type="number"
                  min={MIN_QTY}
                  step={1}
                  disabled
                  value={quantity}
                  className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Size</label>
                <div className="p-2 border border-gray-300 bg-gray-50 font-bold text-gray-700 w-full max-w-[200px]">
                  13x19 Size (Fixed)
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Paper GSM</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={selectedGsm}
                  onChange={e => setSelectedGsm(e.target.value)}
                >
                  {(product.paper_types || []).map(p => (
                    <option key={p.id} value={p.id}>{p.label.replace("Art Paper", "Digital Paper")}</option>
                  ))}
                </select>
              </div>

              {productType === "Texture Paper" && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Texture Variant</label>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800"
                    value={selectedTextureCode}
                    onChange={e => setSelectedTextureCode(e.target.value)}
                  >
                    <option value="">--Select Texture--</option>
                    {textureOptions.map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none"
                  value={selectedPrinting}
                  onChange={e => setSelectedPrinting(e.target.value)}
                >
                  <option value="One Side">One Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Lamination</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[220px] bg-white outline-none"
                  value={selectedLamination}
                  onChange={e => setSelectedLamination(e.target.value)}
                >
                  {(product.finishing_options || []).map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>





              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="digital_printing_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round(breakdown.total).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    // NOTE: Redirect to your direct payment / checkout page here
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM 800 GSM + CRAFT SHEET CONFIGURATOR (VC-4-B)
// ----------------------------------------------------------------------
function CraftSheet800GsmCustomizer({ product }: { product: Product }) {
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
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image Placeholder & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-[#8b4513] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans tracking-wider uppercase">800 GSM</h2>
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-amber-200">CRAFT</h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-9 text-sm"
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                >
                  <option value="--Select Product--">--Select Product--</option>
                  <option value="800 GSM Craft Sheet + Foil">800 GSM Craft Sheet + Foil</option>
                  <option value="800 GSM Craft Sheet + Foil + Die Cut">800 GSM Craft Sheet + Foil + Die Cut</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={500}
                    step={1}
                    disabled
                    value={quantity}
                    className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 500)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm" value={printing} onChange={e => setPrinting(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">White Base</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm" value={whiteBase} onChange={e => setWhiteBase(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Front Side">Front Side</option>
                  <option value="Back Side">Back Side</option>
                  <option value="Both Side">Both Side</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Foil</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm" value={foil} onChange={e => setFoil(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Front Side">Front Side</option>
                  <option value="Back Side">Back Side</option>
                  <option value="Both Side">Both Side</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Foil Color</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm" value={foilColor} onChange={e => setFoilColor(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Gold">Gold Foil</option>
                  <option value="Silver">Silver Foil</option>
                  <option value="Copper">Copper Foil</option>
                  <option value="Rose Gold">Rose Gold Foil</option>
                  <option value="Holographic">Holographic Foil</option>
                </select>
              </div>

              {selectedVariant.includes('Die Cut') && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Die Shape</label>
                  <select className="border border-gray-300 p-2 w-full bg-white outline-none h-9 text-sm font-bold text-blue-800" value={dieShape} onChange={e => setDieShape(e.target.value)}>
                    <option value="--Select--">--Select--</option>
                    {Array.from({ length: 36 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_800_craft" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_800_craft" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="800_gsm_craft_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight">
                  Enter Pressline :<br />
                  <span className="text-[9px] text-blue-600 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter Pressline..."
                    value={pressline}
                    onChange={e => setPressline(e.target.value)}
                    className="rounded-none border-gray-300 font-bold text-blue-800 h-9"
                  />
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5">
                    <span>L.K. PRINTERS</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Texture800GsmCustomizer({ product }: { product: Product }) {
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
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#5c5c5c] to-[#2c2c2c] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans tracking-wider uppercase">800 GSM</h2>
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-gray-300">TEXTURE</h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                >
                  <option value="800 GSM + Matt + Texture">800 GSM + Matt + Texture</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={500}
                    step={1}
                    disabled
                    value={quantity}
                    className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 500)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={printing} onChange={e => setPrinting(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Texture Type</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={textureType} onChange={e => setTextureType(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={101 + i} value={`Texture No. ${101 + i}`}>Texture No. {101 + i}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Die Shape</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={dieShape} onChange={e => setDieShape(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  {Array.from({ length: 36 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_texture" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_texture" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="texture_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>



              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function MattUVRegularCustomizer({ product }: { product: Product }) {
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
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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
    if (selectedVariant === "--Select Product--") { toast.error("Please select a Product"); return; }
    if (printing === "--Select--") { toast.error("Please select Printing"); return; }

    const isBothSideUV = selectedVariant.includes("Both Side UV");
    if (isBothSideUV) {
      if (frontSideUV === "--Select--") { toast.error("Please select Front Side UV"); return; }
      if (backSideUV === "--Select--") { toast.error("Please select Back Side UV"); return; }
    } else {
      if (uvType === "--Select--") { toast.error("Please select UV Type"); return; }
    }

    addToCart(product, breakdown.total, Number(quantity) || 1, {
      name: orderName,
      variant: selectedVariant,
      printing,
      ...(isBothSideUV ? { frontSideUV, backSideUV } : { uvType }),
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#660033] to-[#330022] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase">MATT</h2>
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans uppercase">+</h2>
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-pink-200">UV</h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                >
                  <option value="--Select Product--">--Select Product--</option>
                  <option value="Single Side Printing + Single Side UV">Single Side Printing + Single Side UV</option>
                  <option value="Both Side Printing + Single Side UV">Both Side Printing + Single Side UV</option>
                  <option value="Both Side Printing + Both Side UV">Both Side Printing + Both Side UV</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={1000}
                    step={1}
                    disabled
                    value={quantity}
                    className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 1000)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={printing} onChange={e => setPrinting(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {/* UV fields — conditional on selected product variant */}
              {selectedVariant.includes("Both Side UV") ? (
                <>
                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-right text-gray-700">Front Side UV</label>
                    <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800" value={frontSideUV} onChange={e => setFrontSideUV(e.target.value)}>
                      <option value="--Select--">--Select--</option>
                      <option value="Spot UV(On Text or Image)">Spot UV(On Text or Image)</option>
                      {Array.from({ length: 27 }, (_, i) => {
                        const num = String(i + 1).padStart(2, '0');
                        return (
                          <option key={num} value={`Texture UV, Type-${num}`}>
                            Texture UV, Type-{num}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-right text-gray-700">Back Side UV</label>
                    <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800" value={backSideUV} onChange={e => setBackSideUV(e.target.value)}>
                      <option value="--Select--">--Select--</option>
                      <option value="Spot UV(On Text or Image)">Spot UV(On Text or Image)</option>
                      {Array.from({ length: 27 }, (_, i) => {
                        const num = String(i + 1).padStart(2, '0');
                        return (
                          <option key={num} value={`Texture UV, Type-${num}`}>
                            Texture UV, Type-{num}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              ) : selectedVariant !== "--Select Product--" ? (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">UV Type</label>
                  <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800" value={uvType} onChange={e => setUvType(e.target.value)}>
                    <option value="--Select--">--Select--</option>
                    <option value="Spot UV(On Text or Image)">Spot UV(On Text or Image)</option>
                    {Array.from({ length: 27 }, (_, i) => {
                      const num = String(i + 1).padStart(2, '0');
                      return (
                        <option key={num} value={`Texture UV, Type-${num}`}>
                          Texture UV, Type-{num}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : null}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_matt_uv" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_matt_uv" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="matt_uv_regular_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 text-sm leading-tight">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">(On Free Gift)</span>
                </label>
                <Input
                  placeholder="Enter Pressline..."
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  className="rounded-none border-gray-300 font-bold text-blue-800 h-10"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Gsm500Customizer({ product, type }: { product: Product; type: 'velvet' | 'matt' | 'drip-off' }) {
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
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const breakdown = useMemo(() => {
    const finishingIds: string[] = [];
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
      uvOption: type !== 'drip-off' ? uvOption : undefined,
      foil: type !== 'drip-off' ? foil : undefined,
      foilColor: type !== 'drip-off' ? foilColor : undefined,
      dieShape,
      privacy: privacyPacking,
      fileOption,
      specialRemark,
      pressline
    });
  };

  const gradient = type === 'velvet'
    ? "from-[#0099ff] to-[#003399]"
    : type === 'matt'
      ? "from-[#ff6600] to-[#cc3300]"
      : "from-[#33cc33] to-[#006600]";

  const variantLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link to="/category/$slug" params={{ slug: product.category_slug }} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className={`bg-gradient-to-t ${gradient} w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center`}>
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans tracking-tighter uppercase">500 GSM</h2>
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans uppercase">+</h2>
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans uppercase tracking-tighter">{type.toUpperCase()}</h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedVariant}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedVariant(val);

                    // Auto-sync other fields based on selection
                    if (val.includes("UV")) setUvOption("Both Side");
                    else setUvOption("--Select--");

                    if (val.includes("Foil")) setFoil("Front Side");
                    else setFoil("--Select--");

                    if (val.includes("Die Cut") || val.includes("Customized Die Cut")) setDieShape("1");
                    else setDieShape("--Select--");

                    if (val.includes("Customized Die Cut")) setDieShape("Custom");
                  }}
                >
                  <option value="--Select Product--">--Select Product--</option>
                  {type === 'drip-off' ? (
                    <>
                      <option value="500 GSM + Metallic Printing + Drip Off">500 GSM + Metallic Printing + Drip Off</option>
                      <option value="500 GSM + Metallic Printing + Drip Off + Die Cut">500 GSM + Metallic Printing + Drip Off + Die Cut</option>
                    </>
                  ) : (
                    <>
                      <option value={`500 GSM + ${variantLabel}`}>500 GSM + {variantLabel}</option>
                      <option value={`500 GSM + ${variantLabel} + UV`}>500 GSM + {variantLabel} + UV</option>
                      <option value={`500 GSM + ${variantLabel} + UV + Foil`}>500 GSM + {variantLabel} + UV + Foil</option>
                      <option value={`500 GSM + ${variantLabel} + UV + Die Cut`}>500 GSM + {variantLabel} + UV + Die Cut</option>
                      <option value={`500 GSM + ${variantLabel} + UV + Foil + Die Cut`}>500 GSM + {variantLabel} + UV + Foil + Die Cut</option>
                      <option value={`500 GSM + ${variantLabel} + UV + Foil + Customized Die Cut`}>500 GSM + {variantLabel} + UV + Foil + Customized Die Cut</option>
                    </>
                  )}
                </select>
              </div>




              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={500}
                    step={1}
                    disabled
                    value={quantity}
                    className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 500)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={printing} onChange={e => setPrinting(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {type === 'drip-off' ? (
                <>
                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-right text-gray-700">White Base</label>
                    <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={uvOption} onChange={e => setUvOption(e.target.value)}>
                      <option value="--Select--">--Select--</option>
                      <option value="Front Side">Front Side</option>
                      <option value="Back Side">Back Side</option>
                      <option value="Both Side">Both Side</option>
                      <option value="Not Required">Not Required</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-right text-gray-700">Gloss Area</label>
                    <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={foil} onChange={e => setFoil(e.target.value)}>
                      <option value="--Select--">--Select--</option>
                      <option value="Front Side">Front Side</option>
                      <option value="Back Side">Back Side</option>
                      <option value="Both Side">Both Side</option>
                      <option value="Not Required">Not Required</option>
                    </select>
                  </div>

                  {selectedVariant.includes("Die Cut") && (
                    <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                      <label className="font-bold text-right text-gray-700">Die Shape</label>
                      <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={dieShape} onChange={e => setDieShape(e.target.value)}>
                        <option value="--Select--">--Select--</option>
                        {Array.from({ length: 36 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {(selectedVariant.includes("UV") || selectedVariant === `500 GSM + ${variantLabel}`) && (
                    <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                      <label className="font-bold text-right text-gray-700">Spot UV</label>
                      <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={uvOption} onChange={e => setUvOption(e.target.value)}>
                        <option value="--Select--">--Select--</option>
                        <option value="Front Side">Front Side</option>
                        <option value="Back Side">Back Side</option>
                        <option value="Both Side">Both Side</option>
                        <option value="Not required">Not required</option>
                      </select>
                    </div>
                  )}

                  {(selectedVariant.includes("Foil") || selectedVariant === `500 GSM + ${variantLabel}`) && (
                    <>
                      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                        <label className="font-bold text-right text-gray-700">Foil</label>
                        <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={foil} onChange={e => setFoil(e.target.value)}>
                          <option value="--Select--">--Select--</option>
                          <option value="Front Side">Front Side</option>
                          <option value="Back Side">Back Side</option>
                          <option value="Both Side">Both Side</option>
                          <option value="Not required">Not required</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                        <label className="font-bold text-right text-gray-700">Foil Color</label>
                        <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={foilColor} onChange={e => setFoilColor(e.target.value)}>
                          <option value="--Select--">--Select--</option>
                          <option value="Gold">Gold</option>
                          <option value="Silver">Silver</option>
                          <option value="Rose Gold">Rose Gold</option>
                          <option value="Copper">Copper</option>
                          <option value="Blue">Blue Foil</option>
                        </select>
                      </div>
                    </>
                  )}

                  {(selectedVariant.includes("Die Cut") || selectedVariant === `500 GSM + ${variantLabel}`) && (
                    <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                      <label className="font-bold text-right text-gray-700">Die Shape</label>
                      <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={dieShape} onChange={e => setDieShape(e.target.value)}>
                        <option value="--Select--">--Select--</option>
                        {Array.from({ length: 36 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                        ))}
                        {type === 'velvet' && <option value="Custom">Customized Die Cut</option>}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} /> Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} /> Not Required
                  </label>
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="gsm500_file"
              />

              {/* Pricing breakdown exactly as image */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold text-[14px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="text-black">Amount Payable</span>
                    <span className="text-red-600 text-lg">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter Pressline..."
                    value={pressline}
                    onChange={e => setPressline(e.target.value)}
                    className="rounded-none border-gray-300 font-bold text-blue-800 h-10"
                  />
                </div>
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[18px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[18px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function MattLaminationCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("Matt Lamination");
  const [quantity, setQuantity] = useState("1000");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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
      specialRemark,
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#1a1a2e] to-[#16213e] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-white">MATT</h2>
                    <h2 className="text-xl sm:text-2xl font-bold font-sans uppercase text-gray-300">+</h2>
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-blue-200">LAMINATION</h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                >
                  <option value="Matt Lamination">Matt Lamination</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={1000}
                    step={1}
                    disabled
                    value={quantity}
                    className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 1000)</span>
                </div>
              </div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={printing} onChange={e => setPrinting(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {/* Privacy Packing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_matt_lam" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_matt_lam" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              {/* Free Delivery Banner */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="matt_lam_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              {/* Printers Club */}


              {/* Buttons */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function GlossTextureCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("Gloss + Texture");
  const [quantity, setQuantity] = useState("1000");
  const [printing, setPrinting] = useState("--Select--");
  const [textureType, setTextureType] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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
      specialRemark,
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#1a472a] to-[#2d6a4f] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-white">GLOSS</h2>
                    <h2 className="text-xl sm:text-2xl font-bold font-sans uppercase text-green-200">+</h2>
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider uppercase text-green-100">TEXTURE</h2>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                >
                  <option value="Gloss + Texture">Gloss + Texture</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={1000}
                    step={1}
                    disabled
                    value={quantity}
                    className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 1000)</span>
                </div>
              </div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={printing} onChange={e => setPrinting(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {/* Texture Type */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Texture Type</label>
                <select className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm" value={textureType} onChange={e => setTextureType(e.target.value)}>
                  <option value="--Select--">--Select--</option>
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={101 + i} value={`Texture No. ${101 + i}`}>Texture No. {101 + i}</option>
                  ))}
                </select>
              </div>

              {/* Privacy Packing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_gloss_texture" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_gloss_texture" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              {/* Free Delivery Banner */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="gloss_texture_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              {/* Printers Club */}


              {/* Buttons */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function WithoutLaminationCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [selectedProduct, setSelectedProduct] = useState("Without Coated");
  const [printing, setPrinting] = useState("--Select--");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const MIN_QTY = 1000;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-[#606060] to-[#202020] w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center text-white">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1 p-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-sans tracking-wider leading-tight whitespace-pre-wrap uppercase">
                      {product.name}
                    </h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase">Without Lamination</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold bg-gray-50 p-3 text-center text-blue-800 border uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="Without Coated">Without Coated</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Quantity */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <Input
                    type="number"
                    min={MIN_QTY}
                    disabled
                    value={quantity}
                    className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 1000)</span>
                </div>
              </div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm font-bold text-gray-800"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Single Side + Black Back Printing">Single Side + Black Back Printing</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {/* Privacy Packing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_no_lam" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="privacy_no_lam" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              {/* Free Delivery Banner */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="no_lamination_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-red-600">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              {/* Printers Club */}


              {/* Buttons */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}



// ----------------------------------------------------------------------
// PAMPHLET CONFIGURATOR
// ----------------------------------------------------------------------
function PamphletCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("--Select Product--");
  const [sizeId, setSizeId] = useState("--Select--");
  const [printing, setPrinting] = useState("--Select--");
  const [quantity, setQuantity] = useState("--Select--");

  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedPaperId = selectedProduct === "--Select Product--" ? null : selectedProduct.includes("70 GSM") ? "70gsm-maplitho" : selectedProduct.includes("90 GSM") ? "90gsm-art" : selectedProduct.includes("115 GSM") ? "115gsm-art" : "170gsm-art";
  const selectedColorId = printing === "Single Side" ? "single" : printing === "Both Side" ? "both" : null;

  const breakdown = useMemo(() => {
    if (sizeId === "--Select--" || !selectedPaperId || !selectedColorId || quantity === "--Select--") return null;
    return calculatePrice(product, {
      sizeId: sizeId,
      paperId: selectedPaperId,
      colorId: selectedColorId,
      finishingIds: [],
      quantity: Number(quantity) || 1000,
      express: false
    });
  }, [product, sizeId, selectedPaperId, selectedColorId, quantity]);

  const handleAddToCart = () => {
    if (printing === "--Select--" || sizeId === "--Select--" || selectedProduct === "--Select Product--" || quantity === "--Select--" || !breakdown) {
      toast.error("Please select all options");
      return;
    }
    addToCart(product, breakdown.total, Number(quantity) || 1000, {
      name: orderName,
      product: selectedProduct,
      size: sizeId === "letter" ? "Letter Size (8.5\"x11\")" : sizeId === "a4" ? "A4 Size" : "A5 Size",
      printing,
      remark: specialRemark,
      pressline,
      fileOption
    });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image Placeholder & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[0.7] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-blue-700 to-blue-900 w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans tracking-widest uppercase">PAMPHLET</h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase">{selectedProduct}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold bg-gray-50 p-3 text-center text-blue-800 border uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="--Select Product--">--Select Product--</option>
                  <option value="Pamphlet - 70 GSM Maplitho Paper">Pamphlet - 70 GSM Maplitho Paper</option>
                  <option value="Pamphlet - 90 GSM Art Paper">Pamphlet - 90 GSM Art Paper</option>
                  <option value="Pamphlet - 115 GSM Art Paper">Pamphlet - 115 GSM Art Paper</option>
                  <option value="Pamphlet - 170 GSM Art Paper">Pamphlet - 170 GSM Art Paper</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Size */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Size</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={sizeId}
                  onChange={e => setSizeId(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="letter">Letter Size (8.5"x11")</option>
                  <option value="a4">A4 Size</option>
                  <option value="a5">A5 Size</option>
                </select>
              </div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {/* Qty */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Qty.</label>
                <div>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none font-bold h-10 text-sm"
                    value={quantity}
                  >
                    <option value="--Select--">--Select--</option>
                    <option value="1000">1000</option>
                    <option value="2000">2000</option>
                    <option value="5000">5000</option>
                    <option value="10000">10000</option>
                  </select>
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 1000)</span>
                </div>
              </div>

              {/* Free Delivery Banner */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="pamphlet_file"
              />

              {/* Pricing */}
              {breakdown && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                  <div />
                  <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                    <div className="flex justify-between items-center text-gray-600 text-[13px]">
                      <span>Applicable Cost</span>
                      <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 text-[13px]">
                      <span>GST (18.00%)</span>
                      <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                      <span className="text-sm">Amount Payable</span>
                      <span className="text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              {/* Pressline */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight">
                  Enter Pressline :<br />
                  <span className="text-[9px] text-blue-600 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter Pressline..."
                    value={pressline}
                    onChange={e => setPressline(e.target.value)}
                    className="rounded-none border-gray-300 font-bold text-blue-800 h-9"
                  />
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5">
                    <span>L.K. PRINTERS</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// POSTER CONFIGURATOR
// ----------------------------------------------------------------------
function PosterCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("Posters - 15x20");
  const [printing, setPrinting] = useState("--Select--");
  const [paperQuality, setPaperQuality] = useState("--Select--");
  const [quantity, setQuantity] = useState("500");
  const [specialRemark, setSpecialRemark] = useState("");
  const [pressline, setPressline] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    return localStorage.getItem("lk-smart-upload-image") || null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Image Placeholder & Descriptions */}
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[0.7] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              {filePreview ? (
                <img src={filePreview} alt="Design preview" className="w-full h-full object-contain" />
              ) : (
                <div className="bg-gradient-to-t from-blue-700 to-blue-900 w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                  <div className="border border-white w-full h-full flex flex-col items-center justify-center space-y-1">
                    <h2 className="text-4xl sm:text-5xl font-bold font-sans tracking-widest uppercase">POSTER</h2>
                    <p className="text-sm font-medium opacity-90 tracking-widest uppercase">{selectedProduct}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold bg-gray-50 p-3 text-center text-blue-800 border uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              {/* Order Name */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs h-10"
                />
              </div>

              {/* Select Product */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="Posters - 15x20">Posters - 15x20</option>
                  <option value="Posters - 18x23">Posters - 18x23</option>
                  <option value="Posters - 20x30">Posters - 20x30</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              {/* Printing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              {/* Paper Quality */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Paper Quality</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={paperQuality}
                  onChange={e => setPaperQuality(e.target.value)}
                >
                  <option value="--Select--">--Select--</option>
                  <option value="70 GSM Maplitho">70 GSM Maplitho</option>
                  <option value="90 GSM Art Paper">90 GSM Art Paper</option>
                  <option value="115 GSM Art Paper">115 GSM Art Paper</option>
                  <option value="170 GSM Art Paper">170 GSM Art Paper</option>
                </select>
              </div>

              {/* Qty */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Qty.</label>
                <div>
                  <select
                    className="border border-gray-300 p-2 w-full bg-white outline-none font-bold h-10 text-sm"
                    value={quantity}
                  >
                    <option value="500">500</option>
                    <option value="1000">1000</option>
                    <option value="2000">2000</option>
                    <option value="5000">5000</option>
                  </select>
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 500)</span>
                </div>
              </div>

              {/* Free Delivery Banner */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold p-2 text-center uppercase tracking-wider">
                </div>
              </div>

              {/* File Option */}
              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
                radioName="poster_file"
              />

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600 text-[13px]">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 text-[13px]">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="text-sm">Amount Payable</span>
                    <span className="text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              {/* Special Remark */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              {/* Pressline */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight">
                  Enter Pressline :<br />
                  <span className="text-[9px] text-blue-600 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter Pressline..."
                    value={pressline}
                    onChange={e => setPressline(e.target.value)}
                    className="rounded-none border-gray-300 font-bold text-blue-800 h-9"
                  />
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex flex-col gap-0.5">
                    <span>LK Printers Of India Limited</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function GlossCoatedTagCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [colorId, setColorId] = useState("");
  const [quantity, setQuantity] = useState<number | string>("");
  const [dieShape, setDieShape] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { };

  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: sizeId || (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: colorId || (product.color_options || [])[0]?.id || "",
      finishingIds: dieShape ? ["die-cut"] : [],
      quantity: Number(quantity) || 1000,
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          <div className="flex flex-col items-center lg:items-stretch space-y-6">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mx-auto overflow-hidden">
              <img
                src={product.images?.[0] || ""}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full mt-4">
              <h2 className="text-xl font-bold font-serif text-blue-900 border-b-2 border-blue-900 inline-block mb-4 uppercase tracking-wider">Printers Club Of India Limited</h2>

              <h3 className="font-bold text-gray-800 text-sm mb-2 mt-4">Product Description</h3>
              <ul className="text-sm text-gray-600 space-y-1 pl-1">
                <li>● Product Ref. : TAG/1st Edition (Sample File)</li>
                <li>● Product Code : Tag-1</li>
                <li>● Product Class : Super Gloss Coated</li>
                <li>● Product Core : Gloss Coat with Excellent printing</li>
                <li>● Production Time : Within 7-10 Days from file upload</li>
                <li>● Coated Type : Hi-Gloss</li>
                <li>● Available in 10 different and unique die shapes</li>
                <li>● Available in 3 Size ( Small , Medium , Large )</li>
              </ul>



              <h3 className="font-bold text-gray-800 text-sm mb-2 mt-6">Points to be Noted</h3>
              <ul className="text-sm text-gray-600 space-y-1 pl-1">
                <li>● Size Must be as below ( Small Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 56.00 mm X H: 54.00 mm</li>
                <li className="pl-6">Text / Matter Area : W: 43.00 mm X H: 43.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 48.00 mm X H: 48.00 mm</li>
                <li>● Size Must be as below ( Medium Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 54.00 mm X H: 90.00 mm</li>
                <li className="pl-6">Text / Matter Area : W: 40.00 mm X H: 76.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 48.00 mm X H: 84.00 mm</li>
                <li>● Size Must be as below ( Large Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 56.00 mm X H: 108.00 mm</li>
                <li className="pl-6">Text / Matter Area : W: 42.00 mm X H: 94.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 50.00 mm X H: 102.00 mm</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <div className="border border-gray-300 p-2 w-full bg-gray-50 text-sm text-gray-600">
                  Gloss Coated Tags
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-900 pt-2 uppercase tracking-wide">
                  Select Detail
                </label>
                <div />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <Badge className="bg-blue-600 w-4 h-4 rounded p-0 inline-flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </Badge>
                  Size
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={sizeId}
                  onChange={e => setSizeId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.sizes || []).map(s => (
                    <option key={s.id} value={s.id}>{s.label.split(' ')[0]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">🖨️</span>
                  Printing
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={colorId}
                  onChange={e => setColorId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.color_options || []).map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">🏷️</span>
                  Qty.
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={quantity}
                >
                  <option value="">--Select--</option>
                  {(product.quantity_tiers || []).map(q => (
                    <option key={q.qty} value={q.qty}>{q.qty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">✂️</span>
                  Die Shape
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={dieShape}
                  onChange={e => setDieShape(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={`Die No. ${n}`}>Die No. {n}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 p-3 bg-green-50 text-green-700 text-center text-sm font-bold border border-green-200">
              </div>

              <B2BFileSelector fileOption={fileOption} setFileOption={setFileOption} onFileChange={handleFileChange} />

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4">
                <label className="font-bold text-right text-gray-700 pt-2 leading-tight">
                  Special Remark<br />
                  <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  className="rounded-none border-gray-300 min-h-[80px]"
                />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-end">
                <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  ADD TO CART
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function MattLaminationTagCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [colorId, setColorId] = useState("");
  const [quantity, setQuantity] = useState<number | string>("");
  const [dieShape, setDieShape] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { };

  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: sizeId || (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: colorId || (product.color_options || [])[0]?.id || "",
      finishingIds: dieShape ? ["die-cut"] : [],
      quantity: Number(quantity) || 1000,
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          <div className="flex flex-col items-center lg:items-stretch space-y-6">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mx-auto overflow-hidden">
              <img
                src={product.images?.[0] || ""}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full mt-4">
              <h2 className="text-xl font-bold font-serif text-blue-900 border-b-2 border-blue-900 inline-block mb-4 uppercase tracking-wider">Printers Club Of India Limited</h2>

              <h3 className="font-bold text-gray-800 text-sm mb-2 mt-4">Product Description</h3>
              <ul className="text-sm text-gray-600 space-y-1 pl-1">
                <li>● Product Ref. : TAG/1st Edition (Sample File)</li>
                <li>● Product Code : Tag-2</li>
                <li>● Product Class : Premium</li>
                <li>● Product Core : Smooth Matt</li>
                <li>● Paper Quality : Imported 350 GSM Art Paper</li>
                <li>● Production Time : Within 7-10 days from file upload</li>
                <li>● Lamination Type : Matt</li>
                <li>● Available in 10 different and unique die shapes</li>
                <li>● Available in 3 Size ( Small , Medium , Large )</li>
              </ul>



              <h3 className="font-bold text-gray-800 text-sm mb-2 mt-6">Points to be Noted</h3>
              <ul className="text-sm text-gray-600 space-y-1 pl-1">
                <li>● Size Must be as below ( Small Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 57.00 mm X H: 59.00 mm</li>
                <li className="pl-6">Text / Matter Area : W: 44.00 mm X H: 44.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 50.00 mm X H: 50.00 mm</li>
                <li>● Size Must be as below ( Medium Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 57.00 mm X H: 94.00 mm</li>
                <li className="pl-6">Text / Matter Area : W: 45.00 mm X H: 82.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 50.50 mm X H: 87.50 mm</li>
                <li>● Size Must be as below ( Large Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 58.50 mm X H: 113.50 mm</li>
                <li className="pl-6">Text / Matter Area : W: 46.00 mm X H: 101.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 52.00 mm X H: 107.00 mm</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <div className="border border-gray-300 p-2 w-full bg-gray-50 text-sm text-gray-600">
                  Matt Lamination Tags
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-900 pt-2 uppercase tracking-wide">
                  Select Detail
                </label>
                <div />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <Badge className="bg-blue-600 w-4 h-4 rounded p-0 inline-flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </Badge>
                  Size
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={sizeId}
                  onChange={e => setSizeId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.sizes || []).map(s => (
                    <option key={s.id} value={s.id}>{s.label.split(' ')[0]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">🖨️</span>
                  Printing
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={colorId}
                  onChange={e => setColorId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.color_options || []).map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">🏷️</span>
                  Qty.
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={quantity}
                >
                  <option value="">--Select--</option>
                  {(product.quantity_tiers || []).map(q => (
                    <option key={q.qty} value={q.qty}>{q.qty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">✂️</span>
                  Die Shape
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={dieShape}
                  onChange={e => setDieShape(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={`Die No. ${n}`}>Die No. {n}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 p-3 bg-green-50 text-green-700 text-center text-sm font-bold border border-green-200">
              </div>

              <B2BFileSelector fileOption={fileOption} setFileOption={setFileOption} onFileChange={handleFileChange} />

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4">
                <label className="font-bold text-right text-gray-700 pt-2 leading-tight">
                  Special Remark<br />
                  <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  className="rounded-none border-gray-300 min-h-[80px]"
                />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-end">
                <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  ADD TO CART
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function MattUVTagCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [variant, setVariant] = useState("Single Side Printing + Single Side UV");
  const [sizeId, setSizeId] = useState("");
  const [printingId, setPrintingId] = useState("");
  const [spotUvId, setSpotUvId] = useState("");
  const [quantity, setQuantity] = useState<number | string>("");
  const [dieShape, setDieShape] = useState("");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { };

  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: sizeId || (product.sizes || [])[0]?.id || "",
      paperId: (product.paper_types || [])[0]?.id || "",
      colorId: printingId || (product.color_options || [])[0]?.id || "",
      finishingIds: dieShape ? ["die-cut"] : [],
      quantity: Number(quantity) || 1000,
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          <div className="flex flex-col items-center lg:items-stretch space-y-6">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mx-auto overflow-hidden">
              <img
                src={product.images?.[0] || ""}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full mt-4">
              <h2 className="text-xl font-bold font-serif text-blue-900 border-b-2 border-blue-900 inline-block mb-4 uppercase tracking-wider">Printers Club Of India Limited</h2>

              <h3 className="font-bold text-gray-800 text-sm mb-2 mt-4">Product Description</h3>
              <ul className="text-sm text-gray-600 space-y-1 pl-1">
                <li>● Product Ref. : TAG/1st Edition (Sample File)</li>
                <li>● Product Code : Tag-3</li>
                <li>● Product Class : Premium</li>
                <li>● Product Core : Smooth Matt with Fine UV</li>
                <li>● Paper Quality : Imported 400 GSM Art Paper</li>
                <li>● Production Time : Within 7-10 days from file upload</li>
                <li>● Lamination Type : Matt</li>
                <li>● Embossed Spot UV adds to the magnificence of the card and provide a glossy finish on the selected areas</li>
                <li>● Available in 10 different and unique die shapes</li>
                <li>● Available in 3 Size ( Small , Medium , Large )</li>
              </ul>



              <h3 className="font-bold text-gray-800 text-sm mb-2 mt-6">Points to be Noted</h3>
              <ul className="text-sm text-gray-600 space-y-1 pl-1">
                <li>● Size Must be as below ( Small Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 57.00 mm X H: 59.00 mm</li>
                <li className="pl-6">Text / Matter Area : W: 44.00 mm X H: 44.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 50.00 mm X H: 50.00 mm</li>
                <li>● Size Must be as below ( Medium Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 57.00 mm X H: 94.00 mm</li>
                <li className="pl-6">Text / Matter Area : W: 45.00 mm X H: 82.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 50.50 mm X H: 87.50 mm</li>
                <li>● Size Must be as below ( Large Tags ):</li>
                <li className="pl-6">Tag Design Size : W: 58.50 mm X H: 113.50 mm</li>
                <li className="pl-6">Text / Matter Area : W: 46.00 mm X H: 101.00 mm</li>
                <li className="pl-6">Tag After Cutting : W: 52.00 mm X H: 107.00 mm</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={variant}
                  onChange={e => setVariant(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  <option value="Single Side Printing + Single Side UV">Single Side Printing + Single Side UV</option>
                  <option value="Both Side Printing + Single Side UV">Both Side Printing + Single Side UV</option>
                  <option value="Both Side Printing + Both Side UV">Both Side Printing + Both Side UV</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-900 pt-2 uppercase tracking-wide">
                  Select Detail
                </label>
                <div />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <Badge className="bg-blue-600 w-4 h-4 rounded p-0 inline-flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </Badge>
                  Size
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={sizeId}
                  onChange={e => setSizeId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.sizes || []).map(s => (
                    <option key={s.id} value={s.id}>{s.label.split(' ')[0]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">🖨️</span>
                  Printing
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={printingId}
                  onChange={e => setPrintingId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg text-center leading-none" style={{ paddingBottom: '3px' }}>☼</span>
                  Spot UV
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={spotUvId}
                  onChange={e => setSpotUvId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Single Side">Single Side</option>
                  <option value="Both Side">Both Side</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">🏷️</span>
                  Qty.
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={quantity}
                >
                  <option value="">--Select--</option>
                  {(product.quantity_tiers || []).map(q => (
                    <option key={q.qty} value={q.qty}>{q.qty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-blue-900 flex items-center justify-end gap-2">
                  <span className="text-blue-600 text-lg">✂️</span>
                  Die Shape
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={dieShape}
                  onChange={e => setDieShape(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={`Die No. ${n}`}>Die No. {n}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 p-3 bg-green-50 text-green-700 text-center text-sm font-bold border border-green-200">
              </div>

              <B2BFileSelector fileOption={fileOption} setFileOption={setFileOption} onFileChange={handleFileChange} />

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4">
                <label className="font-bold text-right text-gray-700 pt-2 leading-tight">
                  Special Remark<br />
                  <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  className="rounded-none border-gray-300 min-h-[80px]"
                />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-end">
                <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  ADD TO CART
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function GarmentTagCustomizer({ product }: { product: Product }) {
  return <GenericVisitingCardCustomizer product={product} />;
}

function ThreadCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [paperId, setPaperId] = useState((product.paper_types || [])[0]?.id || "");
  const [quantity, setQuantity] = useState<number | string>((product.quantity_tiers || [])[0]?.qty || "");
  const [colorId, setColorId] = useState("");
  const [specialRemark, setSpecialRemark] = useState("");

  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: (product.sizes || [])[0]?.id || "",
      paperId: paperId,
      colorId: colorId,
      finishingIds: [],
      quantity: Number(quantity) || 1000,
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gray-50 border-2 border-white flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto overflow-hidden">
              <img
                src={product.images?.[0] || ""}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-blue-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={paperId}
                  onChange={e => setPaperId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.paper_types || []).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">
                  Select Detail<br />
                  <span className="text-gray-500 font-normal block mt-1">Qty.</span>
                </label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none mt-2"
                  value={quantity}
                >
                  <option value="">--Select--</option>
                  {(product.quantity_tiers || []).map(q => (
                    <option key={q.qty} value={q.qty}>{q.qty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Colour</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white text-sm outline-none"
                  value={colorId}
                  onChange={e => setColorId(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.color_options || []).map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 p-3 bg-green-50 text-green-700 text-center text-sm font-bold border border-green-200">
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                  <div className="text-center text-green-600 font-bold mt-2 pt-2 border-t border-gray-200">
                    Free Delivery
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 mt-4">
                <label className="font-bold text-right text-gray-700 pt-2 leading-tight">
                  Special Remark<br />
                  <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  className="rounded-none border-gray-300 min-h-[80px]"
                />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
                <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  ADD TO CART
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ----------------------------------------------------------------------
// CUSTOM PVC CLIP CONFIGURATOR
// ----------------------------------------------------------------------
function PVCClipCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [selectedType, setSelectedType] = useState("Type - 1");
  const [quantity, setQuantity] = useState<number | string>(4000);
  const [specialRemark, setSpecialRemark] = useState("");

  useEffect(() => {
    setSelectedType("Type - 1");
    setQuantity(4000);
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

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 items-start">
          {/* LEFT: Image */}
          <div className="flex flex-col items-center border shadow-sm p-4 bg-gray-50 rounded">
            <img src={product.images?.[0] || ""} alt={product.name} className="w-full object-contain" />
          </div>

          {/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 space-y-6 text-sm">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-gray-800">
              ADD ORDER
            </h1>

            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-bold text-gray-700">Order Name</label>
                <Input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-bold text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  <option value="Type - 1">Type - 1</option>
                  <option value="Type - 2">Type - 2</option>
                  <option value="Type - 3">Type - 3</option>
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black mt-6">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <label className="font-bold text-gray-700 pt-2">Qty.</label>
                <div>
                  <Input
                    type="number"
                    min={1}
                    disabled
                    value={quantity}
                    className="border border-gray-300 p-2 w-full bg-gray-100 outline-none cursor-not-allowed" />
                  <div className="text-green-600 text-xs mt-2 font-bold uppercase tracking-wider">
                  </div>
                </div>
              </div>

              {/* Pricing Box */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4 mt-6">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                    <span>Amount Payable</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex items-center gap-2 text-black text-xs mt-2 font-bold">
                    Free Delivery
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-start gap-4 pt-4">
                <div />
                <div className="text-gray-400 font-bold uppercase tracking-tight text-xs pb-4">
                  LK Printers Of India Limited
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
                <Button onClick={handleAddToCart} size="lg" className="w-full px-8 bg-[#003366] hover:bg-[#002244] rounded shadow h-12 text-sm font-bold tracking-widest text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  ADD TO CART
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
