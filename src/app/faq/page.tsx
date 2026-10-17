import Link from "next/link";
import { FadeIn } from "@/components/ui/MotionWrappers";
import { FaqClient } from "./FaqClient";
import { MessageCircle, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions (FAQ) — Pink Farm",
  description: "Find answers to common questions about Pink Farm makhana sourcing, ingredients, delivery, tracking, and orders.",
};

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">
      {/* HERO */}
      <section className="relative w-full bg-brand-green text-brand-ivory pt-32 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 30%, #88E2B0 0%, transparent 60%), radial-gradient(circle at 20% 70%, #F7E1D7 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <FadeIn direction="up">
            <p className="text-brand-champagne text-sm font-medium tracking-widest uppercase mb-4">
              Help Center
            </p>
            <h1 className="font-serif text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Frequently Asked <span className="italic font-light text-brand-pink">Questions.</span>
            </h1>
            <p className="text-lg md:text-xl opacity-80 leading-relaxed max-w-2xl mx-auto">
              Everything you need to know about our slow-roasted makhana, clean sourcing, shipping times, and ordering.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-brand-ivory py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <FadeIn direction="up">
            <FaqClient />
          </FadeIn>
        </div>
      </section>

      {/* STILL HAVE QUESTIONS BANNER */}
      <section className="bg-white py-16 border-t border-brand-green/10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <FadeIn direction="up">
            <div className="rounded-3xl bg-brand-cream/60 p-8 md:p-12 border border-brand-green/10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                <HelpCircle size={32} />
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-brand-green">
                Still have a question?
              </h3>
              <p className="text-brand-charcoal/70 text-sm md:text-base max-w-md">
                Can&apos;t find the answer you&apos;re looking for? Our friendly team is always ready to chat on WhatsApp.
              </p>
              <Link
                href="/contact"
                className="mt-2 inline-flex items-center gap-2 bg-brand-green text-white font-bold px-7 py-3.5 rounded-xl hover:bg-brand-green-light transition-all duration-300 shadow-md shadow-brand-green/15"
              >
                <MessageCircle size={18} /> Chat with Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
