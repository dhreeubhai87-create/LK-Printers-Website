import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, EyeOff, Eye, ArrowRight, ShieldCheck } from "lucide-react";
import { I as Input, B as Button } from "./router-frHDfBxK.js";
import { F as Form, a as FormField, b as FormItem, c as FormLabel, d as FormControl, e as FormMessage } from "./form-CeQpIM2u.js";
import { C as Card } from "./card-kfYlzVfB.js";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
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
const adminLoginSchema = z.object({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters"
  })
});
function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      password: ""
    }
  });
  async function onSubmit(values) {
    setIsLoading(true);
    try {
      const data = await apiRequest("/api/user/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: values.password
        })
      });
      if (data.message === "Login successful") {
        const user = data.response;
        localStorage.setItem("lk-admin-profile", JSON.stringify(user));
        localStorage.setItem("lk-admin-token", data.token);
        toast.success("Welcome back, Administrator!");
        setTimeout(() => {
          setIsLoading(false);
          navigate({
            to: "/admin"
          });
        }, 500);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      toast.error(getApiErrorMessage(error, "Unable to connect to server. Ensure the backend is active."));
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex items-center justify-center bg-muted/30 p-6 font-sans", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" }),
    /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-[450px] p-8 rounded-[2rem] border shadow-2xl bg-card space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-200", children: /* @__PURE__ */ jsx(Lock, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-serif font-bold", children: "Admin Console" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Authorized access only. Log in to manage LK Printers." })
      ] }),
      /* @__PURE__ */ jsx(Form, { ...form, children: /* @__PURE__ */ jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-5", children: [
        /* @__PURE__ */ jsx(FormField, { control: form.control, name: "password", render: ({
          field
        }) => /* @__PURE__ */ jsxs(FormItem, { children: [
          /* @__PURE__ */ jsx(FormLabel, { className: "text-sm font-semibold", children: "Security Password" }),
          /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Input, { type: showPassword ? "text" : "password", placeholder: "••••••••", ...field, className: "h-12 rounded-xl pr-12" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" }) })
          ] }) }),
          /* @__PURE__ */ jsx(FormMessage, {})
        ] }) }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isLoading, className: "w-full h-12 rounded-xl text-base font-bold bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all duration-300 flex items-center justify-center gap-2", children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
          "Authenticating..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          "Enter Admin Panel",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider pt-2 border-t", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-red-600" }),
        "SECURE SSL CONSOLE"
      ] })
    ] })
  ] });
}
export {
  AdminLoginPage as component
};
