"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CalendarRange, CheckCircle, Clock, Printer, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { FulfillmentStatusSelect } from "./FulfillmentStatusSelect";

type Order = Prisma.OrderGetPayload<{ include: { items: true } }>;
type RangeMode = "day" | "week" | "month";

function localDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRange(dateValue: string, mode: RangeMode) {
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
    const range = getRange(dateValue, mode);
    if (!range) return;
    setAppliedRange(range);
    const selected = new Date(`${dateValue}T00:00:00`);
    const formatted = (value: Date) => value.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    setAppliedLabel(mode === "day"
      ? formatted(selected)
      : `${formatted(range.start)} – ${formatted(range.end)}`);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setAppliedRange(null);
    setAppliedLabel("");
    setFilterOpen(false);
  };

  const filterChoices: { value: RangeMode; title: string; description: string; icon: typeof CalendarDays }[] = [
    { value: "day", title: "Specific date", description: "Show orders from one day.", icon: CalendarDays },
    { value: "week", title: "One week", description: "Show Monday through Sunday.", icon: CalendarRange },
    { value: "month", title: "One month", description: "Show all orders in that month.", icon: CalendarDays },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-sm font-semibold text-gray-800">Order list</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {appliedRange ? `Showing ${visibleOrders.length} of ${orders.length} orders · ${appliedLabel}` : `${orders.length} orders across all dates`}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {filterOpen && (
        <section id="orders-date-filter" className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_4px_20px_rgba(28,50,42,0.05)]" aria-labelledby="orders-date-filter-title">
          <div className="flex items-start justify-between gap-4 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-brand-green ring-1 ring-emerald-100"><SlidersHorizontal size={19} /></span>
              <div>
                <h2 id="orders-date-filter-title" className="text-base font-bold text-stone-900">Filter orders</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">Choose a date, week, or month to narrow the order list.</p>
              </div>
            </div>
            <button type="button" aria-label="Close date filter" onClick={() => setFilterOpen(false)} className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"><X size={18} /></button>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="mb-3 text-sm font-bold text-stone-800">Select a time period</p>
              <div className="grid gap-3 md:grid-cols-3" role="group" aria-label="Date filter period">
                {filterChoices.map(({ value, title, description, icon: Icon }) => {
                  const active = mode === value;
                  return (
                    <button key={value} type="button" aria-pressed={active} onClick={() => setMode(value)} className={`rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${active ? "border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-200" : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"}`}>
                      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-emerald-100 text-brand-green" : "bg-stone-100 text-stone-500"}`}><Icon size={17} /></span>
                      <span className="block text-sm font-bold text-stone-900">{title}</span>
                      <span className="mt-1 block text-xs leading-5 text-stone-500">{description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
              <label className="block max-w-md text-sm font-bold text-stone-800">
                {mode === "day" ? "Select the order date" : mode === "week" ? "Select any date in the week" : "Select any date in the month"}
                <span className="relative mt-2 block">
                  <CalendarDays size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-3 text-sm font-normal text-stone-900 shadow-sm outline-none transition focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                </span>
              </label>
              <p className="mt-3 text-xs text-stone-500">{mode === "week" ? "The full Monday–Sunday week will be included." : mode === "month" ? "All days in the selected calendar month will be included." : "Orders placed on this date will be shown."}</p>
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-stone-500">Filtering only changes the orders displayed. No orders are modified.</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" onClick={clearFilter} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">Clear filter</button>
                <button type="button" onClick={applyFilter} disabled={!dateValue} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-green-dark focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:opacity-50"><SlidersHorizontal size={15} /> Apply filter</button>
              </div>
            </div>
          </div>
        </section>
      )}

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
