"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  Bell,
  Truck,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Power,
  Info,
  ImagePlus,
  RotateCcw,
  TicketPercent,
  Trash2,
  Pencil,
} from "lucide-react";
import { useSettingsStore, DEFAULT_SETTINGS } from "@/store/settingsStore";

type Coupon = { id: string; code: string; discountType: "FIXED" | "PERCENTAGE"; discountValue: number; minimumSubtotal: number; maximumDiscount: number | null; startsAt: string; expiresAt: string | null; isActive: boolean; usageLimit: number | null; usedCount: number; perCustomerLimit: number | null; firstOrderOnly: boolean };
type CouponDraft = { code: string; discountType: "FIXED" | "PERCENTAGE"; discountValue: string; minimumSubtotal: string; maximumDiscount: string; startsAt: string; expiresAt: string; usageLimit: string; perCustomerLimit: string; firstOrderOnly: boolean; isActive: boolean };
function toLocalDateTimeInput(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
const emptyCoupon: CouponDraft = { code: "", discountType: "FIXED", discountValue: "", minimumSubtotal: "0", maximumDiscount: "", startsAt: toLocalDateTimeInput(new Date()), expiresAt: "", usageLimit: "", perCustomerLimit: "", firstOrderOnly: false, isActive: true };

async function compressHeroImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("This image could not be opened."));
      image.src = sourceUrl;
    });

    const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not process this image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL("image/jpeg", 0.72);
    if (compressed.length > 900_000) throw new Error("Image is still too large after compression. Choose a smaller image.");
    return compressed;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export default function StoreSettingsPage() {
  const storeSettings = useSettingsStore();

  const [storeName, setStoreName] = useState(DEFAULT_SETTINGS.storeName);
  const [announcementText, setAnnouncementText] = useState(DEFAULT_SETTINGS.announcementText);
  const [heroMainImage, setHeroMainImage] = useState(DEFAULT_SETTINGS.heroMainImage);
  const [heroGheeImage, setHeroGheeImage] = useState(DEFAULT_SETTINGS.heroGheeImage);
  const [heroAlmondsImage, setHeroAlmondsImage] = useState(DEFAULT_SETTINGS.heroAlmondsImage);
  const [supportPhone, setSupportPhone] = useState(DEFAULT_SETTINGS.supportPhone);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SETTINGS.supportEmail);
  const [businessAddress, setBusinessAddress] = useState(DEFAULT_SETTINGS.businessAddress);
  const [deliveryFeeRupees, setDeliveryFeeRupees] = useState("50");
  const [freeThresholdRupees, setFreeThresholdRupees] = useState("500");
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [heroImageError, setHeroImageError] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponDraft, setCouponDraft] = useState<CouponDraft>(emptyCoupon);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  // Sync state from store / remote API on mount
  useEffect(() => {
    if (storeSettings.storeName) {
      setStoreName(storeSettings.storeName);
      setAnnouncementText(storeSettings.announcementText);
      setHeroMainImage(storeSettings.heroMainImage);
      setHeroGheeImage(storeSettings.heroGheeImage);
      setHeroAlmondsImage(storeSettings.heroAlmondsImage);
      setSupportPhone(storeSettings.supportPhone);
      setSupportEmail(storeSettings.supportEmail);
      setBusinessAddress(storeSettings.businessAddress);
      setDeliveryFeeRupees(String(Math.round((storeSettings.deliveryFee ?? 5000) / 100)));
      setFreeThresholdRupees(
        String(Math.round((storeSettings.freeDeliveryThreshold ?? 50000) / 100))
      );
      setIsAcceptingOrders(storeSettings.isAcceptingOrders);
    }

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.storeName) {
          setStoreName(data.storeName);
          if (data.announcementText !== undefined) setAnnouncementText(data.announcementText);
          if (typeof data.heroMainImage === "string") setHeroMainImage(data.heroMainImage);
          if (typeof data.heroGheeImage === "string") setHeroGheeImage(data.heroGheeImage);
          if (typeof data.heroAlmondsImage === "string") setHeroAlmondsImage(data.heroAlmondsImage);
          if (data.supportPhone !== undefined) setSupportPhone(data.supportPhone);
          if (data.supportEmail !== undefined) setSupportEmail(data.supportEmail);
          if (data.businessAddress !== undefined) setBusinessAddress(data.businessAddress);
          if (typeof data.deliveryFee === "number") {
            setDeliveryFeeRupees(String(Math.round(data.deliveryFee / 100)));
          }
          if (typeof data.freeDeliveryThreshold === "number") {
            setFreeThresholdRupees(String(Math.round(data.freeDeliveryThreshold / 100)));
          }
          if (typeof data.isAcceptingOrders === "boolean") {
            setIsAcceptingOrders(data.isAcceptingOrders);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote settings:", err);
      });
  }, []);

  useEffect(() => {
    fetch("/api/admin/coupons").then((res) => res.json()).then((data) => {
      if (Array.isArray(data.coupons)) setCoupons(data.coupons);
    }).catch(() => setCouponMessage("Could not load coupons."));
  }, []);

  const saveCoupon = async () => {
    setCouponBusy(true);
    setCouponMessage("");
    try {
      const response = await fetch(editingCouponId ? `/api/admin/coupons/${editingCouponId}` : "/api/admin/coupons", {
        method: editingCouponId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponDraft),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save coupon.");
      const list = await fetch("/api/admin/coupons").then((res) => res.json());
      setCoupons(list.coupons || []);
      setCouponDraft(emptyCoupon);
      setEditingCouponId(null);
      setCouponMessage("Coupon saved.");
    } catch (error) {
      setCouponMessage(error instanceof Error ? error.message : "Could not save coupon.");
    } finally {
      setCouponBusy(false);
    }
  };

  const editCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setCouponDraft({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountType === "FIXED" ? coupon.discountValue / 100 : coupon.discountValue),
      minimumSubtotal: String(coupon.minimumSubtotal / 100),
      maximumDiscount: coupon.maximumDiscount == null ? "" : String(coupon.maximumDiscount / 100),
      startsAt: toLocalDateTimeInput(new Date(coupon.startsAt)),
      expiresAt: coupon.expiresAt ? toLocalDateTimeInput(new Date(coupon.expiresAt)) : "",
      usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
      perCustomerLimit: coupon.perCustomerLimit == null ? "" : String(coupon.perCustomerLimit),
      firstOrderOnly: coupon.firstOrderOnly,
      isActive: coupon.isActive,
    });
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm("Delete this coupon? It will no longer be accepted at checkout.")) return;
    const response = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setCouponMessage(result.error || "Could not delete coupon."); return; }
    setCoupons((current) => current.filter((coupon) => coupon.id !== id));
  };

  const handleHeroImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: (image: string) => void,
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setHeroImageError("");
    try {
      setImage(await compressHeroImage(file));
    } catch (error) {
      setHeroImageError(error instanceof Error ? error.message : "Could not process this image.");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    setStatusMessage("");

    const deliveryFeePaise = Math.round((parseFloat(deliveryFeeRupees) || 0) * 100);
    const freeThresholdPaise = Math.round((parseFloat(freeThresholdRupees) || 0) * 100);

    const payload = {
      storeName: storeName.trim() || DEFAULT_SETTINGS.storeName,
      announcementText: announcementText.trim(),
      heroMainImage,
      heroGheeImage,
      heroAlmondsImage,
      supportPhone: supportPhone.trim() || DEFAULT_SETTINGS.supportPhone,
      supportEmail: supportEmail.trim() || DEFAULT_SETTINGS.supportEmail,
      businessAddress: businessAddress.trim() || DEFAULT_SETTINGS.businessAddress,
      deliveryFee: deliveryFeePaise,
      freeDeliveryThreshold: freeThresholdPaise,
      isAcceptingOrders,
    };

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Could not save settings.");
      useSettingsStore.getState().setSettings(payload);
      setSaveSuccess(true);
      setStatusMessage("Settings saved successfully!");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const heroImageFields = [
    { key: "main", label: "Center bubble · Makhana", image: heroMainImage, setImage: setHeroMainImage, defaultImage: DEFAULT_SETTINGS.heroMainImage },
    { key: "ghee", label: "Top right bubble · Ghee", image: heroGheeImage, setImage: setHeroGheeImage, defaultImage: DEFAULT_SETTINGS.heroGheeImage },
    { key: "almonds", label: "Bottom left bubble · Almonds", image: heroAlmondsImage, setImage: setHeroAlmondsImage, defaultImage: DEFAULT_SETTINGS.heroAlmondsImage },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Compact Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:px-5 sm:py-3 rounded-xl border border-gray-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
            <Store size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-serif font-bold text-gray-900 leading-none">
                Store Settings
              </h1>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isAcceptingOrders ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {isAcceptingOrders ? "● Store Online" : "● Orders Paused"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
              Configure brand identity, announcements, delivery rules & contacts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
          >
            <ExternalLink size={13} />
            <span>Storefront</span>
          </Link>
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 size={13} className="text-emerald-300" />
            ) : (
              <Save size={13} />
            )}
            <span>{isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Floating Save Alert */}
      {saveSuccess && (
        <div className="p-2.5 px-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{statusMessage || "Settings applied live across your store!"}</span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
            Live
          </span>
        </div>
      )}
      {saveError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{saveError}</div>}

      {/* 2-Column Responsive Layout that fits on screen */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Store Identity & Shipping Rules (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Card 1: Brand & Top Announcement Bar */}
          <div id="settings-identity" className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-3.5 scroll-mt-20">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <Bell size={16} className="text-brand-green" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Store Identity & Announcement Bar
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Pink Farm"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-green text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">Top Announcement Text</label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Welcome to Pink Farm — Goodness in Every Bite."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-green text-sm"
                />
              </div>
            </div>

            {/* Inline Mini Live Preview */}
            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200/60 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <Sparkles size={11} className="text-brand-pink-accent" />
                Live Top Bar Preview
              </div>
              <div className="bg-gradient-to-r from-brand-green to-brand-green-light text-brand-ivory text-center py-1.5 px-3 rounded-md text-xs font-medium truncate">
                ✨ {announcementText || "Welcome to Pink Farm — Goodness in Every Bite."}
              </div>
            </div>
          </div>

          {/* Card 2: Delivery Fees & Free Shipping Rules */}
          <div id="settings-delivery" className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-3.5 scroll-mt-20">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <Truck size={16} className="text-orange-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Delivery Fees & Shipping Threshold
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">Standard Delivery Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryFeeRupees}
                    onChange={(e) => setDeliveryFeeRupees(e.target.value)}
                    placeholder="50"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-green text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">Free Delivery Above (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={freeThresholdRupees}
                    onChange={(e) => setFreeThresholdRupees(e.target.value)}
                    placeholder="500"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-green text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-orange-50/70 border border-orange-200/70 rounded-lg p-2.5 text-xs text-orange-900 flex items-center justify-between">
              <span>
                📦 <strong>Active Rule:</strong> ₹{deliveryFeeRupees || 0} delivery fee. Orders of ₹{freeThresholdRupees || 0}+ get <strong>FREE shipping</strong>.
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Ordering Status & Customer Contacts (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card 3: Store Ordering Status Toggle */}
          <div id="settings-status" className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-3 scroll-mt-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power size={16} className={isAcceptingOrders ? "text-emerald-600" : "text-amber-600"} />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Store Ordering Status
                </h2>
              </div>

              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAcceptingOrders}
                  onChange={(e) => setIsAcceptingOrders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
              </label>
            </div>

            <p className="text-xs text-gray-500">
              {isAcceptingOrders ? (
                <span className="text-emerald-700 font-medium">
                  ✓ Store is actively taking orders. Cart & checkout are fully accessible.
                </span>
              ) : (
                <span className="text-amber-700 font-medium">
                  ⚠️ Orders are paused. Cart & checkout show polite pause notices.
                </span>
              )}
            </p>
          </div>

          {/* Card 4: Customer Support & Contacts */}
          <div id="settings-support" className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-3.5 scroll-mt-20">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <Phone size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Support & Contacts
              </h2>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <Phone size={11} className="text-gray-400" />
                  Support Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+91 8437504040"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-green text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <Mail size={11} className="text-gray-400" />
                  Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="wecare@pinkfarm.in"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-green text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <MapPin size={11} className="text-gray-400" />
                  Business Address
                </label>
                <textarea
                  rows={2}
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Dugri, Ludhiana, Punjab - 141003"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-green text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Homepage Hero Bubble Images */}
          <div id="settings-hero-images" className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-3.5 scroll-mt-20">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <ImagePlus size={16} className="text-brand-green" />
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Homepage Bubble Images</h2>
                <p className="mt-1 text-[11px] text-gray-500">Change the three floating product images on the homepage.</p>
              </div>
            </div>

            <div className="space-y-3">
              {heroImageFields.map((field) => (
                <div key={field.key} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-brand-pink-accent/40 bg-gray-50">
                    <img src={field.image} alt={`${field.label} preview`} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate text-xs font-semibold text-gray-700">{field.label}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-brand-green/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand-green hover:bg-brand-green/15">
                        <ImagePlus size={13} /> Upload image
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => void handleHeroImageUpload(event, field.setImage)} />
                      </label>
                      {field.image !== field.defaultImage && (
                        <button type="button" onClick={() => field.setImage(field.defaultImage)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100">
                          <RotateCcw size={12} /> Restore default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {heroImageError && <p role="alert" className="text-xs font-medium text-rose-700">{heroImageError}</p>}
            <p className="text-[11px] leading-relaxed text-gray-500">Images are compressed before saving. Use square product photos for the best fit.</p>
          </div>

          <section id="settings-coupons" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-4 scroll-mt-20">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <TicketPercent size={16} className="text-brand-green" />
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Coupon Management</h2>
                <p className="mt-1 text-[11px] text-gray-500">Set discount, eligible order value, dates, and redemption limits.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-xs font-bold text-gray-600">Coupon code
                <input value={couponDraft.code} onChange={(e) => setCouponDraft({ ...couponDraft, code: e.target.value.toUpperCase() })} placeholder="e.g. WELCOME10" maxLength={32} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="space-y-1 text-xs font-bold text-gray-600">Discount type
                <select value={couponDraft.discountType} onChange={(e) => setCouponDraft({ ...couponDraft, discountType: e.target.value as CouponDraft["discountType"] })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal">
                  <option value="FIXED">Fixed amount (₹)</option><option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-bold text-gray-600">{couponDraft.discountType === "FIXED" ? "Discount amount (₹)" : "Discount percentage (%)"}
                <input type="number" min="1" max={couponDraft.discountType === "PERCENTAGE" ? 100 : undefined} value={couponDraft.discountValue} onChange={(e) => setCouponDraft({ ...couponDraft, discountValue: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="space-y-1 text-xs font-bold text-gray-600">Minimum order subtotal (₹)
                <input type="number" min="0" value={couponDraft.minimumSubtotal} onChange={(e) => setCouponDraft({ ...couponDraft, minimumSubtotal: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" />
              </label>
              {couponDraft.discountType === "PERCENTAGE" && <label className="space-y-1 text-xs font-bold text-gray-600">Maximum discount (₹)
                <input type="number" min="1" value={couponDraft.maximumDiscount} onChange={(e) => setCouponDraft({ ...couponDraft, maximumDiscount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" />
              </label>}
              <label className="space-y-1 text-xs font-bold text-gray-600">Starts at
                <input type="datetime-local" value={couponDraft.startsAt} onChange={(e) => setCouponDraft({ ...couponDraft, startsAt: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="space-y-1 text-xs font-bold text-gray-600">Expires at (optional)
                <input type="datetime-local" value={couponDraft.expiresAt} onChange={(e) => setCouponDraft({ ...couponDraft, expiresAt: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="space-y-1 text-xs font-bold text-gray-600">Total redemptions (optional)
                <input type="number" min="1" value={couponDraft.usageLimit} onChange={(e) => setCouponDraft({ ...couponDraft, usageLimit: e.target.value })} placeholder="Unlimited" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="space-y-1 text-xs font-bold text-gray-600">Uses per customer (optional)
                <input type="number" min="1" value={couponDraft.perCustomerLimit} onChange={(e) => setCouponDraft({ ...couponDraft, perCustomerLimit: e.target.value })} placeholder="Unlimited" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" />
              </label>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={couponDraft.firstOrderOnly} onChange={(e) => setCouponDraft({ ...couponDraft, firstOrderOnly: e.target.checked })} /> First order only</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={couponDraft.isActive} onChange={(e) => setCouponDraft({ ...couponDraft, isActive: e.target.checked })} /> Active</label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void saveCoupon()} disabled={couponBusy} className="rounded-lg bg-brand-green px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{couponBusy ? "Saving…" : editingCouponId ? "Save coupon" : "Add coupon"}</button>
              {editingCouponId && <button type="button" onClick={() => { setCouponDraft(emptyCoupon); setEditingCouponId(null); }} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold">Cancel edit</button>}
              {couponMessage && <p role="status" className="self-center text-xs text-gray-600">{couponMessage}</p>}
            </div>
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {coupons.length === 0 ? <p className="p-3 text-xs text-gray-500">No coupons created yet.</p> : coupons.map((coupon) => (
                <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{coupon.code} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${coupon.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{coupon.isActive ? "Active" : "Inactive"}</span></p>
                    <p className="mt-1 text-[11px] text-gray-500">{coupon.discountType === "FIXED" ? `₹${(coupon.discountValue / 100).toFixed(2)} off` : `${coupon.discountValue}% off (up to ₹${((coupon.maximumDiscount || 0) / 100).toFixed(2)})`} · min ₹{(coupon.minimumSubtotal / 100).toFixed(2)} · used {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</p>
                  </div>
                  <div className="flex gap-1"><button type="button" onClick={() => editCoupon(coupon)} aria-label={`Edit ${coupon.code}`} className="rounded-md p-2 text-gray-600 hover:bg-gray-100"><Pencil size={14} /></button><button type="button" onClick={() => void deleteCoupon(coupon.id)} aria-label={`Delete ${coupon.code}`} className="rounded-md p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button></div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Save Card */}
          <div className="p-3.5 bg-brand-pink/20 rounded-xl border border-brand-pink/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-brand-green font-medium">
              <ShieldCheck size={16} className="text-brand-green shrink-0" />
              <span>Real-time sync to DB & LocalStorage</span>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Settings"}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
