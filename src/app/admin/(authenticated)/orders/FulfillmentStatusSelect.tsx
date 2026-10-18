"use client";

import { useState } from "react";
import { Loader2, Truck, ExternalLink, X, Check, Edit3, ArrowRight } from "lucide-react";
import { resolveTrackingUrl } from "@/lib/tracking";

interface Props {
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  initialStatus: string;
  initialTrackingNumber?: string | null;
  initialCarrierName?: string | null;
  initialTrackingUrl?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  PENDING: {
    label: "⏳ Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-400",
  },
  PACKED: {
    label: "📦 Packaged",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-300 focus:ring-blue-400",
  },
  PROCESSING: {
    label: "⏳ Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-400",
  },
  SHIPPED: {
    label: "🚚 Shipped",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-300 focus:ring-purple-400",
  },
  OUT_FOR_DELIVERY: {
    label: "🚚 Shipped",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-300 focus:ring-purple-400",
  },
  DELIVERED: {
    label: "✅ Delivered",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-400",
  },
  CANCELLED: {
    label: "❌ Cancelled",
    badgeClass: "bg-red-50 text-red-800 border-red-300 focus:ring-red-400",
  },
};

const POPULAR_CARRIERS = [
  "Delhivery",
  "Blue Dart",
  "Shiprocket",
  "DTDC",
  "India Post",
  "Xpressbees",
  "Shadowfax",
  "Ecom Express",
];

export function FulfillmentStatusSelect({
  orderId,
  orderNumber = "",
  customerName = "",
  initialStatus,
  initialTrackingNumber = "",
  initialCarrierName = "",
  initialTrackingUrl = "",
}: Props) {
  const [status, setStatus] = useState(initialStatus || "PENDING");
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || "");
  const [carrierName, setCarrierName] = useState(initialCarrierName || "");
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl || "");

  const [isUpdating, setIsUpdating] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  // Shipped Tracking Modal State
  const [showShippedModal, setShowShippedModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("SHIPPED");
  const [formTrackingNumber, setFormTrackingNumber] = useState(initialTrackingNumber || "");
  const [formCarrierName, setFormCarrierName] = useState(initialCarrierName || "");
  const [formTrackingUrl, setFormTrackingUrl] = useState(initialTrackingUrl || "");
  const [formError, setFormError] = useState("");

  const executeStatusUpdate = async (
    targetStatus: string,
    extraFields?: { trackingNumber?: string; carrierName?: string; trackingUrl?: string }
  ) => {
    const prevStatus = status;
    setStatus(targetStatus);
    setIsUpdating(true);
    setJustUpdated(false);

    try {
      const payload: Record<string, string | null> = { status: targetStatus };
      if (extraFields) {
        if (extraFields.trackingNumber !== undefined) payload.trackingNumber = extraFields.trackingNumber;
        if (extraFields.carrierName !== undefined) payload.carrierName = extraFields.carrierName;
        if (extraFields.trackingUrl !== undefined) payload.trackingUrl = extraFields.trackingUrl;
      }

      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (extraFields) {
          if (extraFields.trackingNumber !== undefined) setTrackingNumber(extraFields.trackingNumber);
          if (extraFields.carrierName !== undefined) setCarrierName(extraFields.carrierName);
          if (extraFields.trackingUrl !== undefined) setTrackingUrl(extraFields.trackingUrl);
        }
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 2000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to update order status on server.");
        setStatus(prevStatus);
      }
    } catch {
      alert("Network error updating order status. Please check your connection.");
      setStatus(prevStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDropdownChange = (newStatus: string) => {
    if (newStatus === "SHIPPED") {
      // Open modal to collect/confirm AWB & Courier Details
      setPendingStatus("SHIPPED");
      setFormTrackingNumber(trackingNumber);
      setFormCarrierName(carrierName);
      setFormTrackingUrl(trackingUrl);
      setFormError("");
      setShowShippedModal(true);
      return;
    }

    void executeStatusUpdate(newStatus);
  };

  const handleConfirmShipped = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTrackingNumber.trim()) {
      setFormError("Please enter an AWB / Tracking number.");
      return;
    }

    setFormError("");
    await executeStatusUpdate(pendingStatus, {
      trackingNumber: formTrackingNumber.trim(),
      carrierName: formCarrierName.trim(),
      trackingUrl: formTrackingUrl.trim(),
    });
    setShowShippedModal(false);
  };

  const currentConfig = STATUS_CONFIG[status] || {
    label: status,
    badgeClass: "bg-gray-100 text-gray-800 border-gray-300 focus:ring-gray-400",
  };

  const livePreviewUrl = resolveTrackingUrl(formCarrierName, formTrackingNumber, formTrackingUrl);
  const activeResolvedTrackingUrl = resolveTrackingUrl(carrierName, trackingNumber, trackingUrl);

  return (
    <div className="flex flex-col gap-1 items-start">
      <div className="relative inline-flex items-center gap-1.5">
        <select
          value={status === "PROCESSING" ? "PENDING" : status === "OUT_FOR_DELIVERY" ? "SHIPPED" : status}
          onChange={(e) => handleDropdownChange(e.target.value)}
          disabled={isUpdating}
          aria-label="Fulfillment status"
          className={`text-xs font-bold px-3 py-1.5 rounded-xl border appearance-none pr-7 cursor-pointer transition-all shadow-xs focus:outline-none focus:ring-2 disabled:opacity-60 ${currentConfig.badgeClass}`}
        >
          <option value="PENDING">⏳ Pending</option>
          <option value="PACKED">📦 Packaged</option>
          <option value="SHIPPED">🚚 Shipped</option>
          <option value="DELIVERED">✅ Delivered</option>
          <option value="CANCELLED">❌ Cancelled</option>
        </select>

        <div className="absolute right-2.5 pointer-events-none text-xs opacity-60">
          ▼
        </div>

        {isUpdating && (
          <Loader2 size={13} className="animate-spin text-gray-500 absolute -right-5" />
        )}
        {justUpdated && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded absolute -bottom-5 left-0 shadow-xs z-10 whitespace-nowrap animate-fade-in-up">
            Saved!
          </span>
        )}
      </div>

      {/* When Shipped or Tracking details are present, display AWB & courier info + Edit button */}
      {(status === "SHIPPED" || trackingNumber) && (
        <div className="mt-1 flex flex-col gap-0.5 max-w-[210px]">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] leading-tight">
            {carrierName ? (
              <span className="font-semibold text-gray-700">{carrierName}:</span>
            ) : null}

            {trackingNumber ? (
              <a
                href={activeResolvedTrackingUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200/80 inline-flex items-center gap-0.5 transition-colors"
                title="Click to test customer tracking redirection"
              >
                <span>AWB {trackingNumber}</span>
                <ExternalLink size={10} />
              </a>
            ) : (
              <span className="text-gray-400 italic text-[10px]">No AWB added</span>
            )}

            <button
              type="button"
              onClick={() => {
                setPendingStatus(status === "SHIPPED" ? "SHIPPED" : status);
                setFormTrackingNumber(trackingNumber);
                setFormCarrierName(carrierName);
                setFormTrackingUrl(trackingUrl);
                setFormError("");
                setShowShippedModal(true);
              }}
              className="text-[10px] font-semibold text-brand-green hover:underline cursor-pointer inline-flex items-center gap-0.5"
              title="Update AWB / Courier details"
            >
              <Edit3 size={10} /> Edit
            </button>
          </div>
        </div>
      )}

      {/* SHIPPED TRACKING MODAL */}
      {showShippedModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isUpdating) {
              setShowShippedModal(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-purple-50/70 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Mark Order as Shipped</h3>
                  <p className="text-xs text-gray-500">
                    {orderNumber ? `Order #${orderNumber}` : "Dispatch Details"}
                    {customerName ? ` · ${customerName}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShippedModal(false)}
                disabled={isUpdating}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmShipped} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              {/* AWB Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  AWB / Consignment Tracking Number *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formTrackingNumber}
                  onChange={(e) => setFormTrackingNumber(e.target.value)}
                  placeholder="e.g. DEL782391039 or 148291038"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono text-gray-900 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Customer will see this number and can click on it to open tracking.
                </p>
              </div>

              {/* Courier Partner Details */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Courier Partner Details
                </label>
                <input
                  type="text"
                  value={formCarrierName}
                  onChange={(e) => setFormCarrierName(e.target.value)}
                  placeholder="e.g. Delhivery, Blue Dart, Shiprocket, DTDC..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-gray-400 font-semibold">Quick pick:</span>
                  {POPULAR_CARRIERS.map((carrier) => (
                    <button
                      key={carrier}
                      type="button"
                      onClick={() => setFormCarrierName(carrier)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        formCarrierName.toLowerCase() === carrier.toLowerCase()
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {carrier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Tracking URL (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Direct Tracking Link <span className="font-normal text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formTrackingUrl}
                  onChange={(e) => setFormTrackingUrl(e.target.value)}
                  placeholder="Optional: leave blank to auto-generate tracking URL"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                />
              </div>

              {/* Real-time Tracking Redirection Preview */}
              <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3 space-y-1">
                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                  Customer Click Preview
                </span>
                {livePreviewUrl ? (
                  <div className="flex items-center gap-1.5 text-xs text-purple-700 break-all">
                    <ExternalLink size={12} className="shrink-0 text-purple-600" />
                    <span>Redirects to: </span>
                    <a
                      href={livePreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-mono text-[11px] hover:text-purple-900"
                    >
                      {livePreviewUrl}
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Enter an AWB number above to preview tracking link...
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowShippedModal(false)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !formTrackingNumber.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-700 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-50 transition cursor-pointer shadow-sm"
                >
                  {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>Confirm &amp; Mark Shipped</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
