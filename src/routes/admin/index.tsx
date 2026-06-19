import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, ShoppingBag, Users, BarChart3, 
  Settings, Search, Filter, MoreHorizontal, CheckCircle2, Clock,
  Download, FileText, Loader2, ArrowUpDown, Trash2, Edit2, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { apiGetAllOrders, apiUpdateOrder, apiDeleteOrder, generateInvoicePDF, OrderStatus } from "@/lib/orders";
import { formatINR } from "@/lib/pricing";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Edit Modal States
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    status: "Confirmed" as OrderStatus
  });

  // Delete Confirmation State
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null);

  const checkAdminAuth = () => {
    const adminToken = localStorage.getItem("lk-admin-token");
    const adminProfileRaw = localStorage.getItem("lk-admin-profile");

    if (!adminToken) {
      toast.error("Authentication required. Redirecting to admin console.");
      navigate({ to: "/admin/login" });
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
        navigate({ to: "/admin/login" });
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
    navigate({ to: "/admin/login" });
  };

  const handleEditClick = (order: any) => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName,
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      status: order.status
    });
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
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

  const handleDeleteClick = (order: any) => {
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

  const handleDownloadInvoice = async (order: any) => {
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
    const rows = orders.map(o => [
      o.orderNumber,
      o.date,
      o.customerName,
      o.customerEmail || "N/A",
      o.customerPhone || "N/A",
      o.totalAmount,
      o.status
    ]);
    
    const content = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_orders_report_${new Date().getTime()}.csv`;
    a.click();
    toast.success("CSV report exported!");
  };

  // Status Filter options
  const statuses = ["All", "Confirmed", "Under Process", "Shipped", "Delivered", "Cancelled"];

  // Filtering
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customerPhone && o.customerPhone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.items && o.items.some((item: any) => item.name.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesStatus = filterStatus === "All" || o.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sorting
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

  // Pagination calculations
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: "date" | "amount") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Calculations for Advanced Stats
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === "Confirmed" || o.status === "Under Process").length;
  const completedOrdersCount = orders.filter(o => o.status === "Delivered").length;
  const cancelledOrdersCount = orders.filter(o => o.status === "Cancelled").length;
  
  // Today's Orders calculation
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysOrdersCount = orders.filter(o => {
    const dateObj = new Date(o.createdAt || o.date);
    return dateObj >= todayStart;
  }).length;

  return (
    <div className="min-h-dvh bg-muted/20 flex flex-col font-sans">
      <SiteHeader />
      
      <div className="flex-1 container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 space-y-2 flex-shrink-0">
            <h2 className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 font-mono">Main Console</h2>
            <AdminNavLink icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active />
            <AdminNavLink icon={<ShoppingBag className="w-4 h-4" />} label="Orders" />
            <AdminNavLink icon={<Users className="w-4 h-4" />} label="Customers" />
            <AdminNavLink icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-red-600 hover:bg-red-50 hover:shadow-soft"
            >
              <X className="w-4 h-4" />
              Sign Out
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            <div className="flex justify-between items-end flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-serif font-bold">Admin Console</h1>
                <p className="text-muted-foreground mt-1">Real-time database records and secure checkout management.</p>
              </div>
              <Button onClick={downloadAllReport} className="rounded-xl shadow-lg shadow-primary/20 bg-primary font-bold">
                <Download className="w-4 h-4 mr-2" /> Export CSV Report
              </Button>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard label="Total Orders" value={String(totalOrdersCount)} sub="Overall checkouts registered" color="bg-blue-500/10 text-blue-600" />
              <StatCard label="Pending Processing" value={String(pendingOrdersCount)} sub="Confirmed & under process" color="bg-amber-500/10 text-amber-600" />
              <StatCard label="Completed Orders" value={String(completedOrdersCount)} sub="Successfully delivered shipments" color="bg-green-500/10 text-green-600" />
              <StatCard label="Cancelled Orders" value={String(cancelledOrdersCount)} sub="Cancelled / void transactions" color="bg-rose-500/10 text-rose-600" />
              <StatCard label="Placed Today" value={String(todaysOrdersCount)} sub="Orders placed in current 24h" color="bg-violet-500/10 text-violet-600" />
            </div>
 
            {/* Orders Table Container */}
            <div className="bg-card border rounded-[2.5rem] shadow-xl overflow-hidden">
              <div className="p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold font-serif">Customer Order Records</h3>
                
                {/* Search & Filtering Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search Name/Order No..." 
                      className="pl-10 rounded-xl bg-muted/30 border-none w-56" 
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  
                  <select 
                    className="rounded-xl border border-muted/50 bg-background px-3 py-2 text-sm font-bold outline-none"
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {statuses.map(st => (
                      <option key={st} value={st}>{st === "All" ? "All Statuses" : st}</option>
                    ))}
                  </select>
                </div>
              </div>
 
              {loading ? (
                <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground font-bold">Connecting secure database...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest border-b">
                        <th className="px-6 py-4 cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("date")}>
                          Order ID / Date <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />
                        </th>
                        <th className="px-6 py-4">Customer Details</th>
                        <th className="px-6 py-4">Items Summary</th>
                        <th className="px-6 py-4 cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("amount")}>
                          Amount <ArrowUpDown className="w-3.5 h-3.5 inline ml-1" />
                        </th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedOrders.length > 0 ? (
                        paginatedOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-5">
                              <span className="font-mono font-bold text-blue-700 block">{order.orderNumber}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{order.date}</span>
                            </td>
                            <td className="px-6 py-5">
                              <div>
                                <p className="font-bold">{order.customerName}</p>
                                <p className="text-xs text-muted-foreground">{order.customerEmail || "No Email Provided"}</p>
                                <p className="text-xs text-muted-foreground">{order.customerPhone || "No Phone Provided"}</p>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-1">
                                {order.items && order.items.map((item: any, i: number) => (
                                  <div key={i} className="text-xs font-medium">
                                    {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-5 font-bold text-primary">{formatINR(order.totalAmount)}</td>
                            <td className="px-6 py-5">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-8 h-8 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100"
                                  title="Edit Order"
                                  onClick={() => handleEditClick(order)}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-8 h-8 rounded-lg text-red-600 bg-red-50 hover:bg-red-100"
                                  title="Delete Order"
                                  onClick={() => handleDeleteClick(order)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-8 h-8 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                  title="Invoice PDF"
                                  onClick={() => handleDownloadInvoice(order)}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center text-muted-foreground font-semibold">
                            No records matching search parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer with Pagination & Items Per Page controls */}
              {!loading && totalItems > 0 && (
                <div className="p-6 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-bold">Records per page:</span>
                    <select
                      className="rounded-lg border bg-background px-2 py-1 text-xs font-bold outline-none"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-xs text-muted-foreground font-mono">
                      Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-lg"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-bold px-3">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-lg"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Edit Dialog Modal using Radix Dialog */}
      <Dialog open={editingOrder !== null} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-md rounded-[2rem] p-8 border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold">Modify Order Details</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Order Ref: {editingOrder?.orderNumber}</p>
          </DialogHeader>

          <form onSubmit={handleUpdateOrder} className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Name</label>
              <Input
                type="text"
                required
                className="rounded-xl h-11"
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
              <Input
                type="email"
                className="rounded-xl h-11"
                value={editForm.customerEmail}
                onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Phone</label>
              <Input
                type="text"
                className="rounded-xl h-11"
                value={editForm.customerPhone}
                onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
              />
            </div>

             <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Status</label>
              <select
                className="w-full h-11 rounded-xl border bg-card px-3 font-semibold outline-none"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as OrderStatus })}
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Under Process">Under Process</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold"
                onClick={() => setEditingOrder(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingOrder !== null} onOpenChange={(open) => !open && setDeletingOrder(null)}>
        <DialogContent className="max-w-md rounded-[2rem] p-8 border bg-card shadow-2xl space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-red-600">Confirm Deletion</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to permanently delete order <strong className="font-mono text-foreground">{deletingOrder?.orderNumber}</strong>?
            </p>
          </DialogHeader>

          <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
            Warning: This action cannot be undone. This will permanently remove the order record from the database.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={() => setDeletingOrder(null)}
            >
              No, Keep Order
            </Button>
            <Button
              type="button"
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
              onClick={handleConfirmDelete}
            >
              Yes, Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Under Process": "bg-amber-100 text-amber-800 border-amber-200",
    "Confirmed": "bg-blue-100 text-blue-800 border-blue-200",
    "Shipped": "bg-purple-100 text-purple-800 border-purple-200",
    "Delivered": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Cancelled": "bg-rose-100 text-rose-800 border-rose-200",
  };
  const styleClass = styles[status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <Badge variant="outline" className={`rounded-full px-3 py-1 gap-1.5 border font-bold ${styleClass}`}>
      {status}
    </Badge>
  );
}

function AdminNavLink({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-card hover:shadow-soft'}`}>
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-6 bg-card border rounded-[2.5rem] shadow-soft space-y-3">
      <div className={`w-10 h-10 ${color} rounded-2xl flex items-center justify-center`}>
        <BarChart3 className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <h4 className="text-2xl font-serif font-bold mt-1">{value}</h4>
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}
