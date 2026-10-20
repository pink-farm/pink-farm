"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Package,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Save,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  Clock,
  LogOut,
  ExternalLink,
  Check,
  RotateCcw,
  Truck,
  AlertCircle,
  Home,
  Briefcase,
  HelpCircle,
  X,
  XCircle,
  Star,
  CalendarDays,
  SlidersHorizontal
} from "lucide-react";
import { useCustomerStore, CustomerAddress } from "@/store/customerStore";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";
import { resolveTrackingUrl } from "@/lib/tracking";

type AccountTab = "profile" | "addresses" | "orders" | "security";
type CustomerProfileResponse = {
  profile: { name: string; email: string; phone: string; dob?: string; gender?: string; dietaryPreferences?: string[] };
  addresses: CustomerAddress[];
  preferences: { whatsappAlerts: boolean; smsUpdates: boolean; emailNewsletter: boolean; preferredDeliverySlot: "morning" | "evening" | "any"; deliveryNotes: string };
};

async function fetchCustomerProfile(): Promise<CustomerProfileResponse | null> {
  const response = await fetch("/api/customer/profile");
  if (!response.ok) return null;
  return await response.json() as CustomerProfileResponse;
}

type AccountOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  trackingNumber?: string | null;
  carrierName?: string | null;
  trackingUrl?: string | null;
  city: string;
  state: string;
  items: {
    id: string;
    productId: string | null;
    variantName: string | null;
    productName: string | null;
    productSlug: string | null;
    productImageUrl: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: { id: string; name: string; slug: string; imageUrl: string } | null;
  }[];
};

type OrderDateMode = "day" | "week" | "month" | "range";

function toLocalDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getOrderDateRange(mode: OrderDateMode, dateValue: string, fromValue: string, throughValue: string) {
  if (mode === "range") {
    const start = new Date(`${fromValue}T00:00:00`);
    const end = new Date(`${throughValue}T23:59:59.999`);
    if (!fromValue || !throughValue || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null;
    return { start, end };
  }
  if (!dateValue) return null;
  const selected = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return null;
  const start = new Date(selected);
  const end = new Date(selected);
  if (mode === "week") {
    const daysFromMonday = (selected.getDay() + 6) % 7;
    start.setDate(selected.getDate() - daysFromMonday);
    end.setDate(start.getDate() + 6);
  } else if (mode === "month") {
    start.setDate(1);
    end.setMonth(selected.getMonth() + 1, 0);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function CustomerAccountClient() {
  const router = useRouter();
  const customer = useCustomerStore();
  const hydrateCustomer = useCustomerStore((state) => state.hydrateCustomer);
  const logoutCustomer = useCustomerStore((state) => state.logoutCustomer);
  const { addItem } = useCartStore();

  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const mounted = useHydrated();

  const refreshCustomer = useCallback(async () => {
    const data = await fetchCustomerProfile();
    if (!data) return false;
    hydrateCustomer({ profile: data.profile, addresses: data.addresses, preferences: data.preferences });
    return true;
  }, [hydrateCustomer]);

  useEffect(() => {
    let active = true;
    fetchCustomerProfile().then((data) => {
      if (!active) return;
      if (!data) { logoutCustomer(); return; }
      hydrateCustomer({ profile: data.profile, addresses: data.addresses, preferences: data.preferences });
    }).catch(() => { if (active) logoutCustomer(); });
    return () => { active = false; };
  }, [hydrateCustomer, logoutCustomer]);

  // Profile Form States
  const [profileName, setProfileName] = useState(customer.profile.name);
  const [profileEmail, setProfileEmail] = useState(customer.profile.email);
  const [profilePhone, setProfilePhone] = useState(customer.profile.phone);
  const [profileDob, setProfileDob] = useState(customer.profile.dob || "");
  const [profileGender, setProfileGender] = useState(customer.profile.gender || "");
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(customer.profile.dietaryPreferences || []);

  // Address Form / Modal States
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddrLabel, setNewAddrLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [newAddrFullName, setNewAddrFullName] = useState(customer.profile.name);
  const [newAddrPhone, setNewAddrPhone] = useState("");
  const [newAddrLine1, setNewAddrLine1] = useState("");
  const [newAddrLine2, setNewAddrLine2] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("");
  const [newAddrState, setNewAddrState] = useState("");
  const [newAddrPin, setNewAddrPin] = useState("");
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false);
  const [pinLookupStatus, setPinLookupStatus] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderFilterOpen, setOrderFilterOpen] = useState(false);
  const [orderDateMode, setOrderDateMode] = useState<OrderDateMode>("day");
  const [orderDateValue, setOrderDateValue] = useState(() => toLocalDateInput(new Date()));
  const [orderFromDate, setOrderFromDate] = useState(() => toLocalDateInput(new Date()));
  const [orderThroughDate, setOrderThroughDate] = useState(() => toLocalDateInput(new Date()));
  const [appliedOrderDateRange, setAppliedOrderDateRange] = useState<ReturnType<typeof getOrderDateRange>>(null);
  const [appliedOrderDateLabel, setAppliedOrderDateLabel] = useState("");
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<AccountOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);

  const visibleCustomerOrders = useMemo(() => {
    if (!appliedOrderDateRange) return orders;
    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= appliedOrderDateRange.start && createdAt <= appliedOrderDateRange.end;
    });
  }, [orders, appliedOrderDateRange]);

  const applyOrderDateFilter = () => {
    const dateRange = getOrderDateRange(orderDateMode, orderDateValue, orderFromDate, orderThroughDate);
    if (!dateRange) return;
    setAppliedOrderDateRange(dateRange);
    const selectedDate = new Date(`${orderDateValue}T00:00:00`);
    const formatDate = (value: Date) => value.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    setAppliedOrderDateLabel(orderDateMode === "range"
      ? `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`
      : orderDateMode === "day"
        ? formatDate(selectedDate)
        : `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`);
    setOrderFilterOpen(false);
  };

  const clearOrderDateFilter = () => {
    setAppliedOrderDateRange(null);
    setAppliedOrderDateLabel("");
    setOrderFilterOpen(false);
  };

  // Synchronize initial state from customer store
  // This is an intentional form-state sync when the authenticated profile changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setProfileName(customer.profile.name);
    setProfileEmail(customer.profile.email);
    setProfilePhone(customer.profile.phone);
    setProfileDob(customer.profile.dob || "");
    setProfileGender(customer.profile.gender || "");
    setDietaryPrefs(customer.profile.dietaryPreferences || []);

  }, [customer.profile, customer.preferences]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch Orders
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch("/api/customer/orders");
        if (res.ok) {
          const data = await res.json();
          if (data && data.orders) {
            setOrders(data.orders);
          }
        }
      } catch {
        console.warn("Could not load customer orders.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchCustomerOrders();
  }, []);

  // Pincode auto-lookup for address
  useEffect(() => {
    if (!newAddrPin || newAddrPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(newAddrPin)) {
      return;
    }

    let isCancelled = false;
    const lookup = async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${newAddrPin}`);
        const data = await res.json();
        if (!isCancelled && data && data[0] && data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          if (po.District) setNewAddrCity(po.District);
          if (po.State) setNewAddrState(po.State);
          setPinLookupStatus(`Verified: ${po.District}, ${po.State}`);
        }
      } catch {
        // Ignore lookup error
      }
    };

    lookup();
    return () => {
      isCancelled = true;
    };
  }, [newAddrPin]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/customer/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profileName, phone: profilePhone, dob: profileDob, gender: profileGender, dietaryPreferences: dietaryPrefs }) });
    if (!res.ok) { setSaveSuccessMsg("Could not save your profile. Please try again."); return; }
    customer.updateProfile({
      name: profileName,
      phone: profilePhone,
      dob: profileDob,
      gender: profileGender,
      dietaryPreferences: dietaryPrefs,
    });
    setSaveSuccessMsg("Your customer profile has been saved successfully!");
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };



  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    setIsCancelling(true);
    setCancelModalError(null);

    try {
      const res = await fetch(`/api/customer/orders/${cancellingOrder.id}/cancel`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancellingOrder.id
              ? { ...o, fulfillmentStatus: "CANCELLED" }
              : o
          )
        );
        setSaveSuccessMsg(`Order #${cancellingOrder.orderNumber} has been successfully cancelled.`);
        setCancellingOrder(null);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setCancelModalError(data.error || "Unable to cancel order");
      }
    } catch {
      setCancelModalError("Network error while trying to cancel order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLine1.trim() || !newAddrPin.trim()) return;

    const addressData = {
        label: newAddrLabel,
        fullName: newAddrFullName,
        phone: newAddrPhone,
        addressLine1: newAddrLine1,
        addressLine2: newAddrLine2,
        city: newAddrCity,
        state: newAddrState,
        pinCode: newAddrPin,
        isDefault: newAddrIsDefault,
      };
    const response = await fetch(editingAddressId ? `/api/customer/addresses/${editingAddressId}` : "/api/customer/addresses", {
      method: editingAddressId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressData),
    });
    if (!response.ok) { setSaveSuccessMsg("Could not save this address. Check the details and try again."); return; }
    await refreshCustomer();
    if (editingAddressId) {
      setSaveSuccessMsg("Address updated successfully!");
    } else {
      setSaveSuccessMsg("New delivery address added successfully!");
    }

    // Reset address form
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setNewAddrLine1("");
    setNewAddrLine2("");
    setNewAddrPin("");
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const startEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setNewAddrLabel(addr.label);
    setNewAddrFullName(addr.fullName);
    setNewAddrPhone(addr.phone);
    setNewAddrLine1(addr.addressLine1);
    setNewAddrLine2(addr.addressLine2 || "");
    setNewAddrCity(addr.city);
    setNewAddrState(addr.state);
    setNewAddrPin(addr.pinCode);
    setNewAddrIsDefault(addr.isDefault);
    setIsAddingAddress(true);
  };

  const handleReorder = (order: AccountOrder) => {
    if (!order.items || order.items.length === 0) return;
    let addedCount = 0;
    order.items.forEach((item) => {
      if (item.product) {
        addItem(
          {
            id: item.productId || item.product.id || "item-" + Math.random(),
            name: item.product.name,
            slug: item.product.slug || item.product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            price: item.unitPrice,
            imageUrl: item.product.imageUrl || "/images/placeholder.jpg",
            variantName: item.variantName || undefined,
            maxQuantity: 10,
          },
          item.quantity || 1
        );
        addedCount += item.quantity || 1;
      }
    });

    setReorderSuccessMsg(`Added ${addedCount} items from order #${order.orderNumber} to your cart!`);
    setTimeout(() => setReorderSuccessMsg(null), 4000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      customer.logoutCustomer();
      if (typeof window !== "undefined" && window.pinkfarmNavigate) {
        window.pinkfarmNavigate("/login");
      } else {
        router.push("/login");
      }
    }
  };

  // If client is hydrated and customer is not logged in, show access barrier / login prompt
  if (mounted && !customer.isLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#faf7f2] px-4 py-12">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-soft max-w-md w-full border border-brand-green/10 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-pink/50 text-brand-green flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-green mb-2">Customer Account</h2>
          <p className="text-sm text-brand-charcoal/70 mb-6">
            You are currently signed out. Please sign in to manage your profile, saved addresses, delivery preferences, and order history.
          </p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full py-3.5 px-4 rounded-xl bg-brand-green text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-brand-green-light transition-all"
            >
              Sign In to Your Account →
            </Link>
            <Link
              href="/"
              className="inline-block text-xs font-semibold text-brand-charcoal/60 hover:text-brand-green pt-2 transition-colors"
            >
              ← Return to Store Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] py-8 md:py-12 pb-28 sm:pb-16">
      <div className="container mx-auto px-4 max-w-6xl min-w-0">
        
        <nav className="flex items-center gap-2 text-xs md:text-sm text-brand-charcoal/60 mb-4 font-medium">
          <Link href="/" className="hover:text-brand-green transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-brand-green font-bold">My Account & Customer Settings</span>
        </nav>

        {/* Success Notifications */}
        {saveSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in-up">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm">{saveSuccessMsg}</span>
          </div>
        )}

        {reorderSuccessMsg && (
          <div className="mb-6 p-4 bg-brand-pink/60 border border-brand-green/20 text-brand-green rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-brand-green shrink-0" />
              <span className="font-bold text-sm">{reorderSuccessMsg}</span>
            </div>
            <Link
              href="/cart"
              className="px-3.5 py-1.5 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-green-light transition-all shrink-0"
            >
              View Cart →
            </Link>
          </div>
        )}

        {/* Customer Header Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-green/10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-brand-green to-[#234d38] text-white flex items-center justify-center font-serif text-3xl font-bold shadow-md shadow-brand-green/20 border-2 border-white">
                  {customer.profile.name
                    ? customer.profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "SS"}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl md:text-3xl text-brand-green font-bold tracking-tight">
                    {customer.profile.name}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-charcoal/70 mt-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-brand-green/70" />
                    {customer.profile.phone}
                  </span>
                  <span className="hidden sm:inline text-brand-charcoal/30">•</span>
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-brand-green/70" />
                    {customer.profile.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">

              <div className="bg-[#f3f9f5] border border-emerald-200/60 p-3.5 rounded-2xl flex items-center gap-3 min-w-[130px]">
                <div className="p-2.5 bg-emerald-100 rounded-xl text-brand-green">
                  <Package size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-brand-charcoal/60 uppercase tracking-wider">Orders</div>
                  <div className="text-lg font-bold text-brand-green">{orders.length} Placed</div>
                </div>
              </div>

              <div className="bg-[#fcf5f8] border border-brand-pink p-3.5 rounded-2xl flex items-center gap-3 min-w-[130px]">
                <div className="p-2.5 bg-brand-pink rounded-xl text-brand-green">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-brand-charcoal/60 uppercase tracking-wider">Addresses</div>
                  <div className="text-lg font-bold text-brand-green">{customer.addresses.length} Saved</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar Tabs + Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Menu */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-3xl p-3 shadow-sm border border-brand-green/10 space-y-1 sticky top-24">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left ${
                  activeTab === "profile"
                    ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                    : "text-brand-charcoal/80 hover:bg-brand-cream/60 hover:text-brand-green"
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={18} />
                  <span>My Profile</span>
                </div>
                <ChevronRight size={16} className={activeTab === "profile" ? "opacity-100" : "opacity-40"} />
              </button>

              <button
                onClick={() => setActiveTab("addresses")}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left ${
                  activeTab === "addresses"
                    ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                    : "text-brand-charcoal/80 hover:bg-brand-cream/60 hover:text-brand-green"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={18} />
                  <span>Saved Addresses</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "addresses" ? "bg-white/20 text-white" : "bg-brand-green/10 text-brand-green"
                }`}>
                  {customer.addresses.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left ${
                  activeTab === "orders"
                    ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                    : "text-brand-charcoal/80 hover:bg-brand-cream/60 hover:text-brand-green"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package size={18} />
                  <span>My Orders</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "orders" ? "bg-white/20 text-white" : "bg-brand-green/10 text-brand-green"
                }`}>
                  {orders.length}
                </span>
              </button>




              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left ${
                  activeTab === "security"
                    ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                    : "text-brand-charcoal/80 hover:bg-brand-cream/60 hover:text-brand-green"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} />
                  <span>Account & Security</span>
                </div>
                <ChevronRight size={16} className={activeTab === "security" ? "opacity-100" : "opacity-40"} />
              </button>

              <div className="pt-3 border-t border-brand-green/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Customer support shortcut */}
              <div className="p-4 mt-4 bg-brand-pink/30 rounded-2xl border border-brand-pink/60">
                <div className="flex items-center gap-2 text-brand-green font-bold text-xs">
                  <HelpCircle size={15} />
                  <span>Need help with an order?</span>
                </div>
                <p className="text-xs text-brand-charcoal/70 mt-1">
                  Our farm concierge is on WhatsApp: +91 84375 04040
                </p>
                <a
                  href="https://wa.me/918437504040?text=Hi%20Pink%20Farm,%20I%20need%20assistance%20with%20my%20account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline"
                >
                  Chat with Concierge <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="lg:col-span-8 xl:col-span-9">

            {/* TAB 1: PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-green/10 animate-fade-in-up">
                <div className="border-b border-brand-green/10 pb-5 mb-6">
                  <h2 className="font-serif text-2xl font-bold text-brand-green">Personal Profile</h2>
                  <p className="text-sm text-brand-charcoal/70 mt-1">
                    Manage your personal information, contact numbers, and farm food preferences.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full border border-brand-green/15 rounded-xl p-3.5 bg-brand-cream/20 focus:bg-white focus:outline-none focus:border-brand-green text-sm font-medium transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                        Mobile Number (OTP Verified)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full border border-brand-green/15 rounded-xl p-3.5 pr-24 bg-brand-cream/20 focus:bg-white focus:outline-none focus:border-brand-green text-sm font-medium transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        readOnly
                        value={profileEmail}
                        className="w-full border border-brand-green/15 rounded-xl p-3.5 bg-gray-100 text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                        Date of Birth (Birthday Goodness Gift)
                      </label>
                      <input
                        type="date"
                        value={profileDob}
                        onChange={(e) => setProfileDob(e.target.value)}
                        className="w-full border border-brand-green/15 rounded-xl p-3.5 bg-brand-cream/20 focus:bg-white focus:outline-none focus:border-brand-green text-sm font-medium transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                        Gender
                      </label>
                      <select
                        value={profileGender}
                        onChange={(e) => setProfileGender(e.target.value)}
                        className="w-full border border-brand-green/15 rounded-xl p-3.5 bg-brand-cream/20 focus:bg-white focus:outline-none focus:border-brand-green text-sm font-medium transition-colors"
                      >
                        <option value="">Select</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-light transition-all shadow-md shadow-brand-green/20 flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-green/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-green/10 pb-5 mb-6">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-brand-green">Saved Addresses</h2>
                      <p className="text-sm text-brand-charcoal/70 mt-1">
                        Addresses saved here are automatically populated with 1-click at checkout.
                      </p>
                    </div>
                    {!isAddingAddress && (
                      <button
                        onClick={() => {
                          setEditingAddressId(null);
                          setNewAddrFullName(customer.profile.name);
                          setNewAddrPhone(customer.profile.phone.replace(/[^\d]/g, "").slice(-10));
                          setNewAddrLine1("");
                          setNewAddrLine2("");
                          setNewAddrPin("");
                          setNewAddrIsDefault(customer.addresses.length === 0);
                          setIsAddingAddress(true);
                        }}
                        className="px-4 py-2.5 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-light transition-all shadow-sm flex items-center gap-2 text-xs md:text-sm shrink-0 cursor-pointer"
                      >
                        <Plus size={16} />
                        Add New Address
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Address Form Modal/Inline */}
                  {isAddingAddress && (
                    <div className="mb-8 p-6 bg-brand-cream/30 rounded-2xl border-2 border-brand-green/20">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-serif text-lg font-bold text-brand-green">
                          {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingAddress(false);
                            setEditingAddressId(null);
                          }}
                          className="p-1.5 text-brand-charcoal/50 hover:text-brand-charcoal hover:bg-white rounded-full"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveAddress} className="space-y-4">
                        {/* Address Type Tag */}
                        <div className="flex items-center gap-3 mb-2">
                          <label className="text-xs font-bold text-brand-charcoal">Address Type:</label>
                          <div className="flex items-center gap-2">
                            {(["Home", "Work", "Other"] as const).map((label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setNewAddrLabel(label)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  newAddrLabel === label
                                    ? "bg-brand-green text-white"
                                    : "bg-white border border-brand-green/15 text-brand-charcoal/70"
                                }`}
                              >
                                {label === "Home" && "🏠 "}
                                {label === "Work" && "🏢 "}
                                {label === "Other" && "📍 "}
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-brand-charcoal block mb-1">
                              Receiver Full Name
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddrFullName}
                              onChange={(e) => setNewAddrFullName(e.target.value)}
                              className="w-full border border-brand-green/15 rounded-xl p-3 bg-white text-sm focus:outline-none focus:border-brand-green"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-brand-charcoal block mb-1">
                              Receiver Mobile Number
                            </label>
                            <input
                              type="tel"
                              required
                              value={newAddrPhone}
                              onChange={(e) => setNewAddrPhone(e.target.value)}
                              className="w-full border border-brand-green/15 rounded-xl p-3 bg-white text-sm focus:outline-none focus:border-brand-green"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-brand-charcoal block mb-1">
                              House / Flat No., Building Name & Street Address
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. House No. 42, Green Avenue, Phase 2, Dugri"
                              value={newAddrLine1}
                              onChange={(e) => setNewAddrLine1(e.target.value)}
                              className="w-full border border-brand-green/15 rounded-xl p-3 bg-white text-sm focus:outline-none focus:border-brand-green"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-brand-charcoal block mb-1">
                              Landmark / Area (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Near Rose Garden"
                              value={newAddrLine2}
                              onChange={(e) => setNewAddrLine2(e.target.value)}
                              className="w-full border border-brand-green/15 rounded-xl p-3 bg-white text-sm focus:outline-none focus:border-brand-green"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-brand-charcoal block mb-1">
                              6-Digit PIN Code
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              placeholder="e.g. 141003"
                              value={newAddrPin}
                              onChange={(e) => { setNewAddrPin(e.target.value); setPinLookupStatus(null); }}
                              className="w-full border border-brand-green/15 rounded-xl p-3 bg-white text-sm focus:outline-none focus:border-brand-green font-mono"
                            />
                            {pinLookupStatus && (
                              <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                                <Check size={12} /> {pinLookupStatus}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="text-xs font-bold text-brand-charcoal block mb-1">City</label>
                            <input
                              type="text"
                              required
                              value={newAddrCity}
                              onChange={(e) => setNewAddrCity(e.target.value)}
                              className="w-full border border-brand-green/15 rounded-xl p-3 bg-white text-sm focus:outline-none focus:border-brand-green"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-brand-charcoal block mb-1">State</label>
                            <input
                              type="text"
                              required
                              value={newAddrState}
                              onChange={(e) => setNewAddrState(e.target.value)}
                              className="w-full border border-brand-green/15 rounded-xl p-3 bg-white text-sm focus:outline-none focus:border-brand-green"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="makeDefault"
                            checked={newAddrIsDefault}
                            onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                            className="w-4 h-4 rounded text-brand-green focus:ring-brand-green"
                          />
                          <label htmlFor="makeDefault" className="text-xs font-bold text-brand-charcoal cursor-pointer">
                            Make this my default delivery address
                          </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAddress(false);
                              setEditingAddressId(null);
                            }}
                            className="px-4 py-2.5 text-brand-charcoal/70 hover:text-brand-charcoal font-bold text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-light text-xs shadow-sm cursor-pointer"
                          >
                            Save Address
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* List of saved addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`rounded-2xl p-5 border-2 transition-all relative flex flex-col justify-between ${
                          addr.isDefault
                            ? "border-brand-green bg-[#f7faf8]"
                            : "border-brand-green/10 bg-white hover:border-brand-green/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-pink/50 text-brand-green">
                              {addr.label === "Home" && <Home size={13} />}
                              {addr.label === "Work" && <Briefcase size={13} />}
                              {addr.label === "Other" && <MapPin size={13} />}
                              {addr.label}
                            </span>

                            {addr.isDefault ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={11} /> Default Address
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => { const response = await fetch(`/api/customer/addresses/${addr.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) }); if (response.ok) await refreshCustomer(); }}
                                className="text-[11px] font-bold text-brand-green hover:underline cursor-pointer"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          <div className="font-bold text-brand-charcoal text-base">{addr.fullName}</div>
                          <div className="text-xs text-brand-charcoal/60 font-medium mt-0.5">
                            Phone: {addr.phone}
                          </div>

                          <div className="text-sm text-brand-charcoal/80 mt-2.5 leading-relaxed">
                            {addr.addressLine1}
                            {addr.addressLine2 && `, ${addr.addressLine2}`}
                            <br />
                            {addr.city}, {addr.state} — <span className="font-mono font-bold text-brand-green">{addr.pinCode}</span>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-brand-green/10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => startEditAddress(addr)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-brand-green-light cursor-pointer"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          {customer.addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={async () => { const response = await fetch(`/api/customer/addresses/${addr.id}`, { method: "DELETE" }); if (response.ok) await refreshCustomer(); }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ORDERS */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-brand-green/10 animate-fade-in-up min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-green/10 pb-5 mb-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-brand-green">My Orders</h2>
                    <p className="text-sm text-brand-charcoal/70 mt-1">
                      View recent farm deliveries, live status, invoices and 1-click reordering.
                    </p>
                  </div>
                  <Link
                    href="/products"
                    className="px-4 py-2 bg-brand-pink text-brand-green font-bold rounded-xl text-xs hover:bg-brand-pink/70 transition-colors shrink-0"
                  >
                    Explore Farm Goodness →
                  </Link>
                </div>

                {ordersLoading ? (
                  <div className="py-12 text-center text-brand-charcoal/60">
                    <Clock className="w-8 h-8 animate-spin mx-auto text-brand-green mb-2" />
                    <p className="text-sm">Fetching your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-brand-green/30 mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-bold text-brand-green">No Orders Yet</h3>
                    <p className="text-sm text-brand-charcoal/60 max-w-sm mx-auto mt-1 mb-5">
                      You haven&apos;t placed any orders yet. Discover our artisanal butters, raw forest honey, and A2 ghee!
                    </p>
                    <Link
                      href="/products"
                      className="px-6 py-3 bg-brand-green text-white text-sm font-bold rounded-xl hover:bg-brand-green-light transition-all"
                    >
                      Shop Now
                    </Link>
                  </div>
                ) : (
                  <>
                  <div className="flex flex-col gap-3 rounded-2xl border border-brand-green/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <p className="text-sm font-semibold text-brand-charcoal">Order list</p>
                      <p className="mt-0.5 text-xs text-brand-charcoal/60">
                        {appliedOrderDateRange
                          ? `Showing ${visibleCustomerOrders.length} of ${orders.length} orders · ${appliedOrderDateLabel}`
                          : `${orders.length} orders across all dates`}
                      </p>
                    </div>
                    <div className="relative flex items-center gap-2 self-start sm:self-auto">
                      {appliedOrderDateRange && (
                        <button type="button" onClick={clearOrderDateFilter} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brand-charcoal/70 transition hover:bg-brand-cream/60">
                          <X size={15} /> Clear
                        </button>
                      )}
                      <button
                        type="button"
                        aria-expanded={orderFilterOpen}
                        aria-controls="customer-orders-date-filter"
                        onClick={() => setOrderFilterOpen((open) => !open)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${appliedOrderDateRange ? "border-emerald-300 bg-emerald-50 text-brand-green" : "border-brand-green/15 bg-white text-brand-charcoal hover:border-brand-green/30 hover:bg-brand-cream/30"}`}
                      >
                        <SlidersHorizontal size={16} /> Filter
                        {appliedOrderDateRange && <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="Filter active" />}
                      </button>
                      {orderFilterOpen && (
                        <div id="customer-orders-date-filter" className="absolute right-0 top-full z-30 mt-2 w-[min(23rem,calc(100vw-3.5rem))] rounded-2xl border border-brand-green/15 bg-white p-4 shadow-xl sm:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-bold text-brand-charcoal">Filter my orders</h3>
                              <p className="mt-1 text-xs text-brand-charcoal/60">Choose a date or time period.</p>
                            </div>
                            <button type="button" aria-label="Close date filter" onClick={() => setOrderFilterOpen(false)} className="rounded-lg p-1.5 text-brand-charcoal/50 hover:bg-brand-cream/60 hover:text-brand-charcoal"><X size={16} /></button>
                          </div>
                          <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-brand-cream/60 p-1" role="group" aria-label="Date filter period">
                            {(["day", "week", "month", "range"] as const).map((option) => (
                              <button key={option} type="button" aria-pressed={orderDateMode === option} onClick={() => setOrderDateMode(option)} className={`rounded-lg px-1.5 py-2 text-xs font-bold transition ${orderDateMode === option ? "bg-white text-brand-green shadow-sm" : "text-brand-charcoal/60 hover:text-brand-charcoal"}`}>
                                {option === "day" ? "Date" : option === "range" ? "Range" : option[0].toUpperCase() + option.slice(1)}
                              </button>
                            ))}
                          </div>
                          {orderDateMode === "range" ? (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <label className="text-xs font-semibold text-brand-charcoal/80">From
                                <input type="date" value={orderFromDate} max={orderThroughDate || undefined} onChange={(event) => setOrderFromDate(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-brand-green/15 bg-white px-2.5 py-2.5 text-sm font-normal text-brand-charcoal outline-none focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                              </label>
                              <label className="text-xs font-semibold text-brand-charcoal/80">Through
                                <input type="date" value={orderThroughDate} min={orderFromDate || undefined} onChange={(event) => setOrderThroughDate(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-brand-green/15 bg-white px-2.5 py-2.5 text-sm font-normal text-brand-charcoal outline-none focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                              </label>
                            </div>
                          ) : (
                            <label className="mt-4 block text-xs font-semibold text-brand-charcoal/80">
                              {orderDateMode === "day" ? "Select date" : orderDateMode === "week" ? "Select any date in the week" : "Select any date in the month"}
                              <span className="relative mt-1.5 block">
                                <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
                                <input type="date" value={orderDateValue} onChange={(event) => setOrderDateValue(event.target.value)} className="w-full rounded-xl border border-brand-green/15 bg-white py-2.5 pl-10 pr-3 text-sm font-normal text-brand-charcoal outline-none transition focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                              </span>
                            </label>
                          )}
                          <p className="mt-3 text-xs text-brand-charcoal/60">
                            {orderDateMode === "range" ? "Both dates are included." : orderDateMode === "week" ? "The full Monday–Sunday week is included." : orderDateMode === "month" ? "All days in the selected month are included." : "Orders placed on the selected date are shown."}
                          </p>
                          <div className="mt-4 flex justify-end gap-2 border-t border-brand-green/10 pt-4">
                            <button type="button" onClick={clearOrderDateFilter} className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-charcoal/70 hover:bg-brand-cream/60">Clear</button>
                            <button type="button" onClick={applyOrderDateFilter} disabled={orderDateMode === "range" ? !orderFromDate || !orderThroughDate || orderFromDate > orderThroughDate : !orderDateValue} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-green-light disabled:opacity-50"><SlidersHorizontal size={14} /> Apply filter</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {visibleCustomerOrders.length === 0 ? (
                    <div className="rounded-2xl border border-brand-green/10 bg-brand-cream/20 py-10 text-center text-sm text-brand-charcoal/60">
                      <Package className="mx-auto mb-2 h-9 w-9 text-brand-green/30" />
                      No orders found in this date range. Try another date or clear the filter.
                    </div>
                  ) : (
                  <div className="space-y-6">
                    {visibleCustomerOrders.map((order) => {
                      const s = (order.fulfillmentStatus || "PENDING").toUpperCase();
                      const isCancelled = s === "CANCELLED";
                      const isShippedOrDelivered = s === "SHIPPED" || s === "OUT_FOR_DELIVERY" || s === "DELIVERED";
                      const canCancel = s === "PENDING" || s === "PACKED" || s === "PROCESSING";

                      const fulfillment = isCancelled
                        ? { label: "Cancelled", step: 0, badgeClass: "bg-red-100 text-red-800 border-red-200", icon: "❌" }
                        : s === "DELIVERED"
                        ? { label: "Delivered", step: 4, badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "✅" }
                        : s === "SHIPPED" || s === "OUT_FOR_DELIVERY"
                        ? { label: "Shipped", step: 3, badgeClass: "bg-purple-100 text-purple-800 border-purple-200", icon: "🚚" }
                        : s === "PACKED"
                        ? { label: "Packaged", step: 2, badgeClass: "bg-blue-100 text-blue-800 border-blue-200", icon: "📦" }
                        : { label: "Pending", step: 1, badgeClass: "bg-amber-100 text-amber-800 border-amber-200", icon: "⏳" };

                      return (
                        <div
                          key={order.id}
                          className="border border-brand-green/15 rounded-2xl p-4 sm:p-5 hover:border-brand-green/40 transition-colors min-w-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-green/10 min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="font-bold text-brand-green text-sm sm:text-base break-all">#{order.orderNumber}</span>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${fulfillment.badgeClass}`}
                                >
                                  <span>{fulfillment.icon}</span>
                                  <span>{fulfillment.label}</span>
                                </span>
                              </div>
                              <p className="text-xs text-brand-charcoal/60 mt-1">
                                Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>

                            <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0">
                              <div className="font-bold text-brand-green text-base sm:text-lg">
                                ₹{formatPrice(order.totalAmount)}
                              </div>
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>

                          {/* Live Order Timeline Progress */}
                          {isCancelled ? (
                            <div className="py-2.5 px-3.5 my-3 bg-red-50/70 rounded-xl border border-red-200 text-xs text-red-800 flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold flex items-center gap-1.5">
                                <span>❌</span> This order was cancelled and will not be dispatched.
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded shrink-0">
                                Cancelled
                              </span>
                            </div>
                          ) : (
                            <div className="py-3 px-3.5 my-3 bg-brand-cream/35 rounded-xl border border-brand-green/10">
                              <div className="flex items-center justify-between text-[11px] font-bold text-brand-charcoal/70 mb-2">
                                <span className="flex items-center gap-1.5">
                                  <span>Order Progress:</span>
                                  <span className="text-brand-green font-bold">{fulfillment.icon} {fulfillment.label}</span>
                                </span>
                                <span className="text-[11px] font-semibold text-brand-charcoal/50">
                                  {fulfillment.step === 4 ? "Delivery Complete" : `Stage ${fulfillment.step} of 4`}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { name: "Pending", step: 1 },
                                  { name: "Packaged", step: 2 },
                                  { name: "Shipped", step: 3 },
                                  { name: "Delivered", step: 4 },
                                ].map((stage) => {
                                  const isReached = fulfillment.step >= stage.step;
                                  const isCurrent = fulfillment.step === stage.step;
                                  return (
                                    <div key={stage.name} className="flex flex-col items-center">
                                      <div
                                        className={`w-full h-1.5 rounded-full mb-1 transition-all ${
                                          isReached
                                            ? stage.step === 4
                                              ? "bg-emerald-500"
                                              : stage.step === 3
                                              ? "bg-purple-500"
                                              : stage.step === 2
                                              ? "bg-blue-500"
                                              : "bg-amber-500"
                                            : "bg-gray-200"
                                        }`}
                                      />
                                      <span
                                        className={`text-[10px] font-bold ${
                                          isCurrent
                                            ? "text-brand-green"
                                            : isReached
                                            ? "text-brand-charcoal/80"
                                            : "text-brand-charcoal/40"
                                        }`}
                                      >
                                        {stage.name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Courier Tracking Info if Shipped or AWB Present */}
                          {order.trackingNumber && (
                            <div className="my-3 p-3.5 rounded-2xl border border-purple-200/90 bg-gradient-to-r from-purple-50/80 via-pink-50/40 to-purple-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-start sm:items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                                  <Truck size={18} />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                    <span>Courier: {order.carrierName || "Express Courier"}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-200/80 text-purple-900 px-2 py-0.2 rounded-full">
                                      Dispatched
                                    </span>
                                  </div>
                                  <div className="text-xs text-brand-charcoal/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span>AWB Tracking No:</span>
                                    <a
                                      href={resolveTrackingUrl(order.carrierName, order.trackingNumber, order.trackingUrl) || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono font-bold text-purple-800 hover:text-purple-950 underline underline-offset-2 inline-flex items-center gap-1"
                                      title="Click AWB number to track order"
                                    >
                                      <span>{order.trackingNumber}</span>
                                      <ExternalLink size={11} />
                                    </a>
                                  </div>
                                </div>
                              </div>

                              <a
                                href={resolveTrackingUrl(order.carrierName, order.trackingNumber, order.trackingUrl) || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
                                title="Click to open live courier tracking"
                              >
                                <span>Track Order</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}

                          {/* Ordered items list */}
                          <div className="py-4 space-y-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                  {item.product?.imageUrl || item.productImageUrl ? (
                                    <div className="w-12 h-12 rounded-xl overflow-hidden relative bg-brand-cream shrink-0 border border-brand-green/10">
                                      <Image
                                        src={item.product?.imageUrl || item.productImageUrl || "/images/placeholder.jpg"}
                                        alt={item.product?.name || item.productName || "Product"}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-brand-pink/50 flex items-center justify-center text-brand-green font-bold shrink-0">
                                      PF
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-brand-charcoal">
                                      {item.product?.name || item.productName || "Artisanal Product"}
                                    </div>
                                    <div className="text-xs text-brand-charcoal/60">
                                      Qty: {item.quantity} {item.variantName ? `• ${item.variantName}` : ""}
                                    </div>
                                    {item.product?.slug && (
                                      <Link
                                        href={`/products/${item.product.slug}?review=1#reviews`}
                                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded-md transition shadow-2xs"
                                      >
                                        <Star size={11} className="fill-amber-400 text-amber-500" />
                                        <span>Rate &amp; Review Product</span>
                                      </Link>
                                    )}
                                  </div>
                                </div>

                                <div className="font-semibold text-brand-charcoal shrink-0 ml-2">
                                  ₹{formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order actions footer */}
                          <div className="pt-3 border-t border-brand-green/10 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-brand-charcoal/60">
                              Delivered to: <span className="font-medium text-brand-charcoal">{order.city}, {order.state}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Cancel Button / Status Info */}
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelModalError(null);
                                    setCancellingOrder(order);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <XCircle size={13} />
                                  Cancel Order
                                </button>
                              )}

                              {isShippedOrDelivered && !isCancelled && s !== "DELIVERED" && (
                                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/80 px-2.5 py-1 rounded-xl inline-flex items-center gap-1">
                                  <Truck size={12} className="text-amber-600" />
                                  <span>Courier in transit • Cannot be cancelled</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleReorder(order)}
                                className="px-3.5 py-1.5 rounded-xl bg-brand-pink/60 hover:bg-brand-pink text-brand-green font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <RotateCcw size={13} />
                                Reorder in 1-Click
                              </button>

                              <Link
                                href={`/order/${order.orderNumber}`}
                                className="px-3.5 py-1.5 rounded-xl border border-brand-green/20 hover:bg-brand-green/5 text-brand-green font-bold text-xs flex items-center gap-1.5 transition-colors"
                              >
                                View Receipt <ExternalLink size={12} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                  </>
                )}
              </div>
            )}





            {/* TAB 6: SECURITY & SESSIONS */}
            {activeTab === "security" && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-green/10 animate-fade-in-up">
                <div className="border-b border-brand-green/10 pb-5 mb-6">
                  <h2 className="font-serif text-2xl font-bold text-brand-green">Account & Security</h2>
                  <p className="text-sm text-brand-charcoal/70 mt-1">
                    Manage your login method, session devices, and account privacy.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Auth method */}
                  <div className="p-4 rounded-2xl bg-brand-cream/20 border border-brand-green/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-brand-charcoal text-sm">
                        Passwordless Login with Phone OTP
                      </div>
                      <p className="text-xs text-brand-charcoal/60 mt-0.5">
                        Your account is secured via one-time SMS verification sent to {customer.profile.phone}.
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck size={14} /> Active
                    </span>
                  </div>

                  {/* Device sessions */}
                  <div>
                    <h3 className="text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-3">
                      Active Device Sessions
                    </h3>
                    <div className="p-4 rounded-2xl border border-brand-green/15 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-green/10 text-brand-green rounded-xl">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-brand-charcoal text-sm">Current Web Browser</div>
                          <div className="text-xs text-brand-charcoal/60">
                            Logged in from Ludhiana, Punjab • Active Now
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                        This Device
                      </span>
                    </div>
                  </div>

                  {/* Danger zone / Logout */}
                  <div className="pt-6 border-t border-brand-green/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-red-600 text-sm">Sign Out of Pink Farm</div>
                      <div className="text-xs text-brand-charcoal/60">
                        You can sign back in at any time with your verified phone number.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs border border-red-200 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-brand-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-brand-green/10 animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertCircle size={28} />
            </div>

            <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-green text-center mb-2 break-all">
              Cancel Order #{cancellingOrder.orderNumber}?
            </h3>

            <p className="text-sm text-brand-charcoal/70 text-center mb-5 leading-relaxed">
              Are you sure you want to cancel this order?
              <br />
              <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5 inline-block mt-2">
                ⚠️ Notice: Orders can only be cancelled while in packaging. Once dispatched via courier, cancellations cannot be accepted.
              </span>
            </p>

            {cancelModalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {cancelModalError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => {
                  setCancellingOrder(null);
                  setCancelModalError(null);
                }}
                className="py-3 px-4 rounded-xl border border-brand-green/20 hover:bg-brand-green/5 text-brand-charcoal font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancelOrder}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isCancelling ? (
                  <span>Cancelling...</span>
                ) : (
                  <>
                    <XCircle size={14} />
                    <span>Yes, Cancel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
