"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrintControls({
  orderNumber,
  backUrl = "/admin/orders",
  backLabel = "Back to Orders",
}: {
  orderNumber: string;
  backUrl?: string;
  backLabel?: string;
}) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="print:hidden bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={backUrl}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-brand-green bg-gray-100 hover:bg-brand-pink/40 px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{backLabel}</span>
        </Link>
        <div>
          <h2 className="text-sm font-bold text-gray-800 break-all">
            Dispatch Receipt for Order #{orderNumber}
          </h2>
          <p className="text-xs text-gray-500">
            Ready to print &amp; paste onto parcel packaging (A4 or thermal label).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-green text-white hover:bg-brand-green/90 shadow-md hover:shadow-lg transition-all"
        >
          <Printer size={15} />
          <span>Print Slip / Save as PDF</span>
        </button>
      </div>
    </div>
  );
}
