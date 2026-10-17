import Link from "next/link";
import { FadeIn } from "@/components/ui/MotionWrappers";
import { ShieldCheck, FileText, HelpCircle, Mail } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Pink Farm",
  description: "Read the Terms of Service governing purchases, accounts, and use of Pink Farm online store.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">
      {/* HERO */}
      <section className="relative w-full bg-brand-green text-brand-ivory pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 50%, #88E2B0 0%, transparent 60%), radial-gradient(circle at 20% 20%, #F7E1D7 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <FadeIn direction="up">
            <p className="text-brand-champagne text-sm font-medium tracking-widest uppercase mb-4">
              Legal & Policies
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-extrabold leading-tight mb-4">
              Terms of <span className="italic font-light text-brand-pink">Service.</span>
            </h1>
            <p className="text-base md:text-lg opacity-80 leading-relaxed max-w-xl mx-auto">
              Please review the terms and conditions that govern your visits to Pink Farm and all purchases made on our store.
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
                <h2 className="font-serif text-2xl font-bold text-brand-green">1. Overview & Agreement</h2>
                <p>
                  This website is operated by <strong>Pink Farm</strong>. Throughout the site, the terms &ldquo;we&rdquo;, &ldquo;us&rdquo;, and &ldquo;our&rdquo; refer to Pink Farm. By visiting our site and/or purchasing goods from us, you engage in our &ldquo;Service&rdquo; and agree to be bound by the following terms and conditions.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">2. Product Quality & Accuracy</h2>
                <p>
                  Pink Farm crafts premium Makhana and curated everyday favourites. While we make every effort to display the true colors, packaging, and textures of our items accurately, variations may occur due to natural agricultural harvesting and display screens. All products are subject to availability.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">3. Pricing & Payments</h2>
                <p>
                  Prices for our products are stated in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise. We reserve the right to revise prices, discontinue items, or update promotional coupons without prior notice.
                </p>
                <p>
                  Payments are processed through secure, RBI-compliant payment gateways (such as Razorpay). We never capture or store your credit/debit card numbers or net banking passwords.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">4. Returns, Replacements & Cancellations</h2>
                <p>
                  As we specialize in perishable and consumable food products, items once delivered and unsealed are not eligible for general return due to hygiene and food safety protocols.
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li><strong>Damaged on Arrival:</strong> If your package arrives crushed, punctured, or spoiled, please contact our support team on WhatsApp within 48 hours with clear photographic proof. We will provide a free replacement or store credit.</li>
                  <li><strong>Order Cancellation:</strong> Orders can be cancelled before dispatch by contacting customer support. Once an order is dispatched with a tracking ID, it cannot be recalled.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">5. User Accounts & Security</h2>
                <p>
                  When registering an account with Pink Farm, you are responsible for maintaining the confidentiality of your sign-in details and password. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">6. Intellectual Property</h2>
                <p>
                  All content included on this site, including text, graphics, logos, images, packaging artwork, and software, is the property of Pink Farm and protected by applicable copyright and trademark laws.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl font-bold text-brand-green">7. Questions & Contact Information</h2>
                <p>
                  If you have any questions regarding these Terms of Service, please reach out via our <Link href="/contact" className="text-brand-green font-bold underline underline-offset-2">Contact Page</Link> or send a message via WhatsApp to our official helpline.
                </p>
              </section>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
