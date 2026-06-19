import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/pricing";
import { toast } from "sonner";
import { createOrderFromCart, saveOrder } from "@/lib/orders";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options: any;
  image: string;
};

function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

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

  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    localStorage.setItem("lk-printer-cart", JSON.stringify(updated));
    toast.success("Item removed from cart");
  };

  const total = items.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async () => {
    toast.info("Initiating secure payment...", {
      description: "Redirecting to Razorpay (Mock)",
      duration: 3000,
    });
    
    let userProfile = { name: "Guest Customer", email: "", phone: "" };
    try {
      const { api } = await import("@/lib/api");
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
    
    // Simulate Razorpay
    setTimeout(async () => {
      // Create and save the order
      const newOrder = createOrderFromCart(items, total);
      newOrder.customerName = userProfile.name;
      await saveOrder(newOrder, userProfile.email, userProfile.phone);

      toast.success("Payment Successful!", {
        description: `Order ${newOrder.orderNumber} has been placed successfully.`,
        action: {
          label: "View Orders",
          onClick: () => (window.location.href = "/account/orders"),
        },
      });
      
      setItems([]);
      localStorage.removeItem("lk-printer-cart");
    }, 200);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <h1 className="text-4xl font-serif font-bold mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-serif font-bold mb-2">Cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
            <Button asChild size="lg" className="rounded-2xl">
              <Link to="/">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-6 p-6 bg-card border rounded-[2rem] shadow-soft group hover:shadow-md transition-all">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {Object.entries(item.options).map(([k, v]: [string, any]) => (
                        v && <span key={k} className="text-[10px] px-2 py-0.5 bg-muted rounded-full uppercase font-bold tracking-wider">{k}: {v}</span>
                      ))}
                    </div>
                    <div className="pt-4 text-xl font-bold text-primary">
                      {formatINR(item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-card border rounded-[2.5rem] shadow-xl sticky top-24">
                <h2 className="text-2xl font-serif font-bold mb-6">Order Summary</h2>
                <div className="space-y-4 text-sm mb-6 pb-6 border-b">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">{formatINR(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-success font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>Included</span>
                  </div>
                </div>
                <div className="flex justify-between text-2xl font-serif font-bold mb-8">
                  <span>Total</span>
                  <span className="text-primary">{formatINR(total)}</span>
                </div>
                
                <Button onClick={handleCheckout} size="lg" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg group">
                  Pay with Razorpay
                  <CreditCard className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
                
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Secure Checkout
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
