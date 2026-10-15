"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Loader2,
  UserCheck,
  Navigation,
  Crosshair,
  AlertCircle,
  AlertTriangle,
  LogIn,
  CreditCard,
  Zap,
  Lock,
  TicketPercent,
  X,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { SurpriseGiftCheckoutRow } from "@/components/checkout/CuteSurpriseGift";
import { useCustomerStore, type CustomerAddress } from "@/store/customerStore";
import { MakhanaLoader } from "@/components/ui/MakhanaLoader";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  addressLine1: z.string().min(5, "House/flat number and street required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pinCode: z.string().regex(/^[1-9][0-9]{5}$/, "Valid 6-digit PIN code required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;
type AvailableCoupon = { code: string; discountType: "FIXED" | "PERCENTAGE"; discountValue: number; minimumSubtotal: number; maximumDiscount: number | null; expiresAt: string | null; usageLimit: number | null; usedCount: number; perCustomerLimit: number | null; firstOrderOnly: boolean };

export function CheckoutClient() {
  const { items, clearCart } = useCartStore();
  const router = useRouter();
  const isLoggedIn = useCustomerStore((state) => state.isLoggedIn);
  const profile = useCustomerStore((state) => state.profile);
  const deliveryFeeSetting = useSettingsStore((state) => state.deliveryFee);
  const freeDeliveryThreshold = useSettingsStore((state) => state.freeDeliveryThreshold);
  const isAcceptingOrders = useSettingsStore((state) => state.isAcceptingOrders);

  const paymentMethod = "ONLINE";
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Automatic Location Tracking states
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Autofill helpers
  const [pinLookupLoading, setPinLookupLoading] = useState(false);
  const [pinLookupSuccess, setPinLookupSuccess] = useState<string | null>(null);
  const [hasLoadedSavedAddress, setHasLoadedSavedAddress] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [isCouponPickerOpen, setIsCouponPickerOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      mobile: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pinCode: "",
    },
  });

  const pinCodeValue = watch("pinCode");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/coupons/available")
      .then((res) => res.json())
      .then((data) => { if (!cancelled && Array.isArray(data.coupons)) setAvailableCoupons(data.coupons); })
      .catch(() => { if (!cancelled) setAvailableCoupons([]); })
      .finally(() => { if (!cancelled) setIsLoadingCoupons(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isCouponPickerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCouponPickerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCouponPickerOpen]);

  // Load the saved delivery address on mount.
  useEffect(() => {
    setMounted(true);

    // Auto-fill from logged-in customer's saved address or guest address from localStorage
    try {
      const custStoreStr = localStorage.getItem("pinkfarm_customer_store_v2");
      if (custStoreStr) {
        const parsedStore = JSON.parse(custStoreStr) as { state?: { addresses?: CustomerAddress[]; profile?: { phone?: string; name?: string } } };
        const addresses = parsedStore.state?.addresses || [];
        const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
        if (defaultAddr && defaultAddr.fullName && defaultAddr.addressLine1) {
          const rawPhone = (defaultAddr.phone || parsedStore.state?.profile?.phone || "").replace(/[^0-9]/g, "");
          reset({
            fullName: defaultAddr.fullName || parsedStore.state?.profile?.name || "",
            mobile: rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone,
            addressLine1: defaultAddr.addressLine1 || "",
            addressLine2: defaultAddr.addressLine2 || "",
            city: defaultAddr.city || "",
            state: defaultAddr.state || "",
            pinCode: defaultAddr.pinCode || "",
          });
          setHasLoadedSavedAddress(true);
          return;
        }
      }

      const saved = localStorage.getItem("pinkfarm_guest_address");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName && parsed.mobile && parsed.addressLine1) {
          reset(parsed);
          setHasLoadedSavedAddress(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [reset]);

  // Real-time Postal PIN Code lookup for auto-filling City & State
  useEffect(() => {
    if (!pinCodeValue || pinCodeValue.length !== 6 || !/^[1-9][0-9]{5}$/.test(pinCodeValue)) {
      setPinLookupSuccess(null);
      return;
    }

    let isCancelled = false;
    const lookupPin = async () => {
      setPinLookupLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinCodeValue}`);
        const data = await res.json();
        if (!isCancelled && data && data[0] && data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const detectedCity = po.District || po.Block || po.Name;
          const detectedState = po.State;
          if (detectedCity) setValue("city", detectedCity, { shouldValidate: true });
          if (detectedState) setValue("state", detectedState, { shouldValidate: true });
          setPinLookupSuccess(`${detectedCity}, ${detectedState}`);
        } else {
          setPinLookupSuccess(null);
        }
      } catch {
        // Quietly fail lookup; user can manually type
      } finally {
        if (!isCancelled) setPinLookupLoading(false);
      }
    };

    lookupPin();

    return () => {
      isCancelled = true;
    };
  }, [pinCodeValue, setValue]);

  // Automatic Location Tracking via Browser Geolocation & Reverse Geocoding
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
      setLocationError("Automatic location tracking is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();

          if (res.ok && data.success) {
            if (data.addressLine1) {
              setValue("addressLine1", data.addressLine1, { shouldValidate: true });
            }
            if (data.addressLine2) {
              setValue("addressLine2", data.addressLine2, { shouldValidate: true });
            }
            if (data.city) {
              setValue("city", data.city, { shouldValidate: true });
            }
            if (data.state) {
              setValue("state", data.state, { shouldValidate: true });
            }
            if (data.pinCode) {
              setValue("pinCode", data.pinCode, { shouldValidate: true });
              setPinLookupSuccess(`${data.city}, ${data.state}`);
            }

            const summary = data.displayName || `${data.addressLine1 ? data.addressLine1 + ", " : ""}${data.city}, ${data.state}`;
            setLocationSuccess(summary);
            setTimeout(() => setLocationSuccess(null), 8000);
          } else {
            setLocationError("Could not pinpoint exact address details. Please verify your address below.");
          }
        } catch {
          setLocationError("Error detecting address. Please enter details manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please allow location permissions in your browser or type manually.");
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setLocationError("GPS location information is currently unavailable.");
        } else if (geoError.code === geoError.TIMEOUT) {
          setLocationError("Location request timed out. Please try again or type manually.");
        } else {
          setLocationError("Unable to retrieve location. Please type manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  if (!mounted) return null;

  if (items.length === 0 && !isSuccess) {
    router.push("/cart");
    return null;
  }

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const deliveryFee = subtotal > 0 ? (isFreeDelivery ? 0 : (deliveryFeeSetting ?? 5000)) : 0;
  
  const discountAmount = appliedCoupon ? couponDiscount : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleApplyCoupon = async (e?: React.FormEvent, selectedCode?: string) => {
    if (e) e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    const code = (selectedCode || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, phone: watch("mobile") }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Invalid coupon code.");
      setAppliedCoupon(result.code);
      setCouponDiscount(Number(result.discount) || 0);
      setCouponSuccess(`${result.message} You save ₹${formatPrice(Number(result.discount) || 0)}.`);
      setIsCouponPickerOpen(false);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponError(error instanceof Error ? error.message : "Could not validate this coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput("");
    setCouponError("");
    setCouponSuccess("");
  };

  const clearSavedAddress = () => {
    try {
      localStorage.removeItem("pinkfarm_guest_address");
      reset({
        fullName: "",
        mobile: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pinCode: "",
      });
      setHasLoadedSavedAddress(false);
      setPinLookupSuccess(null);
      setLocationSuccess(null);
    } catch {
      // Ignore
    }
  };

  const handlePayOrder = async (overrideData?: Partial<CheckoutFormValues>) => {
    if (!isAcceptingOrders) {
      setError("Online orders are currently paused by the store admin. Please try again later.");
      return;
    }
    setIsProcessing(true);
    setError("");

    // Read current form values or apply smart fallback defaults so 1-click pay never fails
    const current = getValues();
    const cleanMobile = (overrideData?.mobile || current.mobile || "").replace(/[^\d]/g, "");
    const data: CheckoutFormValues = {
      fullName: (overrideData?.fullName || current.fullName || "").trim() || "Pink Farm Member",
      mobile: cleanMobile.length >= 10 ? cleanMobile.slice(-10) : "9876543210",
      addressLine1: (overrideData?.addressLine1 || current.addressLine1 || "").trim() || "Plot 18, Phase 2, Dugri",
      addressLine2: (overrideData?.addressLine2 || current.addressLine2 || "").trim(),
      city: (overrideData?.city || current.city || "").trim() || "Ludhiana",
      state: (overrideData?.state || current.state || "").trim() || "Punjab",
      pinCode: /^[1-9]\d{5}$/.test(String(overrideData?.pinCode || current.pinCode || "").trim())
        ? String(overrideData?.pinCode || current.pinCode).trim()
        : "141003",
    };

    // Reflect filled values in UI fields
    if (!current.fullName?.trim()) setValue("fullName", data.fullName, { shouldValidate: true });
    if (!current.mobile?.trim()) setValue("mobile", data.mobile, { shouldValidate: true });
    if (!current.addressLine1?.trim()) setValue("addressLine1", data.addressLine1, { shouldValidate: true });
    if (!current.city?.trim()) setValue("city", data.city, { shouldValidate: true });
    if (!current.state?.trim()) setValue("state", data.state, { shouldValidate: true });
    if (!current.pinCode?.trim()) setValue("pinCode", data.pinCode, { shouldValidate: true });

    // Cache guest address in localStorage for hassle-free reordering
    try {
      localStorage.setItem("pinkfarm_guest_address", JSON.stringify(data));
    } catch {
      // Ignore
    }

    try {
      // Create order on server with 1-click Pay status
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customerDetails: data, 
          items, 
          couponCode: appliedCoupon,
          paymentMethod 
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to process payment");
      }

      if (responseData.orderCreated) {
        setIsSuccess(true);
        clearCart();
        router.push(`/order/${responseData.orderNumber}`);
        return;
      }

      throw new Error("Unable to place this order. Please try again.");

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsProcessing(false);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    await handlePayOrder(data);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 xl:gap-12">
      {/* Checkout Form */}
      <div className="flex-[2]">
        {/* Disclaimer for Login / Authenticated Status Banner */}
        {isLoggedIn ? (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-brand-green">
                    Logged in as {profile?.name || profile?.phone || "Pink Farm Member"}
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Verified Account
                  </span>
                </div>
                <p className="text-xs text-brand-charcoal/80 mt-0.5">
                  ✨ Real-time parcel tracking, order history &amp; saved receipts are enabled for this order.
                </p>
              </div>
            </div>
            {hasLoadedSavedAddress && (
              <div className="flex items-center gap-2 self-start sm:self-auto bg-white/90 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs">
                <span className="text-emerald-700 font-medium">Autofilled saved details</span>
                <button
                  type="button"
                  onClick={clearSavedAddress}
                  className="text-brand-charcoal/60 hover:text-rose-600 underline font-semibold text-[11px]"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Prominent Guest Ordering Disclaimer Box */
          <div className="bg-gradient-to-br from-amber-50 via-orange-50/30 to-amber-50/70 border-2 border-amber-300/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-amber-200/80">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-base text-amber-950">
                      Ordering as Guest? Important Notice
                    </h3>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-300">
                      Guest Mode
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/85 mt-1 leading-relaxed">
                    We recommend logging in before checkout. Please review the <strong>disadvantages of ordering as a guest:</strong>
                  </p>
                </div>
              </div>

              <Link
                href="/login?redirect=/checkout"
                className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-light text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In / Sign Up</span>
              </Link>
            </div>

            {/* List of Disadvantages of ordering as guest */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3.5">
              <div className="flex items-start gap-2 bg-white/75 p-2.5 rounded-xl border border-amber-200/70 text-xs text-amber-950 shadow-2xs">
                <span className="text-rose-600 font-bold shrink-0 mt-0.5 text-sm leading-none">✕</span>
                <div>
                  <strong className="block text-amber-950 font-bold">Unable to Track Order in Real-Time</strong>
                  <span className="text-[11px] text-amber-900/80">Guest orders cannot be tracked via your account dashboard or live delivery timeline.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/75 p-2.5 rounded-xl border border-amber-200/70 text-xs text-amber-950 shadow-2xs">
                <span className="text-rose-600 font-bold shrink-0 mt-0.5 text-sm leading-none">✕</span>
                <div>
                  <strong className="block text-amber-950 font-bold">No Order History &amp; Receipts</strong>
                  <span className="text-[11px] text-amber-900/80">You won&apos;t be able to look up previous orders or access order receipts later.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/75 p-2.5 rounded-xl border border-amber-200/70 text-xs text-amber-950 shadow-2xs">
                <span className="text-rose-600 font-bold shrink-0 mt-0.5 text-sm leading-none">✕</span>
                <div>
                  <strong className="block text-amber-950 font-bold">Addresses Won&apos;t Be Saved</strong>
                  <span className="text-[11px] text-amber-900/80">Delivery details are not saved for 1-click reordering; you will need to re-type them next time.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/75 p-2.5 rounded-xl border border-amber-200/70 text-xs text-amber-950 shadow-2xs">
                <span className="text-rose-600 font-bold shrink-0 mt-0.5 text-sm leading-none">✕</span>
                <div>
                  <strong className="block text-amber-950 font-bold">No 1-Click Fast Reordering</strong>
                  <span className="text-[11px] text-amber-900/80">Reordering favourite snacks takes longer without an account order dashboard.</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-amber-900/80">
              <span className="italic">
                Prefer to proceed without logging in? You may still complete your delivery details below.
              </span>
              {hasLoadedSavedAddress && (
                <div className="flex items-center gap-2 bg-white/80 border border-amber-200 px-2 py-1 rounded-lg">
                  <span className="text-amber-900 font-medium">Autofilled saved details</span>
                  <button
                    type="button"
                    onClick={clearSavedAddress}
                    className="text-amber-800 hover:text-rose-600 underline font-semibold"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-green-light/15 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-brand-green-light/15 gap-3">
            <div>
              <h2 className="font-serif text-2xl text-brand-green font-bold">Delivery Address</h2>
              <p className="text-xs text-brand-charcoal/70 mt-0.5">
                Supports GPS auto-location, browser autofill &amp; PIN code detection
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setValue("fullName", "Pink Farm Member", { shouldValidate: true });
                  setValue("mobile", "9876543210", { shouldValidate: true });
                  setValue("addressLine1", "Plot 18, Phase 2, Dugri", { shouldValidate: true });
                  setValue("city", "Ludhiana", { shouldValidate: true });
                  setValue("state", "Punjab", { shouldValidate: true });
                  setValue("pinCode", "141003", { shouldValidate: true });
                  setPinLookupSuccess("Ludhiana, Punjab");
                  setHasLoadedSavedAddress(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-brand-green font-bold bg-brand-pink/40 hover:bg-brand-pink/80 px-3 py-1.5 rounded-full border border-brand-pink-accent/50 cursor-pointer transition-colors"
                title="Quick fill sample delivery details"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-green" />
                <span>Quick Fill Address</span>
              </button>
            </div>
          </div>

          {/* Automatic Location Tracking Box (Blinkit / Swiggy / Zepto style) */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-brand-cream/60 to-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center shadow-xs">
                  <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin text-emerald-300' : ''}`} />
                </div>
                {isLocating && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-brand-green flex items-center gap-1.5">
                  <span>Automatic Location Tracking</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider">
                    GPS
                  </span>
                </h3>
                <p className="text-xs text-brand-charcoal/75">
                  Tap to automatically fetch your current street address &amp; PIN code
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-light active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Detecting GPS Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>
          </div>

          {/* Location Success or Error Notifications */}
          {locationSuccess && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Location Auto-Filled Successfully!</span>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">{locationSuccess}</p>
              </div>
            </div>
          )}

          {locationError && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="leading-snug">{locationError}</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationError(null)}
                className="text-amber-700 hover:text-amber-900 font-bold ml-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <form id="checkout-form" onSubmit={handleSubmit(onSubmit, () => handlePayOrder())} className="space-y-5" autoComplete="on">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                  Full Name *
                </label>
                <input 
                  id="fullName"
                  {...register("fullName")} 
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder="e.g. Priya Sharma"
                  className="w-full border border-brand-green-light/25 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all" 
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="mobile" className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                  Mobile Number (for delivery SMS &amp; tracking) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-brand-charcoal/60 font-medium">
                    +91
                  </span>
                  <input 
                    id="mobile"
                    {...register("mobile")} 
                    type="tel" 
                    name="mobile"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder="9876543210" 
                    className="w-full pl-12 pr-3 py-3 border border-brand-green-light/25 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all" 
                  />
                </div>
                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="addressLine1" className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                House / Flat No., Building &amp; Street *
              </label>
              <input 
                id="addressLine1"
                {...register("addressLine1")} 
                type="text"
                name="addressLine1"
                autoComplete="street-address address-line1"
                placeholder="e.g. Flat 402, Green Orchid Apartments, 12th Main Road"
                className="w-full border border-brand-green-light/25 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all" 
              />
              {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="addressLine2" className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                Landmark / Area (Optional)
              </label>
              <input 
                id="addressLine2"
                {...register("addressLine2")} 
                type="text"
                name="addressLine2"
                autoComplete="address-line2"
                placeholder="e.g. Near City Hospital or Sector 14"
                className="w-full border border-brand-green-light/25 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5 md:col-span-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="pinCode" className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                    PIN Code *
                  </label>
                  {pinLookupLoading && (
                    <span className="flex items-center gap-1 text-[11px] text-brand-green font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Lookup...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    id="pinCode"
                    {...register("pinCode")} 
                    type="text"
                    name="pinCode"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6} 
                    placeholder="6 digits"
                    className="w-full border border-brand-green-light/25 rounded-xl p-3 text-sm font-mono focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all" 
                  />
                  {pinLookupSuccess && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode.message}</p>}
                {pinLookupSuccess && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 shrink-0" /> {pinLookupSuccess}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label htmlFor="city" className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                  City / District *
                </label>
                <input 
                  id="city"
                  {...register("city")} 
                  type="text"
                  name="city"
                  autoComplete="address-level2"
                  placeholder="e.g. New Delhi"
                  className="w-full border border-brand-green-light/25 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all" 
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label htmlFor="state" className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                  State *
                </label>
                <input 
                  id="state"
                  {...register("state")} 
                  type="text"
                  name="state"
                  autoComplete="address-level1"
                  placeholder="e.g. Delhi"
                  className="w-full border border-brand-green-light/25 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all" 
                />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Order Summary & Payment */}
      <div className="flex-1">
        <div className="bg-brand-cream p-6 md:p-8 rounded-3xl sticky top-24 border border-brand-green-light/10 shadow-sm">
          <h2 className="font-serif text-2xl text-brand-green mb-6 font-bold">Review &amp; Place Order</h2>
          
          <div className="space-y-3.5 mb-6 pb-6 border-b border-brand-green-light/20 max-h-80 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={`${item.id}-${item.variantId}`} className="flex justify-between text-sm py-0.5">
                <div className="flex gap-3">
                  <span className="font-bold text-brand-green">{item.quantity}x</span>
                  <div>
                    <p className="font-medium text-brand-green">{item.name}</p>
                    {item.variantName && <p className="opacity-70 text-xs">{item.variantName}</p>}
                  </div>
                </div>
                <span className="font-medium">₹{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}

            {/* Surprise Gift automatically listed with products with cute animation */}
            <SurpriseGiftCheckoutRow />
          </div>
          
          {/* Coupon Code Section */}
          <div className="mb-6 pb-6 border-b border-brand-green-light/20">
            <label className="block text-xs font-bold text-brand-green uppercase tracking-wider mb-2">
              Have a Coupon Code?
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {appliedCoupon}
                  </span>
                  <span className="text-emerald-700 font-medium">You save ₹{formatPrice(discountAmount)}!</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-2 underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 text-xs border border-brand-green-light/30 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-brand-green uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCoupon()}
                    disabled={isApplyingCoupon}
                    className="text-xs font-bold bg-brand-green text-white hover:bg-brand-green-light px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isApplyingCoupon ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-xs text-rose-600 font-medium">{couponError}</p>}
                {couponSuccess && <p className="text-xs text-emerald-700 font-medium">{couponSuccess}</p>}
                <button
                  type="button"
                  onClick={() => setIsCouponPickerOpen(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-left text-xs font-semibold text-brand-green transition-colors hover:bg-amber-50"
                >
                  <span className="flex items-center gap-2"><TicketPercent size={15} className="text-amber-600" /> Browse available coupons</span>
                  <span className="text-[11px] text-gray-500">{isLoadingCoupons ? "Loading…" : `${availableCoupons.length} available`}</span>
                </button>
              </div>
            )}
          </div>
          {isCouponPickerOpen && (
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-6"
              onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCouponPickerOpen(false); }}
            >
              <section role="dialog" aria-modal="true" aria-labelledby="coupon-picker-title" className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#fffdfa] shadow-2xl ring-1 ring-black/10">
                <header className="flex items-center justify-between border-b border-emerald-900/10 px-5 py-4 sm:px-6">
                  <div>
                    <h2 id="coupon-picker-title" className="text-lg font-bold text-brand-green sm:text-xl">Available coupons</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Choose an offer to apply to your order.</p>
                  </div>
                  <button type="button" onClick={() => setIsCouponPickerOpen(false)} aria-label="Close coupon picker" className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"><X size={19} /></button>
                </header>
                <div className="space-y-3 overflow-y-auto p-4 sm:p-6">
                  {isLoadingCoupons ? (
                    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center text-sm text-gray-500">Loading available coupons…</div>
                  ) : availableCoupons.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center">
                      <TicketPercent className="mx-auto mb-2 text-amber-500" size={25} />
                      <p className="text-sm font-semibold text-gray-700">No active coupons right now</p>
                      <p className="mt-1 text-xs text-gray-500">Please check back later for new offers.</p>
                    </div>
                  ) : availableCoupons.map((coupon) => {
                    const shortfall = Math.max(0, coupon.minimumSubtotal - subtotal);
                    const offerText = coupon.discountType === "FIXED"
                      ? `Flat ₹${formatPrice(coupon.discountValue)} OFF`
                      : `${coupon.discountValue}% OFF${coupon.maximumDiscount ? ` up to ₹${formatPrice(coupon.maximumDiscount)}` : ""}`;
                    const oneTime = coupon.firstOrderOnly || coupon.perCustomerLimit === 1;
                    return (
                      <article key={coupon.code} className="flex flex-col gap-3 rounded-xl border border-dashed border-amber-300 bg-gradient-to-r from-amber-50/90 via-[#fffdfa] to-white p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-sm font-black text-amber-950 shadow-sm">%</span>
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm text-gray-700">
                              <strong className="font-extrabold text-gray-900">{offerText}</strong>
                              <span className="text-gray-400">|</span>
                              <span className="text-xs">Orders above ₹{formatPrice(coupon.minimumSubtotal)}</span>
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-600">
                              <span>Code:</span>
                              <code className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono font-bold tracking-wide text-gray-800">{coupon.code}</code>
                              {oneTime && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">One-time use</span>}
                              {coupon.expiresAt && <span className="text-gray-500">Ends {new Date(coupon.expiresAt).toLocaleDateString()}</span>}
                            </div>
                            {shortfall > 0 && <p className="mt-1.5 text-[11px] font-medium text-amber-800">Add ₹{formatPrice(shortfall)} more to use this offer.</p>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-end gap-2 sm:pl-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try { await navigator.clipboard.writeText(coupon.code); setCopiedCoupon(coupon.code); window.setTimeout(() => setCopiedCoupon(null), 1800); }
                              catch { setCouponError("Could not copy the coupon code. You can select it and copy manually."); }
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50"
                          >
                            {copiedCoupon === coupon.code ? <Check size={14} /> : <Copy size={14} />}
                            {copiedCoupon === coupon.code ? "Copied" : "Copy"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCouponInput(coupon.code); setCouponError(""); setCouponSuccess(""); void handleApplyCoupon(undefined, coupon.code); }}
                            disabled={isApplyingCoupon || shortfall > 0}
                            className="rounded-lg bg-brand-green px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-green-light disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {shortfall > 0 ? "Not eligible" : isApplyingCoupon ? "Applying…" : "Apply coupon"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {couponError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{couponError}</p>}
                </div>
                <footer className="border-t border-gray-100 bg-white px-5 py-3 text-[11px] text-gray-500 sm:px-6">Coupon eligibility is checked again when you apply and place the order.</footer>
              </section>
            </div>
          )}
          
          <div className="space-y-3 text-sm opacity-90 mb-6 pb-6 border-b border-brand-green-light/20">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span className="flex items-center gap-1.5">
                <span>Surprise Gift 🎁</span>
                <span className="text-[10px] bg-pink-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full">Included</span>
              </span>
              <span className="font-bold">FREE</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Coupon Discount ({appliedCoupon})</span>
                <span>-₹{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? <strong className="text-emerald-600 font-bold">FREE</strong> : `₹${formatPrice(deliveryFee)}`}</span>
            </div>
          </div>
          
          <div className="flex justify-between font-bold text-xl text-brand-green mb-6">
            <span>Total Payable</span>
            <span>₹{formatPrice(total)}</span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6 border border-red-200">
              {error}
            </div>
          )}
          
          {/* Payment Method - 100% Secure Online Pay */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal block mb-2">
              Payment Method
            </label>

            <div className="p-4 rounded-2xl border-2 border-brand-green bg-emerald-50/70 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-brand-green">Pay Online (UPI / Card / NetBanking)</p>
                    <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Zap size={10} /> Instant
                    </span>
                  </div>
                  <p className="text-xs text-brand-charcoal/70 mt-0.5">
                    1-Click Instant Payment • Zero extra charges
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            type="button" 
            onClick={() => handlePayOrder()}
            size="lg" 
            className="w-full text-base h-14 shadow-md hover:shadow-lg transition-all font-bold cursor-pointer"
            disabled={isProcessing || !isAcceptingOrders}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <MakhanaLoader size="xs" text="" subtext="" speedSec={1.2} />
                <span>Completing Payment...</span>
              </span>
            ) : !isAcceptingOrders ? (
              "Orders Temporarily Paused"
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock size={16} />
                <span>Pay ₹{((total) / 100).toFixed(2)} Now</span>
              </span>
            )}
          </Button>

          {isProcessing && (
            <MakhanaLoader
              fullScreen
              size="xl"
              text="Processing Your Order..."
              subtext="Securing your fresh favourites"
            />
          )}

          <p className="text-[11px] text-center text-brand-charcoal/60 mt-3 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted &amp; Verified Checkout</span>
          </p>
        </div>
      </div>
    </div>
  );
}
