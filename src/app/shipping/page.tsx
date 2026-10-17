import Link from "next/link";
import { FadeIn, SpotlightCard, StaggerContainer, StaggerItem } from "@/components/ui/MotionWrappers";
import { Truck, Clock, ShieldCheck, PackageCheck, MapPin, MessageCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery — Pink Farm",
  description: "Learn about Pink Farm shipping policy, delivery timelines, packaging safety, and real-time tracking.",
};

export default function ShippingPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">
      {/* HERO */}
      <section className="relative w-full bg-brand-green text-brand-ivory pt-32 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #88E2B0 0%, transparent 60%), radial-gradient(circle at 80% 20%, #F7E1D7 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <FadeIn direction="up">
            <p className="text-brand-champagne text-sm font-medium tracking-widest uppercase mb-4">
              Care Delivered to Your Door
            </p>
            <h1 className="font-serif text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Shipping & <span className="italic font-light text-brand-pink">Delivery.</span>
            </h1>
            <p className="text-lg md:text-xl opacity-80 leading-relaxed max-w-2xl mx-auto">
              Every pack of Pink Farm Makhana and everyday favourites is hand-inspected, carefully packed in moisture-lock food-grade pouches, and shipped quickly to your doorstep.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* HIGHLIGHT PILLARS */}
      <section className="bg-brand-ivory py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerItem>
              <SpotlightCard className="h-full rounded-[2rem]" glowColor="rgba(42, 89, 78, 0.12)">
                <div className="flex flex-col items-start gap-4 bg-white p-8 rounded-[2rem] border border-brand-pink-accent/25 shadow-sm h-full">
                  <div className="w-14 h-14 rounded-2xl bg-brand-cream/80 text-brand-green flex items-center justify-center">
                    <Clock size={28} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-brand-green">Fast Dispatch</h3>
                  <p className="text-brand-charcoal/70 text-sm leading-relaxed">
                    Orders are packed fresh and dispatched within <strong>24 to 48 business hours</strong> from our facility.
                  </p>
                </div>
              </SpotlightCard>
            </StaggerItem>

            <StaggerItem>
              <SpotlightCard className="h-full rounded-[2rem]" glowColor="rgba(42, 89, 78, 0.12)">
                <div className="flex flex-col items-start gap-4 bg-white p-8 rounded-[2rem] border border-brand-pink-accent/25 shadow-sm h-full">
                  <div className="w-14 h-14 rounded-2xl bg-brand-cream/80 text-brand-green flex items-center justify-center">
                    <MapPin size={28} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-brand-green">Pan-India Reach</h3>
                  <p className="text-brand-charcoal/70 text-sm leading-relaxed">
                    We partner with reputable couriers (Bluedart, Delhivery, DTDC, Xpressbees) covering <strong>25,000+ pin codes</strong> across India.
                  </p>
                </div>
              </SpotlightCard>
            </StaggerItem>

            <StaggerItem>
              <SpotlightCard className="h-full rounded-[2rem]" glowColor="rgba(42, 89, 78, 0.12)">
                <div className="flex flex-col items-start gap-4 bg-white p-8 rounded-[2rem] border border-brand-pink-accent/25 shadow-sm h-full">
                  <div className="w-14 h-14 rounded-2xl bg-brand-cream/80 text-brand-green flex items-center justify-center">
                    <PackageCheck size={28} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-brand-green">Moisture-Lock Seal</h3>
                  <p className="text-brand-charcoal/70 text-sm leading-relaxed">
                    Specially engineered multilayer food-safe packaging protects the crunchy texture from humidity during transit.
                  </p>
                </div>
              </SpotlightCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* POLICY DETAILS */}
      <section className="bg-white py-16 md:py-24 border-t border-brand-green/10">
        <div className="container mx-auto px-4 max-w-4xl space-y-12">
          <FadeIn direction="up">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-green mb-6">
              Delivery Timelines & Charges
            </h2>
            <div className="space-y-6 text-brand-charcoal/80 leading-relaxed">
              <div className="rounded-2xl bg-brand-ivory/60 p-6 border border-brand-green-light/20">
                <h4 className="font-bold text-brand-green text-lg mb-2">Estimated Delivery Times</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><strong>Metro Cities:</strong> 2 to 4 business days post-dispatch.</li>
                  <li><strong>Tier 2 & 3 Cities:</strong> 3 to 6 business days post-dispatch.</li>
                  <li><strong>North-East & Remote Locations:</strong> 5 to 8 business days post-dispatch.</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-brand-ivory/60 p-6 border border-brand-green-light/20">
                <h4 className="font-bold text-brand-green text-lg mb-2">Shipping Rates</h4>
                <p className="text-sm">
                  We offer <strong>Free Standard Shipping</strong> on eligible cart values as displayed at checkout. For smaller orders, a nominal standard carrier fee is calculated transparently before payment.
                </p>
              </div>

              <div className="rounded-2xl bg-brand-ivory/60 p-6 border border-brand-green-light/20">
                <h4 className="font-bold text-brand-green text-lg mb-2">Order Tracking & Updates</h4>
                <p className="text-sm mb-3">
                  As soon as your shipment is dispatched, you will receive a tracking link via email and WhatsApp. You can also view live delivery status anytime by visiting your <Link href="/account" className="text-brand-green font-bold underline underline-offset-2">Customer Account</Link>.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="up">
            <div className="rounded-3xl bg-brand-green text-brand-ivory p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-bold mb-2">Need help with an ongoing delivery?</h3>
                <p className="opacity-80 text-sm">Our team is available on WhatsApp to assist with urgent tracking or address updates.</p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 whitespace-nowrap bg-brand-pink text-brand-green font-bold px-6 py-3.5 rounded-xl hover:bg-brand-pink-accent transition-all duration-300 shadow-md"
              >
                <MessageCircle size={18} /> Contact Support
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
