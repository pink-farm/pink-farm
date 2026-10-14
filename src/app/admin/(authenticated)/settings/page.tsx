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
} from "lucide-react";
import { useSettingsStore, DEFAULT_SETTINGS } from "@/store/settingsStore";

export default function StoreSettingsPage() {
  const storeSettings = useSettingsStore();

  const [storeName, setStoreName] = useState(DEFAULT_SETTINGS.storeName);
  const [announcementText, setAnnouncementText] = useState(DEFAULT_SETTINGS.announcementText);
  const [supportPhone, setSupportPhone] = useState(DEFAULT_SETTINGS.supportPhone);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SETTINGS.supportEmail);
  const [businessAddress, setBusinessAddress] = useState(DEFAULT_SETTINGS.businessAddress);
  const [deliveryFeeRupees, setDeliveryFeeRupees] = useState("50");
  const [freeThresholdRupees, setFreeThresholdRupees] = useState("500");
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Sync state from store / remote API on mount
  useEffect(() => {
    if (storeSettings.storeName) {
      setStoreName(storeSettings.storeName);
      setAnnouncementText(storeSettings.announcementText);
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setStatusMessage("");

    const deliveryFeePaise = Math.round((parseFloat(deliveryFeeRupees) || 0) * 100);
    const freeThresholdPaise = Math.round((parseFloat(freeThresholdRupees) || 0) * 100);

    const payload = {
      storeName: storeName.trim() || DEFAULT_SETTINGS.storeName,
      announcementText: announcementText.trim(),
      supportPhone: supportPhone.trim() || DEFAULT_SETTINGS.supportPhone,
      supportEmail: supportEmail.trim() || DEFAULT_SETTINGS.supportEmail,
      businessAddress: businessAddress.trim() || DEFAULT_SETTINGS.businessAddress,
      deliveryFee: deliveryFeePaise,
      freeDeliveryThreshold: freeThresholdPaise,
      isAcceptingOrders,
    };

    useSettingsStore.getState().setSettings(payload);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setStatusMessage("Settings saved successfully!");
      } else {
        setSaveSuccess(true);
        setStatusMessage("Settings updated locally.");
      }
    } catch {
      setSaveSuccess(true);
      setStatusMessage("Settings saved locally.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

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
