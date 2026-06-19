import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ArrowRight, Sparkles, Truck, ShieldCheck, Zap, Printer, 
  Package, Layers, PenTool, Focus, Palette, Droplets, 
  BookOpen, Send, Archive, ChevronRight, Star, Heart
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HARDCODED_CATEGORIES } from "@/lib/fallback-data";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [loading, setLoading] = useState(false);
  const categories = HARDCODED_CATEGORIES;

  return (
    <div className="min-h-dvh bg-background flex flex-col selection:bg-primary/20">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold animate-fade-in">
              <Sparkles className="w-3 h-3" />
              <span>India's Premium Print Service</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[1.05] tracking-tight text-balance animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Design Your <span className="text-primary italic">Dreams,</span><br />
              We Print Your <span className="text-foreground relative inline-block">
                Reality.
                <span className="absolute bottom-2 left-0 w-full h-2 bg-accent/20 -z-10" />
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              Experience professional-grade printing with live pricing, instant previews, and lightning-fast delivery across the nation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <Button asChild size="lg" className="h-14 px-8 text-base rounded-2xl shadow-xl shadow-primary/20 group bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                <Link to="/smart-upload">
                  <Sparkles className="w-4.5 h-4.5 mr-2" />
                  AI Smart Upload
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base rounded-2xl border-2 hover:bg-muted/50">
                <a href="#categories">Explore Catalog</a>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-accent">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-muted-foreground mt-0.5"><span className="font-bold text-foreground">10k+</span> Happy Customers</p>
              </div>
            </div>
          </div>

          <div className="relative animate-slide-in-right" style={{ animationDelay: "200ms" }}>
            <div className="relative z-10 w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-background group">
              <img
                src={heroImg}
                alt="Premium Prints"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            {/* Floating Elements (Flutter-style) */}
            <div className="absolute -top-6 -right-6 bg-card p-4 rounded-3xl shadow-xl border animate-bounce-slow z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div className="pr-2">
                  <p className="text-xs font-bold">Fast Delivery</p>
                  <p className="text-[10px] text-muted-foreground">Across India</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-3xl shadow-xl border animate-bounce-slow-delayed z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="pr-2">
                  <p className="text-xs font-bold">Instant Price</p>
                  <p className="text-[10px] text-muted-foreground">Live Calculator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 bg-muted/30 border-y overflow-hidden whitespace-nowrap">
        <div className="flex items-center animate-marquee space-x-12 px-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="flex items-center space-x-12 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2"><Printer className="w-4 h-4 text-primary" /> Premium Offset</span>
              <span className="flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Custom Packaging</span>
              <span className="flex items-center gap-2"><PenTool className="w-4 h-4 text-primary" /> Luxury Finishing</span>
              <span className="flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Spot UV & Foil</span>
              <span className="flex items-center gap-2"><Droplets className="w-4 h-4 text-primary" /> CMYK Matching</span>
              <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Trusted Quality</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categories" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
                Premium Collections
              </h2>
              <p className="text-lg text-muted-foreground">
                Discover our curated range of professional printing solutions tailored for your brand's excellence.
              </p>
            </div>
            <Button variant="ghost" className="rounded-full group h-12">
              View All Products <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((cat, index) => (
              <Link
                key={cat.id}
                to={cat.coming_soon ? "/" : "/category/$slug"}
                params={cat.coming_soon ? {} : { slug: cat.slug } as any}
                className={`group relative h-[380px] rounded-[2.5rem] overflow-hidden border bg-card shadow-soft hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-in-up ${cat.coming_soon ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                
                <div className="absolute bottom-0 left-0 w-full p-8 space-y-3">
                  <h3 className="text-xl font-bold text-white tracking-wide uppercase">
                    {cat.name}
                  </h3>
                  {!cat.coming_soon && (
                    <div className="pt-2">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                  {cat.coming_soon && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm rounded-full">Coming Soon</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (Premium Style) */}
      <section id="about" className="py-24 bg-muted/40 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold">The Seamless Flow</h2>
            <p className="text-muted-foreground text-lg">Getting high-quality prints is now simpler than ever.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              { 
                idx: "01", 
                title: "Choose Product", 
                desc: "Browse through our extensive catalog of 15+ premium printing categories.",
                icon: <Layers className="w-6 h-6 text-primary" />,
                bg: "bg-primary/10"
              },
              { 
                idx: "02", 
                title: "Live Customization", 
                desc: "Instantly adjust size, paper, and finishing with our live price calculator.",
                icon: <Focus className="w-6 h-6 text-accent" />,
                bg: "bg-accent/10"
              },
              { 
                idx: "03", 
                title: "Direct Delivery", 
                desc: "Upload your design and sit back while we print and deliver to your doorstep.",
                icon: <Truck className="w-6 h-6 text-green-500" />,
                bg: "bg-green-500/10"
              },
            ].map((step, i) => (
              <div key={step.idx} className="relative p-10 rounded-[3rem] bg-card border shadow-soft hover:shadow-xl transition-all duration-500 group">
                <div className="absolute -top-6 left-10 w-16 h-16 rounded-3xl bg-card border-4 border-muted/20 shadow-lg flex items-center justify-center font-serif font-bold text-2xl text-primary group-hover:scale-110 transition-transform">
                  {step.idx}
                </div>
                <div className={`w-12 h-12 ${step.bg} rounded-2xl flex items-center justify-center mb-6`}>
                  {step.icon}
                </div>
                <h3 className="text-2xl font-serif font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          width: max-content;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .animate-bounce-slow-delayed {
          animation: bounce-slow 4s ease-in-out 2s infinite;
        }
      `}</style>
    </div>
  );
}
