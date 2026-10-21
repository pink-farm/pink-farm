"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";

export function ReceiptAction({
  orderNumber,
  paymentStatus,
  fulfillmentStatus,
}: {
  orderNumber: string;
  paymentStatus: string;
  fulfillmentStatus: string;
}) {
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);
  const isCancelled = fulfillmentStatus.toUpperCase() === "CANCELLED";
  const canPrint = paymentStatus.toUpperCase() === "PAID" && !isCancelled;

  useEffect(() => {
    if (!showUnavailableDialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowUnavailableDialog(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showUnavailableDialog]);

  const buttonClassName = "inline-flex items-center justify-center rounded-xl border border-brand-green px-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-green transition hover:bg-brand-green/5 w-full sm:w-auto h-11 sm:h-12";

  return (
    <>
      {canPrint ? (
        <Link href={`/order/${encodeURIComponent(orderNumber)}/receipt`} target="_blank" rel="noopener noreferrer" className={buttonClassName}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt / Invoice
        </Link>
      ) : (
        <button type="button" onClick={() => setShowUnavailableDialog(true)} className={`${buttonClassName} cursor-pointer`}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt / Invoice
        </button>
      )}

      {showUnavailableDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowUnavailableDialog(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="receipt-unavailable-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button type="button" aria-label="Close" onClick={() => setShowUnavailableDialog(false)} className="absolute right-3 top-3 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
              <X size={18} />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Printer size={22} />
            </div>
            <h2 id="receipt-unavailable-title" className="pr-8 text-lg font-bold text-brand-green">
              Receipt unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-brand-charcoal/75">
              {isCancelled
                ? "This order was cancelled, so a payment receipt cannot be printed."
                : "Payment must be completed and confirmed before a receipt can be printed."}
            </p>
            <button type="button" onClick={() => setShowUnavailableDialog(false)} className="mt-5 w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-green-light">
              Got it
            </button>
          </section>
        </div>
      )}
    </>
  );
}
