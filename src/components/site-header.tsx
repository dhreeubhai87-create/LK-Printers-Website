import { Link } from "@tanstack/react-router";
import { Printer, User, Sun, Moon, ShoppingBag, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("lk-auth-token");
      const profileStr = localStorage.getItem("lk-printer-profile");
      if (token && profileStr) {
        setIsLoggedIn(true);
        try {
          const profile = JSON.parse(profileStr);
          setUserName(profile.name || profile.yourName || "Account");
        } catch {
          setUserName("Account");
        }
      } else {
        setIsLoggedIn(false);
        setUserName("");
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem("lk-printer-cart");
        if (saved) {
          const cart = JSON.parse(saved);
          setCartCount(Array.isArray(cart) ? cart.length : 0);
        } else {
          setCartCount(0);
        }
      } catch (e) {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    const interval = setInterval(updateCount, 1000);
    return () => {
      window.removeEventListener("storage", updateCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-primary group-hover:scale-105 transition-transform">
            <Printer className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-serif font-bold tracking-tight">
            LK <span className="text-primary">Printer</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="text-foreground/80 hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/smart-upload" activeProps={{ className: "text-primary" }} className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors flex items-center gap-1.5 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            AI Smart Upload
          </Link>
          <a href="/#categories" className="text-foreground/80 hover:text-primary transition-colors">Categories</a>
          <a href="/#about" className="text-foreground/80 hover:text-primary transition-colors">About</a>
          <a href="/#contact" className="text-foreground/80 hover:text-primary transition-colors">Contact</a>
          <Link to="/account/orders" activeProps={{ className: "text-primary" }} className="text-foreground/80 hover:text-primary transition-colors">My Orders</Link>
          <Link to="/admin" activeProps={{ className: "text-primary" }} className="text-foreground/80 hover:text-primary transition-colors font-bold text-red-600 dark:text-red-400">Admin Panel</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          <Button variant="ghost" size="icon" asChild aria-label="Cart" className="relative">
            <Link to="/cart">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Desktop Login */}
          {isLoggedIn ? (
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex gap-2">
              <Link to="/account/orders">
                <User className="w-4 h-4 text-primary" /> {userName}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex gap-2">
              <Link to="/login">
                <User className="w-4 h-4" /> Login
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primary" />
                  LK Printer
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-10">
                <Link to="/" className="text-lg font-medium hover:text-primary transition-colors">Home</Link>
                <Link to="/smart-upload" className="text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Smart Upload
                </Link>
                <a href="/#categories" className="text-lg font-medium hover:text-primary transition-colors">Categories</a>
                <a href="/#about" className="text-lg font-medium hover:text-primary transition-colors">About Us</a>
                <a href="/#contact" className="text-lg font-medium hover:text-primary transition-colors">Contact</a>
                <Link to="/account/orders" className="text-lg font-medium hover:text-primary transition-colors text-blue-600">My Orders</Link>
                <Link to="/admin" className="text-lg font-bold hover:text-primary transition-colors text-red-600 dark:text-red-400">Admin Panel</Link>
                <hr className="border-muted" />
                {isLoggedIn ? (
                  <Button asChild className="w-full justify-start gap-2" variant="outline">
                    <Link to="/account/orders">
                      <User className="w-4 h-4 text-primary" /> {userName}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full justify-start gap-2" variant="outline">
                    <Link to="/login">
                      <User className="w-4 h-4" /> Login / Register
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
