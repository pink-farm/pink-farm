import Link from "next/link";
import { FadeIn } from "@/components/ui/MotionWrappers";
import { ShieldCheck, FileText, Mail } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions — Pink Farm",
  description: "Read the official Terms & Conditions governing access, purchases, orders, and usage of Pink Farm.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">
      {/* HERO */}
      <section className="relative w-full bg-brand-green text-brand-ivory pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 50%, #88E2B0 0%, transparent 60%), radial-gradient(circle at 20% 20%, #F7E1D7 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <FadeIn direction="up">
            <p className="text-brand-champagne text-xs md:text-sm font-semibold tracking-widest uppercase mb-3 flex items-center justify-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-champagne" />
              Legal &amp; Store Policies
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4">
              Terms &amp; <span className="italic font-light text-brand-pink">Conditions.</span>
            </h1>
            <p className="text-sm md:text-base opacity-85 leading-relaxed max-w-xl mx-auto">
              Welcome to Pink Farm. By accessing or using our website and placing an order with us, you agree to the following Terms &amp; Conditions.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-[#FAF7F2] py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <FadeIn direction="up">
            <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm border border-brand-green/10 space-y-8 text-brand-charcoal text-sm md:text-base leading-relaxed">
              
              <div className="border-b border-brand-green/10 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-brand-charcoal/60">
                <span className="font-semibold text-brand-green uppercase tracking-wider">suvana organics · pink farm</span>
                <span>Terms &amp; Conditions of Sale and Website Access</span>
              </div>

              {/* Intro Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-brand-cream/60 border border-brand-green/10 text-brand-charcoal/85">
                <p>
                  Welcome to <strong>Pink Farm</strong>. By accessing or using our website and placing an order with us, you agree to the following Terms &amp; Conditions.
                </p>
              </div>

              {/* 1. Website Usage */}
              <div className="space-y-3 pt-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  1. Website Usage
                </h2>
                <p className="text-brand-charcoal/80">
                  The information, images, product descriptions and content available on this website are provided for general information and may be updated from time to time. Pink Farm reserves the right to modify website content, product details and pricing without prior notice.
                </p>
              </div>

              {/* 2. Products & Availability */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  2. Products &amp; Availability
                </h2>
                <p className="text-brand-charcoal/80">
                  We make every effort to ensure that product descriptions, images, flavours, availability and pricing displayed on the website are accurate. However, minor variations in appearance or packaging may occur.
                </p>
                <p className="text-brand-charcoal/80 font-medium">
                  All orders are subject to product availability.
                </p>
              </div>

              {/* 3. Pricing & Payments */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  3. Pricing &amp; Payments
                </h2>
                <p className="text-brand-charcoal/80">
                  All prices displayed on the website are subject to change without prior notice. Orders are confirmed only after successful payment, unless otherwise specified.
                </p>
              </div>

              {/* 4. Order Cancellation */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  4. Order Cancellation
                </h2>
                <p className="text-brand-charcoal/80">
                  Orders may be cancelled only within the time period specified by Pink Farm and before dispatch. Once an order has been dispatched, cancellation may not be possible.
                </p>
              </div>

              {/* 5. Shipping & Delivery */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  5. Shipping &amp; Delivery
                </h2>
                <p className="text-brand-charcoal/80">
                  We aim to dispatch orders within the stated processing period. Delivery timelines may vary depending on the delivery location, courier partner and circumstances beyond our control.
                </p>
                <p className="text-brand-charcoal/80">
                  Pink Farm shall not be responsible for delays caused by courier partners, incorrect delivery information, natural events or other circumstances beyond our reasonable control.
                </p>
              </div>

              {/* 6. Damaged or Incorrect Orders */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  6. Damaged or Incorrect Orders
                </h2>
                <p className="text-brand-charcoal/80">
                  If you receive a damaged, tampered or incorrect product, please contact us promptly with your order details and relevant photographs/videos. We will review the issue and provide an appropriate resolution in accordance with our policies.
                </p>
              </div>

              {/* 7. Food Products */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  7. Food Products
                </h2>
                <p className="text-brand-charcoal/80">
                  Our products are packed and handled with care. Customers are advised to check the ingredients, allergen information and product details mentioned on the packaging before consumption.
                </p>
              </div>

              {/* 8. Intellectual Property */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  8. Intellectual Property
                </h2>
                <p className="text-brand-charcoal/80">
                  All logos, brand names, product images, photographs, graphics, text and other content available on this website are the property of Pink Farm or are used with appropriate rights. They may not be copied, reproduced or used commercially without prior written permission.
                </p>
              </div>

              {/* 9. Changes to Terms */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  9. Changes to Terms
                </h2>
                <p className="text-brand-charcoal/80">
                  Pink Farm reserves the right to update or modify these Terms &amp; Conditions at any time. Any changes will be effective once published on this website.
                </p>
              </div>

              {/* 10. Contact */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  10. Contact
                </h2>
                <p className="text-brand-charcoal/80">
                  For any questions regarding these Terms &amp; Conditions, please contact Pink Farm through the contact details provided on our website.
                </p>
                <div className="pt-2">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green text-white font-bold text-xs sm:text-sm hover:bg-brand-green-light transition-all shadow-sm"
                  >
                    <Mail size={16} /> Contact Pink Farm Team &rarr;
                  </Link>
                </div>
              </div>

            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
