import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { S as SiteHeader } from "./site-header-B5bYOmyi.js";
import { S as SiteFooter } from "./site-footer-ehRP9ZUw.js";
import { useState, useEffect } from "react";
import { f as formatINR } from "./pricing-DDwJ8HTl.js";
import { e as getOrders, g as generateInvoicePDF, i as initDemoOrders } from "./orders-7cCYmoLB.js";
import { B as Badge } from "./badge-DHgTIpEC.js";
import { I as Input, B as Button } from "./router-frHDfBxK.js";
import { Search, Filter, Eye, FileText, Package, Truck, CheckCircle2, Clock, ChevronRight, LayoutDashboard, User, Settings, LogOut, Loader2 } from "lucide-react";
import { D as Dialog, d as DialogTrigger, a as DialogContent, c as DialogTitle } from "./dialog-Dh6oVRd5.js";
import { toast } from "sonner";
import { api } from "./api-DY95vw1Q.js";
import "@tanstack/react-router";
import "date-fns";
import "pdf-lib";
import "./api-client-Bu49ln3o.js";
import "class-variance-authority";
import "zod";
import "@supabase/supabase-js";
import "@radix-ui/react-slot";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-dialog";
import "fs";
import "path";
import "sharp";
const StatusBadge = ({ status }) => {
  switch (status) {
    case "Under Process":
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-amber-50 text-amber-700 border-amber-200 gap-1 font-bold", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
        " Under Process"
      ] });
    case "Confirmed":
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200 gap-1 font-bold", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3" }),
        " Confirmed"
      ] });
    case "Shipped":
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200 gap-1 font-bold", children: [
        /* @__PURE__ */ jsx(Truck, { className: "w-3 h-3" }),
        " Shipped"
      ] });
    case "Delivered":
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-bold", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-3 h-3" }),
        " Delivered"
      ] });
    default:
      return /* @__PURE__ */ jsx(Badge, { children: status });
  }
};
const RecentOrders = ({ filterStatus = "All Orders" }) => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    setOrders(getOrders());
    const handleStorage = () => setOrders(getOrders());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  const downloadCSV = () => {
    const headers = ["Order No", "Date", "Order Name", "Total", "Status"];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.date,
      o.customerName,
      // This is used as the Order Name in our B2B context
      o.totalAmount,
      o.status
    ]);
    const content = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_export_${(/* @__PURE__ */ new Date()).getTime()}.csv`;
    a.click();
    toast.success("CSV Export successful!");
  };
  const handleDownloadInvoice = async (order) => {
    try {
      const pdfBytes = await generateInvoicePDF(order);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Invoice PDF Downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    }
  };
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === "Processing") {
      return matchesSearch && (o.status === "Under Process" || o.status === "Confirmed");
    }
    if (filterStatus === "Completed") {
      return matchesSearch && (o.status === "Delivered" || o.status === "Shipped");
    }
    return matchesSearch;
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative w-full md:w-96", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search by Order # or Name...",
            className: "pl-10 rounded-xl bg-gray-50/50",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 w-full md:w-auto", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "rounded-xl flex-1 md:flex-none border-gray-200 hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4 mr-2 text-gray-500" }),
          " Filters"
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            className: "rounded-xl flex-1 md:flex-none border-gray-200 hover:bg-gray-50 font-bold",
            onClick: downloadCSV,
            children: "Export CSV"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "hidden md:block bg-white border rounded-[2rem] overflow-hidden shadow-xl shadow-gray-100", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500", children: "Order No." }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500", children: "Date" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500", children: "Order Name" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500", children: "Order Detail" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500", children: "Total" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500 text-center", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: filteredOrders.length > 0 ? filteredOrders.map((order) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50/80 transition-colors group", children: [
        /* @__PURE__ */ jsx("td", { className: "px-6 py-5 font-mono text-sm font-bold text-blue-700", children: order.orderNumber }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-5 text-sm text-gray-600", children: order.date }),
        /* @__PURE__ */ jsxs("td", { className: "px-6 py-5", children: [
          /* @__PURE__ */ jsx("div", { className: "font-bold text-sm", children: order.customerName }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400", children: "B2B Customized Order" })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx("div", { className: "flex -space-x-2", children: order.items.map((item, i) => /* @__PURE__ */ jsx("div", { title: item.name, className: "w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm", children: /* @__PURE__ */ jsx("img", { src: item.image, alt: item.name, className: "w-full h-full object-cover" }) }, i)) }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-5 font-bold text-primary", children: formatINR(order.totalAmount) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsx(StatusBadge, { status: order.status }) }),
        /* @__PURE__ */ jsx("td", { className: "px-6 py-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [
          /* @__PURE__ */ jsxs(Dialog, { children: [
            /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "w-9 h-9 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100", title: "View Details", children: /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) }) }),
            /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-blue-600 p-8 text-white", children: [
                /* @__PURE__ */ jsx(DialogTitle, { className: "text-2xl font-serif font-bold", children: "Order Details" }),
                /* @__PURE__ */ jsxs("p", { className: "opacity-80 text-sm mt-1", children: [
                  "Order Number: ",
                  order.orderNumber
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-8", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-muted-foreground tracking-widest", children: "Order Name" }),
                      /* @__PURE__ */ jsx("div", { className: "font-bold text-lg", children: order.customerName })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-muted-foreground tracking-widest", children: "Placement Date" }),
                      /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-gray-600", children: order.date })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-muted-foreground tracking-widest", children: "Current Status" }),
                      /* @__PURE__ */ jsx("div", { className: "pt-1", children: /* @__PURE__ */ jsx(StatusBadge, { status: order.status }) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-muted-foreground tracking-widest", children: "Payment Total" }),
                      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-blue-600", children: formatINR(order.totalAmount) })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "border rounded-2xl overflow-hidden bg-gray-50/50", children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-gray-100/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b", children: "Product Summary" }),
                  /* @__PURE__ */ jsx("div", { className: "divide-y max-h-60 overflow-y-auto", children: order.items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex gap-4 items-center", children: [
                    /* @__PURE__ */ jsx("img", { src: item.image, className: "w-12 h-12 rounded-xl border object-cover shadow-sm" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsx("div", { className: "font-bold text-sm", children: item.name }),
                      /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground uppercase font-bold tracking-tighter", children: [
                        "Quantity: ",
                        item.quantity
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "font-bold text-primary", children: formatINR(item.price) })
                  ] }, i)) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-4 pt-2", children: [
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      className: "flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold transition-all active:scale-95",
                      onClick: () => toast.info(`Tracking Order: ${order.orderNumber}`, {
                        description: "Your package is in transit. Estimated delivery: 2 days."
                      }),
                      children: "Track Shipment"
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    Button,
                    {
                      variant: "outline",
                      className: "flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 font-bold shadow-sm transition-all active:scale-95",
                      onClick: () => handleDownloadInvoice(order),
                      children: [
                        /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 mr-2 text-red-600" }),
                        " Download Invoice (PDF)"
                      ]
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "w-10 h-10 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-all border border-red-100 shadow-sm",
              title: "Download PDF Invoice",
              onClick: () => handleDownloadInvoice(order),
              children: /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5" })
            }
          )
        ] }) })
      ] }, order.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-6 py-20 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-10 h-10 text-muted-foreground opacity-20" }),
        /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-gray-400", children: "No matching orders found" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: "Adjust your filters or search terms." })
      ] }) }) }) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "md:hidden space-y-4", children: filteredOrders.length > 0 ? filteredOrders.map((order) => /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-bold text-blue-700", children: order.orderNumber }),
          /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground font-medium uppercase tracking-widest", children: order.date })
        ] }),
        /* @__PURE__ */ jsx(StatusBadge, { status: order.status })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 py-2 border-y border-gray-50", children: [
        /* @__PURE__ */ jsx("div", { className: "flex -space-x-3", children: order.items.slice(0, 3).map((item, i) => /* @__PURE__ */ jsx("img", { src: item.image, className: "w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" }, i)) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest", children: "Order Amount" }),
          /* @__PURE__ */ jsx("div", { className: "font-bold text-lg text-primary", children: formatINR(order.totalAmount) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "flex-1 rounded-xl h-10 border-gray-200 font-bold text-xs", children: "View Details" }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "secondary",
            size: "sm",
            className: "flex-1 rounded-xl h-10 bg-red-50 text-red-700 hover:bg-red-100 font-bold border border-red-100 text-xs",
            onClick: () => handleDownloadInvoice(order),
            children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 mr-2" }),
              " PDF Invoice"
            ]
          }
        )
      ] })
    ] }, order.id)) : /* @__PURE__ */ jsx("div", { className: "bg-white border rounded-3xl p-10 text-center text-gray-400 font-bold", children: "No orders found." }) })
  ] });
};
function AccountOrdersPage() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [orderFilter, setOrderFilter] = useState("All Orders");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "Loading...",
    email: "",
    phone: "",
    company: ""
  });
  const [settings, setSettings] = useState({
    emailNotify: true,
    twoFactor: false,
    darkMode: false,
    language: "English",
    currency: "INR (₹)"
  });
  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
    confirm: ""
  });
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [p, s] = await Promise.all([api.getProfile(), api.getSettings()]);
        setProfile(p);
        setSettings(s);
        initDemoOrders();
      } catch (error) {
        toast.error("Failed to load account data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile(profile);
      toast.success("Profile saved to cloud!", {
        description: "Changes are now permanent."
      });
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };
  const handleUpdateSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await api.updateSettings(newSettings);
    } catch (error) {
      toast.error("Failed to sync settings");
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("lk-auth-token");
    localStorage.removeItem("lk-printer-profile");
    toast.info("Logging out...", {
      description: "Redirecting to home page."
    });
    setTimeout(() => window.location.href = "/", 1500);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-[#f8f9fa] flex flex-col font-sans", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 container mx-auto px-4 py-8 md:py-12 max-w-[1200px]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-8", children: [
        /* @__PURE__ */ jsx("span", { children: "Home" }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
        /* @__PURE__ */ jsx("span", { children: "Account" }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" }),
        /* @__PURE__ */ jsx("span", { className: "text-blue-600", children: "Order History" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-8", children: [
        /* @__PURE__ */ jsxs("aside", { className: "w-full lg:w-64 space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-white border rounded-3xl p-6 shadow-sm mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-xl", children: "DK" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-bold", children: "Dheeraj Kumar" }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-500 uppercase tracking-tighter", children: "Premium Member" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("nav", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => setActiveTab("Dashboard"), className: `w-full justify-start rounded-xl h-12 transition-all group ${activeTab === "Dashboard" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white hover:shadow-sm"}`, children: [
              /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-5 h-5 mr-3" }),
              " Dashboard"
            ] }),
            /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => setActiveTab("Orders"), className: `w-full justify-start rounded-xl h-12 transition-all group ${activeTab === "Orders" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white hover:shadow-sm"}`, children: [
              /* @__PURE__ */ jsx(Package, { className: "w-5 h-5 mr-3" }),
              " Order History"
            ] }),
            /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => setActiveTab("Profile"), className: `w-full justify-start rounded-xl h-12 transition-all group ${activeTab === "Profile" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white hover:shadow-sm"}`, children: [
              /* @__PURE__ */ jsx(User, { className: "w-5 h-5 mr-3" }),
              " My Profile"
            ] }),
            /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => setActiveTab("Settings"), className: `w-full justify-start rounded-xl h-12 transition-all group ${activeTab === "Settings" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white hover:shadow-sm"}`, children: [
              /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 mr-3" }),
              " Settings"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-4 mt-4 border-t", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: handleLogout, className: "w-full justify-start rounded-xl h-12 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all group", children: [
              /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" }),
              " Logout"
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 space-y-8", children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-96 space-y-4", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-12 h-12 text-blue-600 animate-spin" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-400 font-bold animate-pulse", children: "Connecting to Secure Server..." })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          activeTab === "Orders" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-serif font-bold text-gray-900", children: "Order History" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-1", children: "Manage and track your recent orders with ease." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex bg-white border rounded-2xl p-1 shadow-sm", children: [
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: `rounded-xl h-9 px-4 text-[11px] font-bold uppercase tracking-wider transition-all ${orderFilter === "All Orders" ? "bg-gray-100 text-black shadow-sm" : "text-gray-500 hover:text-black"}`, onClick: () => setOrderFilter("All Orders"), children: "All Orders" }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: `rounded-xl h-9 px-4 text-[11px] font-bold uppercase tracking-wider transition-all ${orderFilter === "Processing" ? "bg-gray-100 text-black shadow-sm" : "text-gray-500 hover:text-black"}`, onClick: () => setOrderFilter("Processing"), children: "Processing" }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: `rounded-xl h-9 px-4 text-[11px] font-bold uppercase tracking-wider transition-all ${orderFilter === "Completed" ? "bg-gray-100 text-black shadow-sm" : "text-gray-500 hover:text-black"}`, onClick: () => setOrderFilter("Completed"), children: "Completed" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(RecentOrders, { filterStatus: orderFilter })
          ] }),
          activeTab === "Dashboard" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded-[2rem] p-10 text-center space-y-4 shadow-sm relative overflow-hidden group", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" }),
              /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-all shadow-lg shadow-blue-100", children: /* @__PURE__ */ jsx(LayoutDashboard, { className: "w-10 h-10" }) }),
              /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-serif font-bold", children: [
                "Welcome back, ",
                profile.name,
                "!"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: "Track your orders, manage your profile and keep your account secure in one place." }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 pt-10", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border text-left hover:shadow-md transition-all", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1", children: "Total Orders" }),
                  /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-gray-900", children: "128" }),
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-green-600 font-bold mt-2", children: "+12 this month" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border text-left hover:shadow-md transition-all", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1", children: "Pending Payment" }),
                  /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-red-600", children: "₹0" }),
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 font-bold mt-2", children: "No overdue invoices" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border text-left hover:shadow-md transition-all", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1", children: "In Process" }),
                  /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-blue-600", children: "3" }),
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-blue-400 font-bold mt-2", children: "ETA: 2-3 Days" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded-[2rem] p-8 shadow-sm", children: [
                /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg mb-6 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Package, { className: "w-5 h-5 text-blue-600" }),
                  " Recent Activity"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-4", children: getOrders().slice(0, 3).map((order) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-center p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group", onClick: () => setActiveTab("Orders"), children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all", children: /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxs("div", { className: "text-sm font-bold", children: [
                      "Order #",
                      order.orderNumber,
                      " updated"
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400", children: order.date })
                  ] }),
                  /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-gray-300 group-hover:text-blue-600" })
                ] }, order.id)) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded-[2rem] p-8 shadow-sm", children: [
                /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg mb-6 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 text-blue-600" }),
                  " Quick Actions"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "h-20 rounded-2xl flex flex-col gap-2 font-bold text-xs hover:bg-blue-50 hover:border-blue-200", onClick: () => setActiveTab("Orders"), children: [
                    /* @__PURE__ */ jsx(Package, { className: "w-5 h-5" }),
                    " My Orders"
                  ] }),
                  /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "h-20 rounded-2xl flex flex-col gap-2 font-bold text-xs hover:bg-blue-50 hover:border-blue-200", onClick: () => setActiveTab("Profile"), children: [
                    /* @__PURE__ */ jsx(User, { className: "w-5 h-5" }),
                    " Edit Profile"
                  ] })
                ] })
              ] })
            ] })
          ] }),
          activeTab === "Profile" && /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded-[2rem] p-10 space-y-8 shadow-sm relative overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-24 h-24 rounded-3xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl shadow-inner", children: profile.name.charAt(0) }),
                  /* @__PURE__ */ jsx("div", { className: "absolute -bottom-2 -right-2 w-8 h-8 bg-white border rounded-full shadow-lg flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-600 hover:text-white transition-all", children: /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-3xl font-serif font-bold", children: "Account Profile" }),
                  /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "Personalize your B2B printing account dashboard." })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex bg-gray-50 p-1 rounded-2xl border", children: [
                /* @__PURE__ */ jsx("div", { className: "px-4 py-2 text-xs font-bold text-gray-400", children: "Account Status:" }),
                /* @__PURE__ */ jsx("div", { className: "px-4 py-2 text-xs font-bold text-green-600 bg-white rounded-xl shadow-sm border border-green-100", children: "Active" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1", children: "Full Name" }),
                /* @__PURE__ */ jsx("input", { type: "text", className: "w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold", value: profile.name, onChange: (e) => setProfile({
                  ...profile,
                  name: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1", children: "Email Address" }),
                /* @__PURE__ */ jsx("input", { type: "email", className: "w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold", value: profile.email, onChange: (e) => setProfile({
                  ...profile,
                  email: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1", children: "Phone Number" }),
                /* @__PURE__ */ jsx("input", { type: "text", className: "w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold", value: profile.phone, onChange: (e) => setProfile({
                  ...profile,
                  phone: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1", children: "Organization" }),
                /* @__PURE__ */ jsx("input", { type: "text", className: "w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold", value: profile.company, onChange: (e) => setProfile({
                  ...profile,
                  company: e.target.value
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t flex flex-col md:flex-row gap-4 items-center justify-between", children: [
              /* @__PURE__ */ jsxs(Button, { className: "w-full md:w-auto rounded-2xl px-12 h-14 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 font-bold transition-all active:scale-95 flex items-center gap-2", onClick: handleUpdateProfile, disabled: isSaving, children: [
                isSaving ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : null,
                isSaving ? "Saving..." : "Update Account Details"
              ] }),
              /* @__PURE__ */ jsx(Button, { variant: "ghost", className: "text-gray-400 text-sm hover:text-red-500 font-bold", onClick: () => toast.warning("Requesting data deletion..."), children: "Delete Account Permanently" })
            ] })
          ] }),
          activeTab === "Settings" && /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded-[2rem] p-10 space-y-8 shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Preferences & Security" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "Fine-tune your B2B dashboard experience and account security." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4 pt-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition-all group", onClick: () => handleUpdateSettings({
                  ...settings,
                  emailNotify: !settings.emailNotify
                }), children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${settings.emailNotify ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`, children: /* @__PURE__ */ jsx(Package, { className: "w-6 h-6" }) }),
                    /* @__PURE__ */ jsx("div", { className: "font-bold", children: "Email Alerts" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: `w-12 h-6 rounded-full p-1 transition-all flex items-center ${settings.emailNotify ? "bg-blue-600" : "bg-gray-200"}`, children: /* @__PURE__ */ jsx("div", { className: `w-4 h-4 bg-white rounded-full transition-all ${settings.emailNotify ? "translate-x-6" : "translate-x-0"}` }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition-all group", onClick: () => handleUpdateSettings({
                  ...settings,
                  twoFactor: !settings.twoFactor
                }), children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${settings.twoFactor ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`, children: /* @__PURE__ */ jsx(User, { className: "w-6 h-6" }) }),
                    /* @__PURE__ */ jsx("div", { className: "font-bold", children: "2FA Security" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: `w-12 h-6 rounded-full p-1 transition-all flex items-center ${settings.twoFactor ? "bg-emerald-600" : "bg-gray-200"}`, children: /* @__PURE__ */ jsx("div", { className: `w-4 h-4 bg-white rounded-full transition-all ${settings.twoFactor ? "translate-x-6" : "translate-x-0"}` }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-6 pt-4 border-t", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1", children: "Display Language" }),
                  /* @__PURE__ */ jsxs("select", { className: "w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold outline-none cursor-pointer", value: settings.language, onChange: (e) => {
                    handleUpdateSettings({
                      ...settings,
                      language: e.target.value
                    });
                    toast.success(`Language changed to ${e.target.value}`);
                  }, children: [
                    /* @__PURE__ */ jsx("option", { children: "English" }),
                    /* @__PURE__ */ jsx("option", { children: "Hindi (हिन्दी)" }),
                    /* @__PURE__ */ jsx("option", { children: "Spanish" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1", children: "Currency Format" }),
                  /* @__PURE__ */ jsxs("select", { className: "w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold outline-none cursor-pointer", value: settings.currency, onChange: (e) => {
                    handleUpdateSettings({
                      ...settings,
                      currency: e.target.value
                    });
                    toast.success(`Currency changed to ${e.target.value}`);
                  }, children: [
                    /* @__PURE__ */ jsx("option", { children: "INR (₹)" }),
                    /* @__PURE__ */ jsx("option", { children: "USD ($)" }),
                    /* @__PURE__ */ jsx("option", { children: "EUR (€)" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white border rounded-[2rem] p-10 space-y-6 shadow-sm", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-red-500" }),
                " Password Management"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[9px] font-bold text-gray-400 uppercase tracking-widest", children: "Current Password" }),
                  /* @__PURE__ */ jsx("input", { type: "password", placeholder: "••••••••", className: "w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:bg-white transition-all" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[9px] font-bold text-gray-400 uppercase tracking-widest", children: "New Password" }),
                  /* @__PURE__ */ jsx("input", { type: "password", placeholder: "••••••••", className: "w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:bg-white transition-all" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[9px] font-bold text-gray-400 uppercase tracking-widest", children: "Confirm New" }),
                  /* @__PURE__ */ jsx("input", { type: "password", placeholder: "••••••••", className: "w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:bg-white transition-all" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(Button, { variant: "secondary", className: "rounded-xl h-12 px-6 font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2", onClick: async () => {
                setIsSaving(true);
                await new Promise((r) => setTimeout(r, 50));
                setIsSaving(false);
                toast.success("Password updated!");
              }, disabled: isSaving, children: [
                isSaving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : null,
                isSaving ? "Verifying..." : "Update Password"
              ] })
            ] })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  AccountOrdersPage as component
};
