import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#faf7f2]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-soft border border-brand-green/10 space-y-5 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-brand-pink/60 text-brand-green flex items-center justify-center mx-auto text-2xl font-bold font-serif">
          404
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-brand-green">Product Not Found</h2>
          <p className="text-xs text-brand-charcoal/70 leading-relaxed">
            The item you are looking for might have been moved, renamed, or is currently unavailable.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-green text-white text-xs font-bold shadow-sm hover:bg-brand-green-light active:scale-95 transition-all"
          >
            <ArrowLeft size={14} /> Back to Products
          </Link>
        </div>
      </div>
    </div>
  );
}
