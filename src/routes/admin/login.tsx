import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Printer, ArrowRight, ShieldCheck, Lock } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";

interface AdminLoginResponse {
  message: string;
  response: {
    _id: string;
    role: string;
    email: string;
    username: string;
    businessName: string;
    phoneNumber: string;
  };
  token: string;
}

const adminLoginSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onSubmit(values: AdminLoginFormValues) {
    setIsLoading(true);

    try {
      const data = await apiRequest<AdminLoginResponse>("/api/user/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: values.password,
        }),
      });

      if (data.message === "Login successful") {
        const user = data.response;

        // Store admin data and token
        localStorage.setItem("lk-admin-profile", JSON.stringify(user));
        localStorage.setItem("lk-admin-token", data.token);

        toast.success("Welcome back, Administrator!");
        
        setTimeout(() => {
          setIsLoading(false);
          navigate({ to: "/admin" });
        }, 500);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      toast.error(getApiErrorMessage(error, "Unable to connect to server. Ensure the backend is active."));
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-6 font-sans">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
      
      <Card className="w-full max-w-[450px] p-8 rounded-[2rem] border shadow-2xl bg-card space-y-8">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-200">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Authorized access only. Log in to manage LK Printers.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Security Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="h-12 rounded-xl pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-bold bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Enter Admin Panel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider pt-2 border-t">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          SECURE SSL CONSOLE
        </div>
      </Card>
    </div>
  );
}
