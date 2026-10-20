"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle, Clock, Printer, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { FulfillmentStatusSelect } from "./FulfillmentStatusSelect";

type Order = Prisma.OrderGetPayload<{ include: { items: true } }>;
type RangeMode = "day" | "week" | "month" | "range";

function localDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRange(dateValue: string, mode: RangeMode, rangeFrom: string, rangeTo: string) {
  if (mode === "range") {
    const start = new Date(`${rangeFrom}T00:00:00`);
    const end = new Date(`${rangeTo}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null;
    return { start, end };
  }
  const selected = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return null;
  const start = new Date(selected);
  const end = new Date(selected);
  if (mode === "week") {
    const daysFromMonday = (selected.getDay() + 6) % 7;
    start.setDate(selected.getDate() - daysFromMonday);
    end.setDate(start.getDate() + 6);
  } else if (mode === "month") {
    start.setDate(1);
    end.setMonth(selected.getMonth() + 1, 0);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [mode, setMode] = useState<RangeMode>("day");
  const [dateValue, setDateValue] = useState(() => localDateInputValue(new Date()));
  const [rangeFrom, setRangeFrom] = useState(() => localDateInputValue(new Date()));
  const [rangeTo, setRangeTo] = useState(() => localDateInputValue(new Date()));
  const [appliedRange, setAppliedRange] = useState<ReturnType<typeof getRange>>(null);
  const [appliedLabel, setAppliedLabel] = useState("");

  const visibleOrders = useMemo(() => {
    if (!appliedRange) return orders;
    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= appliedRange.start && createdAt <= appliedRange.end;
    });
  }, [orders, appliedRange]);

  const applyFilter = () => {
    const range = getRange(dateValue, mode, rangeFrom, rangeTo);
    if (!range) return;
    setAppliedRange(range);
    const selected = new Date(`${dateValue}T00:00:00`);
    const formatted = (value: Date) => value.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    setAppliedLabel(mode === "range"
      ? `${formatted(range.start)} – ${formatted(range.end)}`
      : mode === "day"
      ? formatted(selected)
      : `${formatted(range.start)} – ${formatted(range.end)}`);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setAppliedRange(null);
    setAppliedLabel("");
    setFilterOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-sm font-semibold text-gray-800">Order list</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {appliedRange ? `Showing ${visibleOrders.length} of ${orders.length} orders · ${appliedLabel}` : `${orders.length} orders across all dates`}
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          {appliedRange && (
            <button type="button" onClick={clearFilter} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100">
              <X size={15} /> Clear
            </button>
          )}
          <button
            type="button"
            aria-expanded={filterOpen}
            aria-controls="orders-date-filter"
            onClick={() => setFilterOpen((open) => !open)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${appliedRange ? "border-emerald-300 bg-emerald-50 text-brand-green" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
          >
            <SlidersHorizontal size={16} /> Filter
            {appliedRange && <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="Filter active" />}
          </button>
          {filterOpen && (
            <div id="orders-date-filter" className="absolute right-0 top-full z-30 mt-2 w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-4 shadow-xl sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Filter orders</h2>
                  <p className="mt-1 text-xs text-stone-500">Choose a date or time period.</p>
                </div>
                <button type="button" aria-label="Close date filter" onClick={() => setFilterOpen(false)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"><X size={16} /></button>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-stone-100 p-1" role="group" aria-label="Date filter period">
                {(["day", "week", "month", "range"] as const).map((option) => (
                  <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)} className={`rounded-lg px-1.5 py-2 text-xs font-bold transition ${mode === option ? "bg-white text-brand-green shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>
                    {option === "day" ? "Date" : option === "range" ? "Range" : option[0].toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>

              {mode === "range" ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-stone-700">From
                    <input type="date" value={rangeFrom} max={rangeTo || undefined} onChange={(event) => setRangeFrom(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-stone-200 bg-white px-2.5 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                  </label>
                  <label className="text-xs font-semibold text-stone-700">To
                    <input type="date" value={rangeTo} min={rangeFrom || undefined} onChange={(event) => setRangeTo(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-stone-200 bg-white px-2.5 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                  </label>
                </div>
              ) : (
                <label className="mt-4 block text-xs font-semibold text-stone-700">
                  {mode === "day" ? "Select date" : mode === "week" ? "Select any date in the week" : "Select any date in the month"}
                  <span className="relative mt-1.5 block">
                    <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm font-normal text-stone-900 outline-none transition focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                  </span>
                </label>
              )}

              <p className="mt-3 text-xs text-stone-500">
                {mode === "range" ? "Both dates are included." : mode === "week" ? "The full Monday–Sunday week is included." : mode === "month" ? "All days in the selected month are included." : "Orders placed on the selected date are shown."}
              </p>
              <div className="mt-4 flex justify-end gap-2 border-t border-stone-100 pt-4">
                <button type="button" onClick={clearFilter} className="rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100">Clear</button>
                <button type="button" onClick={applyFilter} disabled={mode === "range" ? !rangeFrom || !rangeTo || rangeFrom > rangeTo : !dateValue} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:opacity-50"><SlidersHorizontal size={14} /> Apply filter</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Payment</th>
                <th className="px-6 py-4 font-semibold">Fulfillment</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-center font-semibold">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {visibleOrders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-gray-50/70">
                  <td className="break-all px-6 py-4 font-bold text-brand-green">{order.orderNumber}</td>
                  <td className="px-6 py-4"><div className="font-semibold text-gray-800">{order.customerName}</div><div className="text-xs text-gray-400">{order.customerPhone}</div></td>
                  <td className="px-6 py-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {order.paymentStatus === "PAID" ? <CheckCircle size={12} /> : <Clock size={12} />}{order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4"><FulfillmentStatusSelect orderId={order.id} orderNumber={order.orderNumber} customerName={order.customerName} initialStatus={order.fulfillmentStatus} initialTrackingNumber={order.trackingNumber} initialCarrierName={order.carrierName} initialTrackingUrl={order.trackingUrl} /></td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">₹{(order.totalAmount / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/admin/orders/${order.id}/slip`} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green/10 px-3 py-1.5 text-xs font-bold text-brand-green shadow-sm transition-all hover:bg-brand-green hover:text-white" title="Print Dispatch Receipt / Packaging Slip">
                      <Printer size={13} /><span>Print Slip</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {visibleOrders.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400"><ShoppingBag size={36} className="mx-auto mb-2 text-gray-300" />{appliedRange ? "No orders found in this date range. Try another date or clear the filter." : "No orders placed yet. New store orders will appear here automatically."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
