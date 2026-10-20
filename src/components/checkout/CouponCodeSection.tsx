"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, LockKeyhole, Sparkles, TicketPercent, UserRound, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

type AvailableCoupon = {
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  minimumSubtotal: number;
  maximumDiscount: number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  firstOrderOnly: boolean;
};

type CouponCodeSectionProps = {
  subtotal: number;
  phone?: string;
};

export function CouponCodeSection({ subtotal, phone = "" }: CouponCodeSectionProps) {
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const setAppliedCoupon = useCartStore((state) => state.setAppliedCoupon);
  const clearAppliedCoupon = useCartStore((state) => state.clearAppliedCoupon);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isCouponPickerOpen, setIsCouponPickerOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [couponAccess, setCouponAccess] = useState<"checking" | "allowed" | "guest">("checking");
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const validPhone = phoneDigits.length === 10 ? phoneDigits : "";
  const appliedCode = appliedCoupon?.code ?? "";

  const checkCouponAccess = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await response.json();
      const allowed = Boolean(response.ok && session.isCustomer);
      setCouponAccess(allowed ? "allowed" : "guest");
      if (!allowed) clearAppliedCoupon();
      return allowed;
    } catch {
      setCouponAccess("guest");
      clearAppliedCoupon();
      return false;
    }
  }, [clearAppliedCoupon]);

  useEffect(() => { void checkCouponAccess(); }, [checkCouponAccess]);

  const fetchAvailableCoupons = useCallback(async () => {
    setIsLoadingCoupons(true);
    try {
      const response = await fetch("/api/coupons/available", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) {
        setCouponAccess("guest");
        setIsCouponPickerOpen(false);
        setShowSignInPrompt(true);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not load coupons.");
      setAvailableCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch (error) {
      setAvailableCoupons([]);
      setCouponError(error instanceof Error ? error.message : "Could not load coupons. Please try again.");
    } finally {
      setIsLoadingCoupons(false);
    }
  }, []);

  const applyCoupon = useCallback(async (rawCode: string) => {
    if (!(await checkCouponAccess())) {
      setShowSignInPrompt(true);
      return;
    }
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponError("");
    setIsApplyingCoupon(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, phone: validPhone || undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Invalid coupon code.");
      setAppliedCoupon({
        code: result.code,
        discount: Number(result.discount) || 0,
        message: result.message || `${result.code} applied successfully.`,
      });
      setCouponInput("");
      setIsCouponPickerOpen(false);
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "Could not validate this coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [checkCouponAccess, setAppliedCoupon, subtotal, validPhone]);

  const browseCoupons = async () => {
    setCouponError("");
    if (!(await checkCouponAccess())) {
      setShowSignInPrompt(true);
      return;
    }
    setIsCouponPickerOpen(true);
    void fetchAvailableCoupons();
  };

  // Recheck a saved coupon when the cart total or checkout phone changes.
  useEffect(() => {
    if (!appliedCode || subtotal <= 0) return;
    let cancelled = false;
    fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: appliedCode, subtotal, phone: validPhone || undefined }),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          if (cancelled) return;
          if (response.status >= 500) {
            setCouponError(result.error || "Could not recheck this coupon. Please try again.");
            return;
          }
          clearAppliedCoupon();
          setCouponError(result.error || "This coupon is no longer available.");
          return;
        }
        if (!cancelled) {
          setAppliedCoupon({ code: result.code, discount: Number(result.discount) || 0, message: result.message || `${result.code} applied successfully.` });
          setCouponError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCouponError("Could not recheck this coupon. Please try again.");
        }
      });
    return () => { cancelled = true; };
  }, [appliedCode, clearAppliedCoupon, setAppliedCoupon, subtotal, validPhone]);

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

  return (
    <>
      <div className="mb-6 pb-6 border-b border-brand-green-light/20">
        <label className="block text-xs font-bold text-brand-green uppercase tracking-wider mb-2">
          Have a Coupon Code?
        </label>
        {appliedCoupon && couponAccess === "allowed" ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">{appliedCoupon.code}</span>
                <span className="text-emerald-700 font-semibold">You save ₹{formatPrice(appliedCoupon.discount)}!</span>
              </div>
              <button type="button" onClick={() => { clearAppliedCoupon(); setCouponError(""); }} className="shrink-0 text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer">Remove</button>
            </div>
            <p className="mt-2 text-emerald-800">{appliedCoupon.message} Discount is applied to your order subtotal.</p>
          </div>
        ) : couponAccess !== "allowed" ? (
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50/70 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-green shadow-sm ring-1 ring-emerald-100"><LockKeyhole size={18} /></span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-green">{couponAccess === "checking" ? "Checking coupon access…" : "Coupons are for signed-in customers"}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{couponAccess === "checking" ? "One moment while we check your account." : "Sign in to browse offers and apply a discount to your order."}</p>
                </div>
              </div>
              <button type="button" onClick={() => void browseCoupons()} className="mt-3 flex w-full items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/70 px-3 py-2.5 text-left text-xs font-semibold text-brand-green transition-colors hover:bg-amber-50 cursor-pointer">
                <span className="flex items-center gap-2"><TicketPercent size={15} className="text-amber-600" /> Browse available coupons</span>
                <span className="text-[11px] text-gray-500">Sign in required</span>
              </button>
            </div>
          ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void applyCoupon(couponInput); } }}
                placeholder="Enter coupon code"
                className="flex-1 min-w-0 text-xs border border-brand-green-light/30 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-brand-green uppercase font-mono"
              />
              <button type="button" onClick={() => void applyCoupon(couponInput)} disabled={isApplyingCoupon} className="text-xs font-bold bg-brand-green text-white hover:bg-brand-green-light px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-60">
                {isApplyingCoupon ? "Checking…" : "Apply"}
              </button>
            </div>
            {couponError && <p role="alert" className="text-xs text-rose-600 font-medium">{couponError}</p>}
            <button
              type="button"
              onClick={() => void browseCoupons()}
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-left text-xs font-semibold text-brand-green transition-colors hover:bg-amber-50 cursor-pointer"
            >
              <span className="flex items-center gap-2"><TicketPercent size={15} className="text-amber-600" /> Browse available coupons</span>
              <span className="text-[11px] text-gray-500">{isLoadingCoupons ? "Loading…" : `${availableCoupons.length} available`}</span>
            </button>
          </div>
          )}
      </div>

      {isCouponPickerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCouponPickerOpen(false); }}>
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
                          <strong className="font-extrabold text-gray-900">{offerText}</strong><span className="text-gray-400">|</span><span className="text-xs">Orders above ₹{formatPrice(coupon.minimumSubtotal)}</span>
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-600">
                          <span>Code:</span><code className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono font-bold tracking-wide text-gray-800">{coupon.code}</code>
                          {oneTime && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">One-time use</span>}
                          {coupon.expiresAt && <span className="text-gray-500">Ends {new Date(coupon.expiresAt).toLocaleDateString()}</span>}
                        </div>
                        {shortfall > 0 && <p className="mt-1.5 text-[11px] font-medium text-amber-800">Add ₹{formatPrice(shortfall)} more to use this offer.</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 sm:pl-2 shrink-0">
                      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(coupon.code); setCopiedCoupon(coupon.code); window.setTimeout(() => setCopiedCoupon(null), 1800); } catch { setCouponError("Could not copy the coupon code. You can select it and copy manually."); } }} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50">
                        {copiedCoupon === coupon.code ? <Check size={14} /> : <Copy size={14} />}{copiedCoupon === coupon.code ? "Copied" : "Copy"}
                      </button>
                      <button type="button" onClick={() => { setCouponInput(coupon.code); void applyCoupon(coupon.code); }} disabled={isApplyingCoupon || shortfall > 0} className="rounded-lg bg-brand-green px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-green-light disabled:cursor-not-allowed disabled:opacity-45">
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

      {showSignInPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSignInPrompt(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="coupon-signin-title" className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-[#fffdfa] shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-600" />
            <button type="button" onClick={() => setShowSignInPrompt(false)} aria-label="Close sign-in prompt" className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
            <div className="px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-brand-green ring-1 ring-emerald-100 shadow-sm"><TicketPercent size={28} /></div>
              <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800"><Sparkles size={13} /> Member offer access</span>
              <h2 id="coupon-signin-title" className="mt-3 font-serif text-2xl font-bold text-brand-green">Sign in to unlock coupons</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">Available coupons are reserved for Pink Farm customers. Sign in or create an account to browse offers and apply savings to your order.</p>
              <div className="mt-6 grid gap-2.5">
                <Link href="/login?redirect=%2Fcart" onClick={() => setShowSignInPrompt(false)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-green-light"><UserRound size={17} /> Sign in to your account</Link>
                <Link href="/login?register=1&redirect=%2Fcart" onClick={() => setShowSignInPrompt(false)} className="inline-flex items-center justify-center rounded-xl border border-emerald-900/15 bg-white px-5 py-3 text-sm font-bold text-brand-green transition hover:bg-emerald-50">Create an account</Link>
                <button type="button" onClick={() => setShowSignInPrompt(false)} className="mt-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">Continue as guest</button>
              </div>
              <p className="mt-5 text-[11px] text-gray-400">Your cart will be waiting after you sign in.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
