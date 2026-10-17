"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { LotusLoader } from "@/components/ui/LotusLoader";

type AccountRole = "customer" | "admin";
type ResetStep = "request" | "verify" | "success";

export function PasswordResetForm() {
  const [role, setRole] = useState<AccountRole>("customer");
  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loadingText, setLoadingText] = useState("Restoring account access");

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown((remaining) => remaining - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- initialize this form from a reset-link query string */
    const params = new URLSearchParams(window.location.search);
    const requestedRole = params.get("role");
    if (requestedRole === "admin") {
      setRole("admin");
    } else if (params.get("email")) {
      setEmail(params.get("email") || "");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const chooseRole = (nextRole: AccountRole) => {
    setRole(nextRole);
    setEmail("");
    setStep("request");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setNotice("");
    setResendCountdown(0);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (step === "verify" && password !== confirmPassword) {
      setError("Those passwords don’t match yet.");
      return;
    }

    setLoadingText(step === "request" ? "Sending your secure code" : "Restoring account access");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          ...(role === "customer" ? { email } : {}),
          action: step === "verify" ? "verify" : "request",
          ...(step === "verify" ? { code, password } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn’t complete that request.");

      if (step === "request") {
        setNotice(result.message || "If an account matches that email, a reset code will arrive shortly.");
        setStep("verify");
        setResendCountdown(50);
      } else {
        setNotice(result.message || "Your password has been updated.");
        setStep("success");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We couldn’t complete that request.");
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (busy || resendCountdown > 0) return;
    setError("");
    setNotice("");
    setLoadingText("Sending another secure code");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...(role === "customer" ? { email } : {}), action: "request" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn’t send another code.");
      setCode("");
      setNotice("A fresh verification code has been sent. Use the newest code in your inbox.");
      setResendCountdown(50);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We couldn’t send another code.");
      if (requestError instanceof Error && /wait a minute/i.test(requestError.message)) setResendCountdown(50);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {step === "success" ? (
          <motion.div key="success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><Check size={30} /></div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Password updated</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-brand-green">You’re all set.</h2>
            <p className="mt-3 text-sm leading-6 text-brand-charcoal/65">Your new password is ready. Sign in again to pick up where you left off.</p>
            <Link href="/login" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/15 transition-transform hover:-translate-y-0.5">
              Return to sign in <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green/55">Secure password recovery</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-green">{step === "request" ? "Let’s get you back in." : "Check your email."}</h2>
              <p className="mt-2 text-sm leading-6 text-brand-charcoal/65">{step === "request" ? "Choose the account you want to recover. We’ll send a one-time code to its email address." : role === "admin" ? "Enter the code sent to the configured administrator email address and choose a new password." : `Enter the code sent to ${email} and choose a new password.`}</p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl bg-brand-cream p-1">
              <button type="button" disabled={step !== "request" || busy} onClick={() => chooseRole("customer")} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${role === "customer" ? "bg-white text-brand-green shadow-sm" : "text-brand-charcoal/55"}`}>Customer</button>
              <button type="button" disabled={step !== "request" || busy} onClick={() => chooseRole("admin")} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${role === "admin" ? "bg-white text-brand-green shadow-sm" : "text-brand-charcoal/55"}`}>Store Admin</button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                {role === "admin" ? <div className="rounded-xl border border-brand-green-light/15 bg-gray-50 p-4 text-sm text-brand-charcoal/70">A verification code will be sent to the configured store administrator email address.</div> : <div>
                  <label htmlFor="reset-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-charcoal">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-green/50" />
                    <input id="reset-email" type="email" autoComplete="email" required value={email} readOnly={step === "verify"} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-brand-green-light/15 bg-brand-cream/40 py-3.5 pl-10 pr-4 text-sm font-medium text-brand-charcoal transition-colors focus:border-brand-green focus:bg-white focus:outline-none read-only:cursor-not-allowed read-only:bg-gray-50" />
                  </div>
                </div>}
              </div>

              {step === "verify" && <>
                <div className="space-y-1.5">
                  <label htmlFor="reset-code" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">One-time verification code</label>
                  <input id="reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="w-full rounded-xl border border-brand-green-light/15 bg-brand-cream/40 p-4 text-center font-mono text-2xl font-semibold tracking-[0.65em] text-brand-green transition-colors placeholder:text-brand-green/20 focus:border-brand-green focus:bg-white focus:outline-none" />
                  <p className="text-[11px] text-brand-charcoal/55">For your security, the code expires in 10 minutes.</p>
                  <div className="flex flex-wrap items-center gap-x-1 text-xs text-brand-charcoal/60">
                    <span>Didn’t receive the email?</span>
                    <button type="button" onClick={resendCode} disabled={busy || resendCountdown > 0} className="font-bold text-brand-green underline underline-offset-2 transition-colors hover:text-brand-green-light disabled:cursor-not-allowed disabled:text-brand-charcoal/40 disabled:no-underline">
                      {busy ? "Sending…" : resendCountdown > 0 ? `Request a new code in 0:${String(resendCountdown).padStart(2, "0")}` : "Request a new code"}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">New password</label>
                  <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="w-full rounded-xl border border-brand-green-light/15 bg-brand-cream/40 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Confirm new password</label>
                  <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it once more" className="w-full rounded-xl border border-brand-green-light/15 bg-brand-cream/40 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
                </div>
              </>}

              {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">{error}</p>}
              {notice && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-800">{notice}</p>}

              <button type="submit" disabled={busy || (step === "verify" && code.length !== 6)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/15 transition-all hover:-translate-y-0.5 hover:bg-brand-green-light disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55">
                {step === "request" ? <><Mail size={16} /> Send secure code</> : <><KeyRound size={16} /> Reset password securely</>}
              </button>
            </form>

            {step === "verify" && <button type="button" onClick={() => { setStep("request"); setCode(""); setPassword(""); setConfirmPassword(""); setError(""); setNotice(""); }} className="mt-4 w-full text-center text-xs font-semibold text-brand-green underline underline-offset-2">Use a different email or account</button>}
            <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-brand-charcoal/50"><ShieldCheck size={13} className="text-brand-green/60" /> Your code is private and expires after one use.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {busy && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-ivory/90 px-5 backdrop-blur-md"><div className="rounded-[2rem] border border-brand-green/10 bg-white/95 px-9 py-8 shadow-2xl shadow-brand-green/10"><LotusLoader size="md" text={loadingText} subtext="A moment of Pink Farm care" /></div></motion.div>}
      </AnimatePresence>
    </div>
  );
}
