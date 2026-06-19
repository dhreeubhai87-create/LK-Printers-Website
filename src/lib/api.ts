import { apiRequest } from "@/lib/api-client";

/**
 * MOCK BACKEND API LAYER
 * ----------------------
 * This simulates a real backend server using localStorage for persistence.
 * Includes artificial delays to mimic network latency.
 */

const STORAGE_KEYS = {
  USER_PROFILE: "lk-printer-profile",
  USER_SETTINGS: "lk-printer-settings",
};

// Resolved instantly to make the website load and response extremely fast
const sleep = (ms: number) => Promise.resolve();

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  id?: string;
  whatsappNo?: string;
  address?: string;
  gstNumber?: string;
  state?: string;
  district?: string;
  city?: string;
  pinCode?: string;
}

export interface UserSettings {
  emailNotify: boolean;
  twoFactor: boolean;
  darkMode: boolean;
  language: string;
  currency: string;
}

export const api = {
  /**
   * Fetch user profile from the "backend"
   */
  getProfile: async (): Promise<UserProfile> => {
    const token = localStorage.getItem("lk-auth-token");
    if (!token) {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (saved) return JSON.parse(saved);

      // Default initial profile
      return {
        name: "Dheeraj Kumar",
        email: "dheeraj@example.com",
        phone: "+91 9876543210",
        company: "Dheeraj Designs Ltd."
      };
    }

    const data = await apiRequest<{ response: any }>("/api/user/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const dbUser = data.response;
    const mappedProfile: UserProfile = {
      id: dbUser._id,
      name: dbUser.username,
      email: dbUser.email,
      phone: dbUser.phoneNumber,
      company: dbUser.businessName,
      whatsappNo: dbUser.phoneNumber,
      address: dbUser.fullAddress,
      gstNumber: dbUser.gstTax || "",
      state: dbUser.state,
      district: dbUser.district,
      city: dbUser.city,
      pinCode: dbUser.pinCode
    };

    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mappedProfile));
    return mappedProfile;
  },

  /**
   * Save user profile to the "backend"
   */
  updateProfile: async (profile: UserProfile): Promise<boolean> => {
    const token = localStorage.getItem("lk-auth-token");
    if (!token) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      return true;
    }

    const data = await apiRequest<{ response: any }>("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        businessName: profile.company,
        username: profile.name,
        email: profile.email,
        phoneNumber: profile.whatsappNo || profile.phone,
        Country: "India",
        state: profile.state || "",
        district: profile.district || "",
        city: profile.city || "",
        pinCode: profile.pinCode || "",
        gstTax: profile.gstNumber || "",
        fullAddress: profile.address || ""
      })
    });
    const dbUser = data.response;
    const mappedProfile: UserProfile = {
      id: dbUser._id,
      name: dbUser.username,
      email: dbUser.email,
      phone: dbUser.phoneNumber,
      company: dbUser.businessName,
      whatsappNo: dbUser.phoneNumber,
      address: dbUser.fullAddress,
      gstNumber: dbUser.gstTax || "",
      state: dbUser.state,
      district: dbUser.district,
      city: dbUser.city,
      pinCode: dbUser.pinCode
    };

    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mappedProfile));
    return true;
  },

  /**
   * Fetch user settings from the "backend"
   */
  getSettings: async (): Promise<UserSettings> => {
    await sleep(500);
    const saved = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (saved) return JSON.parse(saved);

    return {
      emailNotify: true,
      twoFactor: false,
      darkMode: false,
      language: "English",
      currency: "INR (₹)"
    };
  },

  /**
   * Update user settings on the "backend"
   */
  updateSettings: async (settings: UserSettings): Promise<boolean> => {
    await sleep(600);
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    return true;
  }
};
