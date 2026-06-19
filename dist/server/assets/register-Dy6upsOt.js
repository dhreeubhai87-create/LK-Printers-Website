import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, Check, ChevronUp, CheckCircle2, Info, ArrowRight, Printer, UserCheck, Building2, User, Phone, Mail, Lock, EyeOff, Eye, Globe, Map, Compass, MapPin, Hash, FileText, AlignLeft, Loader2 } from "lucide-react";
import { c as cn, B as Button, I as Input, T as Textarea } from "./router-frHDfBxK.js";
import { F as Form, a as FormField, b as FormItem, c as FormLabel, d as FormControl, e as FormMessage } from "./form-CeQpIM2u.js";
import * as SelectPrimitive from "@radix-ui/react-select";
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
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
const INDIAN_STATES = [
  { id: "AP", name: "Andhra Pradesh" },
  { id: "AR", name: "Arunachal Pradesh" },
  { id: "AS", name: "Assam" },
  { id: "BR", name: "Bihar" },
  { id: "CG", name: "Chhattisgarh" },
  { id: "GA", name: "Goa" },
  { id: "GJ", name: "Gujarat" },
  { id: "HR", name: "Haryana" },
  { id: "HP", name: "Himachal Pradesh" },
  { id: "JH", name: "Jharkhand" },
  { id: "KA", name: "Karnataka" },
  { id: "KL", name: "Kerala" },
  { id: "MP", name: "Madhya Pradesh" },
  { id: "MH", name: "Maharashtra" },
  { id: "MN", name: "Manipur" },
  { id: "ML", name: "Meghalaya" },
  { id: "MZ", name: "Mizoram" },
  { id: "NL", name: "Nagaland" },
  { id: "OD", name: "Odisha" },
  { id: "PB", name: "Punjab" },
  { id: "RJ", name: "Rajasthan" },
  { id: "SK", name: "Sikkim" },
  { id: "TN", name: "Tamil Nadu" },
  { id: "TG", name: "Telangana" },
  { id: "TR", name: "Tripura" },
  { id: "UP", name: "Uttar Pradesh" },
  { id: "UT", name: "Uttarakhand" },
  { id: "WB", name: "West Bengal" },
  { id: "AN", name: "Andaman and Nicobar Islands" },
  { id: "CH", name: "Chandigarh" },
  { id: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { id: "DL", name: "Delhi" },
  { id: "JK", name: "Jammu and Kashmir" },
  { id: "LA", name: "Ladakh" },
  { id: "LD", name: "Lakshadweep" },
  { id: "PY", name: "Puducherry" }
].sort((a, b) => a.name.localeCompare(b.name));
const DISTRICTS_BY_STATE = {
  "Andhra Pradesh": [
    "Anantapur",
    "Chittoor",
    "East Godavari",
    "Guntur",
    "Krishna",
    "Kurnool",
    "Nellore",
    "Prakasam",
    "Srikakulam",
    "Visakhapatnam",
    "Vizianagaram",
    "West Godavari"
  ],
  "Arunachal Pradesh": [
    "Changlang",
    "Dibang Valley",
    "East Kameng",
    "East Siang",
    "Itanagar Capital Complex",
    "Kurung Kumey",
    "Lohit",
    "Lower Subansiri",
    "Papum Pare",
    "Tawang",
    "Tirap",
    "West Kameng"
  ],
  "Assam": [
    "Barpeta",
    "Cachar",
    "Darrang",
    "Dibrugarh",
    "Jorhat",
    "Kamrup Metropolitan",
    "Kamrup Rural",
    "Karbi Anglong",
    "Lakhimpur",
    "Nagaon",
    "Sivasagar",
    "Sonitpur",
    "Tinsukia"
  ],
  "Bihar": [
    "Araria",
    "Aurangabad",
    "Banki",
    "Begusarai",
    "Bhagalpur",
    "Bhojpur",
    "Darbhanga",
    "Gaya",
    "Gopalganj",
    "Katihar",
    "Madhubani",
    "Muzaffarpur",
    "Nalanda",
    "Patna",
    "Purnia",
    "Rohtas",
    "Samastipur",
    "Siwan",
    "Vaishali"
  ],
  "Chhattisgarh": [
    "Bastari",
    "Bilaspur",
    "Durg",
    "Janigir-Champa",
    "Korba",
    "Raigarh",
    "Raipur",
    "Rajnandgaon",
    "Surguja"
  ],
  "Delhi": [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi"
  ],
  "Goa": [
    "North Goa",
    "South Goa"
  ],
  "Gujarat": [
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Banaskantha",
    "Bharuch",
    "Bhavnagar",
    "Dahod",
    "Gandhinagar",
    "Jamnagar",
    "Junagadh",
    "Kutch",
    "Mehsana",
    "Morbi",
    "Narmada",
    "Navsari",
    "Panchmahal",
    "Patan",
    "Porbandar",
    "Rajkot",
    "Sabarkantha",
    "Surat",
    "Surendranagar",
    "Vadodara",
    "Valsad"
  ],
  "Haryana": [
    "Ambala",
    "Bhiwani",
    "Faridabad",
    "Fatehabad",
    "Gurugram",
    "Hisar",
    "Jhajjar",
    "Jind",
    "Kaithal",
    "Karnal",
    "Kurukshetra",
    "Mahendragarh",
    "Panchkula",
    "Panipat",
    "Rewari",
    "Rohtak",
    "Sirsa",
    "Sonipat",
    "Yamunanagar"
  ],
  "Himachal Pradesh": [
    "Bilaspur",
    "Chamba",
    "Hamirpur",
    "Kangra",
    "Kinnaur",
    "Kullu",
    "Lahaul and Spiti",
    "Mandi",
    "Shimla",
    "Sirmaur",
    "Solan",
    "Una"
  ],
  "Jammu and Kashmir": [
    "Anantnag",
    "Baramulla",
    "Budgam",
    "Doda",
    "Jammu",
    "Kathua",
    "Kupwara",
    "Poonch",
    "Rajouri",
    "Ramban",
    "Reasi",
    "Samba",
    "Shopian",
    "Srinagar",
    "Udhampur"
  ],
  "Jharkhand": [
    "Bokaro",
    "Chatra",
    "Deoghar",
    "Dhanbad",
    "Dumka",
    "East Singhbhum",
    "Garhwa",
    "Giridih",
    "Godda",
    "Gumla",
    "Hazaribagh",
    "Jamtara",
    "Khunti",
    "Koderma",
    "Latehar",
    "Lohardaga",
    "Pakur",
    "Palamu",
    "Ramgarh",
    "Ranchi",
    "Sahibganj",
    "West Singhbhum"
  ],
  "Karnataka": [
    "Bagalkot",
    "Ballari",
    "Belagavi",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikkaballapur",
    "Chikkamagaluru",
    "Chitradurga",
    "Dakshina Kannada",
    "Davanagere",
    "Dharwad",
    "Gadag",
    "Hassan",
    "Haveri",
    "Kalaburagi",
    "Kodagu",
    "Kolar",
    "Koppal",
    "Mandya",
    "Mysuru",
    "Raichur",
    "Ramanagara",
    "Shivamogga",
    "Tumakuru",
    "Udupi",
    "Uttara Kannada",
    "Vijayapura",
    "Yadgir"
  ],
  "Kerala": [
    "Alappuzha",
    "Ernakulam",
    "Idukki",
    "Kannur",
    "Kasaragod",
    "Kollam",
    "Kottayam",
    "Kozhikode",
    "Malappuram",
    "Palakkad",
    "Pathanamthitta",
    "Thiruvananthapuram",
    "Thrissur",
    "Wayanad"
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Chhindwara",
    "Dewas",
    "Dhar",
    "Gwalior",
    "Indore",
    "Jabalpur",
    "Khandwa",
    "Khargone",
    "Mandsaur",
    "Morena",
    "Ratlam",
    "Rewa",
    "Sagar",
    "Satna",
    "Sehore",
    "Shivpuri",
    "Ujjain",
    "Vidisha"
  ],
  "Maharashtra": [
    "Ahmednagar",
    "Akola",
    "Amravati",
    "Aurangabad",
    "Beed",
    "Bhandara",
    "Buldhana",
    "Chandrapur",
    "Dhule",
    "Gadchiroli",
    "Gondia",
    "Hingoli",
    "Jalgaon",
    "Jalna",
    "Kolhapur",
    "Latur",
    "Mumbai City",
    "Mumbai Suburban",
    "Nagpur",
    "Nanded",
    "Nandurbar",
    "Nashik",
    "Osmanabad",
    "Palghar",
    "Parbhani",
    "Pune",
    "Raigad",
    "Ratnagiri",
    "Sangli",
    "Satara",
    "Sindhudurg",
    "Solapur",
    "Thane",
    "Wardha",
    "Washim",
    "Yavatmal"
  ],
  "Manipur": [
    "Bishnupur",
    "Chandel",
    "Churachandpur",
    "Imphal East",
    "Imphal West",
    "Senapati",
    "Thoubal",
    "Ukhrul"
  ],
  "Meghalaya": [
    "East Garo Hills",
    "East Jaintia Hills",
    "East Khasi Hills",
    "Ri Bhoi",
    "South Garo Hills",
    "West Garo Hills",
    "West Khasi Hills"
  ],
  "Mizoram": [
    "Aizawl",
    "Champhai",
    "Kolasib",
    "Lawngtlai",
    "Lunglei",
    "Mamit",
    "Saiha",
    "Serchhip"
  ],
  "Nagaland": [
    "Dimapur",
    "Kiphire",
    "Kohima",
    "Longleng",
    "Mokokchung",
    "Mon",
    "Peren",
    "Phek",
    "Tuensang",
    "Wokha",
    "Zunheboto"
  ],
  "Odisha": [
    "Angul",
    "Balasore",
    "Bargarh",
    "Bhadrak",
    "Bolangir",
    "Cuttack",
    "Deogarh",
    "Dhenkanal",
    "Ganjam",
    "Jagatsinghpur",
    "Jajpur",
    "Jharsuguda",
    "Kalahandi",
    "Kendrapara",
    "Keonjhar",
    "Khordha",
    "Koraput",
    "Mayurbhanj",
    "Nabarangpur",
    "Nayagarh",
    "Nuapada",
    "Puri",
    "Rayagada",
    "Sambalpur",
    "Subarnapur",
    "Sundargarh"
  ],
  "Punjab": [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Ferozepur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Mansa",
    "Moga",
    "Muktsar",
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "Sahibzada Ajit Singh Nagar (Mohali)",
    "Sangrur",
    "Tarn Taran"
  ],
  "Rajasthan": [
    "Ajmer",
    "Alwar",
    "Banswara",
    "Baran",
    "Barmer",
    "Bharatpur",
    "Bhilwara",
    "Bikaner",
    "Bundi",
    "Chittorgarh",
    "Churu",
    "Dausa",
    "Dholpur",
    "Dungarpur",
    "Hanumangarh",
    "Jaipur",
    "Jaisalmer",
    "Jalore",
    "Jhalawar",
    "Jhunjhunu",
    "Jodhpur",
    "Karauli",
    "Kota",
    "Nagaur",
    "Pali",
    "Pratapgarh",
    "Rajsamand",
    "Sawai Madhopur",
    "Sikar",
    "Sirohi",
    "Sri Ganganagar",
    "Tonk",
    "Udaipur"
  ],
  "Sikkim": [
    "East Sikkim",
    "North Sikkim",
    "South Sikkim",
    "West Sikkim"
  ],
  "Tamil Nadu": [
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kanchipuram",
    "Kanyakumari",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar"
  ],
  "Telangana": [
    "Adilabad",
    "Bhadradri Kothagudem",
    "Hyderabad",
    "Jagtial",
    "Jangaon",
    "Jayashankar Bhupalpally",
    "Jogulamba Gadwal",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Kumuram Bheem Asifabad",
    "Mahabubabad",
    "Mahabubnagar",
    "Mancherial",
    "Medak",
    "Medchal-Malkajgiri",
    "Mulugu",
    "Nagarkurnool",
    "Nalgonda",
    "Narayanpet",
    "Nirmal",
    "Nizamabad",
    "Peddapalli",
    "Rajanna Sircilla",
    "Rangareddy",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Vikarabad",
    "Wanaparthy",
    "Warangal Rural",
    "Warangal Urban",
    "Yadadri Bhuvanagiri"
  ],
  "Tripura": [
    "Dhalai",
    "Gomati",
    "Khowai",
    "North Tripura",
    "Sepahijala",
    "South Tripura",
    "Unakoti",
    "West Tripura"
  ],
  "Uttar Pradesh": [
    "Agra",
    "Aligarh",
    "Ambedkar Nagar",
    "Amethi",
    "Amroha",
    "Auraiya",
    "Ayodhya",
    "Azamgarh",
    "Baghpat",
    "Bahraich",
    "Ballia",
    "Balrampur",
    "Banda",
    "Bara Banki",
    "Bareilly",
    "Basti",
    "Bijnor",
    "Budaun",
    "Bulandshahr",
    "Chandauli",
    "Chitrakoot",
    "Deoria",
    "Etah",
    "Etawah",
    "Farrukhabad",
    "Fatehpur",
    "Firozabad",
    "Gautam Buddha Nagar (Noida)",
    "Ghaziabad",
    "Ghazipur",
    "Gonda",
    "Gorakhpur",
    "Hamirpur",
    "Hapur",
    "Hardoi",
    "Hathras",
    "Jalaun",
    "Jaunpur",
    "Jhansi",
    "Kannauj",
    "Kanpur Dehat",
    "Kanpur Nagar",
    "Kasganj",
    "Kaushambi",
    "Kheri",
    "Kushinagar",
    "Lalitpur",
    "Lucknow",
    "Maharajganj",
    "Mahoba",
    "Mainpuri",
    "Mathura",
    "Mau",
    "Meerut",
    "Mirzapur",
    "Moradabad",
    "Muzaffarnagar",
    "Pilibhit",
    "Pratapgarh",
    "Prayagraj",
    "Rae Bareli",
    "Rampur",
    "Saharanpur",
    "Sambhal",
    "Sant Kabir Nagar",
    "Shahjahanpur",
    "Shamli",
    "Shrawasti",
    "Siddharthnagar",
    "Sitapur",
    "Sonbhadra",
    "Sultanpur",
    "Unnao",
    "Varanasi"
  ],
  "Uttarakhand": [
    "Almora",
    "Bageshwar",
    "Chamoli",
    "Champawat",
    "Dehradun",
    "Haridwar",
    "Nainital",
    "Pauri Garhwal",
    "Pithoragarh",
    "Rudraprayag",
    "Tehri Garhwal",
    "Udham Singh Nagar",
    "Uttarkashi"
  ],
  "West Bengal": [
    "Alipurduar",
    "Bankura",
    "Birbhum",
    "Cooch Behar",
    "Dakshin Dinajpur",
    "Darjeeling",
    "Hooghly",
    "Howrah",
    "Jalpaiguri",
    "Jhargram",
    "Kalimpong",
    "Kolkata",
    "Malda",
    "Murshidabad",
    "Nadia",
    "North 24 Parganas",
    "Paschim Bardhaman",
    "Paschim Medinipur",
    "Purba Bardhaman",
    "Purba Medinipur",
    "Purulia",
    "South 24 Parganas",
    "Uttar Dinajpur"
  ],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};
const CITIES_BY_DISTRICT = {
  // Key districts from various states
  // Karnataka
  "Bengaluru Urban": ["Bengaluru", "Kengeri", "Yelahanka", "Whitefield", "Electronic City"],
  "Mysuru": ["Mysuru", "Nanjangud", "Hunsur", "T Narasipura", "K R Nagar"],
  "Dharwad": ["Hubballi", "Dharwad", "Kalghatgi", "Kundgol", "Navalgund"],
  "Dakshina Kannada": ["Mangaluru", "Ullal", "Bantwal", "Puttur", "Belthangady"],
  "Belagavi": ["Belagavi", "Gokak", "Chikodi", "Athani", "Nipani", "Bailhongal"],
  // Maharashtra
  "Mumbai City": ["Mumbai", "Colaba", "Dadar", "Fort", "Byculla"],
  "Mumbai Suburban": ["Andheri", "Bandra", "Borivali", "Kurla", "Ghatkopar", "Mulund"],
  "Pune": ["Pune", "Pimpri-Chinchwad", "Chakan", "Lonavala", "Baramati", "Talegaon"],
  "Thane": ["Thane", "Kalyan", "Dombivli", "Mira-Bhayandar", "Ulhasnagar", "Ambernath", "Bhiwandi"],
  "Nagpur": ["Nagpur", "Kamthi", "Umred", "Kalmeshwar"],
  "Nashik": ["Nashik", "Malegaon", "Manmad", "Sinnar", "Ozar", "Igatpuri"],
  // Delhi
  "New Delhi": ["Connaught Place", "Chanakyapuri", "Vasant Kunj", "Saket", "Dwarka"],
  "Central Delhi": ["Daryaganj", "Paharganj", "Karol Bagh", "Chandni Chowk"],
  "South Delhi": ["Hauz Khas", "Greater Kailash", "Nehru Place", "Lajpat Nagar"],
  // Tamil Nadu
  "Chennai": ["Chennai", "Adyar", "Mylapore", "T Nagar", "Velachery", "Tambaram", "Anna Nagar"],
  "Coimbatore": ["Coimbatore", "Pollachi", "Mettupalayam", "Valparai"],
  "Madurai": ["Madurai", "Melur", "Thirumangalam", "Vadipatti"],
  // Telangana
  "Hyderabad": ["Hyderabad", "Secunderabad", "Gachibowli", "Madhapur", "Kukatpally", "Begumpet"],
  "Warangal Urban": ["Warangal", "Hanamkonda", "Kazipet"],
  // Uttar Pradesh
  "Lucknow": ["Lucknow", "Malihabad", "Bakshi Ka Talab", "Gosainganj"],
  "Kanpur Nagar": ["Kanpur", "Bilhau", "Ghatampur"],
  "Gautam Buddha Nagar (Noida)": ["Noida", "Greater Noida", "Dadri", "Jewar"],
  "Ghaziabad": ["Ghaziabad", "Loni", "Modinagar", "Muradnagar"],
  "Varanasi": ["Varanasi", "Ramnagar", "Pindra"],
  // West Bengal
  "Kolkata": ["Kolkata", "Salt Lake", "New Town", "Alipore", "Ballygunge"],
  "Howrah": ["Howrah", "Bally", "Uluberia", "Andul"],
  "Darjeeling": ["Darjeeling", "Kurseong", "Mirik"],
  // Gujarat
  "Ahmedabad": ["Ahmedabad", "Bavla", "Sanand", "Viramgam", "Dholka"],
  "Surat": ["Surat", "Bardoli", "Vyara", "Kosamba"],
  "Vadodara": ["Vadodara", "Padra", "Karjan", "Dabhoi"],
  // Rajasthan
  "Jaipur": ["Jaipur", "Sanganer", "Amer", "Chomu", "Bagru"],
  "Jodhpur": ["Jodhpur", "Piparcity", "Bilara"],
  // Bihar
  "Patna": ["Patna", "Danapur", "Khagaul", "Phulwari Sharif", "Fatwah"],
  // Kerala
  "Ernakulam": ["Kochi", "Aluva", "Angamaly", "Perumbavoor", "Muvattupuzha", "Tripunithura"],
  "Thiruvananthapuram": ["Thiruvananthapuram", "Neyyattinkara", "Attingal", "Nedumangad"]
};
function getCitiesForDistrict(district) {
  if (CITIES_BY_DISTRICT[district]) {
    return CITIES_BY_DISTRICT[district];
  }
  return [
    `${district} City`,
    `${district} Town`,
    `${district} Rural`,
    `East ${district}`,
    `West ${district}`
  ];
}
const registerSchema = z.object({
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
function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedValues, setSubmittedValues] = useState(null);
  const [generatedId, setGeneratedId] = useState("");
  const navigate = useNavigate();
  const form = useForm({
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
      fullAddress: ""
    }
  });
  const selectedState = form.watch("state");
  const selectedDistrict = form.watch("district");
  useEffect(() => {
    if (selectedState) {
      form.setValue("district", "");
      form.setValue("customDistrict", "");
      form.setValue("city", "");
      form.setValue("customCity", "");
    }
  }, [selectedState, form]);
  useEffect(() => {
    if (selectedDistrict) {
      form.setValue("city", "");
      form.setValue("customCity", "");
    }
  }, [selectedDistrict, form]);
  const districtsList = selectedState ? DISTRICTS_BY_STATE[selectedState] || [] : [];
  const finalDistricts = districtsList.length > 0 ? [...districtsList, "Other"] : [];
  const citiesList = selectedDistrict && selectedDistrict !== "Other" ? getCitiesForDistrict(selectedDistrict) : [];
  const finalCities = citiesList.length > 0 ? [...citiesList, "Other"] : [];
  async function onSubmit(values) {
    setIsLoading(true);
    const mappedDistrict = values.district === "Other" ? values.customDistrict || "" : values.district;
    const mappedCity = values.city === "Other" ? values.customCity || "" : values.city;
    try {
      const data = await apiRequest("/api/user/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
        localStorage.setItem("lk-printer-profile", JSON.stringify(profileData));
        if (data.token) {
          localStorage.setItem("lk-auth-token", data.token);
        }
        setIsLoading(false);
        setSubmittedValues(values);
        toast.success(data.message || "Printer Registration Completed Successfully!");
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setIsLoading(false);
      toast.error(getApiErrorMessage(error, "Unable to connect to server. Please check the backend is running."));
    }
  }
  if (submittedValues) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 selection:bg-[#13b58c]/20", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-2xl w-full mx-auto bg-white rounded-3xl shadow-xl border p-8 md:p-12 text-center animate-fade-in space-y-8 my-auto", children: [
        /* @__PURE__ */ jsx("div", { className: "w-24 h-24 rounded-full bg-[#eafaf6] flex items-center justify-center mx-auto text-[#13b58c] border border-[#a2e8d7] shadow-inner animate-bounce-slow", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-12 h-12" }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight text-slate-900 font-serif", children: "Registration Successful!" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 max-w-md mx-auto text-sm leading-relaxed", children: "Your profile has been created and your unique Printer ID is now active." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-[#13b58c]/10 to-[#0f9c78]/10 border border-[#13b58c]/20 text-[#0d6e59] px-6 py-6 rounded-2xl space-y-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-[#0f9c78] block", children: "Your Generated Printer ID" }),
          /* @__PURE__ */ jsx("div", { className: "text-3xl md:text-4xl font-mono font-extrabold tracking-wider text-slate-900", children: generatedId }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[#0f9c78] font-semibold", children: "Please save this ID. You can use it or your email to log in." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#eafaf6] border border-[#a2e8d7] text-[#0d6e59] px-5 py-4 rounded-2xl flex gap-3 text-left", children: [
          /* @__PURE__ */ jsx(Info, { className: "w-5 h-5 flex-shrink-0 mt-0.5 text-[#13b58c]" }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold leading-relaxed", children: [
            /* @__PURE__ */ jsx("strong", { children: "Automatic Login Active:" }),
            " You are now logged in! You can immediately browse our print catalog and customize your orders with wholesale pricing."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border rounded-2xl bg-slate-50 p-6 text-left space-y-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2", children: "Application Summary" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-slate-700", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 block text-xs", children: "Printer ID" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-[#13b58c]", children: generatedId })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 block text-xs", children: "Business Name" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: submittedValues.businessName })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 block text-xs", children: "Contact Person" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: submittedValues.yourName })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 block text-xs", children: "Email Address" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-900", children: submittedValues.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 block text-xs", children: "WhatsApp Number" }),
              /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                "+91 ",
                submittedValues.whatsappNo
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 block text-xs", children: "Location" }),
              /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                submittedValues.city === "Other" ? submittedValues.customCity : submittedValues.city,
                ",",
                " ",
                submittedValues.state,
                ", IN"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 block text-xs", children: "PIN Code" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: submittedValues.pinCode })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex flex-col sm:flex-row gap-4 justify-center", children: [
          /* @__PURE__ */ jsxs(Button, { onClick: () => navigate({
            to: "/"
          }), className: "px-8 h-12 bg-gradient-to-r from-[#13b58c] to-[#0f9c78] hover:shadow-lg hover:shadow-[#13b58c]/20 text-white rounded-xl font-bold flex items-center justify-center gap-2 group transition-all", children: [
            "Start Ordering",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 group-hover:translate-x-1 transition-transform" })
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => navigate({
            to: "/account/orders"
          }), className: "px-8 h-12 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold", children: "Go to Account" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("footer", { className: "text-center text-xs text-slate-400 pt-8", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " LK Printers of India. All rights reserved."
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#f8fafc] w-full flex flex-col selection:bg-[#13b58c]/20", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-b from-[#13b58c] to-[#0f9c78] text-white pt-16 pb-28 px-6 text-center rounded-b-[3rem] md:rounded-b-[6rem] relative shadow-lg", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[-20%] left-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-black/10 rounded-full blur-2xl pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto space-y-4 relative z-10", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2.5 group transition-transform hover:scale-105 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:rotate-6 transition-all duration-300", children: /* @__PURE__ */ jsx(Printer, { className: "w-5 h-5 text-white" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-lg font-bold tracking-wider uppercase text-white/95", children: "LK Printers" })
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-extrabold tracking-tight", children: "Join Our LK Printers Network" }),
        /* @__PURE__ */ jsx("p", { className: "text-white/90 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed", children: "Access exclusive wholesale benefits and grow your business with LK Printers of India" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 px-4 md:px-8 pb-20 relative z-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 -mt-16 relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-[#eafaf6] flex items-center justify-center text-[#13b58c]", children: /* @__PURE__ */ jsx(UserCheck, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl md:text-2xl font-bold text-slate-800 font-serif", children: "LK Printers ID Registration" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-b border-slate-100 mb-6" }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#eafaf6] border border-[#a2e8d7] text-[#0d6e59] p-4 rounded-2xl flex gap-3.5 mb-8 items-start", children: [
        /* @__PURE__ */ jsx(Info, { className: "w-5 h-5 flex-shrink-0 mt-0.5 text-[#13b58c]" }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium leading-relaxed", children: [
          /* @__PURE__ */ jsx("strong", { children: "Note:" }),
          " You are applying for a ",
          /* @__PURE__ */ jsx("strong", { children: "LK Printers ID" }),
          " for exclusive wholesale benefits. Requests are approved after internal verification (1–2 working days)."
        ] })
      ] }),
      /* @__PURE__ */ jsx(Form, { ...form, children: /* @__PURE__ */ jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "businessName", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "Business / Firm Name ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Building2, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Enter business or enterprise name", ...field, className: "h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "yourName", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "Your Name ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(User, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Enter your full name", ...field, className: "h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "whatsappNo", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "WhatsApp No. ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 border-r pr-2.5 h-5 border-slate-200", children: [
                  /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-500", children: "+91" })
                ] }),
                /* @__PURE__ */ jsx(Input, { type: "tel", maxLength: 10, placeholder: "Enter 10-digit WhatsApp number", ...field, className: "h-12 pl-[4.8rem] rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-red-500 mt-1.5 block", children: "Do not include 0 or country code" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "email", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "Email Address ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Mail, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { type: "email", placeholder: "Enter email address", ...field, className: "h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative my-8", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("span", { className: "w-full border-t border-slate-100" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative flex justify-start text-xs uppercase", children: /* @__PURE__ */ jsx("span", { className: "bg-white pr-4 text-slate-400 font-bold tracking-widest text-[10px]", children: "Security & Reference" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "password", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "Create Password ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Lock, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { type: showPassword ? "text" : "password", placeholder: "Create a strong password", ...field, className: "h-12 pl-11 pr-10 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all" }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors", children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "referenceCode", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsx(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: "Reference Code (Optional)" }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(UserCheck, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Employee Code", ...field, className: "h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative my-8", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("span", { className: "w-full border-t border-slate-100" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative flex justify-start text-xs uppercase", children: /* @__PURE__ */ jsx("span", { className: "bg-white pr-4 text-slate-400 font-bold tracking-widest text-[10px]", children: "Location Details" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "country", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "Country ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Globe, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsxs(Select, { disabled: true, defaultValue: "India", onValueChange: field.onChange, children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-12 pl-11 rounded-xl border-slate-200 bg-slate-50 text-slate-700", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "India" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: /* @__PURE__ */ jsx(SelectItem, { value: "India", children: "India" }) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "state", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "State ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Map, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" }),
              /* @__PURE__ */ jsxs(Select, { value: field.value, onValueChange: field.onChange, children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-12 pl-11 rounded-xl border-slate-200 focus:ring-[#13b58c]/20", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "--Select State--" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: INDIAN_STATES.map((state) => /* @__PURE__ */ jsx(SelectItem, { value: state.name, children: state.name }, state.id)) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "district", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "District ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Compass, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" }),
              /* @__PURE__ */ jsxs(Select, { disabled: !selectedState, value: field.value, onValueChange: field.onChange, children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-12 pl-11 rounded-xl border-slate-200 focus:ring-[#13b58c]/20", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: selectedState ? "--Select--" : "Select State first" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: finalDistricts.map((dist) => /* @__PURE__ */ jsx(SelectItem, { value: dist, children: dist }, dist)) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "city", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "City ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" }),
              /* @__PURE__ */ jsxs(Select, { disabled: !selectedDistrict || selectedDistrict === "", value: field.value, onValueChange: field.onChange, children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-12 pl-11 rounded-xl border-slate-200 focus:ring-[#13b58c]/20", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: selectedDistrict ? "--Select--" : "Select District first" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: selectedDistrict === "Other" ? /* @__PURE__ */ jsx(SelectItem, { value: "Other", children: "Other (Type Below)" }) : finalCities.map((city) => /* @__PURE__ */ jsx(SelectItem, { value: city, children: city }, city)) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          selectedDistrict === "Other" && /* @__PURE__ */ jsx(FormField, { control: form.control, name: "customDistrict", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { className: "animate-fade-in md:col-span-2", children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "Specify District ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Compass, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Enter your district name", ...field, className: "h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c]" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          form.watch("city") === "Other" && /* @__PURE__ */ jsx(FormField, { control: form.control, name: "customCity", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { className: "animate-fade-in md:col-span-2", children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "Specify City ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Enter your city/town name", ...field, className: "h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c]" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "pinCode", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "PIN Code ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Hash, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { maxLength: 6, placeholder: "Enter 6-digit postal index number", ...field, className: "h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, b: true, name: "gstNumber", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { children: [
            /* @__PURE__ */ jsx(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: "GST / Tax Number (Optional)" }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(FileText, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Input, { placeholder: "Enter 15-digit GSTIN format", ...field, className: "h-12 pl-11 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) }),
          /* @__PURE__ */ jsx(FormField, { control: form.control, name: "fullAddress", render: ({
            field
          }) => /* @__PURE__ */ jsxs(FormItem, { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxs(FormLabel, { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: [
              "Full Address ",
              /* @__PURE__ */ jsx("span", { className: "text-[#13b58c] font-bold", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(AlignLeft, { className: "absolute left-4 top-4 w-4 h-4 text-slate-400" }),
              /* @__PURE__ */ jsx(Textarea, { placeholder: "Enter full billing or shop address details", ...field, className: "min-h-[100px] pl-11 pt-3.5 rounded-xl border-slate-200 focus-visible:ring-[#13b58c]/20 focus-visible:border-[#13b58c] transition-all resize-y" })
            ] }) }),
            /* @__PURE__ */ jsx(FormMessage, {})
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex flex-col items-center space-y-4", children: [
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isLoading, className: "w-full md:max-w-md h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-[#13b58c] to-[#0f9c78] hover:shadow-xl hover:shadow-[#13b58c]/25 text-white transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer", children: isLoading ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }),
            "Submitting Registration..."
          ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            "Register & Request LK Printers ID",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 group-hover:translate-x-1 transition-transform" })
          ] }) }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-slate-500", children: [
            "Already have a LK Printers ID?",
            " ",
            /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-[#13b58c] hover:underline underline-offset-4 font-bold", children: "Log in instead" })
          ] })
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxs("footer", { className: "text-center text-xs text-slate-400 py-8 border-t border-slate-100 mt-12 bg-white", children: [
      "© ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " LK Printers of India. All rights reserved."
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
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
      ` })
  ] });
}
export {
  RegisterPage as component
};
