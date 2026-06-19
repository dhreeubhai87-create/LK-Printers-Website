import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { S as SiteHeader } from "./site-header-B5bYOmyi.js";
import { S as SiteFooter } from "./site-footer-ehRP9ZUw.js";
import { B as Button, I as Input } from "./router-frHDfBxK.js";
import { LayoutDashboard, ShoppingBag, Users, BarChart3, X, Download, Search, Loader2, ArrowUpDown, Edit2, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { B as Badge } from "./badge-DHgTIpEC.js";
import { useState, useEffect } from "react";
import { a as apiGetAllOrders, g as generateInvoicePDF, b as apiUpdateOrder, d as apiDeleteOrder } from "./orders-7cCYmoLB.js";
import { f as formatINR } from "./pricing-DDwJ8HTl.js";
import { toast } from "sonner";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-Dh6oVRd5.js";
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
function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    status: "Confirmed"
  });
  const [deletingOrder, setDeletingOrder] = useState(null);
  const checkAdminAuth = () => {
    const adminToken = localStorage.getItem("lk-admin-token");
    const adminProfileRaw = localStorage.getItem("lk-admin-profile");
    if (!adminToken) {
      toast.error("Authentication required. Redirecting to admin console.");
      navigate({
        to: "/admin/login"
      });
      return false;
    }
    if (adminProfileRaw) {
      try {
        const adminProfile = JSON.parse(adminProfileRaw);
        if (adminProfile.role !== "admin") {
          throw new Error("Invalid admin profile");
        }
      } catch {
        localStorage.removeItem("lk-admin-token");
        localStorage.removeItem("lk-admin-profile");
        toast.error("Admin session is invalid. Please log in again.");
        navigate({
          to: "/admin/login"
        });
        return false;
      }
    }
    return true;
  };
  const loadOrders = async () => {
    if (!checkAdminAuth()) return;
    setLoading(true);
    try {
      const data = await apiGetAllOrders();
      setOrders(data);
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadOrders();
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("lk-admin-token");
    localStorage.removeItem("lk-admin-profile");
    toast.success("Logged out successfully");
    navigate({
      to: "/admin/login"
    });
  };
  const handleEditClick = (order) => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName,
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      status: order.status
    });
  };
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    const success = await apiUpdateOrder(editingOrder._id, editForm);
    if (success) {
      toast.success("Order details updated successfully");
      setEditingOrder(null);
      loadOrders();
    } else {
      toast.error("Failed to update order");
    }
  };
  const handleDeleteClick = (order) => {
    setDeletingOrder(order);
  };
  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    const success = await apiDeleteOrder(deletingOrder._id);
    if (success) {
      toast.success(`Order ${deletingOrder.orderNumber} deleted successfully`);
      setDeletingOrder(null);
      loadOrders();
    } else {
      toast.error("Failed to delete order");
    }
  };
  const handleDownloadInvoice = async (order) => {
    try {
      const pdfBytes = await generateInvoicePDF(order);
      const blob = new Blob([pdfBytes], {
        type: "application/pdf"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error generating invoice PDF");
    }
  };
  const downloadAllReport = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = ["Order No", "Date", "Customer Name", "Customer Email", "Customer Phone", "Total Amount", "Status"];
    const rows = orders.map((o) => [o.orderNumber, o.date, o.customerName, o.customerEmail || "N/A", o.customerPhone || "N/A", o.totalAmount, o.status]);
    const content = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([content], {
      type: "text/csv"
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_orders_report_${(/* @__PURE__ */ new Date()).getTime()}.csv`;
    a.click();
    toast.success("CSV report exported!");
  };
  const statuses = ["All", "Confirmed", "Under Process", "Shipped", "Delivered", "Cancelled"];
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerEmail && o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerPhone && o.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) || o.items && o.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "All" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.createdAt || a.date).getTime();
      const dateB = new Date(b.createdAt || b.date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sortBy === "amount") {
      return sortOrder === "asc" ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
    }
    return 0;
  });
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === "Confirmed" || o.status === "Under Process").length;
  const completedOrdersCount = orders.filter((o) => o.status === "Delivered").length;
  const cancelledOrdersCount = orders.filter((o) => o.status === "Cancelled").length;
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysOrdersCount = orders.filter((o) => {
    const dateObj = new Date(o.createdAt || o.date);
    return dateObj >= todayStart;
  }).length;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-muted/20 flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("div", { className: "flex-1 container mx-auto px-6 py-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-8", children: [
      /* @__PURE__ */ jsxs("aside", { className: "lg:w-64 space-y-2 flex-shrink-0", children: [
        /* @__PURE__ */ jsx("h2", { className: "px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 font-mono", children: "Main Console" }),
        /* @__PURE__ */ jsx(AdminNavLink, { icon: /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-4 h-4" }), label: "Dashboard", active: true }),
        /* @__PURE__ */ jsx(AdminNavLink, { icon: /* @__PURE__ */ jsx(ShoppingBag, { className: "w-4 h-4" }), label: "Orders" }),
        /* @__PURE__ */ jsx(AdminNavLink, { icon: /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }), label: "Customers" }),
        /* @__PURE__ */ jsx(AdminNavLink, { icon: /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4" }), label: "Analytics" }),
        /* @__PURE__ */ jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-red-600 hover:bg-red-50 hover:shadow-soft", children: [
          /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
          "Sign Out"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end flex-wrap gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-4xl font-serif font-bold", children: "Admin Console" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Real-time database records and secure checkout management." })
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: downloadAllReport, className: "rounded-xl shadow-lg shadow-primary/20 bg-primary font-bold", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
            " Export CSV Report"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6", children: [
          /* @__PURE__ */ jsx(StatCard, { label: "Total Orders", value: String(totalOrdersCount), sub: "Overall checkouts registered", color: "bg-blue-500/10 text-blue-600" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Pending Processing", value: String(pendingOrdersCount), sub: "Confirmed & under process", color: "bg-amber-500/10 text-amber-600" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Completed Orders", value: String(completedOrdersCount), sub: "Successfully delivered shipments", color: "bg-green-500/10 text-green-600" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Cancelled Orders", value: String(cancelledOrdersCount), sub: "Cancelled / void transactions", color: "bg-rose-500/10 text-rose-600" }),
          /* @__PURE__ */ jsx(StatCard, { label: "Placed Today", value: String(todaysOrdersCount), sub: "Orders placed in current 24h", color: "bg-violet-500/10 text-violet-600" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border rounded-[2.5rem] shadow-xl overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold font-serif", children: "Customer Order Records" }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
                /* @__PURE__ */ jsx(Input, { placeholder: "Search Name/Order No...", className: "pl-10 rounded-xl bg-muted/30 border-none w-56", value: searchTerm, onChange: (e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                } })
              ] }),
              /* @__PURE__ */ jsx("select", { className: "rounded-xl border border-muted/50 bg-background px-3 py-2 text-sm font-bold outline-none", value: filterStatus, onChange: (e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }, children: statuses.map((st) => /* @__PURE__ */ jsx("option", { value: st, children: st === "All" ? "All Statuses" : st }, st)) })
            ] })
          ] }),
          loading ? /* @__PURE__ */ jsxs("div", { className: "p-20 text-center flex flex-col items-center justify-center gap-4", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-10 h-10 text-primary animate-spin" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground font-bold", children: "Connecting secure database..." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest border-b", children: [
              /* @__PURE__ */ jsxs("th", { className: "px-6 py-4 cursor-pointer select-none hover:text-foreground", onClick: () => toggleSort("date"), children: [
                "Order ID / Date ",
                /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-3.5 h-3.5 inline ml-1" })
              ] }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Customer Details" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Items Summary" }),
              /* @__PURE__ */ jsxs("th", { className: "px-6 py-4 cursor-pointer select-none hover:text-foreground", onClick: () => toggleSort("amount"), children: [
                "Amount ",
                /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-3.5 h-3.5 inline ml-1" })
              ] }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: paginatedOrders.length > 0 ? paginatedOrders.map((order) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/10 transition-colors", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-6 py-5", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-blue-700 block", children: order.orderNumber }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-mono", children: order.date })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold", children: order.customerName }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: order.customerEmail || "No Email Provided" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: order.customerPhone || "No Phone Provided" })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: order.items && order.items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium", children: [
                item.name,
                " ",
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                  "x",
                  item.quantity
                ] })
              ] }, i)) }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 font-bold text-primary", children: formatINR(order.totalAmount) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx(StatusBadge, { status: order.status }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "w-8 h-8 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100", title: "Edit Order", onClick: () => handleEditClick(order), children: /* @__PURE__ */ jsx(Edit2, { className: "w-3.5 h-3.5" }) }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "w-8 h-8 rounded-lg text-red-600 bg-red-50 hover:bg-red-100", title: "Delete Order", onClick: () => handleDeleteClick(order), children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "w-8 h-8 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100", title: "Invoice PDF", onClick: () => handleDownloadInvoice(order), children: /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }) })
              ] }) })
            ] }, order._id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-8 py-20 text-center text-muted-foreground font-semibold", children: "No records matching search parameters." }) }) })
          ] }) }),
          !loading && totalItems > 0 && /* @__PURE__ */ jsxs("div", { className: "p-6 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-bold", children: "Records per page:" }),
              /* @__PURE__ */ jsxs("select", { className: "rounded-lg border bg-background px-2 py-1 text-xs font-bold outline-none", value: itemsPerPage, onChange: (e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }, children: [
                /* @__PURE__ */ jsx("option", { value: 5, children: "5" }),
                /* @__PURE__ */ jsx("option", { value: 10, children: "10" }),
                /* @__PURE__ */ jsx("option", { value: 20, children: "20" }),
                /* @__PURE__ */ jsx("option", { value: 50, children: "50" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-mono", children: [
                "Showing ",
                (currentPage - 1) * itemsPerPage + 1,
                " - ",
                Math.min(currentPage * itemsPerPage, totalItems),
                " of ",
                totalItems
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", className: "w-8 h-8 rounded-lg", disabled: currentPage === 1, onClick: () => setCurrentPage((prev) => prev - 1), children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold px-3", children: [
                "Page ",
                currentPage,
                " of ",
                totalPages || 1
              ] }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", className: "w-8 h-8 rounded-lg", disabled: currentPage === totalPages || totalPages === 0, onClick: () => setCurrentPage((prev) => prev + 1), children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }) })
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: editingOrder !== null, onOpenChange: (open) => !open && setEditingOrder(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md rounded-[2rem] p-8 border bg-card shadow-2xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-2xl font-serif font-bold", children: "Modify Order Details" }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
          "Order Ref: ",
          editingOrder?.orderNumber
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleUpdateOrder, className: "space-y-4 pt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Customer Name" }),
          /* @__PURE__ */ jsx(Input, { type: "text", required: true, className: "rounded-xl h-11", value: editForm.customerName, onChange: (e) => setEditForm({
            ...editForm,
            customerName: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Email Address" }),
          /* @__PURE__ */ jsx(Input, { type: "email", className: "rounded-xl h-11", value: editForm.customerEmail, onChange: (e) => setEditForm({
            ...editForm,
            customerEmail: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Contact Phone" }),
          /* @__PURE__ */ jsx(Input, { type: "text", className: "rounded-xl h-11", value: editForm.customerPhone, onChange: (e) => setEditForm({
            ...editForm,
            customerPhone: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Order Status" }),
          /* @__PURE__ */ jsxs("select", { className: "w-full h-11 rounded-xl border bg-card px-3 font-semibold outline-none", value: editForm.status, onChange: (e) => setEditForm({
            ...editForm,
            status: e.target.value
          }), children: [
            /* @__PURE__ */ jsx("option", { value: "Confirmed", children: "Confirmed" }),
            /* @__PURE__ */ jsx("option", { value: "Under Process", children: "Under Process" }),
            /* @__PURE__ */ jsx("option", { value: "Shipped", children: "Shipped" }),
            /* @__PURE__ */ jsx("option", { value: "Delivered", children: "Delivered" }),
            /* @__PURE__ */ jsx("option", { value: "Cancelled", children: "Cancelled" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", className: "flex-1 h-12 rounded-xl font-bold", onClick: () => setEditingOrder(null), children: "Cancel" }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold", children: "Save Changes" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: deletingOrder !== null, onOpenChange: (open) => !open && setDeletingOrder(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md rounded-[2rem] p-8 border bg-card shadow-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-2xl font-serif font-bold text-red-600", children: "Confirm Deletion" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [
          "Are you sure you want to permanently delete order ",
          /* @__PURE__ */ jsx("strong", { className: "font-mono text-foreground", children: deletingOrder?.orderNumber }),
          "?"
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100", children: "Warning: This action cannot be undone. This will permanently remove the order record from the database." }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", className: "flex-1 h-12 rounded-xl font-bold", onClick: () => setDeletingOrder(null), children: "No, Keep Order" }),
        /* @__PURE__ */ jsx(Button, { type: "button", className: "flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold", onClick: handleConfirmDelete, children: "Yes, Delete Permanently" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function StatusBadge({
  status
}) {
  const styles = {
    "Under Process": "bg-amber-100 text-amber-800 border-amber-200",
    "Confirmed": "bg-blue-100 text-blue-800 border-blue-200",
    "Shipped": "bg-purple-100 text-purple-800 border-purple-200",
    "Delivered": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Cancelled": "bg-rose-100 text-rose-800 border-rose-200"
  };
  const styleClass = styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
  return /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `rounded-full px-3 py-1 gap-1.5 border font-bold ${styleClass}`, children: status });
}
function AdminNavLink({
  icon,
  label,
  active
}) {
  return /* @__PURE__ */ jsxs("button", { className: `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-card hover:shadow-soft"}`, children: [
    icon,
    label
  ] });
}
function StatCard({
  label,
  value,
  sub,
  color
}) {
  return /* @__PURE__ */ jsxs("div", { className: "p-6 bg-card border rounded-[2.5rem] shadow-soft space-y-3", children: [
    /* @__PURE__ */ jsx("div", { className: `w-10 h-10 ${color} rounded-2xl flex items-center justify-center`, children: /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-muted-foreground uppercase tracking-widest", children: label }),
      /* @__PURE__ */ jsx("h4", { className: "text-2xl font-serif font-bold mt-1", children: value }),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-1", children: sub })
    ] })
  ] });
}
export {
  AdminDashboard as component
};
