import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { PasswordResetForm } from "./PasswordResetForm";

export const metadata = {
  title: "Reset Password | Pink Farm",
  description: "Securely reset your Pink Farm account password using an email verification code.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-[#f6f2e9] px-4 py-12 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-brand-pink/80 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-100/80 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-green/75 transition-colors hover:text-brand-green">
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        <div className="grid overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_90px_-40px_rgba(26,60,52,0.35)] lg:min-h-[630px] lg:grid-cols-[0.92fr_1.08fr]">
          <section className="relative hidden flex-col justify-between overflow-hidden bg-brand-green p-10 text-brand-ivory lg:flex xl:p-14">
            <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border border-white/10" />
            <div className="absolute -right-5 top-0 h-56 w-56 rounded-full border border-white/10" />
            <div className="relative">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-brand-champagne ring-1 ring-white/15">
                <ShieldCheck size={26} />
              </div>
              <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-champagne"><Sparkles size={14} /> Account care</p>
              <h1 className="max-w-md font-serif text-4xl font-semibold leading-tight xl:text-5xl">A fresh start, with your account kept safe.</h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">We’ll send a one-time code to your registered email. It expires after ten minutes and can only be used once.</p>
            </div>
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="font-serif text-lg italic text-brand-pink">“Pure in nature, good for you.”</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Pink Farm · Secure account recovery</p>
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
            <div className="w-full max-w-md">
              <div className="mb-7 lg:hidden">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-green/60">Pink Farm Account Care</p>
                <h1 className="font-serif text-3xl font-semibold text-brand-green">A fresh start, securely.</h1>
              </div>
              <PasswordResetForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
