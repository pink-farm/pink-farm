"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, TicketPercent, X } from "lucide-react";
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
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const validPhone = phoneDigits.length === 10 ? phoneDigits : "";
  const appliedCode = appliedCoupon?.code ?? "";

  const fetchAvailableCoupons = useCallback(async () => {
    setIsLoadingCoupons(true);
    try {
      const response = await fetch("/api/coupons/available", { cache: "no-store" });
      const data = await response.json();
      setAvailableCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch {
      setAvailableCoupons([]);
      setCouponError("Could not load coupons. Please try again.");
    } finally {
      setIsLoadingCoupons(false);
    }
  }, []);

  const applyCoupon = useCallback(async (rawCode: string) => {
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
  }, [setAppliedCoupon, subtotal, validPhone]);

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
        {appliedCoupon ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">{appliedCoupon.code}</span>
                <span className="text-emerald-700 font-semibold">You save ₹{formatPrice(appliedCoupon.discount)}!</span>
              </div>
              <button type="button" onClick={() => { clearAppliedCoupon(); setCouponError(""); }} className="shrink-0 text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer">Remove</button>
            </div>
            <p className="mt-2 text-emerald-800">{appliedCoupon.message} Discount is applied to your order subtotal.</p>
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
              onClick={() => { setCouponError(""); setIsCouponPickerOpen(true); void fetchAvailableCoupons(); }}
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
                    <div className="flex shrink-0 items-center justify-end gap-2 sm:pl-2">
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
    </>
  );
}
