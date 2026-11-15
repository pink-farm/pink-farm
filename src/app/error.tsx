"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#faf7f2]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-soft border border-brand-green/10 space-y-5 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/60 shadow-xs">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-brand-green">Something went wrong</h2>
          <p className="text-xs text-brand-charcoal/70 leading-relaxed">
            We couldn&apos;t load this page right now. Please try again or head back to our products.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-green text-white text-xs font-bold shadow-sm hover:bg-brand-green-light active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Try Again
          </button>
          <Link
            href="/products"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-cream/80 text-brand-green text-xs font-bold border border-brand-green/15 hover:bg-brand-cream active:scale-95 transition-all"
          >
            <ArrowLeft size={14} /> View Products
          </Link>
        </div>
      </div>
    </div>
  );
}
