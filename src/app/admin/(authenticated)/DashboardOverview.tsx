"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Banknote,
  ShoppingBag,
  Clock,
  Package,
  Printer,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { OrderHistoryClearControl } from "./OrderHistoryClearControl";

export type TimePeriod = "today" | "weekly" | "monthly" | "yearly" | "all";

export interface SerializedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
}

interface DashboardOverviewProps {
  initialOrders: SerializedOrder[];
  lowStockCount: number;
}

export function isWithinPeriod(dateStr: string, period: TimePeriod): boolean {
  if (period === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();

  if (period === "today") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  if (period === "weekly") {
    // Last 7 days (rolling 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return d >= sevenDaysAgo;
  }

  if (period === "monthly") {
    // Last 30 days (rolling 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return d >= thirtyDaysAgo;
  }

  if (period === "yearly") {
    // Current calendar year (since Jan 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    return d >= startOfYear;
  }

  return true;
}

const PERIOD_OPTIONS: { id: TimePeriod; label: string; shortLabel: string; description: string }[] = [
  { id: "today", label: "Today", shortLabel: "Today", description: "Orders placed today" },
  { id: "weekly", label: "Weekly (Last 7 Days)", shortLabel: "Weekly", description: "Orders in the last 7 days" },
  { id: "monthly", label: "Monthly (Last 30 Days)", shortLabel: "Monthly", description: "Orders in the last 30 days" },
  { id: "yearly", label: "Yearly (This Year)", shortLabel: "Yearly", description: "Orders in current calendar year" },
  { id: "all", label: "All Time", shortLabel: "All Time", description: "All historical store orders" },
];

export function DashboardOverview({ initialOrders, lowStockCount }: DashboardOverviewProps) {
  // Read initial period from localStorage if available, default to "today" or "weekly"
  const [period, setPeriod] = useState<TimePeriod>("today");
  const [searchQuery, setSearchQuery] = useState("");

  // Hydrate this client-only preference from URL/localStorage after mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Check URL param or saved preference
    const params = new URLSearchParams(window.location.search);
    const urlPeriod = params.get("period") as TimePeriod;
    if (urlPeriod && ["today", "weekly", "monthly", "yearly", "all"].includes(urlPeriod)) {
      setPeriod(urlPeriod);
    } else {
      const saved = localStorage.getItem("pinkfarm_dashboard_period") as TimePeriod;
      if (saved && ["today", "weekly", "monthly", "yearly", "all"].includes(saved)) {
        setPeriod(saved);
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    try {
      localStorage.setItem("pinkfarm_dashboard_period", newPeriod);
      const url = new URL(window.location.href);
      url.searchParams.set("period", newPeriod);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  // Pre-calculate counts for all periods so badges can be shown in buttons/dropdown
  const periodCounts = useMemo(() => {
    return {
      today: initialOrders.filter((o) => isWithinPeriod(o.createdAt, "today")).length,
      weekly: initialOrders.filter((o) => isWithinPeriod(o.createdAt, "weekly")).length,
      monthly: initialOrders.filter((o) => isWithinPeriod(o.createdAt, "monthly")).length,
      yearly: initialOrders.filter((o) => isWithinPeriod(o.createdAt, "yearly")).length,
      all: initialOrders.length,
    };
  }, [initialOrders]);

  // Orders filtered by the selected period
  const ordersInPeriod = useMemo(() => {
    return initialOrders.filter((o) => isWithinPeriod(o.createdAt, period));
  }, [initialOrders, period]);

  // Calculated Stats for the selected period
  const stats = useMemo(() => {
    const totalOrders = ordersInPeriod.length;
    const paidOrders = ordersInPeriod.filter((o) => o.paymentStatus === "PAID");
    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const pendingOrders = ordersInPeriod.filter(
      (o) => (o.fulfillmentStatus === "PENDING" || o.fulfillmentStatus === "PROCESSING") && o.paymentStatus === "PAID"
    ).length;
    const aov = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      paidOrdersCount: paidOrders.length,
      unpaidOrdersCount: totalOrders - paidOrders.length,
      aov,
    };
  }, [ordersInPeriod]);

  // Search filtered orders
  const displayedOrders = useMemo(() => {
    if (!searchQuery.trim()) return ordersInPeriod;
    const q = searchQuery.toLowerCase().trim();
    return ordersInPeriod.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q)
    );
  }, [ordersInPeriod, searchQuery]);

  const activeOption = PERIOD_OPTIONS.find((opt) => opt.id === period) || PERIOD_OPTIONS[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ============================================================== */}
      {/* HEADER SECTION WITH EYE-SOOTHING FILTER DROPDOWN & PILLS       */}
      {/* ============================================================== */}
      <div className="bg-white/95 rounded-2xl border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                Dashboard Overview
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                {activeOption.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500">
              {period === "today" && "Here is what's happening in your store today."}
              {period === "weekly" && "Here is what's happening in your store this week (last 7 days)."}
              {period === "monthly" && "Here is what's happening in your store this month (last 30 days)."}
              {period === "yearly" && "Here is what's happening in your store this year."}
              {period === "all" && "Here is what's happening across all store history."}
            </p>
          </div>

          {/* Time Filter Controls: Segmented Pills + Dropdown Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 self-start lg:self-auto">
            {/* Segmented Pills for Desktop / Tablets */}
            <div className="hidden md:flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/80">
              {PERIOD_OPTIONS.map((opt) => {
                const isSelected = period === opt.id;
                const count = periodCounts[opt.id];

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePeriodChange(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#1A4031] text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                    }`}
                  >
                    <span>{opt.shortLabel}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isSelected ? "bg-white/20 text-white" : "bg-stone-200/80 text-stone-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dropdown Menu (Accessible on Mobile & Compact Views) */}
            <div className="relative inline-flex items-center">
              <div className="absolute left-3 text-stone-500 pointer-events-none flex items-center">
                <Calendar size={14} className="text-brand-green" />
              </div>
              <select
                aria-label="Filter dashboard by time period"
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value as TimePeriod)}
                className="w-full sm:w-auto appearance-none pl-9 pr-9 py-2 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm font-bold text-stone-800 hover:border-stone-300 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 cursor-pointer shadow-xs transition-all"
              >
                <option value="today">📅 Today ({periodCounts.today})</option>
                <option value="weekly">📊 Weekly · Last 7 Days ({periodCounts.weekly})</option>
                <option value="monthly">🗓️ Monthly · Last 30 Days ({periodCounts.monthly})</option>
                <option value="yearly">📈 Yearly · This Year ({periodCounts.yearly})</option>
                <option value="all">🌐 All Time ({periodCounts.all})</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 text-stone-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Friendly context notification when viewing Today with 0 orders */}
        {period === "today" && stats.totalOrders === 0 && periodCounts.weekly > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                No orders have been placed today yet. You have <strong>{periodCounts.weekly} orders</strong> from this week.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handlePeriodChange("weekly")}
              className="inline-flex items-center gap-1 font-bold text-brand-green hover:underline cursor-pointer shrink-0"
            >
              <span>View This Week ({periodCounts.weekly})</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* METRIC CARDS (TOTAL REVENUE, ORDERS, PENDING, LOW STOCK)       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-stone-200/80 flex items-center gap-4 hover:border-stone-300 transition-all">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Banknote size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Total Revenue
              </p>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {activeOption.shortLabel}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mt-0.5 truncate">
              ₹{(stats.totalRevenue / 100).toFixed(2)}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate">
              {stats.paidOrdersCount > 0
                ? `${stats.paidOrdersCount} paid · Avg ₹${(stats.aov / 100).toFixed(0)}/order`
                : "No paid transactions in period"}
            </p>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-stone-200/80 flex items-center gap-4 hover:border-stone-300 transition-all">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <ShoppingBag size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Total Orders
              </p>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                {activeOption.shortLabel}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mt-0.5">
              {stats.totalOrders}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate">
              {stats.totalOrders > 0
                ? `${stats.paidOrdersCount} paid · ${stats.unpaidOrdersCount} unpaid`
                : "No orders in this timeframe"}
            </p>
          </div>
        </div>

        {/* Card 3: Pending Action */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-stone-200/80 flex items-center gap-4 hover:border-stone-300 transition-all">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Pending Action
              </p>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                {activeOption.shortLabel}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mt-0.5">
              {stats.pendingOrders}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate">
              {stats.pendingOrders > 0 ? "Awaiting dispatch & packing" : "All orders up to date"}
            </p>
          </div>
        </div>

        {/* Card 4: Low Stock Items */}
        <Link
          href="/admin/products"
          className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-stone-200/80 flex items-center gap-4 hover:border-stone-300 transition-all group"
        >
          <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
            <Package size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Low Stock Items
              </p>
              <ArrowUpRight
                size={14}
                className="text-stone-300 group-hover:text-brand-green transition-colors"
              />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mt-0.5">
              {lowStockCount}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate">
              {lowStockCount > 0 ? "Items need restock" : "Inventory healthy"}
            </p>
          </div>
        </Link>
      </div>

      <OrderHistoryClearControl orders={initialOrders.map(({ id, orderNumber, createdAt }) => ({ id, orderNumber, createdAt }))} />

      {/* ============================================================== */}
      {/* RECENT ORDERS SECTION WITH INSTANT SEARCH & PERIOD DATA        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-stone-200/80 overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                Recent Orders
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {displayedOrders.length} in {activeOption.shortLabel}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Displaying orders matching filter: <strong>{activeOption.label}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search customer, order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 w-48 sm:w-60 transition-all placeholder:text-stone-400"
              />
            </div>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-green hover:underline whitespace-nowrap"
            >
              <span>All Orders</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Table or Empty State */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-xs font-bold text-stone-500 uppercase tracking-wider bg-stone-50/60">
                <th className="py-3 px-5">Order #</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Date &amp; Time</th>
                <th className="py-3 px-5">Payment</th>
                <th className="py-3 px-5">Fulfillment</th>
                <th className="py-3 px-5 text-right">Total</th>
                <th className="py-3 px-5 text-center">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {displayedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-brand-green text-xs break-all">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-semibold text-stone-900 text-xs sm:text-sm">
                      {order.customerName}
                    </p>
                    <p className="text-[11px] text-stone-400">{order.customerPhone}</p>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-stone-600 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700">
                      {order.fulfillmentStatus === "PROCESSING" ? "PENDING" : order.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold text-stone-900 text-xs sm:text-sm">
                    ₹{(order.totalAmount / 100).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <Link
                      href={`/admin/orders/${order.id}/slip`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-2xs"
                      title="Print Dispatch Receipt / Packaging Slip"
                    >
                      <Printer size={12} />
                      <span>Slip</span>
                    </Link>
                  </td>
                </tr>
              ))}

              {displayedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 px-6 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                        <ShoppingBag size={22} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-stone-800 text-sm">
                          No orders found for {activeOption.label}
                        </p>
                        <p className="text-xs text-stone-500">
                          {searchQuery
                            ? "Try adjusting your search query."
                            : "There are no customer orders recorded in this specific time window."}
                        </p>
                      </div>

                      {!searchQuery && periodCounts.all > 0 && (
                        <div className="pt-2 flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePeriodChange("weekly")}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          >
                            View This Week ({periodCounts.weekly})
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePeriodChange("monthly")}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          >
                            View This Month ({periodCounts.monthly})
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePeriodChange("all")}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-green/10 hover:bg-brand-green/20 text-brand-green transition-colors cursor-pointer"
                          >
                            View All Time ({periodCounts.all})
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {displayedOrders.length > 0 && (
          <div className="p-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>
              Showing <strong>{displayedOrders.length}</strong> of{" "}
              <strong>{ordersInPeriod.length}</strong> order(s) for {activeOption.label}
            </span>
            <Link
              href="/admin/orders"
              className="font-bold text-brand-green hover:underline inline-flex items-center gap-1"
            >
              <span>Go to Orders Manager</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
