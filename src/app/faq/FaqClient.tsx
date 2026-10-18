"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  question: string;
  answer: string;
  category: "product" | "shipping" | "orders";
}

const FAQS: FaqItem[] = [
  {
    category: "product",
    question: "How should I store Pink Farm Makhana?",
    answer:
      "Store in a cool, dry place away from direct sunlight and moisture. Once opened, keep the pack/jar tightly sealed to retain maximum freshness and crunch.",
  },
  {
    category: "product",
    question: "What is the shelf life of the product?",
    answer:
      "The shelf life is mentioned on the product packaging. For the best taste, freshness and crunch, we recommend consuming the product within the mentioned period.",
  },
  {
    category: "orders",
    question: "Can I place a bulk or corporate gifting order?",
    answer:
      "Absolutely. Pink Farm offers bulk and corporate gifting options with premium packaging and multiple flavour choices. For customised requirements, please contact us directly.",
  },
  {
    category: "orders",
    question: "Do you accept wholesale or distributor orders?",
    answer:
      "Yes. We offer wholesale and distributor opportunities for selected products. Please contact our team to discuss pricing, minimum quantities and available options.",
  },
  {
    category: "shipping",
    question: "Can I return or exchange my order?",
    answer:
      "Since our products are food items, returns and exchanges are subject to our food safety and return policy. If your order arrives damaged, incorrect or tampered with, please contact us with your order details and photographs as soon as possible.",
  },
  {
    category: "shipping",
    question: "What should I do if I receive a damaged or incorrect product?",
    answer:
      "Please contact our customer support team as soon as possible after delivery and share your order number along with clear photographs/videos of the package and product. Our team will review the issue and assist you accordingly.",
  },
  {
    category: "product",
    question: "What makes Pink Farm Makhana special?",
    answer:
      "We hand-select only Grade-A jumbo lotus seeds directly from traditional harvesting farms in Bihar. Each batch is slow-roasted to golden crunch perfection using cold-pressed oils and clean, authentic spices without any artificial preservatives, MSG, or palm oil.",
  },
  {
    category: "product",
    question: "Is Pink Farm Makhana gluten-free and suitable for fasting (Vrat)?",
    answer:
      "Yes! Natural makhana is inherently gluten-free, low-glycemic, and traditionally cherished as a pure satvik fasting food. Our Himalayan Pink Salt and classic roasted flavours are ideal for vrat and everyday clean snacking.",
  },
  {
    category: "shipping",
    question: "How long does delivery take?",
    answer:
      "Orders are freshly packed and dispatched within 24 to 48 business hours. Metro city deliveries usually arrive within 2 to 4 business days post-dispatch, while tier-2/3 cities and remote regions take 4 to 7 business days.",
  },
  {
    category: "shipping",
    question: "How can I track my shipment?",
    answer:
      "As soon as our courier partner picks up your parcel, we send an SMS and WhatsApp message with your tracking link. You can also view live delivery progress anytime in your Pink Farm Customer Account.",
  },
  {
    category: "orders",
    question: "What payment options do you support?",
    answer:
      "We accept all major secure payment methods via UPI (GPay, PhonePe, Paytm), Debit and Credit Cards (Visa, Mastercard, RuPay), Net Banking across 50+ banks, and popular digital wallets.",
  },
];

export function FaqClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<"all" | "product" | "shipping" | "orders">("all");

  const filteredFaqs =
    activeCategory === "all" ? FAQS : FAQS.filter((faq) => faq.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { id: "all", label: "All Questions" },
          { id: "product", label: "Product & Storage" },
          { id: "orders", label: "Bulk & Wholesale" },
          { id: "shipping", label: "Returns & Shipping" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id as typeof activeCategory);
              setOpenIndex(null);
            }}
            className={`cursor-pointer px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeCategory === cat.id
                ? "bg-brand-green text-white shadow-md shadow-brand-green/15"
                : "bg-white text-brand-charcoal/70 border border-brand-green/10 hover:border-brand-green/30"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.question}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? "bg-white border-brand-green/20 shadow-md"
                  : "bg-white/80 border-brand-green/10 hover:border-brand-green/20"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="font-serif text-lg md:text-xl font-bold text-brand-green">
                  {faq.question}
                </span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
                    isOpen ? "rotate-180 bg-brand-pink text-brand-green" : "bg-brand-cream/60 text-brand-charcoal/60"
                  }`}
                >
                  <ChevronDown size={18} />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-1 text-brand-charcoal/75 text-sm md:text-base leading-relaxed border-t border-brand-cream/80">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
