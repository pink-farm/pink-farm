"use client";

import React, { useState, useEffect } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { 
  X, 
  Package, 
  Phone, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id?: string;
    name: string;
    slug?: string;
    category?: string;
    imageUrl?: string;
  };
  selectedVariant?: {
    name?: string;
    packSize?: string;
  } | null;
}

export function BulkOrderModal({
  isOpen,
  onClose,
  product,
  selectedVariant,
}: BulkOrderModalProps) {
  const { isLoggedIn, profile } = useCustomerStore();
  const supportPhone = useSettingsStore((state) => state.supportPhone);

  // Raw makhana check (minimum 5kg), others minimum 2kg
  const isRawMakhana = Boolean(
    product?.slug?.toLowerCase().includes("raw") ||
    product?.name?.toLowerCase().includes("raw")
  );
  const minKg = isRawMakhana ? 5 : 2;

  const [quantityKg, setQuantityKg] = useState<number>(0);
  const [qtyInput, setQtyInput] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Reset or initialize state when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setQuantityKg(0);
      setQtyInput("");
      setErrorMsg(null);
      setIsSuccess(false);

      if (isLoggedIn && profile) {
        setCustomerName(profile.name || "");
        setCustomerPhone(profile.phone ? profile.phone.replace(/\D/g, "").slice(-10) : "");
      } else {
        setCustomerName("");
        setCustomerPhone("");
      }
      setNotes("");
    }
  }, [isOpen, minKg, isLoggedIn, profile]);

  if (!isOpen) return null;

  // Handle typing limiter for quantity
  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, ""); // strictly allow only digits
    setQtyInput(val);

    if (val === "") {
      setQuantityKg(0);
      setErrorMsg(null);
      return;
    }

    const num = parseInt(val, 10);
    if (isNaN(num) || num < minKg) {
      setErrorMsg(`Minimum bulk order for ${product.name} is ${minKg} kg.`);
      setQuantityKg(num || 0);
    } else {
      setErrorMsg(null);
      setQuantityKg(num);
    }
  };

  const handleBlurQuantity = () => {
    if (!qtyInput || qtyInput.trim() === "") {
      setQuantityKg(0);
      setQtyInput("");
      return;
    }
    const num = parseInt(qtyInput, 10);
    if (isNaN(num) || num < minKg) {
      setErrorMsg(`Minimum bulk order is ${minKg} kg. Please enter ${minKg} kg or more.`);
      setQuantityKg(num || 0);
    } else {
      setQuantityKg(num);
      setQtyInput(num.toString());
      setErrorMsg(null);
    }
  };


  // Quick preset pills (includes 100kg quick pill)
  const presetPills = isRawMakhana ? [5, 10, 25, 50, 100] : [2, 5, 10, 25, 50, 100];

  // Phone input formatting (strictly 10 digits)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setCustomerPhone(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate quantity against limiter
    if (!quantityKg || quantityKg < minKg || isNaN(quantityKg)) {
      setErrorMsg(`Please enter required quantity (minimum ${minKg} kg).`);
      return;
    }

    // Validate name and phone if not logged in
    const finalName = customerName.trim();
    const finalPhone = customerPhone.trim();

    if (!finalName) {
      setErrorMsg("Please enter your name.");
      return;
    }

    if (!finalPhone || finalPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Owner WhatsApp clean number
    const basePhone = supportPhone || "8437504040";
    const digits = basePhone.replace(/\D/g, "");
    const cleanPhone = digits.startsWith("91") ? digits : `91${digits}`;

    // Craft WhatsApp inquiry message
    const lines = [
      "🌸 *BULK ORDER INQUIRY — PINK FARM* 🌸",
      "",
      `📦 *Product:* ${product.name}`,
      selectedVariant?.name ? `🏷️ *Variant:* ${selectedVariant.name}` : null,
      `⚖️ *Quantity Requested:* ${quantityKg} kg`,
      `👤 *Customer Name:* ${finalName}`,
      `📞 *Phone Number:* +91 ${finalPhone}`,
      notes.trim() ? `📝 *Special Requirements / City:* ${notes.trim()}` : null,
      "",
      "Hello! I am looking for bulk commercial/wholesale pricing and dispatch details for the above order.",
      "Thank you!"
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines)}`;
    
    setIsSuccess(true);

    // Open WhatsApp in new tab
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    setTimeout(() => {
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-charcoal/65 backdrop-blur-sm">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-brand-green/15 z-10 p-5 sm:p-7"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-brand-charcoal/60 hover:text-brand-charcoal hover:bg-brand-cream/80 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-brand-green/10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-pink/20 to-brand-cream flex items-center justify-center text-brand-green shrink-0 border border-brand-pink/30 shadow-xs">
            <Package size={24} className="text-brand-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-green leading-tight">
                Bulk Order Inquiry
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-pink/15 text-brand-pink-dark border border-brand-pink/30">
                Direct WhatsApp
              </span>
            </div>
            <p className="text-xs text-brand-charcoal/70 line-clamp-1 mt-0.5 font-medium">
              {product.name}
              {selectedVariant?.name ? ` • ${selectedVariant.name}` : ""}
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="font-serif text-xl font-bold text-brand-green">
              Opening WhatsApp...
            </h4>
            <p className="text-xs text-brand-charcoal/70 max-w-xs mx-auto">
              Your bulk order inquiry for <strong>{quantityKg} kg</strong> has been formatted. Sending directly to owner on WhatsApp!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity Input with Limiter */}
            <div className="bg-brand-cream/40 rounded-2xl p-4 border border-brand-green/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs sm:text-sm text-brand-green flex items-center gap-1.5">
                  Quantity in Kilograms (Kgs)
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-brand-pink-dark bg-brand-pink/15 px-2 py-0.5 rounded-md border border-brand-pink/25">
                  Min {minKg} kg {isRawMakhana ? "(Raw Makhana)" : ""}
                </span>
              </div>

              {/* Direct Typable Input */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={qtyInput}
                    onFocus={(e) => e.target.select()}
                    onChange={handleQuantityInputChange}
                    onBlur={handleBlurQuantity}
                    placeholder="Enter Required Quantity"
                    className="w-full h-12 pl-4 pr-12 rounded-xl border-2 border-brand-green/20 focus:border-brand-green bg-white text-brand-green font-bold text-base shadow-xs focus:outline-none transition-colors placeholder:text-brand-charcoal/40 placeholder:font-normal placeholder:text-sm"
                    aria-label="Bulk quantity in kg"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs font-bold text-brand-charcoal/70 bg-brand-cream/80 px-2 py-0.5 rounded-md border border-brand-green/10">
                    kg
                  </div>
                </div>

                {quantityKg > 0 && (
                  <div className="text-xs font-semibold text-brand-charcoal/80 flex items-baseline gap-1.5 shrink-0">
                    <span className="text-sm font-bold text-brand-green">
                      {quantityKg} kg
                    </span>
                    <span className="text-[11px] text-brand-charcoal/60">
                      ({quantityKg >= 1000 ? `${(quantityKg / 1000).toFixed(1)} MT` : `${quantityKg * 1000} gms`})
                    </span>
                  </div>
                )}
              </div>

              {/* Inline Quantity Warning if below minimum limiter */}
              {(qtyInput !== "" && (parseInt(qtyInput, 10) < minKg || isNaN(parseInt(qtyInput, 10)))) && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span className="font-medium">
                    Minimum bulk quantity is <strong>{minKg} kg</strong> for {product.name}. Please select {minKg} kg or more.
                  </span>
                </div>
              )}

              {/* Quick Select Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-brand-charcoal/60 font-medium mr-1">Quick pick:</span>
                {presetPills.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setQuantityKg(preset);
                      setQtyInput(preset.toString());
                      setErrorMsg(null);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                      quantityKg === preset
                        ? "bg-brand-green text-white shadow-xs"
                        : "bg-white border border-brand-green/20 text-brand-charcoal/80 hover:border-brand-green hover:bg-brand-cream/60"
                    }`}
                  >
                    {preset} kg
                  </button>
                ))}
              </div>

              {/* Limiter Notice / Explanation */}
              <div className="flex items-start gap-1.5 text-[11px] text-brand-charcoal/70 bg-white/70 p-2 rounded-xl border border-brand-green/10">
                <Info size={14} className="text-brand-pink shrink-0 mt-0.5" />
                <span>
                  {isRawMakhana
                    ? "Wholesale sacks for Raw Phool Makhana begin at 5 kg for trade packing."
                    : "Bulk packing for roasted & seasoned snacks begins from 2 kg."}
                </span>
              </div>
            </div>

            {/* Customer Details: Ask for Name and Phone if not logged in */}
            {isLoggedIn && profile?.name && profile?.phone ? (
              <div className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 size={14} />
                    <span>Ordering with your logged in profile</span>
                  </div>
                  <p className="text-xs text-brand-charcoal/80 mt-0.5">
                    <strong>{profile.name}</strong> • +91 {profile.phone.replace(/\D/g, "").slice(-10)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Allow toggling custom input if needed
                    setCustomerName(profile.name);
                    setCustomerPhone(profile.phone.replace(/\D/g, "").slice(-10));
                  }}
                  className="text-[11px] text-brand-green font-semibold underline hover:opacity-80"
                >
                  Confirm
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-brand-green">
                  Your Contact Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-brand-charcoal/80 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-brand-green/20 text-xs text-brand-charcoal focus:border-brand-green focus:outline-none bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-brand-charcoal/80 mb-1">
                      WhatsApp / Phone <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-brand-charcoal/60 text-xs font-semibold">
                        <Phone size={13} />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        placeholder="10-digit number"
                        className="w-full h-10 pl-14 pr-3 rounded-xl border border-brand-green/20 text-xs text-brand-charcoal focus:border-brand-green focus:outline-none bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-brand-charcoal/80 mb-1">
                Delivery Location / Special Notes <span className="text-brand-charcoal/40 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Delivery to Mumbai, monthly recurring order"
                className="w-full h-10 px-3 rounded-xl border border-brand-green/20 text-xs text-brand-charcoal focus:border-brand-green focus:outline-none bg-white transition-colors"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 h-11 rounded-xl border border-brand-green/20 text-brand-charcoal hover:bg-brand-cream/60 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!quantityKg || quantityKg < minKg || isNaN(quantityKg)}
                className="w-2/3 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Send size={15} />
                <span>Send Enquiry</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
