/**
 * PREMIUM RECENT ORDERS COMPONENT
 * -------------------------------
 * This component provides a professional, high-end order management interface
 * for B2B e-commerce clients. It features responsive design, real-time filtering,
 * CSV export, and detailed order modal views.
 */

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/pricing";
import { Order, OrderStatus, getOrders, generateInvoicePDF } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Eye, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * StatusBadge Component
 * Renders a stylized badge based on the order status with matching icons.
 */
const StatusBadge = ({ status }: { status: OrderStatus }) => {
  switch (status) {
    case "Under Process":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-bold">
          <Clock className="w-3 h-3" /> Under Process
        </Badge>
      );
    case "Confirmed":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-bold">
          <CheckCircle2 className="w-3 h-3" /> Confirmed
        </Badge>
      );
    case "Shipped":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 font-bold">
          <Truck className="w-3 h-3" /> Shipped
        </Badge>
      );
    case "Delivered":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-bold">
          <Package className="w-3 h-3" /> Delivered
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

export const RecentOrders = ({ filterStatus = "All Orders" }: { filterStatus?: string }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Load orders and listen for storage changes (updates when new orders are placed)
  useEffect(() => {
    setOrders(getOrders());
    const handleStorage = () => setOrders(getOrders());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /**
   * Export orders to CSV format
   */
  const downloadCSV = () => {
    const headers = ["Order No", "Date", "Order Name", "Total", "Status"];
    const rows = orders.map(o => [
      o.orderNumber,
      o.date,
      o.customerName, // This is used as the Order Name in our B2B context
      o.totalAmount,
      o.status
    ]);
    
    const content = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_export_${new Date().getTime()}.csv`;
    a.click();
    toast.success("CSV Export successful!");
  };

  /**
   * Generates and triggers a direct PDF invoice download
   */
  const handleDownloadInvoice = async (order: Order) => {
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

  // Filter logic for search and status tabs
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "Processing") {
      return matchesSearch && (o.status === "Under Process" || o.status === "Confirmed");
    }
    if (filterStatus === "Completed") {
      return matchesSearch && (o.status === "Delivered" || o.status === "Shipped");
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* SEARCH AND CONTROL BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Order # or Name..." 
            className="pl-10 rounded-xl bg-gray-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="rounded-xl flex-1 md:flex-none border-gray-200 hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2 text-gray-500" /> Filters
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl flex-1 md:flex-none border-gray-200 hover:bg-gray-50 font-bold"
            onClick={downloadCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white border rounded-[2rem] overflow-hidden shadow-xl shadow-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Order No.</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Date</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Order Name</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Order Detail</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Total</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-5 font-mono text-sm font-bold text-blue-700">{order.orderNumber}</td>
                <td className="px-6 py-5 text-sm text-gray-600">{order.date}</td>
                <td className="px-6 py-5">
                  <div className="font-bold text-sm">{order.customerName}</div>
                  <div className="text-[10px] text-gray-400">B2B Customized Order</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex -space-x-2">
                    {order.items.map((item, i) => (
                      <div key={i} title={item.name} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5 font-bold text-primary">{formatINR(order.totalAmount)}</td>
                <td className="px-6 py-5">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* DETAILS MODAL */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                        <div className="bg-blue-600 p-8 text-white">
                          <DialogTitle className="text-2xl font-serif font-bold">Order Details</DialogTitle>
                          <p className="opacity-80 text-sm mt-1">Order Number: {order.orderNumber}</p>
                        </div>
                        <div className="p-8 space-y-6">
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Order Name</label>
                                <div className="font-bold text-lg">{order.customerName}</div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Placement Date</label>
                                <div className="text-sm font-medium text-gray-600">{order.date}</div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Current Status</label>
                                <div className="pt-1"><StatusBadge status={order.status} /></div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Payment Total</label>
                                <div className="text-2xl font-bold text-blue-600">{formatINR(order.totalAmount)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="border rounded-2xl overflow-hidden bg-gray-50/50">
                            <div className="bg-gray-100/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b">Product Summary</div>
                            <div className="divide-y max-h-60 overflow-y-auto">
                              {order.items.map((item, i) => (
                                <div key={i} className="p-4 flex gap-4 items-center">
                                  <img src={item.image} className="w-12 h-12 rounded-xl border object-cover shadow-sm" />
                                  <div className="flex-1">
                                    <div className="font-bold text-sm">{item.name}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Quantity: {item.quantity}</div>
                                  </div>
                                  <div className="font-bold text-primary">{formatINR(item.price)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-4 pt-2">
                            <Button 
                              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold transition-all active:scale-95"
                              onClick={() => toast.info(`Tracking Order: ${order.orderNumber}`, {
                                description: "Your package is in transit. Estimated delivery: 2 days."
                              })}
                            >
                              Track Shipment
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 font-bold shadow-sm transition-all active:scale-95"
                              onClick={() => handleDownloadInvoice(order)}
                            >
                              <FileText className="w-4 h-4 mr-2 text-red-600" /> Download Invoice (PDF)
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {/* DIRECT DOWNLOAD BUTTON */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-10 h-10 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-all border border-red-100 shadow-sm" 
                      title="Download PDF Invoice"
                      onClick={() => handleDownloadInvoice(order)}
                    >
                      <FileText className="w-5 h-5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-10 h-10 text-muted-foreground opacity-20" />
                    <div className="text-lg font-bold text-gray-400">No matching orders found</div>
                    <p className="text-sm text-gray-400">Adjust your filters or search terms.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RESPONSIVE MOBILE VIEW (CARDS) */}
      <div className="md:hidden space-y-4">
        {filteredOrders.length > 0 ? filteredOrders.map((order) => (
          <div key={order.id} className="bg-white border rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="font-mono text-sm font-bold text-blue-700">{order.orderNumber}</div>
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">{order.date}</div>
              </div>
              <StatusBadge status={order.status} />
            </div>
            
            <div className="flex items-center gap-4 py-2 border-y border-gray-50">
              <div className="flex -space-x-3">
                {order.items.slice(0, 3).map((item, i) => (
                  <img key={i} src={item.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                ))}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Amount</div>
                <div className="font-bold text-lg text-primary">{formatINR(order.totalAmount)}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 border-gray-200 font-bold text-xs">View Details</Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1 rounded-xl h-10 bg-red-50 text-red-700 hover:bg-red-100 font-bold border border-red-100 text-xs"
                onClick={() => handleDownloadInvoice(order)}
              >
                <FileText className="w-4 h-4 mr-2" /> PDF Invoice
              </Button>
            </div>
          </div>
        )) : (
          <div className="bg-white border rounded-3xl p-10 text-center text-gray-400 font-bold">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
};
