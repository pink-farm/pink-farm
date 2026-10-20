"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock3, Mail, PackageX, ShieldCheck, Trash2 } from "lucide-react";

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
  const progressStep = step === "ready" ? 0 : step === "otp" ? 1 : step === "confirm" ? 2 : 3;
  const choices: { value: DeleteMode; title: string; description: string; icon: typeof CalendarDays; danger?: boolean }[] = [
    { value: "range", title: "Date range", description: "Remove orders within selected dates.", icon: CalendarDays },
    { value: "single", title: "One order", description: "Find and remove a specific order.", icon: PackageX },
    { value: "all", title: "All history", description: "Remove every order from the store.", icon: Trash2, danger: true },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_4px_20px_rgba(28,50,42,0.05)]" aria-labelledby="order-history-title">
      <div className="flex flex-col gap-4 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-100">
          <Trash2 size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="order-history-title" className="text-base font-bold text-stone-900">Order history cleanup</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">Choose a date range, a specific order, or the full order history. Related order items are removed with each order.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <ShieldCheck size={14} /> Email protected
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {step !== "done" && (
          <ol className="mb-6 flex max-w-2xl items-center" aria-label="Deletion steps">
            {["Choose", "Verify", "Confirm"].map((label, index) => {
              const complete = progressStep > index;
              const current = progressStep === index;
              return (
                <li key={label} className={`flex items-center ${index < 2 ? "flex-1" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-brand-green text-white" : current ? "bg-brand-green text-white ring-4 ring-emerald-100" : "bg-stone-100 text-stone-500"}`}>
                      {complete ? <Check size={14} /> : index + 1}
                    </span>
                    <span className={`text-xs font-semibold ${current ? "text-stone-900" : complete ? "text-brand-green" : "text-stone-400"}`}>{label}</span>
                  </div>
                  {index < 2 && <span className={`mx-3 h-px flex-1 ${complete ? "bg-emerald-300" : "bg-stone-200"}`} />}
                </li>
              );
            })}
          </ol>
        )}

        {step === "ready" && (
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-bold text-stone-800">What would you like to remove?</p>
              <div className="grid gap-3 md:grid-cols-3">
                {choices.map(({ value, title, description, icon: Icon, danger }) => {
                  const active = mode === value;
                  return (
                    <button key={value} type="button" aria-pressed={active} onClick={() => setMode(value)} className={`group rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${active ? danger ? "border-rose-300 bg-rose-50/70 ring-1 ring-rose-200" : "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200" : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"}`}>
                      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${danger ? "bg-rose-100 text-rose-700" : active ? "bg-emerald-100 text-brand-green" : "bg-stone-100 text-stone-500 group-hover:text-stone-700"}`}><Icon size={17} /></span>
                      <span className="block text-sm font-bold text-stone-900">{title}</span>
                      <span className="mt-1 block text-xs leading-5 text-stone-500">{description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {mode === "range" && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-800"><Clock3 size={16} className="text-stone-500" /> Select the order dates</div>
                <div className="grid gap-3 sm:grid-cols-2 sm:max-w-xl">
                  <label className="space-y-1.5 text-xs font-semibold text-stone-600">From
                    <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal text-stone-900 shadow-sm outline-none transition focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                  </label>
                  <label className="space-y-1.5 text-xs font-semibold text-stone-600">Through
                    <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal text-stone-900 shadow-sm outline-none transition focus:border-brand-green focus:ring-4 focus:ring-emerald-50" />
                  </label>
                </div>
                <p className="mt-3 text-xs text-stone-500">Both selected dates are included.</p>
              </div>
            )}

            {mode === "single" && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
                <label htmlFor="order-history-single-order" className="block max-w-xl space-y-2 text-sm font-bold text-stone-800">Find an order
                  <select id="order-history-single-order" value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm font-normal text-stone-900 shadow-sm outline-none transition focus:border-brand-green focus:ring-4 focus:ring-emerald-50">
                    <option value="">Choose an order…</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>{order.orderNumber} · {new Date(order.createdAt).toLocaleString()}</option>
                    ))}
                  </select>
                  {orders.length === 0 && <span className="block text-xs font-normal text-stone-500">There are no orders to delete.</span>}
                </label>
              </div>
            )}

            {mode === "all" && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-900">
                <Trash2 size={17} className="mt-0.5 shrink-0 text-rose-700" />
                <p><strong>Full history deletion.</strong> Every order and its items will be permanently removed after verification.</p>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-stone-500">You’ll review the matching order count before anything is deleted.</p>
              <button type="button" onClick={() => void runAction("send")} disabled={busy || (mode === "single" && orders.length === 0)} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-green-dark focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-wait disabled:opacity-60">
                <Mail size={16} /> {busy ? "Sending code…" : "Continue to email verification"}
              </button>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="mx-auto max-w-xl space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-900"><Mail size={16} /> Check the administrator email</div>
              <p role="status" className="mt-1 text-xs leading-5 text-emerald-800">{message}</p>
              <p className="mt-2 text-xs text-emerald-900">Selected target: <strong>{targetDescription}</strong></p>
            </div>
            <div className="space-y-2">
              <label htmlFor="order-history-otp" className="block text-sm font-bold text-stone-800">Enter your 6-digit code</label>
              <input id="order-history-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="• • • • • •" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-center font-mono text-lg tracking-[0.5em] shadow-sm outline-none transition focus:border-brand-green focus:ring-4 focus:ring-emerald-50 sm:w-72" />
              <p className="text-xs text-stone-500">The code expires after 10 minutes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void runAction("verify")} disabled={busy || code.length !== 6} className="cursor-pointer rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Verifying…" : "Verify code"}</button>
              <button type="button" onClick={() => void runAction("send")} disabled={busy} className="cursor-pointer rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50">Resend code</button>
              <button type="button" onClick={cancel} disabled={busy} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-500 transition hover:bg-stone-100 disabled:opacity-50">Cancel</button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-5 sm:p-6" role="alert">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><Trash2 size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-rose-950">Confirm permanent deletion</p>
                  <p className="mt-1 text-sm leading-6 text-rose-900">This cannot be undone. Products and customer accounts will remain.</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Selected target</p>
                  <p className="mt-1 text-sm font-bold text-stone-900">{targetDescription}</p>
                  <p className="mt-1 text-xs text-stone-500">Order items will be deleted with their orders.</p>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="text-3xl font-bold tracking-tight text-rose-800">{orderCount}</p>
                  <p className="text-xs font-semibold text-stone-500">matching orders</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={cancel} disabled={busy} className="cursor-pointer rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50">Cancel and keep orders</button>
              <button type="button" onClick={() => void runAction("delete")} disabled={busy || orderCount === 0} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={15} /> {busy ? "Deleting orders…" : `Permanently delete ${orderCount} order${orderCount === 1 ? "" : "s"}`}</button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Check size={18} /></span>
              <div><p className="text-sm font-bold text-emerald-950">Deletion complete</p><p role="status" className="mt-1 text-sm text-emerald-800">{message}</p></div>
            </div>
            <button type="button" onClick={cancel} className="cursor-pointer rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100">Delete more history</button>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>}
      </div>
    </section>
  );
}
