"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";

export function AdminSlipAction({
  orderId,
  paymentStatus,
  fulfillmentStatus,
  compact = false,
}: {
  orderId: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  compact?: boolean;
}) {
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);
  const normalizedPayment = paymentStatus.toUpperCase();
  const normalizedFulfillment = fulfillmentStatus.toUpperCase();
  const isCancelled = normalizedFulfillment === "CANCELLED";
  const canPrint = normalizedPayment === "PAID" && !isCancelled;

  useEffect(() => {
    if (!showUnavailableDialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowUnavailableDialog(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showUnavailableDialog]);

  const buttonClassName = compact
    ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm transition-all"
    : "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm transition-all";
  const availableClassName = "bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white";
  const unavailableClassName = "cursor-pointer bg-amber-50 text-amber-800 hover:bg-amber-100";
  const label = compact ? "Slip" : "Print Slip";
  const destination = `/admin/orders/${encodeURIComponent(orderId)}/slip`;

  return (
    <>
      {canPrint ? (
        <Link href={destination} target="_blank" rel="noopener noreferrer" className={`${buttonClassName} ${availableClassName}`} title="Print Dispatch Receipt / Packaging Slip">
          <Printer size={compact ? 12 : 13} /><span>{label}</span>
        </Link>
      ) : (
        <button type="button" onClick={() => setShowUnavailableDialog(true)} className={`${buttonClassName} ${unavailableClassName}`} title="Slip unavailable for this order">
          <Printer size={compact ? 12 : 13} /><span>{label}</span>
        </button>
      )}

      {showUnavailableDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowUnavailableDialog(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="admin-slip-unavailable-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button type="button" aria-label="Close" onClick={() => setShowUnavailableDialog(false)} className="absolute right-3 top-3 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
              <X size={18} />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Printer size={22} />
            </div>
            <h2 id="admin-slip-unavailable-title" className="pr-8 text-lg font-bold text-brand-green">Slip unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-brand-charcoal/75">
              {isCancelled
                ? "This order was cancelled, so its dispatch slip cannot be generated."
                : normalizedPayment === "PENDING"
                  ? "Payment is still pending. The dispatch slip can be generated after payment is confirmed."
                  : normalizedPayment === "CANCELLED" || normalizedPayment === "CANCELED"
                    ? "This payment was cancelled, so the dispatch slip cannot be generated."
                    : `Payment is ${paymentStatus.toLowerCase()}. The dispatch slip can only be generated for paid orders.`}
            </p>
            <button type="button" onClick={() => setShowUnavailableDialog(false)} className="mt-5 w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-green-light">Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
