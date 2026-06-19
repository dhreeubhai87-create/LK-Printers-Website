import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building2,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Globe,
  Map,
  Compass,
  MapPin,
  Hash,
  FileText,
  AlignLeft,
  Info,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Printer
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";

interface RegisterResponse {
  message: string;
  response: {
    _id: string;
    businessName: string;
    username: string;
    email: string;
    phoneNumber: string;
    refCode?: string;
    Country: string;
    state: string;
    district: string;
    city: string;
    pinCode: string;
    gstTax?: string;
    fullAddress: string;
  };
  token?: string;
}

// Location Data Import
import {
  INDIAN_STATES,
  DISTRICTS_BY_STATE,
  getCitiesForDistrict
} from "@/lib/india-locations";

// Custom form validation schema
const registerSchema = z.object({
  businessName: z.string().min(2, { message: "Business / Firm Name must be at least 2 characters" }),
  yourName: z.string().min(2, { message: "Your Name must be at least 2 characters" }),
  whatsappNo: z.string()
    .length(10, { message: "WhatsApp number must be exactly 10 digits" })
    .regex(/^[0-9]+$/, { message: "WhatsApp number must contain only numbers" })
    .refine((val) => !val.startsWith("0"), { message: "Do not include leading 0" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  referenceCode: z.string().optional(),
  country: z.string().default("India"),
  state: z.string().min(1, { message: "Please select a state" }),
  district: z.string().min(1, { message: "Please select a district" }),
  customDistrict: z.string().optional(),
  city: z.string().min(1, { message: "Please select a city" }),
  customCity: z.string().optional(),
  pinCode: z.string()
    .length(6, { message: "PIN Code must be exactly 6 digits" })
    .regex(/^[0-9]+$/, { message: "PIN Code must contain only numbers" }),
  gstNumber: z.string().optional(),
  fullAddress: z.string().min(10, { message: "Please enter a detailed full address (min 10 chars)" })
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

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<RegisterFormValues | null>(null);
  const [generatedId, setGeneratedId] = useState<string>("");

  // Navigation & Router
  const navigate = useNavigate();

  // React Hook Form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: "",
      yourName: "",
      whatsappNo: "",
      email: "",
      password: "",
      referenceCode: "",
      country: "India",
      state: "",
      district: "",
      customDistrict: "",
      city: "",
      customCity: "",
      pinCode: "",
      gstNumber: "",
      fullAddress: "",
    },
  });

  // Watch state and district for cascading selectors
  const selectedState = form.watch("state");
  const selectedDistrict = form.watch("district");

  // Reset district and city when state changes
  useEffect(() => {
    if (selectedState) {
      form.setValue("district", "");
      form.setValue("customDistrict", "");
      form.setValue("city", "");
      form.setValue("customCity", "");
    }
  }, [selectedState, form]);

  // Reset city when district changes
  useEffect(() => {
    if (selectedDistrict) {
      form.setValue("city", "");
      form.setValue("customCity", "");
    }
  }, [selectedDistrict, form]);

  // Get active districts list
  const districtsList = selectedState ? DISTRICTS_BY_STATE[selectedState] || [] : [];
  // Append "Other" option for fallback input
  const finalDistricts = districtsList.length > 0 ? [...districtsList, "Other"] : [];

  // Get active cities list
  const citiesList = selectedDistrict && selectedDistrict !== "Other"
    ? getCitiesForDistrict(selectedDistrict)
    : [];
  // Append "Other" option for fallback input
  const finalCities = citiesList.length > 0 ? [...citiesList, "Other"] : [];

  // Form submission handler
  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);

    const mappedDistrict = values.district === "Other" ? values.customDistrict || "" : values.district;
    const mappedCity = values.city === "Other" ? values.customCity || "" : values.city;

    try {
      const data = await apiRequest<RegisterResponse>("/api/user/signup", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: values.businessName,
          username: values.yourName,
          email: values.email,
          phoneNumber: values.whatsappNo,
          password: values.password,
          refCode: values.referenceCode || "",
          Country: values.country,
          state: values.state,
          district: mappedDistrict,
          city: mappedCity,
          pinCode: values.pinCode,
          gstTax: values.gstNumber || "",
          fullAddress: values.fullAddress
        })
      });

      if (data.message === "User registered successfully") {
        // Successful signup
        setGeneratedId(data.response._id);

        const profileData = {
          id: data.response._id,
          name: data.response.username,
          yourName: data.response.username,
          email: data.response.email,
          phone: `+91 ${data.response.phoneNumber}`,
          whatsappNo: data.response.phoneNumber,
          company: data.response.businessName,
          businessName: data.response.businessName,
          state: data.response.state,
          district: data.response.district,
          city: data.response.city,
          pinCode: data.response.pinCode,
          gstNumber: data.response.gstTax || "",
          address: data.response.fullAddress,
          fullAddress: data.response.fullAddress,
          referenceCode: data.response.refCode || ""
        };

        // Set active session profile & token (logs them in)
        localStorage.setItem("lk-printer-profile", JSON.stringify(profileData));
        if (data.token) {
          localStorage.setItem("lk-auth-token", data.token);
        }

        setIsLoading(false);
        setSubmittedValues(values);
        toast.success(data.message || "Printer Registration Completed Successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setIsLoading(false);
      toast.error(getApiErrorMessage(error, "Unable to connect to server. Please check the backend is running."));
    }
  }

  // Render registration receipt / success screen
  if (submittedValues) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 selection:bg-[#13b58c]/20">
        <div className="max-w-2xl w-full mx-auto bg-white rounded-3xl shadow-xl border p-8 md:p-12 text-center animate-fade-in space-y-8 my-auto">
          {/* Animated Success Badge */}
          <div className="w-24 h-24 rounded-full bg-[#eafaf6] flex items-center justify-center mx-auto text-[#13b58c] border border-[#a2e8d7] shadow-inner animate-bounce-slow">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">
              Registration Successful!
            </h1>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              Your profile has been created and your unique Printer ID is now active.
            </p>
          </div>

          {/* Printer ID Display Badge */}
          <div className="bg-gradient-to-r from-[#13b58c]/10 to-[#0f9c78]/10 border border-[#13b58c]/20 text-[#0d6e59] px-6 py-6 rounded-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0f9c78] block">Your Generated Printer ID</span>
            <div className="text-3xl md:text-4xl font-mono font-extrabold tracking-wider text-slate-900">
              {generatedId}
            </div>
            <p className="text-xs text-[#0f9c78] font-semibold">Please save this ID. You can use it or your email to log in.</p>
          </div>

          {/* Alert Notice */}
          <div className="bg-[#eafaf6] border border-[#a2e8d7] text-[#0d6e59] px-5 py-4 rounded-2xl flex gap-3 text-left">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#13b58c]" />
            <div className="text-sm font-semibold leading-relaxed">
              <strong>Automatic Login Active:</strong> You are now logged in! You can immediately browse our print catalog and customize your orders with wholesale pricing.
            </div>
          </div>

          {/* Details Overview */}
          <div className="border rounded-2xl bg-slate-50 p-6 text-left space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">
              Application Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-slate-700">
              <div>
                <span className="text-slate-400 block text-xs">Printer ID</span>
                <span className="font-mono font-bold text-[#13b58c]">{generatedId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Business Name</span>
                <span className="font-semibold">{submittedValues.businessName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Contact Person</span>
                <span className="font-semibold">{submittedValues.yourName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Email Address</span>
                <span className="font-medium text-slate-900">{submittedValues.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">WhatsApp Number</span>
                <span className="font-semibold">+91 {submittedValues.whatsappNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Location</span>
                <span className="font-semibold">
                  {submittedValues.city === "Other" ? submittedValues.customCity : submittedValues.city},{" "}
                  {submittedValues.state}, IN
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">PIN Code</span>
                <span className="font-semibold">{submittedValues.pinCode}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate({ to: "/" })}
              className="px-8 h-12 bg-gradient-to-r from-[#13b58c] to-[#0f9c78] hover:shadow-lg hover:shadow-[#13b58c]/20 text-white rounded-xl font-bold flex items-center justify-center gap-2 group transition-all"
            >
              Start Ordering
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/account/orders" })}
              className="px-8 h-12 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold"
            >
              Go to Account
            </Button>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-400 pt-8">
          &copy; {new Date().getFullYear()} LK Printers of India. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] w-full flex flex-col selection:bg-[#13b58c]/20">

      {/* Curved Emerald Teal Header Banner */}
      <div className="bg-gradient-to-b from-[#13b58c] to-[#0f9c78] text-white pt-16 pb-28 px-6 text-center rounded-b-[3rem] md:rounded-b-[6rem] relative shadow-lg">
        {/* Glow circles */}
        <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group transition-transform hover:scale-105 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:rotate-6 transition-all duration-300">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wider uppercase text-white/95">
              LK Printers
            </span>
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Join Our LK Printers Network
          </h1>
          <p className="text-white/90 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
            Access exclusive wholesale benefits and grow your business with LK Printers of India
          </p>
        </div>
      </div>

      {/* Main Registration Form Container */}
      <div className="flex-1 px-4 md:px-8 pb-20 relative z-20">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 -mt-16 relative">

          {/* Header section inside card */}
          <div className="flex items-center gap-3 pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#eafaf6] flex items-center justify-center text-[#13b58c]">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 font-serif">
              LK Printers ID Registration
            </h2>
          </div>

          <div className="border-b border-slate-100 mb-6" />

          {/* Info Alert Box */}
          <div className="bg-[#eafaf6] border border-[#a2e8d7] text-[#0d6e59] p-4 rounded-2xl flex gap-3.5 mb-8 items-start">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#13b58c]" />
            <span className="text-sm font-medium leading-relaxed">
              <strong>Note:</strong> You are applying for a <strong>LK Printers ID</strong> for exclusive wholesale benefits. Requests are approved after internal verification (1–2 working days).
            </span>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* SECTION: BASIC DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Business / Firm Name */}
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Business / Firm Name <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Enter business or enterprise name"
                            {...field}
                            className="h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Your Name */}
                <FormField
                  control={form.control}
                  name="yourName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Your Name <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                            className="h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WhatsApp No. */}
                <FormField
                  control={form.control}
                  name="whatsappNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        WhatsApp No. <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 border-r pr-2.5 h-5 border-slate-200">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm font-semibold text-slate-500">+91</span>
                            </div>
                            <Input
                              type="tel"
                              maxLength={10}
                              placeholder="Enter 10-digit WhatsApp number"
                              {...field}
                              className="h-12 pl-[4.8rem] rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all"
                            />
                          </div>
                          <span className="text-[11px] font-medium text-red-500 mt-1.5 block">
                            Do not include 0 or country code
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Address */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Email Address <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            {...field}
                            className="h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* SECTION DIVIDER: SECURITY & REFERENCE */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-start text-xs uppercase">
                  <span className="bg-white pr-4 text-slate-400 font-bold tracking-widest text-[10px]">
                    Security & Reference
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Create Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Create Password <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            {...field}
                            className="h-12 pl-11 pr-10 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reference Code / Employee Code */}
                <FormField
                  control={form.control}
                  name="referenceCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Reference Code (Optional)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Employee Code"
                            {...field}
                            className="h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* SECTION DIVIDER: LOCATION DETAILS */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-start text-xs uppercase">
                  <span className="bg-white pr-4 text-slate-400 font-bold tracking-widest text-[10px]">
                    Location Details
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Country */}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Country <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Select disabled defaultValue="India" onValueChange={field.onChange}>
                            <SelectTrigger className="h-12 pl-11 rounded-xl border-slate-200 bg-slate-50 text-slate-700">
                              <SelectValue placeholder="India" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="India">India</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* State */}
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        State <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-12 pl-11 rounded-xl border-slate-200 focus:ring-[#13b58c]/20">
                              <SelectValue placeholder="--Select State--" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state.id} value={state.name}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* District */}
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        District <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                          <Select
                            disabled={!selectedState}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-12 pl-11 rounded-xl border-slate-200 focus:ring-[#13b58c]/20">
                              <SelectValue placeholder={selectedState ? "--Select--" : "Select State first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {finalDistricts.map((dist) => (
                                <SelectItem key={dist} value={dist}>
                                  {dist}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        City <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                          <Select
                            disabled={!selectedDistrict || selectedDistrict === ""}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-12 pl-11 rounded-xl border-slate-200 focus:ring-[#13b58c]/20">
                              <SelectValue placeholder={selectedDistrict ? "--Select--" : "Select District first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedDistrict === "Other" ? (
                                <SelectItem value="Other">Other (Type Below)</SelectItem>
                              ) : (
                                finalCities.map((city) => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Custom District Input (if "Other" is selected) */}
                {selectedDistrict === "Other" && (
                  <FormField
                    control={form.control}
                    name="customDistrict"
                    render={({ field }) => (
                      <FormItem className="animate-fade-in md:col-span-2">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Specify District <span className="text-[#13b58c] font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              placeholder="Enter your district name"
                              {...field}
                              className="h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c]"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Custom City Input (if "Other" is selected) */}
                {form.watch("city") === "Other" && (
                  <FormField
                    control={form.control}
                    name="customCity"
                    render={({ field }) => (
                      <FormItem className="animate-fade-in md:col-span-2">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Specify City <span className="text-[#13b58c] font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              placeholder="Enter your city/town name"
                              {...field}
                              className="h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c]"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* PIN Code */}
                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        PIN Code <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            maxLength={6}
                            placeholder="Enter 6-digit postal index number"
                            {...field}
                            className="h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* GST / Tax Number */}
                <FormField
                  control={form.control}  b
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        GST / Tax Number (Optional)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Enter 15-digit GSTIN format"
                            {...field}
                            className="h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full Address */}
                <FormField
                  control={form.control}
                  name="fullAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Full Address <span className="text-[#13b58c] font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                          <Textarea
                            placeholder="Enter full billing or shop address details"
                            {...field}
                            className="min-h-[100px] pl-11 pt-3.5 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all resize-y"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* Submit Button */}
              <div className="pt-4 flex flex-col items-center space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full md:max-w-md h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-[#13b58c] to-[#0f9c78] hover:shadow-xl hover:shadow-[#13b58c]/25 text-white transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting Registration...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Register & Request LK Printers ID
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>

                {/* Footer link to login */}
                <p className="text-sm font-semibold text-slate-500">
                  Already have a LK Printers ID?{" "}
                  <Link
                    to="/login"
                    className="text-[#13b58c] hover:underline underline-offset-4 font-bold"
                  >
                    Log in instead
                  </Link>
                </p>
              </div>

            </form>
          </Form>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-8 border-t border-slate-100 mt-12 bg-white">
        &copy; {new Date().getFullYear()} LK Printers of India. All rights reserved.
      </footer>

      {/* Embedded Animations and Transition Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}
