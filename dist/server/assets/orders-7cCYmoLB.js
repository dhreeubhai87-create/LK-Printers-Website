import { format } from "date-fns";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { a as apiRequest } from "./api-client-Bu49ln3o.js";
const STORAGE_KEY = "lk-printer-orders";
const getOrders = () => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error("Error parsing orders:", e);
    return [];
  }
};
const saveOrder = async (order, email, phone) => {
  const orders = getOrders();
  const updated = [order, ...orders];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  await apiSaveOrder(order, email, phone);
};
const apiSaveOrder = async (order, email, phone) => {
  try {
    const response = await apiRequest("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: email || "",
        customerPhone: phone || "",
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        date: order.date
      })
    });
    return !!response;
  } catch (e) {
    console.error("API Order save failed:", e);
    return false;
  }
};
const handleAuthRedirect = (status) => {
  if (status === 401 || status === 403) {
    localStorage.removeItem("lk-admin-token");
    localStorage.removeItem("lk-admin-profile");
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
  }
};
const apiGetAllOrders = async () => {
  try {
    const token = localStorage.getItem("lk-admin-token");
    const data = await apiRequest("/api/orders", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    return data.response || [];
  } catch (e) {
    const status = e.status;
    if (status === 401 || status === 403) {
      handleAuthRedirect(status);
    }
    console.error("API Get all orders failed:", e);
    return [];
  }
};
const apiUpdateOrder = async (id, updateData) => {
  try {
    const token = localStorage.getItem("lk-admin-token");
    await apiRequest(`/api/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    return true;
  } catch (e) {
    const status = e.status;
    if (status === 401 || status === 403) {
      handleAuthRedirect(status);
    }
    console.error("API Update order failed:", e);
    return false;
  }
};
const apiDeleteOrder = async (id) => {
  try {
    const token = localStorage.getItem("lk-admin-token");
    await apiRequest(`/api/orders/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    return true;
  } catch (e) {
    const status = e.status;
    if (status === 401 || status === 403) {
      handleAuthRedirect(status);
    }
    console.error("API Delete order failed:", e);
    return false;
  }
};
const createOrderFromCart = (items, total) => {
  const orderNumber = `ORD-${Math.floor(1e5 + Math.random() * 9e5)}`;
  return {
    id: crypto.randomUUID(),
    orderNumber,
    date: format(/* @__PURE__ */ new Date(), "dd MMM yyyy, hh:mm a"),
    customerName: items[0]?.options?.orderName || "Guest Customer",
    items,
    totalAmount: total,
    status: "Confirmed",
    invoiceUrl: "#"
    // Mock PDF link
  };
};
const initDemoOrders = () => {
  const orders = getOrders();
  if (orders.length === 0) {
    const demoOrders = [
      {
        id: "1",
        orderNumber: "ORD-827361",
        date: "08 May 2026, 02:30 PM",
        customerName: "Dheeraj Kumar",
        items: [
          {
            id: "d1",
            name: "Gloss Coated Tags",
            price: 4500,
            quantity: 1e3,
            image: "https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?q=80&w=2070&auto=format&fit=crop",
            options: { size: "Medium", shape: "Rectangle" }
          }
        ],
        totalAmount: 4500,
        status: "Delivered",
        invoiceUrl: "#"
      },
      {
        id: "2",
        orderNumber: "ORD-918273",
        date: "09 May 2026, 11:15 AM",
        customerName: "Rahul Sharma",
        items: [
          {
            id: "d2",
            name: "Matt Lamination Tags",
            price: 6800,
            quantity: 2e3,
            image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop",
            options: { size: "Small", shape: "Round Corner" }
          }
        ],
        totalAmount: 6800,
        status: "Shipped",
        invoiceUrl: "#"
      },
      {
        id: "3",
        orderNumber: "ORD-552211",
        date: "10 May 2026, 09:45 AM",
        customerName: "Anita Singh",
        items: [
          {
            id: "d3",
            name: "Matt Lamination + UV",
            price: 12500,
            quantity: 5e3,
            image: "https://images.unsplash.com/photo-1606857521015-7f9fdf4239b9?q=80&w=2070&auto=format&fit=crop",
            options: { size: "Large", spotUV: "Both Side" }
          }
        ],
        totalAmount: 12500,
        status: "Under Process",
        invoiceUrl: "#"
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoOrders));
  }
};
const generateInvoicePDF = async (order) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  page.drawText("INVOICE", { x: 50, y: height - 80, size: 24, font: boldFont, color: rgb(0.1, 0.4, 0.8) });
  page.drawText("LK PRINTERS", { x: 400, y: height - 80, size: 18, font: boldFont });
  page.drawText("123 Business Hub, New Delhi, India", { x: 400, y: height - 100, size: 8, font });
  page.drawLine({
    start: { x: 50, y: height - 120 },
    end: { x: 550, y: height - 120 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });
  page.drawText(`Invoice No: ${order.orderNumber}`, { x: 50, y: height - 150, size: 11, font: boldFont });
  page.drawText(`Date: ${order.date}`, { x: 50, y: height - 170, size: 11, font });
  page.drawText(`Status: ${order.status}`, { x: 50, y: height - 190, size: 11, font });
  page.drawText("BILL TO:", { x: 350, y: height - 150, size: 11, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(order.customerName || "Customer", { x: 350, y: height - 170, size: 11, font: boldFont });
  if (order.customerEmail) {
    page.drawText(`Email: ${order.customerEmail}`, { x: 350, y: height - 190, size: 10, font });
  }
  if (order.customerPhone) {
    page.drawText(`Phone: ${order.customerPhone}`, { x: 350, y: height - 210, size: 10, font });
  }
  let currentY = height - 260;
  page.drawRectangle({
    x: 50,
    y: currentY - 5,
    width: 500,
    height: 25,
    color: rgb(0.95, 0.95, 0.95)
  });
  page.drawText("Item Details", { x: 60, y: currentY, size: 10, font: boldFont });
  page.drawText("Qty", { x: 320, y: currentY, size: 10, font: boldFont });
  page.drawText("Unit Price", { x: 400, y: currentY, size: 10, font: boldFont });
  page.drawText("Total", { x: 490, y: currentY, size: 10, font: boldFont });
  currentY -= 30;
  if (order.items && Array.isArray(order.items)) {
    for (const item of order.items) {
      page.drawText(item.name, { x: 60, y: currentY, size: 10, font });
      if (item.options) {
        const optionStrings = Object.entries(item.options).filter(([k, v]) => v && k !== "orderName").map(([k, v]) => `${k}: ${v}`).join(", ");
        if (optionStrings) {
          page.drawText(optionStrings.substring(0, 50), { x: 60, y: currentY - 12, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
        }
      }
      page.drawText(String(item.quantity), { x: 320, y: currentY, size: 10, font });
      const qtyVal = item.quantity || 1;
      page.drawText(`Rs. ${(item.price / qtyVal).toFixed(2)}`, { x: 400, y: currentY, size: 10, font });
      page.drawText(`Rs. ${item.price.toFixed(2)}`, { x: 490, y: currentY, size: 10, font: boldFont });
      currentY -= 30;
    }
  }
  page.drawLine({
    start: { x: 50, y: currentY },
    end: { x: 550, y: currentY },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });
  currentY -= 25;
  page.drawText("Grand Total:", { x: 380, y: currentY, size: 14, font: boldFont, color: rgb(0.1, 0.4, 0.8) });
  page.drawText(`Rs. ${order.totalAmount.toFixed(2)}`, { x: 490, y: currentY, size: 14, font: boldFont, color: rgb(0.1, 0.4, 0.8) });
  page.drawText("Thank you for choosing LK Printers!", { x: 50, y: 50, size: 12, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("This is a computer generated invoice.", { x: 50, y: 35, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
export {
  apiGetAllOrders as a,
  apiUpdateOrder as b,
  createOrderFromCart as c,
  apiDeleteOrder as d,
  getOrders as e,
  generateInvoicePDF as g,
  initDemoOrders as i,
  saveOrder as s
};
