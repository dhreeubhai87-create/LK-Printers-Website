import { jsx, jsxs } from "react/jsx-runtime";
import { createRootRoute, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter, useRouter } from "@tanstack/react-router";
import * as React from "react";
import { useState, useEffect, createContext, useContext } from "react";
import * as z from "zod";
import { createClient } from "@supabase/supabase-js";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import "sonner";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import sharp from "sharp";
const initialState = {
  theme: "system",
  setTheme: () => null
};
const ThemeProviderContext = createContext(initialState);
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(storageKey) || defaultTheme;
    }
    return defaultTheme;
  });
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);
  const value = {
    theme,
    setTheme: (theme2) => {
      localStorage.setItem(storageKey, theme2);
      setTheme(theme2);
    }
  };
  return /* @__PURE__ */ jsx(ThemeProviderContext.Provider, { ...props, value, children });
}
const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
const appCss = "/assets/styles-Ca9_2LFp.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
const Route$c = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LK Printer — Premium Printing Services in India" },
      { name: "description", content: "Custom visiting cards, pamphlets, letterheads, stickers & more. Live price calculator, premium materials, fast delivery across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      {
        rel: "icon",
        href: "/favicon.svg"
      },
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", className: "scroll-smooth", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(ThemeProvider, { defaultTheme: "light", storageKey: "lk-printer-theme", children }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const $$splitComponentImporter$9 = () => import("./smart-upload-BD1UMOXI.js");
const Route$b = createFileRoute("/smart-upload")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./register-Dy6upsOt.js");
z.object({
  businessName: z.string().min(2, {
    message: "Business / Firm Name must be at least 2 characters"
  }),
  yourName: z.string().min(2, {
    message: "Your Name must be at least 2 characters"
  }),
  whatsappNo: z.string().length(10, {
    message: "WhatsApp number must be exactly 10 digits"
  }).regex(/^[0-9]+$/, {
    message: "WhatsApp number must contain only numbers"
  }).refine((val) => !val.startsWith("0"), {
    message: "Do not include leading 0"
  }),
  email: z.string().email({
    message: "Please enter a valid email address"
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters"
  }),
  referenceCode: z.string().optional(),
  country: z.string().default("India"),
  state: z.string().min(1, {
    message: "Please select a state"
  }),
  district: z.string().min(1, {
    message: "Please select a district"
  }),
  customDistrict: z.string().optional(),
  city: z.string().min(1, {
    message: "Please select a city"
  }),
  customCity: z.string().optional(),
  pinCode: z.string().length(6, {
    message: "PIN Code must be exactly 6 digits"
  }).regex(/^[0-9]+$/, {
    message: "PIN Code must contain only numbers"
  }),
  gstNumber: z.string().optional(),
  fullAddress: z.string().min(10, {
    message: "Please enter a detailed full address (min 10 chars)"
  })
}).refine((data) => {
  if (data.district === "Other" && (!data.customDistrict || data.customDistrict.trim().length < 2)) {
    return false;
  }
  return true;
}, {
  message: "Please enter your district name",
  path: ["customDistrict"]
}).refine((data) => {
  if (data.city === "Other" && (!data.customCity || data.customCity.trim().length < 2)) {
    return false;
  }
  return true;
}, {
  message: "Please enter your city name",
  path: ["customCity"]
});
const Route$a = createFileRoute("/register")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./login-CPrdttxf.js");
z.object({
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
const Route$9 = createFileRoute("/login")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./cart-B5ra_QfJ.js");
const Route$8 = createFileRoute("/cart")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./index-CsmlvoM0.js");
const Route$7 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./index-CKWAlwh7.js");
const Route$6 = createFileRoute("/admin/")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
function createSupabaseClient() {
  const SUPABASE_URL = "https://tsjbmfntbjbfzpqtyuvr.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzamJtZm50YmpiZnpwcXR5dXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTIwMzgsImV4cCI6MjA5Mjg4ODAzOH0.82wbdBBYOHB182MCQWgCMW1Sw8rfri7e7rxBRp9wbqg";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [
  /* @__PURE__ */ jsx(SheetOverlay, {}),
  /* @__PURE__ */ jsxs(SheetPrimitive.Content, { ref, className: cn(sheetVariants({ side }), className), ...props, children: [
    /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
      /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
    ] }),
    children
  ] })
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
const SheetHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-2 text-center sm:text-left", className), ...props });
SheetHeader.displayName = "SheetHeader";
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
const $$splitComponentImporter$3 = () => import("./product._slug-B19JW5QU.js");
const Route$5 = createFileRoute("/product/$slug")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./category._slug-BCPvrS9Z.js");
const Route$4 = createFileRoute("/category/$slug")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const Route$3 = createFileRoute("/api/upload-pdf")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { pdfBase64, orderNumber } = body;
          if (!pdfBase64 || !orderNumber) {
            return new Response(JSON.stringify({ error: "Missing data" }), { status: 400 });
          }
          const buffer = Buffer.from(pdfBase64, "base64");
          const fileName = `${orderNumber}.pdf`;
          try {
            const publicOrdersDir = path.join(process.cwd(), "public", "orders");
            if (!fs.existsSync(publicOrdersDir)) {
              fs.mkdirSync(publicOrdersDir, { recursive: true });
            }
            const filePath = path.join(publicOrdersDir, fileName);
            fs.writeFileSync(filePath, buffer);
            console.log(`Successfully saved invoice locally: ${filePath}`);
          } catch (fsErr) {
            console.error("Local file write failed (might be serverless/read-only environment):", fsErr);
          }
          return new Response(JSON.stringify({
            success: true,
            fileName
          }));
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
      }
    }
  }
});
const Route$2 = createFileRoute("/api/process-print")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("file");
          const productStr = formData.get("product");
          const action = formData.get("action");
          if (!file || !productStr) {
            return new Response(JSON.stringify({ error: "Missing file or product" }), { status: 400 });
          }
          const product = JSON.parse(productStr);
          const buffer = Buffer.from(await file.arrayBuffer());
          const isPdf = file.type === "application/pdf";
          const isImage = file.type.startsWith("image/");
          let report = {
            status: "valid",
            issues: [],
            dimensions: { width: 0, height: 0 },
            dpi: 300,
            // placeholder default
            colorMode: "RGB"
            // placeholder default
          };
          if (isImage) {
            const metadata = await sharp(buffer).metadata();
            const dpiX = metadata.density || 300;
            const widthMm = metadata.width / dpiX * 25.4;
            const heightMm = metadata.height / dpiX * 25.4;
            report.dimensions = { width: widthMm, height: heightMm };
            report.dpi = dpiX;
            report.colorMode = metadata.space === "cmyk" ? "CMYK" : "RGB";
            const targetW = product.w;
            const targetH = product.h;
            if (Math.abs(widthMm - targetW) > 1 || Math.abs(heightMm - targetH) > 1) {
              report.status = "invalid";
              report.issues.push(`Dimensions mismatch: Expected ${targetW}x${targetH}mm, got ${widthMm.toFixed(1)}x${heightMm.toFixed(1)}mm.`);
            }
            if (report.colorMode !== "CMYK" && product.color === "CMYK") {
              report.issues.push("Color mode is RGB. Print requires CMYK.");
            }
            if (dpiX < product.dpi) {
              report.issues.push(`Low resolution: Expected at least ${product.dpi} DPI, got ${dpiX} DPI.`);
            }
          } else if (isPdf) {
            const pdfDoc = await PDFDocument.load(buffer);
            const pages = pdfDoc.getPages();
            const pageCount = pages.length;
            if (pageCount !== product.pages) {
              report.status = "invalid";
              report.issues.push(`Page count mismatch: Expected ${product.pages} pages, got ${pageCount} pages.`);
            }
            if (pageCount > 0) {
              const firstPage = pages[0];
              const { width, height } = firstPage.getSize();
              const widthMm = width / 72 * 25.4;
              const heightMm = height / 72 * 25.4;
              report.dimensions = { width: widthMm, height: heightMm };
              const targetW = product.w;
              const targetH = product.h;
              if (Math.abs(widthMm - targetW) > 1 || Math.abs(heightMm - targetH) > 1) {
                report.status = "invalid";
                report.issues.push(`Dimensions mismatch: Expected ${targetW}x${targetH}mm, got ${widthMm.toFixed(1)}x${heightMm.toFixed(1)}mm.`);
              }
            }
          }
          if (action === "analyze") {
            return new Response(JSON.stringify({
              report,
              // For initial preview of image, just send base64
              previewUrl: isImage ? `data:${file.type};base64,${buffer.toString("base64")}` : null
            }));
          }
          if (action === "fix" && isImage) {
            const targetDpi = 300;
            const pxPerMm = targetDpi / 25.4;
            const totalW_px = Math.round((product.w + product.bleed * 2) * pxPerMm);
            const totalH_px = Math.round((product.h + product.bleed * 2) * pxPerMm);
            const fixedBuffer = await sharp(buffer).resize({
              width: totalW_px,
              height: totalH_px,
              fit: "contain",
              background: { r: 255, g: 255, b: 255, alpha: 1 }
              // Add white background
            }).jpeg({ quality: 90 }).toBuffer();
            const fixedUrl = `data:image/jpeg;base64,${fixedBuffer.toString("base64")}`;
            return new Response(JSON.stringify({ fixedUrl }));
          }
          if (action === "fix" && isPdf) {
            const pdfDoc = await PDFDocument.load(buffer);
            const pages = pdfDoc.getPages();
            for (const page of pages) {
              const { width, height } = page.getSize();
              const scale = Math.min(product.w * 72 / 25.4 / width, product.h * 72 / 25.4 / height);
              page.scale(scale, scale);
            }
            const fixedPdfBytes = await pdfDoc.save();
            const fixedUrl = `data:application/pdf;base64,${Buffer.from(fixedPdfBytes).toString("base64")}`;
            return new Response(JSON.stringify({ fixedUrl }));
          }
          return new Response(JSON.stringify({ error: "Unsupported operation" }), { status: 400 });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
      }
    }
  }
});
const $$splitComponentImporter$1 = () => import("./login-Bxmg1bqK.js");
z.object({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters"
  })
});
const Route$1 = createFileRoute("/admin/login")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./account.orders-BaLqEa9P.js");
const Route = createFileRoute("/account/orders")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SmartUploadRoute = Route$b.update({
  id: "/smart-upload",
  path: "/smart-upload",
  getParentRoute: () => Route$c
});
const RegisterRoute = Route$a.update({
  id: "/register",
  path: "/register",
  getParentRoute: () => Route$c
});
const LoginRoute = Route$9.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$c
});
const CartRoute = Route$8.update({
  id: "/cart",
  path: "/cart",
  getParentRoute: () => Route$c
});
const IndexRoute = Route$7.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$c
});
const AdminIndexRoute = Route$6.update({
  id: "/admin/",
  path: "/admin/",
  getParentRoute: () => Route$c
});
const ProductSlugRoute = Route$5.update({
  id: "/product/$slug",
  path: "/product/$slug",
  getParentRoute: () => Route$c
});
const CategorySlugRoute = Route$4.update({
  id: "/category/$slug",
  path: "/category/$slug",
  getParentRoute: () => Route$c
});
const ApiUploadPdfRoute = Route$3.update({
  id: "/api/upload-pdf",
  path: "/api/upload-pdf",
  getParentRoute: () => Route$c
});
const ApiProcessPrintRoute = Route$2.update({
  id: "/api/process-print",
  path: "/api/process-print",
  getParentRoute: () => Route$c
});
const AdminLoginRoute = Route$1.update({
  id: "/admin/login",
  path: "/admin/login",
  getParentRoute: () => Route$c
});
const AccountOrdersRoute = Route.update({
  id: "/account/orders",
  path: "/account/orders",
  getParentRoute: () => Route$c
});
const rootRouteChildren = {
  IndexRoute,
  CartRoute,
  LoginRoute,
  RegisterRoute,
  SmartUploadRoute,
  AccountOrdersRoute,
  AdminLoginRoute,
  ApiProcessPrintRoute,
  ApiUploadPdfRoute,
  CategorySlugRoute,
  ProductSlugRoute,
  AdminIndexRoute
};
const routeTree = Route$c._addFileChildren(rootRouteChildren)._addFileTypes();
function DefaultErrorComponent({ error, reset }) {
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        className: "h-8 w-8 text-destructive",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "An unexpected error occurred. Please try again." }),
    false,
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 3e4,
    defaultErrorComponent: DefaultErrorComponent
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Button as B,
  Input as I,
  Route$5 as R,
  Sheet as S,
  Textarea as T,
  Route$4 as a,
  SheetTrigger as b,
  cn as c,
  SheetContent as d,
  SheetHeader as e,
  SheetTitle as f,
  router as r,
  supabase as s,
  useTheme as u
};
