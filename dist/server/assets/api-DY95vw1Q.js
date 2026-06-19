import { a as apiRequest } from "./api-client-Bu49ln3o.js";
const STORAGE_KEYS = {
  USER_PROFILE: "lk-printer-profile",
  USER_SETTINGS: "lk-printer-settings"
};
const sleep = (ms) => Promise.resolve();
const api = {
  /**
   * Fetch user profile from the "backend"
   */
  getProfile: async () => {
    const token = localStorage.getItem("lk-auth-token");
    if (!token) {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (saved) return JSON.parse(saved);
      return {
        name: "Dheeraj Kumar",
        email: "dheeraj@example.com",
        phone: "+91 9876543210",
        company: "Dheeraj Designs Ltd."
      };
    }
    const data = await apiRequest("/api/user/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const dbUser = data.response;
    const mappedProfile = {
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
  updateProfile: async (profile) => {
    const token = localStorage.getItem("lk-auth-token");
    if (!token) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      return true;
    }
    const data = await apiRequest("/api/user/profile", {
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
    const mappedProfile = {
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
  getSettings: async () => {
    await sleep();
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
  updateSettings: async (settings) => {
    await sleep();
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    return true;
  }
};
export {
  api
};
