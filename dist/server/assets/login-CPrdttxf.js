import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, Printer, EyeOff, Eye, ArrowRight, Sparkles, ShieldCheck, Zap, Clock, CheckCircle2 } from "lucide-react";
import { c as cn, I as Input, B as Button } from "./router-frHDfBxK.js";
import { F as Form, a as FormField, b as FormItem, c as FormLabel, d as FormControl, e as FormMessage } from "./form-CeQpIM2u.js";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { C as Card } from "./card-kfYlzVfB.js";
import { toast } from "sonner";
import { a as apiRequest, g as getApiErrorMessage } from "./api-client-Bu49ln3o.js";
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
import "./label-BaeoGtRW.js";
import "@radix-ui/react-label";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(CheckboxPrimitive.Indicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
const loginSchema = z.object({
  email: z.string().min(1, {
    message: "Email is required"
  }).email({
    message: "Please enter a valid email address"
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters"
  }),
  rememberMe: z.boolean()
});
function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });
  async function onSubmit(values) {
    setIsLoading(true);
    try {
      const data = await apiRequest("/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        })
      });
      if (data.message === "Login successful") {
        localStorage.setItem("lk-printer-profile", JSON.stringify(data.response));
        localStorage.setItem("lk-auth-token", data.token);
        if (values.rememberMe) {
          localStorage.setItem("lk-remember-me", "true");
          localStorage.setItem("lk-user-email", values.email);
        } else {
          localStorage.removeItem("lk-remember-me");
          localStorage.removeItem("lk-user-email");
        }
        toast.success(data.message || "Login successful!");
        setTimeout(() => {
          setIsLoading(false);
          navigate({
            to: "/"
          });
        }, 500);
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      toast.error(getApiErrorMessage(error, "Unable to connect to server. Please check the backend is running."));
    }
  }
  useEffect(() => {
    const remembered = localStorage.getItem("lk-remember-me");
    const savedEmail = localStorage.getItem("lk-user-email");
    if (remembered === "true" && savedEmail) {
      form.setValue("email", savedEmail);
      form.setValue("rememberMe", true);
    }
  }, [form]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex flex-col md:flex-row bg-background selection:bg-primary/20 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-16 lg:px-24 xl:px-32 relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none opacity-40", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[80px]" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-[440px] space-y-8 animate-fade-in", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-2.5 group w-fit transition-transform hover:scale-105", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-6 transition-all duration-300", children: /* @__PURE__ */ jsx(Printer, { className: "w-6 h-6 text-white" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-serif font-bold tracking-tight text-foreground block leading-none", children: "Lk Printers" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-primary tracking-[0.2em] uppercase mt-1 block", children: "Premium Prints" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-serif font-bold tracking-tight text-foreground", children: [
            "Welcome back ",
            /* @__PURE__ */ jsx("span", { className: "text-primary italic", children: "!" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm font-medium", children: "Enter your credentials to access your account & orders." })
        ] }),
        /* @__PURE__ */ jsx(Form, { ...form, children: /* @__PURE__ */ jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-5", children: [
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "email", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-sm font-semibold flex items-center gap-1.5", children: [
              "Email Address ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(Input, { type: "email", placeholder: "test@gmail.com", ...field, className: "h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/30 focus-visible:border-primary transition-all duration-200" }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "password", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs(FormLabel, { className: "text-sm font-semibold flex items-center gap-1.5", children: [
              "Password ",
              /* @__PURE__ */ jsx("span", { className: "text-primary", children: "*" })
            ] }) }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Input, { type: showPassword ? "text" : "password", placeholder: "Enter your password", ...field, className: "h-12 rounded-xl border-muted-foreground/20 pr-12 focus-visible:ring-primary/30 focus-visible:border-primary transition-all duration-200" }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" }) })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "rememberMe", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { className: "flex flex-row items-center space-x-2 space-y-0 py-1", children: [
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange, className: "rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" }) }),
            /* @__PURE__ */ jsx(FormLabel, { className: "text-sm font-medium text-muted-foreground cursor-pointer select-none", children: "Remember me for 30 days" })
          ] }) }),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isLoading, className: "w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 group", children: isLoading ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
            "Signing in..."
          ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            "Log In",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 group-hover:translate-x-1 transition-transform" })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-center text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-primary", children: "Demo Credentials:" }),
          /* @__PURE__ */ jsx("br", {}),
          "Email: test@gmail.com | Password: test12345"
        ] }) }),
        /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-muted-foreground font-medium pt-4", children: [
          "Don't have an account?",
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/register", className: "text-primary font-bold hover:underline underline-offset-4", children: "Register here" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-1 relative bg-slate-950 overflow-hidden p-12 lg:p-16 items-center justify-center", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 animate-gradient" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-[120px] animate-pulse" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[150px] animate-pulse", style: {
          animationDelay: "1s"
        } }),
        /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-64 h-64 border border-white/10 rounded-[3rem] rotate-12 backdrop-blur-3xl bg-white/5 shadow-2xl" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/3 right-1/4 w-48 h-48 border border-white/5 rounded-full -rotate-12 backdrop-blur-2xl bg-white/[0.02]" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-[0.03]", style: {
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        } })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-lg space-y-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in-up", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-accent" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-white/90 tracking-wide", children: "Premium Printing Hub" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-10", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-5xl lg:text-6xl font-serif font-bold text-white leading-tight animate-fade-in-up", style: {
            animationDelay: "100ms"
          }, children: [
            "Experience the ",
            /* @__PURE__ */ jsx("span", { className: "text-accent italic", children: "Art" }),
            " of ",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "Precision." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid gap-6 animate-fade-in-up", style: {
            animationDelay: "200ms"
          }, children: [{
            icon: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5" }),
            title: "Premium Substrates",
            desc: "Specialists in 800 GSM heavy-weight cards with metallic finishes.",
            color: "text-blue-400",
            bg: "bg-blue-400/10"
          }, {
            icon: /* @__PURE__ */ jsx(Zap, { className: "w-5 h-5" }),
            title: "Advanced Finishing",
            desc: "Precision Die-cutting, Drip-off UV, and Luxury Spot UV coatings.",
            color: "text-emerald-400",
            bg: "bg-emerald-400/10"
          }, {
            icon: /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5" }),
            title: "Expert Craftsmanship",
            desc: "Next-day production for Offset & Digital prints with nationwide delivery.",
            color: "text-amber-400",
            bg: "bg-amber-400/10"
          }].map((item, i) => /* @__PURE__ */ jsxs("div", { className: "group flex gap-5 p-5 rounded-3xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300", children: [
            /* @__PURE__ */ jsx("div", { className: `flex-shrink-0 w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`, children: item.icon }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-white group-hover:text-primary transition-colors", children: item.title }),
              /* @__PURE__ */ jsx("p", { className: "text-white/60 text-sm leading-relaxed", children: item.desc })
            ] })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6 pt-4 animate-fade-in-up", style: {
          animationDelay: "300ms"
        }, children: [
          /* @__PURE__ */ jsx("div", { className: "flex -space-x-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: `https://i.pravatar.cc/100?img=${i + 20}`, alt: "User" }) }, i)) }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
            /* @__PURE__ */ jsx("p", { className: "text-white/90 font-bold", children: "Trusted by 10k+ Businesses" }),
            /* @__PURE__ */ jsx("p", { className: "text-white/50", children: "Across India since 2018" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Card, { className: "absolute bottom-10 right-10 p-4 bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl animate-bounce-slow hidden lg:block", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pr-8", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-white", children: "Order Status" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-white/50", children: "Ready for Printing" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
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
      ` })
  ] });
}
export {
  LoginPage as component
};
