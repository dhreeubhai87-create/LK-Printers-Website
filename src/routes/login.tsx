import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Printer,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";

// Login Form Schema
const loginSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// API Response Types
interface LoginResponse {
  message: string;
  response: {
    _id: string;
    businessName: string;
    email: string;
    username: string;
    phoneNumber: string;
    password: string;
    refCode: string;
    Country: string;
    state: string;
    district: string;
    city: string;
    pinCode: string;
    gstTax: string;
    fullAddress: string;
    __v: number;
  };
  token: string;
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);

    try {
      const data: LoginResponse = await apiRequest('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        })
      });

      if (data.message === "Login successful") {
        // Store user data and token in localStorage
        localStorage.setItem("lk-printer-profile", JSON.stringify(data.response));
        localStorage.setItem("lk-auth-token", data.token);

        // Set remember me option
        if (values.rememberMe) {
          localStorage.setItem("lk-remember-me", "true");
          localStorage.setItem("lk-user-email", values.email);
        } else {
          localStorage.removeItem("lk-remember-me");
          localStorage.removeItem("lk-user-email");
        }

        toast.success(data.message || "Login successful!");

        // Small delay to show success toast before navigation
        setTimeout(() => {
          setIsLoading(false);
          navigate({ to: "/" });
        }, 500);
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      toast.error(getApiErrorMessage(error, "Unable to connect to server. Please check the backend is running."));
    }
  }

  // Load saved email if remember me was checked
  useEffect(() => {
    const remembered = localStorage.getItem("lk-remember-me");
    const savedEmail = localStorage.getItem("lk-user-email");
    if (remembered === "true" && savedEmail) {
      form.setValue("email", savedEmail);
      form.setValue("rememberMe", true);
    }
  }, [form]);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background selection:bg-primary/20 overflow-hidden">
      {/* Left Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-16 lg:px-24 xl:px-32 relative">
        {/* Background blobs for subtle depth */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-[440px] space-y-8 animate-fade-in">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group w-fit transition-transform hover:scale-105">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-6 transition-all duration-300">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-serif font-bold tracking-tight text-foreground block leading-none">
                Lk Printers
              </span>
              <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase mt-1 block">
                Premium Prints
              </span>
            </div>
          </Link>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground">
              Welcome back <span className="text-primary italic">!</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Enter your credentials to access your account & orders.
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                      Email Address <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="test@gmail.com"
                        {...field}
                        className="h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/30 focus-visible:border-primary transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                        Password <span className="text-primary">*</span>
                      </FormLabel>
                      {/* <Link 
                        to="/forgot-password" 
                        className="text-xs font-bold text-primary hover:underline underline-offset-4"
                      >
                        Forgot password?
                      </Link> */}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                          className="h-12 rounded-xl border-muted-foreground/20 pr-12 focus-visible:ring-primary/30 focus-visible:border-primary transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 py-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                      Remember me for 30 days
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Log In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          {/* Demo Credentials Notice */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-xs text-center text-muted-foreground">
              <span className="font-semibold text-primary">Demo Credentials:</span><br />
              Email: test@gmail.com | Password: test12345
            </p>
          </div>

          {/* Footer Link */}
          <p className="text-center text-sm text-muted-foreground font-medium pt-4">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side: Abstract Artwork & Features */}
      <div className="hidden md:flex flex-1 relative bg-slate-950 overflow-hidden p-12 lg:p-16 items-center justify-center">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 animate-gradient" />

        {/* Abstract Shapes (Premium Glassmorphism Look) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "1s" }} />

          {/* Geometric elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-white/10 rounded-[3rem] rotate-12 backdrop-blur-3xl bg-white/5 shadow-2xl" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 border border-white/5 rounded-full -rotate-12 backdrop-blur-2xl bg-white/[0.02]" />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 w-full max-w-lg space-y-12">
          {/* Branding Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-white/90 tracking-wide">Premium Printing Hub</span>
          </div>

          {/* Lk Printers Key Points */}
          <div className="space-y-10">
            <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-tight animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Experience the <span className="text-accent italic">Art</span> of <span className="text-primary">Precision.</span>
            </h2>

            <div className="grid gap-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              {[
                {
                  icon: <ShieldCheck className="w-5 h-5" />,
                  title: "Premium Substrates",
                  desc: "Specialists in 800 GSM heavy-weight cards with metallic finishes.",
                  color: "text-blue-400",
                  bg: "bg-blue-400/10"
                },
                {
                  icon: <Zap className="w-5 h-5" />,
                  title: "Advanced Finishing",
                  desc: "Precision Die-cutting, Drip-off UV, and Luxury Spot UV coatings.",
                  color: "text-emerald-400",
                  bg: "bg-emerald-400/10"
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  title: "Expert Craftsmanship",
                  desc: "Next-day production for Offset & Digital prints with nationwide delivery.",
                  color: "text-amber-400",
                  bg: "bg-amber-400/10"
                }
              ].map((item, i) => (
                <div key={i} className="group flex gap-5 p-5 rounded-3xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Metric */}
          <div className="flex items-center gap-6 pt-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <p className="text-white/90 font-bold">Trusted by 10k+ Businesses</p>
              <p className="text-white/50">Across India since 2018</p>
            </div>
          </div>
        </div>

        {/* Floating Card Decorative */}
        <Card className="absolute bottom-10 right-10 p-4 bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl animate-bounce-slow hidden lg:block">
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Order Status</p>
              <p className="text-[10px] text-white/50">Ready for Printing</p>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 5s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}