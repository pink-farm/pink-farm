import Link from "next/link";
import { FadeIn } from "@/components/ui/MotionWrappers";
import { Lock, ShieldCheck, EyeOff, UserCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Pink Farm",
  description: "Learn how Pink Farm collects, protects, and respects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">
      {/* HERO */}
      <section className="relative w-full bg-brand-green text-brand-ivory pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 40%, #88E2B0 0%, transparent 60%), radial-gradient(circle at 30% 80%, #F7E1D7 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <FadeIn direction="up">
            <p className="text-brand-champagne text-sm font-medium tracking-widest uppercase mb-4">
              Your Trust Matters
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-extrabold leading-tight mb-4">
              Privacy <span className="italic font-light text-brand-pink">Policy.</span>
            </h1>
            <p className="text-base md:text-lg opacity-80 leading-relaxed max-w-xl mx-auto">
              We respect your privacy and are committed to protecting your personal information with absolute care.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-brand-charcoal/80 leading-relaxed space-y-10 text-sm md:text-base">
          <FadeIn direction="up">
            <div className="border-b border-brand-green/10 pb-6 mb-8">
              <p className="text-xs uppercase tracking-widest text-brand-green font-semibold">
                Last updated: October 2026
              </p>
            </div>

            <div className="space-y-8">
              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">1. Information We Collect</h2>
                <p>
                  When you visit or place an order on <strong>Pink Farm</strong>, we collect relevant information necessary to fulfill your request:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Personal details:</strong> Name, phone number, and email address.</li>
                  <li><strong>Shipping details:</strong> Delivery address, landmark, state, and pin code.</li>
                  <li><strong>Transaction details:</strong> Order ID, payment mode (UPI, card, net banking), and status provided by our gateway partner.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">2. How We Use Your Data</h2>
                <p>
                  We use your details strictly for customer service and fulfillment purposes:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Processing, packing, and dispatching your orders.</li>
                  <li>Sending real-time delivery notifications and tracking receipts via SMS or WhatsApp.</li>
                  <li>Authenticating account access securely via password or one-time verification codes.</li>
                  <li>Preventing fraudulent transactions and unauthorized account takeovers.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">3. Payment Security</h2>
                <p>
                  All online payments are handled directly by PCI-DSS certified payment processors (e.g. Razorpay). <strong>Pink Farm never stores your credit card numbers, CVVs, UPI PINs, or bank account credentials</strong> on our servers.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">4. Third-Party Sharing</h2>
                <p>
                  We never sell, rent, or trade your personal information to third parties. We share data only with trusted service partners essential for fulfilling your purchases:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Logistics Partners:</strong> Couriers (such as Delhivery, Bluedart) receive your shipping address and contact number to deliver your parcel.</li>
                  <li><strong>Communication Gateways:</strong> WhatsApp/SMS APIs to deliver order receipts and tracking links.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">5. Data Retention & Your Rights</h2>
                <p>
                  You have the right to request access to the personal data we hold about you, or ask for account deletion. If you wish to update your details or delete your profile, please contact our support team at <Link href="/contact" className="text-brand-green font-bold underline underline-offset-2">our contact page</Link>.
                </p>
              </section>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
