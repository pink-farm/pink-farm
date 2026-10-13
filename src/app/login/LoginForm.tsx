"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCustomerStore } from "@/store/customerStore";
import { Mail, ShieldAlert, Settings, User } from "lucide-react";

type CustomerMethod = "password" | "otp";

export function LoginForm() {
  const [activeTab, setActiveTab] = useState<"customer" | "admin">("customer");
  const [customerMethod, setCustomerMethod] = useState<CustomerMethod>("password");
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const loginCustomer = useCustomerStore((state) => state.loginCustomer);

  const finishCustomerSignIn = (customer: { name: string; email: string; phone?: string | null }) => {
    loginCustomer({ name: customer.name, email: customer.email, phone: customer.phone || "" });
    router.push("/account");
    router.refresh();
  };

  const handleAdminSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Invalid credentials.");
      else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to sign in.");
      else finishCustomerSignIn(data.customer);
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const registering = isRegistering;
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          mode: registering ? "register" : "login",
          ...(registering ? { name: customerName, password } : {}),
          ...(otpSent ? { code: otp } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to verify your email.");
      else if (!otpSent) setOtpSent(true);
      else finishCustomerSignIn(data.customer);
    } catch {
      setError("Unable to verify your email right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetOtp = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  const startRegistration = () => {
    setIsRegistering(true);
    setCustomerMethod("otp");
    resetOtp();
  };

  const returnToSignIn = () => {
    setIsRegistering(false);
    setCustomerMethod("password");
    resetOtp();
  };

  return (
    <div className="space-y-6">
      <div className="flex rounded-2xl border border-brand-green/10 bg-brand-green/5 p-1">
        <button
          type="button"
          onClick={() => { setActiveTab("customer"); setError(""); }}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${activeTab === "customer" ? "border border-brand-green/10 bg-white text-brand-green shadow-sm" : "text-brand-charcoal/60 hover:text-brand-green"}`}
        >
          <User size={16} /> Customer
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("admin"); setError(""); }}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${activeTab === "admin" ? "border border-brand-green/10 bg-white text-brand-green shadow-sm" : "text-brand-charcoal/60 hover:text-brand-green"}`}
        >
          <Settings size={16} /> Store Admin
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-600">
          <span className="font-bold text-red-500">!</span> {error}
        </div>
      )}

      {activeTab === "customer" ? (
        <div className="space-y-5">
          {!isRegistering && (
            <div className="grid grid-cols-2 rounded-xl bg-brand-cream/70 p-1">
              <button
                type="button"
                onClick={() => { setCustomerMethod("password"); resetOtp(); }}
                className={`cursor-pointer rounded-lg py-2.5 text-sm font-semibold ${customerMethod === "password" ? "bg-white text-brand-green shadow-sm" : "text-brand-charcoal/60"}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setCustomerMethod("otp"); resetOtp(); }}
                className={`cursor-pointer rounded-lg py-2.5 text-sm font-semibold ${customerMethod === "otp" ? "bg-white text-brand-green shadow-sm" : "text-brand-charcoal/60"}`}
              >
                Email code
              </button>
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="register-name" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Username</label>
                    <input id="register-name" type="text" autoComplete="name" required maxLength={100} placeholder="How should we call you?" value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="register-email" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Email address</label>
                    <input id="register-email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="register-password" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Create password</label>
                    <input id="register-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="register-code" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">6-digit verification code</label>
                  <p className="text-sm text-brand-charcoal/65">Enter the code sent to {email}.</p>
                  <input id="register-code" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 font-mono tracking-[0.4em]" />
                </div>
              )}
              <Button type="submit" size="lg" className="h-12 w-full cursor-pointer rounded-xl text-sm shadow-lg shadow-brand-green/10" disabled={isLoading}>
                {isLoading ? "Please wait..." : otpSent ? "Verify code and create account" : "Send verification code"}
              </Button>
              {otpSent && <button type="button" onClick={resetOtp} className="w-full cursor-pointer text-xs font-semibold text-brand-green underline underline-offset-2">Change details or request a new code</button>}
              <p className="text-center text-sm text-brand-charcoal/70">Already have an account? <button type="button" onClick={returnToSignIn} className="cursor-pointer font-bold text-brand-green underline underline-offset-2">Sign in</button></p>
            </form>
          ) : customerMethod === "password" ? (
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="customer-email" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Email address</label>
                <input id="customer-email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="customer-password" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Password</label>
                <input id="customer-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full cursor-pointer rounded-xl text-sm shadow-lg shadow-brand-green/10" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-sm text-brand-charcoal/70">Don&apos;t have an account? <button type="button" onClick={startRegistration} className="cursor-pointer font-bold text-brand-green underline underline-offset-2">Register now</button></p>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              {!otpSent ? (
                <div className="space-y-1.5">
                  <label htmlFor="otp-email" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Email address</label>
                  <input id="otp-email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="login-code" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">6-digit sign-in code</label>
                  <p className="text-sm text-brand-charcoal/65">Enter the code sent to {email}.</p>
                  <input id="login-code" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 font-mono tracking-[0.4em]" />
                </div>
              )}
              <Button type="submit" size="lg" className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm shadow-lg shadow-brand-green/10" disabled={isLoading}>
                <Mail size={16} /> {isLoading ? "Please wait..." : otpSent ? "Verify code and sign in" : "Send sign-in code"}
              </Button>
              {otpSent && <button type="button" onClick={resetOtp} className="w-full cursor-pointer text-xs font-semibold text-brand-green underline underline-offset-2">Change email or request a new code</button>}
              <p className="text-center text-sm text-brand-charcoal/70">New to Pink Farm? <button type="button" onClick={startRegistration} className="cursor-pointer font-bold text-brand-green underline underline-offset-2">Register now</button></p>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200/60 bg-amber-50 p-3 text-xs font-medium text-amber-900">
            <ShieldAlert size={16} className="shrink-0 text-amber-700" />
            <span>Store Administrator Backoffice. Authorized personnel only.</span>
          </div>
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Admin email</label>
              <input id="admin-email" type="email" autoComplete="username" required value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Password</label>
              <input id="admin-password" type="password" autoComplete="current-password" required value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className="w-full rounded-xl border border-brand-green-light/20 bg-brand-cream/30 p-3.5 text-sm font-medium transition-colors focus:border-brand-green focus:bg-white focus:outline-none" />
            </div>
            <Button type="submit" size="lg" className="h-12 w-full cursor-pointer rounded-xl text-sm shadow-lg shadow-brand-green/10" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Access Admin Dashboard"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
