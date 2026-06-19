import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RecentOrders } from "@/components/recent-orders";
import { initDemoOrders, getOrders } from "@/lib/orders";
import { useEffect, useState } from "react";
import { Package, LayoutDashboard, Settings, User, LogOut, ChevronRight, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, UserProfile, UserSettings } from "@/lib/api";

export const Route = createFileRoute("/account/orders")({
  component: AccountOrdersPage,
});

function AccountOrdersPage() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [orderFilter, setOrderFilter] = useState("All Orders");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    name: "Loading...",
    email: "",
    phone: "",
    company: ""
  });

  // Settings State
  const [settings, setSettings] = useState<UserSettings>({
    emailNotify: true,
    twoFactor: false,
    darkMode: false,
    language: "English",
    currency: "INR (₹)"
  });

  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [p, s] = await Promise.all([api.getProfile(), api.getSettings()]);
        setProfile(p);
        setSettings(s);
        initDemoOrders();
      } catch (error) {
        toast.error("Failed to load account data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile(profile);
      toast.success("Profile saved to cloud!", { description: "Changes are now permanent." });
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      await api.updateSettings(newSettings);
    } catch (error) {
      toast.error("Failed to sync settings");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lk-auth-token");
    localStorage.removeItem("lk-printer-profile");
    toast.info("Logging out...", { description: "Redirecting to home page." });
    setTimeout(() => window.location.href = "/", 1500);
  };

  return (
    <div className="min-h-dvh bg-[#f8f9fa] flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-[1200px]">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span>Account</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600">Order History</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 space-y-2">
            <div className="bg-white border rounded-3xl p-6 shadow-sm mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-xl">
                  DK
                </div>
                <div>
                  <div className="font-bold">Dheeraj Kumar</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Premium Member</div>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("Dashboard")}
                className={`w-full justify-start rounded-xl h-12 transition-all group ${activeTab === "Dashboard" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white hover:shadow-sm"}`}
              >
                <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("Orders")}
                className={`w-full justify-start rounded-xl h-12 transition-all group ${activeTab === "Orders" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white hover:shadow-sm"}`}
              >
                <Package className="w-5 h-5 mr-3" /> Order History
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("Profile")}
                className={`w-full justify-start rounded-xl h-12 transition-all group ${activeTab === "Profile" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white hover:shadow-sm"}`}
              >
                <User className="w-5 h-5 mr-3" /> My Profile
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("Settings")}
                className={`w-full justify-start rounded-xl h-12 transition-all group ${activeTab === "Settings" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-white hover:shadow-sm"}`}
              >
                <Settings className="w-5 h-5 mr-3" /> Settings
              </Button>
              <div className="pt-4 mt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start rounded-xl h-12 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all group"
                >
                  <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" /> Logout
                </Button>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-400 font-bold animate-pulse">Connecting to Secure Server...</p>
              </div>
            ) : (
              <>
                {activeTab === "Orders" && (
                  <>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Order History</h1>
                        <p className="text-gray-500 mt-1">Manage and track your recent orders with ease.</p>
                      </div>

                      <div className="flex bg-white border rounded-2xl p-1 shadow-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`rounded-xl h-9 px-4 text-[11px] font-bold uppercase tracking-wider transition-all ${orderFilter === "All Orders" ? "bg-gray-100 text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
                          onClick={() => setOrderFilter("All Orders")}
                        >
                          All Orders
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`rounded-xl h-9 px-4 text-[11px] font-bold uppercase tracking-wider transition-all ${orderFilter === "Processing" ? "bg-gray-100 text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
                          onClick={() => setOrderFilter("Processing")}
                        >
                          Processing
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`rounded-xl h-9 px-4 text-[11px] font-bold uppercase tracking-wider transition-all ${orderFilter === "Completed" ? "bg-gray-100 text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
                          onClick={() => setOrderFilter("Completed")}
                        >
                          Completed
                        </Button>
                      </div>
                    </div>
                    <RecentOrders filterStatus={orderFilter} />
                  </>
                )}

                {activeTab === "Dashboard" && (
                  <div className="space-y-6">
                    <div className="bg-white border rounded-[2rem] p-10 text-center space-y-4 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                      <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-all shadow-lg shadow-blue-100">
                        <LayoutDashboard className="w-10 h-10" />
                      </div>
                      <h2 className="text-3xl font-serif font-bold">Welcome back, {profile.name}!</h2>
                      <p className="text-gray-500 max-w-md mx-auto">Track your orders, manage your profile and keep your account secure in one place.</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                        <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border text-left hover:shadow-md transition-all">
                          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Orders</div>
                          <div className="text-3xl font-bold text-gray-900">128</div>
                          <div className="text-[10px] text-green-600 font-bold mt-2">+12 this month</div>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border text-left hover:shadow-md transition-all">
                          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Payment</div>
                          <div className="text-3xl font-bold text-red-600">₹0</div>
                          <div className="text-[10px] text-gray-400 font-bold mt-2">No overdue invoices</div>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border text-left hover:shadow-md transition-all">
                          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">In Process</div>
                          <div className="text-3xl font-bold text-blue-600">3</div>
                          <div className="text-[10px] text-blue-400 font-bold mt-2">ETA: 2-3 Days</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-[2rem] p-8 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-600" /> Recent Activity
                        </h3>
                        <div className="space-y-4">
                          {getOrders().slice(0, 3).map(order => (
                            <div
                              key={order.id}
                              className="flex gap-4 items-center p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                              onClick={() => setActiveTab("Orders")}
                            >
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-bold">Order #{order.orderNumber} updated</div>
                                <div className="text-[10px] text-gray-400">{order.date}</div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white border rounded-[2rem] p-8 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-blue-600" /> Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="h-20 rounded-2xl flex flex-col gap-2 font-bold text-xs hover:bg-blue-50 hover:border-blue-200" onClick={() => setActiveTab("Orders")}>
                            <Package className="w-5 h-5" /> My Orders
                          </Button>
                          <Button variant="outline" className="h-20 rounded-2xl flex flex-col gap-2 font-bold text-xs hover:bg-blue-50 hover:border-blue-200" onClick={() => setActiveTab("Profile")}>
                            <User className="w-5 h-5" /> Edit Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Profile" && (
                  <div className="bg-white border rounded-[2rem] p-10 space-y-8 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
                      <div className="flex items-center gap-6">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-3xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl shadow-inner">
                            {profile.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border rounded-full shadow-lg flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-600 hover:text-white transition-all">
                            <Settings className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-3xl font-serif font-bold">Account Profile</h2>
                          <p className="text-gray-500 text-sm">Personalize your B2B printing account dashboard.</p>
                        </div>
                      </div>
                      <div className="flex bg-gray-50 p-1 rounded-2xl border">
                        <div className="px-4 py-2 text-xs font-bold text-gray-400">Account Status:</div>
                        <div className="px-4 py-2 text-xs font-bold text-green-600 bg-white rounded-xl shadow-sm border border-green-100">Active</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1">Full Name</label>
                        <input
                          type="text"
                          className="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1">Email Address</label>
                        <input
                          type="email"
                          className="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1">Phone Number</label>
                        <input
                          type="text"
                          className="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1">Organization</label>
                        <input
                          type="text"
                          className="w-full p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
                          value={profile.company}
                          onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t flex flex-col md:flex-row gap-4 items-center justify-between">
                      <Button
                        className="w-full md:w-auto rounded-2xl px-12 h-14 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 font-bold transition-all active:scale-95 flex items-center gap-2"
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {isSaving ? "Saving..." : "Update Account Details"}
                      </Button>
                      <Button variant="ghost" className="text-gray-400 text-sm hover:text-red-500 font-bold" onClick={() => toast.warning("Requesting data deletion...")}>
                        Delete Account Permanently
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "Settings" && (
                  <div className="space-y-8">
                    <div className="bg-white border rounded-[2rem] p-10 space-y-8 shadow-sm">
                      <div>
                        <h2 className="text-2xl font-serif font-bold">Preferences & Security</h2>
                        <p className="text-gray-500 text-sm">Fine-tune your B2B dashboard experience and account security.</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 pt-4">
                        <div
                          className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition-all group"
                          onClick={() => handleUpdateSettings({ ...settings, emailNotify: !settings.emailNotify })}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${settings.emailNotify ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                              <Package className="w-6 h-6" />
                            </div>
                            <div className="font-bold">Email Alerts</div>
                          </div>
                          <div className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${settings.emailNotify ? "bg-blue-600" : "bg-gray-200"}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-all ${settings.emailNotify ? "translate-x-6" : "translate-x-0"}`}></div>
                          </div>
                        </div>

                        <div
                          className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition-all group"
                          onClick={() => handleUpdateSettings({ ...settings, twoFactor: !settings.twoFactor })}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${settings.twoFactor ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                              <User className="w-6 h-6" />
                            </div>
                            <div className="font-bold">2FA Security</div>
                          </div>
                          <div className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${settings.twoFactor ? "bg-emerald-600" : "bg-gray-200"}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-all ${settings.twoFactor ? "translate-x-6" : "translate-x-0"}`}></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1">Display Language</label>
                          <select
                            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold outline-none cursor-pointer"
                            value={settings.language}
                            onChange={(e) => {
                              handleUpdateSettings({ ...settings, language: e.target.value });
                              toast.success(`Language changed to ${e.target.value}`);
                            }}
                          >
                            <option>English</option>
                            <option>Hindi (हिन्दी)</option>
                            <option>Spanish</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest px-1">Currency Format</label>
                          <select
                            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold outline-none cursor-pointer"
                            value={settings.currency}
                            onChange={(e) => {
                              handleUpdateSettings({ ...settings, currency: e.target.value });
                              toast.success(`Currency changed to ${e.target.value}`);
                            }}
                          >
                            <option>INR (₹)</option>
                            <option>USD ($)</option>
                            <option>EUR (€)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border rounded-[2rem] p-10 space-y-6 shadow-sm">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-red-500" /> Password Management
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current Password</label>
                          <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">New Password</label>
                          <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Confirm New</label>
                          <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:bg-white transition-all" />
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        className="rounded-xl h-12 px-6 font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2"
                        onClick={async () => {
                          setIsSaving(true);
                          await new Promise(r => setTimeout(r, 50));
                          setIsSaving(false);
                          toast.success("Password updated!");
                        }}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSaving ? "Verifying..." : "Update Password"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
