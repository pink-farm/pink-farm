"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2 } from "lucide-react";

type OrderOption = { id: string; orderNumber: string; createdAt: string };
type DeleteScope =
  | { type: "all" }
  | { type: "range"; from: string; to: string }
  | { type: "single"; orderId: string };
type DeleteMode = DeleteScope["type"];
type Step = "ready" | "otp" | "confirm" | "done";

interface OrderHistoryClearControlProps {
  orders: OrderOption[];
}

export function OrderHistoryClearControl({ orders }: OrderHistoryClearControlProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("ready");
  const [mode, setMode] = useState<DeleteMode>("range");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [pendingScope, setPendingScope] = useState<DeleteScope | null>(null);
  const [code, setCode] = useState("");
  const [grant, setGrant] = useState("");
  const [orderCount, setOrderCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getSelectedScope = (): DeleteScope => {
    if (mode === "all") return { type: "all" };
    if (mode === "single") {
      if (!selectedOrderId) throw new Error("Choose an order to delete.");
      return { type: "single", orderId: selectedOrderId };
    }
    if (!fromDate || !toDate) throw new Error("Choose both the start and end dates.");
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T00:00:00`);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) {
      throw new Error("The end date must be the same as or later than the start date.");
    }
    to.setDate(to.getDate() + 1);
    return { type: "range", from: from.toISOString(), to: to.toISOString() };
  };

  const runAction = async (action: "send" | "verify" | "delete") => {
    setError("");
    let scope = pendingScope;
    if (action === "send") {
      try {
        scope = getSelectedScope();
        setPendingScope(scope);
      } catch (selectionError) {
        setError(selectionError instanceof Error ? selectionError.message : "Choose what to delete.");
        return;
      }
    }
    if (!scope) {
      setError("Choose a deletion target and request a new verification code.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/order-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          scope,
          ...(action === "verify" ? { code } : {}),
          ...(action === "delete" ? { grant } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to complete this action.");

      if (action === "send") {
        setStep("otp");
        setMessage(data.message || "A verification code was sent to the administrator email.");
      } else if (action === "verify") {
        setGrant(data.grant);
        setOrderCount(data.orderCount);
        setStep("confirm");
      } else {
        setStep("done");
        setGrant("");
        setCode("");
        setPendingScope(null);
        setMessage(`${data.deletedOrders} order${data.deletedOrders === 1 ? "" : "s"} and their items were permanently deleted.`);
        router.refresh();
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete this action.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setStep("ready");
    setCode("");
    setGrant("");
    setPendingScope(null);
    setOrderCount(0);
    setError("");
    setMessage("");
  };

  const selectedOrder = orders.find((order) => order.id === (pendingScope?.type === "single" ? pendingScope.orderId : selectedOrderId));
  const targetDescription = pendingScope?.type === "all"
    ? "all order history"
    : pendingScope?.type === "single"
      ? `order ${selectedOrder?.orderNumber || "selected"}`
      : pendingScope?.type === "range"
        ? `orders from ${fromDate} through ${toDate}`
        : "selected orders";

  return (
    <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-7" aria-labelledby="order-history-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
          <Trash2 size={19} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="order-history-title" className="text-sm font-bold uppercase tracking-wider text-stone-900">Manage order history</h2>
          <p className="text-xs leading-5 text-stone-600">
            Permanently delete orders for a date range, one selected order, or all history. Order items are removed with each order. Email verification is required.
          </p>
        </div>
      </div>

      {step === "ready" && (
        <div className="mt-4 space-y-3">
          <label htmlFor="order-history-delete-mode" className="block text-xs font-bold text-stone-700">Choose what to delete</label>
          <select id="order-history-delete-mode" value={mode} onChange={(event) => setMode(event.target.value as DeleteMode)} className="w-full max-w-md rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-green focus:outline-none">
            <option value="range">Orders within a date range</option>
            <option value="single">One specific order</option>
            <option value="all">All order history</option>
          </select>

          {mode === "range" && (
            <div className="flex flex-wrap gap-3">
              <label className="space-y-1 text-xs font-semibold text-stone-600">From
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="block rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900 focus:border-brand-green focus:outline-none" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-stone-600">Through
                <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="block rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal text-stone-900 focus:border-brand-green focus:outline-none" />
              </label>
            </div>
          )}

          {mode === "single" && (
            <label htmlFor="order-history-single-order" className="block max-w-md space-y-1 text-xs font-semibold text-stone-600">Select an order
              <select id="order-history-single-order" value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-normal text-stone-900 focus:border-brand-green focus:outline-none">
                <option value="">Choose an order…</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>{order.orderNumber} — {new Date(order.createdAt).toLocaleString()}</option>
                ))}
              </select>
              {orders.length === 0 && <span className="block font-normal text-stone-500">There are no orders to delete.</span>}
            </label>
          )}

          <button type="button" onClick={() => void runAction("send")} disabled={busy} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-bold text-rose-800 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60">
            <Mail size={16} /> {busy ? "Sending code…" : "Send verification code"}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="mt-4 max-w-md space-y-3">
          <p role="status" className="text-xs font-medium text-emerald-800">{message}</p>
          <p className="text-xs text-stone-600">Target: <strong>{targetDescription}</strong></p>
          <label htmlFor="order-history-otp" className="block text-xs font-bold text-stone-700">Enter the 6-digit code</label>
          <input id="order-history-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-mono tracking-[0.35em] focus:border-brand-green focus:outline-none sm:w-64" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void runAction("verify")} disabled={busy || code.length !== 6} className="cursor-pointer rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Verifying…" : "Verify code"}</button>
            <button type="button" onClick={() => void runAction("send")} disabled={busy} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-50">Resend code</button>
            <button type="button" onClick={cancel} disabled={busy} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="mt-4 space-y-4 rounded-xl border border-rose-300 bg-rose-50 p-4" role="alert">
          <div>
            <p className="text-sm font-bold text-rose-900">Warning: this permanently deletes order history.</p>
            <p className="mt-1 text-xs leading-5 text-rose-800">
              This will delete {orderCount} order{orderCount === 1 ? "" : "s"} from {targetDescription}, including associated order items. This cannot be undone. Products and customer accounts will remain.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void runAction("delete")} disabled={busy || orderCount === 0} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"><Trash2 size={15} /> {busy ? "Deleting history…" : "Permanently delete selected orders"}</button>
            <button type="button" onClick={cancel} disabled={busy} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-white disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="mt-4 space-y-3">
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>
          <button type="button" onClick={cancel} className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100">Delete more order history</button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p>}
    </section>
  );
}
