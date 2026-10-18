import Link from "next/link";
import { FadeIn } from "@/components/ui/MotionWrappers";
import { ShieldCheck, Lock, CheckCircle2, Mail, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Pink Farm",
  description: "Learn how Pink Farm protects your privacy and handles your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">
      {/* HERO */}
      <section className="relative w-full bg-brand-green text-brand-ivory pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 40%, #88E2B0 0%, transparent 60%), radial-gradient(circle at 30% 80%, #F7E1D7 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <FadeIn direction="up">
            <p className="text-brand-champagne text-xs md:text-sm font-semibold tracking-widest uppercase mb-3 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-champagne" />
              Pink Farm Official Policy
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4">
              Privacy <span className="italic font-light text-brand-pink">Policy.</span>
            </h1>
            <p className="text-sm md:text-base opacity-85 leading-relaxed max-w-xl mx-auto">
              At Pink Farm, we respect your privacy and are committed to protecting the information you share with us when you use our website or place an order.
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
                <span>Effective Date: Updated for Store Customers</span>
              </div>

              {/* Intro Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-brand-cream/60 border border-brand-green/10 text-brand-charcoal/85">
                <p>
                  At <strong>Pink Farm</strong>, we respect your privacy and are committed to protecting the information you share with us when you use our website or place an order.
                </p>
              </div>

              {/* 1. Information We Collect */}
              <div className="space-y-3 pt-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green flex items-center gap-2">
                  <span>1. Information We Collect</span>
                </h2>
                <p className="text-brand-charcoal/80">
                  When you place an order, contact us or use certain features of our website, we may collect information such as your name, phone number, email address, billing and shipping address and order details.
                </p>
              </div>

              {/* 2. How We Use Your Information */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  2. How We Use Your Information
                </h2>
                <p className="text-brand-charcoal/80">
                  We may use the information collected to:
                </p>
                <ul className="space-y-2 pl-2">
                  {[
                    "Process and deliver your orders",
                    "Provide customer support",
                    "Communicate with you regarding your orders",
                    "Send important updates regarding our products or services",
                    "Improve our website, products and customer experience",
                    "Prevent fraudulent or unauthorised transactions",
                  ].map((point, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-brand-charcoal/85">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Payment Information */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  3. Payment Information
                </h2>
                <p className="text-brand-charcoal/80">
                  Payments may be processed through third-party payment gateways. Pink Farm does not store your complete card, UPI or banking credentials on its own servers. Payment information is handled according to the policies and security practices of the respective payment service provider.
                </p>
              </div>

              {/* 4. Sharing of Information */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  4. Sharing of Information
                </h2>
                <p className="text-brand-charcoal/80">
                  We do not sell or rent your personal information. Your information may be shared with trusted service providers such as courier companies, payment gateways and technology/service providers where necessary to process your order and provide our services.
                </p>
              </div>

              {/* 5. Cookies */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  5. Cookies
                </h2>
                <p className="text-brand-charcoal/80">
                  Our website may use cookies and similar technologies to improve website functionality, understand website usage and enhance your browsing experience.
                </p>
              </div>

              {/* 6. Data Security */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  6. Data Security
                </h2>
                <p className="text-brand-charcoal/80">
                  We take reasonable measures to protect your personal information from unauthorised access, misuse, alteration or disclosure. However, no online system can be guaranteed to be completely secure.
                </p>
              </div>

              {/* 7. Third-Party Links */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  7. Third-Party Links
                </h2>
                <p className="text-brand-charcoal/80">
                  Our website may contain links to third-party websites or services. Pink Farm is not responsible for the privacy practices or content of those third-party websites.
                </p>
              </div>

              {/* 8. Your Rights */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  8. Your Rights
                </h2>
                <p className="text-brand-charcoal/80">
                  You may contact us to request access to, correction of or deletion of your personal information, subject to applicable laws and legitimate business requirements.
                </p>
              </div>

              {/* 9. Changes to This Privacy Policy */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  9. Changes to This Privacy Policy
                </h2>
                <p className="text-brand-charcoal/80">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or applicable requirements. Updated versions will be published on this website.
                </p>
              </div>

              {/* 10. Contact Us */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
                  10. Contact Us
                </h2>
                <p className="text-brand-charcoal/80">
                  If you have any questions regarding this Privacy Policy or how your information is handled, please contact Pink Farm through the contact details provided on our website.
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
