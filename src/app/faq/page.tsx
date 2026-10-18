import Link from "next/link";
import { FadeIn } from "@/components/ui/MotionWrappers";
import { FaqClient } from "./FaqClient";
import { MessageCircle, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions (FAQ) — Pink Farm",
  description: "Find answers to common questions about Pink Farm makhana sourcing, storage, shelf life, bulk gifting, wholesale, and returns.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How should I store Pink Farm Makhana?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Store in a cool, dry place away from direct sunlight and moisture. Once opened, keep the pack/jar tightly sealed to retain maximum freshness and crunch.",
      },
    },
    {
      "@type": "Question",
      name: "What is the shelf life of the product?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The shelf life is mentioned on the product packaging. For the best taste, freshness and crunch, we recommend consuming the product within the mentioned period.",
      },
    },
    {
      "@type": "Question",
      name: "Can I place a bulk or corporate gifting order?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Pink Farm offers bulk and corporate gifting options with premium packaging and multiple flavour choices. For customised requirements, please contact us directly.",
      },
    },
    {
      "@type": "Question",
      name: "Do you accept wholesale or distributor orders?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We offer wholesale and distributor opportunities for selected products. Please contact our team to discuss pricing, minimum quantities and available options.",
      },
    },
    {
      "@type": "Question",
      name: "Can I return or exchange my order?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Since our products are food items, returns and exchanges are subject to our food safety and return policy. If your order arrives damaged, incorrect or tampered with, please contact us with your order details and photographs as soon as possible.",
      },
    },
    {
      "@type": "Question",
      name: "What should I do if I receive a damaged or incorrect product?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Please contact our customer support team as soon as possible after delivery and share your order number along with clear photographs/videos of the package and product. Our team will review the issue and assist you accordingly.",
      },
    },
  ],
};

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
