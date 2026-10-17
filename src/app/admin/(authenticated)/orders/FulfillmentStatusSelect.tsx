"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  orderId: string;
  initialStatus: string;
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
    label: "📦 Packaged",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-300 focus:ring-blue-400",
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

export function FulfillmentStatusSelect({ orderId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus || "PENDING");
  const [isUpdating, setIsUpdating] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const handleChange = async (newStatus: string) => {
    setStatus(newStatus);
    setIsUpdating(true);
    setJustUpdated(false);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 2000);
      } else {
        console.error("Failed to update status on server");
      }
    } catch {
      console.error("Network error updating order status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentConfig = STATUS_CONFIG[status] || {
    label: status,
    badgeClass: "bg-gray-100 text-gray-800 border-gray-300 focus:ring-gray-400",
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <select
        value={status === "PROCESSING" ? "PACKED" : status === "OUT_FOR_DELIVERY" ? "SHIPPED" : status}
        onChange={(e) => handleChange(e.target.value)}
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
        <Loader2 size={13} className="animate-spin text-gray-500 absolute -right-4" />
      )}
      {justUpdated && (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded absolute -bottom-5 left-0 shadow-xs z-10 whitespace-nowrap animate-fade-in-up">
          Saved!
        </span>
      )}
    </div>
  );
}
