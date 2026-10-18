"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2 } from "lucide-react";

export function OrderHistoryClearControl() {
  const router = useRouter();
  const [step, setStep] = useState<"ready" | "otp" | "confirm" | "done">("ready");
  const [code, setCode] = useState("");
  const [grant, setGrant] = useState("");
  const [orderCount, setOrderCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const runAction = async (action: "send" | "verify" | "clear") => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/order-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "verify" ? { code } : {}),
          ...(action === "clear" ? { grant } : {}),
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
        setMessage(`${data.deletedOrders} order${data.deletedOrders === 1 ? "" : "s"} and their history were permanently deleted.`);
        router.refresh();
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete this action.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-7" aria-labelledby="order-history-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
          <Trash2 size={19} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="order-history-title" className="text-sm font-bold uppercase tracking-wider text-stone-900">Clear all order history</h2>
          <p className="text-xs leading-5 text-stone-600">
            Permanently remove all orders and their items. Products, customers, and other store data will remain. Email verification is required.
          </p>
        </div>
      </div>

      {step === "ready" && (
        <button type="button" onClick={() => void runAction("send")} disabled={busy} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-bold text-rose-800 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60">
          <Mail size={16} /> {busy ? "Sending code…" : "Send verification code"}
        </button>
      )}

      {step === "otp" && (
        <div className="mt-4 max-w-md space-y-3">
          <p role="status" className="text-xs font-medium text-emerald-800">{message}</p>
          <label htmlFor="order-history-otp" className="block text-xs font-bold text-stone-700">Enter the 6-digit code</label>
          <input id="order-history-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-mono tracking-[0.35em] focus:border-brand-green focus:outline-none sm:w-64" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void runAction("verify")} disabled={busy || code.length !== 6} className="cursor-pointer rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Verifying…" : "Verify code"}</button>
            <button type="button" onClick={() => void runAction("send")} disabled={busy} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-50">Resend code</button>
            <button type="button" onClick={() => { setStep("ready"); setCode(""); setError(""); setMessage(""); }} disabled={busy} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="mt-4 space-y-4 rounded-xl border border-rose-300 bg-rose-50 p-4" role="alert">
          <div>
            <p className="text-sm font-bold text-rose-900">Warning: this permanently deletes order history.</p>
            <p className="mt-1 text-xs leading-5 text-rose-800">
              {orderCount > 0
                ? `This will delete ${orderCount} order${orderCount === 1 ? "" : "s"} and all associated order items. `
                : "This will delete all order records and associated order items. "}
              This cannot be undone. Products and customer accounts will remain.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void runAction("clear")} disabled={busy} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"><Trash2 size={15} /> {busy ? "Deleting history…" : "Permanently delete order history"}</button>
            <button type="button" onClick={() => { setStep("ready"); setGrant(""); setError(""); }} disabled={busy} className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-white disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}

      {step === "done" && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p>}
    </section>
  );
}
