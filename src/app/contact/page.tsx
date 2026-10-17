import { FadeIn, StaggerContainer, StaggerItem, SpotlightCard } from "@/components/ui/MotionWrappers";
import { ContactWhatsAppCard } from "./ContactWhatsAppCard";

export const metadata = {
  title: "Contact Us — Pink Farm",
  description: "Get in touch with Pink Farm. Order via WhatsApp, follow us on Instagram, or send us a message. We're always happy to help.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">

      {/* HERO */}
      <section className="relative w-full bg-brand-green text-brand-ivory pt-32 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #88E2B0 0%, transparent 60%), radial-gradient(circle at 20% 20%, #F7E1D7 0%, transparent 50%)" }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
          <FadeIn direction="up">
            <p className="text-brand-champagne text-sm font-medium tracking-widest uppercase mb-4">We&apos;re Here for You</p>
            <h1 className="font-serif text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Let&apos;s <span className="italic font-light text-brand-pink">Talk.</span>
            </h1>
            <p className="text-lg md:text-xl opacity-80 leading-relaxed">
              Whether you want to place an order, ask a question, or just say hello — the Pink Farm team is always just a message away.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="bg-brand-ivory py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <StaggerContainer staggerDelay={0.12} className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* WhatsApp */}
            <StaggerItem>
              <ContactWhatsAppCard />
            </StaggerItem>

            {/* Instagram */}
            <StaggerItem>
              <SpotlightCard className="h-full rounded-[2rem]" glowColor="rgba(42, 89, 78, 0.12)">
                <a
                  href="https://instagram.com/pinkfarm.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center text-center gap-5 bg-white p-10 rounded-[2rem] border border-brand-pink-accent/30 shadow-sm hover:shadow-2xl transition-all duration-400 h-full"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-brand-green mb-2">Instagram</h3>
                    <p className="text-brand-charcoal/70 text-sm mb-3">Follow us for recipes, updates, and behind-the-scenes farm stories.</p>
                    <p className="font-bold text-brand-green text-lg group-hover:text-brand-green-light transition-colors">@pinkfarm.in</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#bc1888] group-hover:gap-2 transition-all">
                    Follow us →
                  </span>
                </a>
              </SpotlightCard>
            </StaggerItem>

            {/* YouTube */}
            <StaggerItem>
              <SpotlightCard className="h-full rounded-[2rem]" glowColor="rgba(42, 89, 78, 0.12)">
                <a
                  href="https://www.youtube.com/@pinkfarm.official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center text-center gap-5 bg-white p-10 rounded-[2rem] border border-brand-pink-accent/30 shadow-sm hover:shadow-2xl transition-all duration-400 h-full"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF0000] to-[#cc0000] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-brand-green mb-2">YouTube</h3>
                    <p className="text-brand-charcoal/70 text-sm mb-3">Watch wholesome recipes, product reels & farm stories made with love.</p>
                    <p className="font-bold text-brand-green text-lg group-hover:text-brand-green-light transition-colors">@pinkfarm.official</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#FF0000] group-hover:gap-2 transition-all">
                    Watch now →
                  </span>
                </a>
              </SpotlightCard>
            </StaggerItem>

          </StaggerContainer>
        </div>
      </section>

      {/* HOW TO ORDER */}
      <section className="bg-brand-green text-brand-ivory py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <FadeIn>
            <p className="text-brand-champagne text-sm font-medium tracking-widest uppercase mb-4">Placing an Order</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-12">It&apos;s Super Simple.</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Browse & Choose", desc: "Pick your favourite products from our curated collection." },
              { step: "2", title: "WhatsApp or DM Us", desc: "Send us a message on +91 8437504040 or @pinkfarm.in on Instagram." },
              { step: "3", title: "Receive with Love", desc: "We carefully pack and dispatch your order PAN-India. Surprise gift inside 🎁" },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-pink text-brand-green flex items-center justify-center text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-serif text-xl font-bold">{item.title}</h3>
                <p className="opacity-75 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK INFO STRIP */}
      <section className="bg-brand-cream py-14">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-pink-accent/20">
              <p className="text-3xl mb-2">📍</p>
              <h4 className="font-bold text-brand-green mb-1">Delivery</h4>
              <p className="text-sm text-brand-charcoal/70">PAN-India delivery available on all orders.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-pink-accent/20">
              <p className="text-3xl mb-2">📦</p>
              <h4 className="font-bold text-brand-green mb-1">Dispatch</h4>
              <p className="text-sm text-brand-charcoal/70">Orders processed &amp; dispatched within 24 hours.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-pink-accent/20">
              <p className="text-3xl mb-2">🎁</p>
              <h4 className="font-bold text-brand-green mb-1">Free Gift</h4>
              <p className="text-sm text-brand-charcoal/70">Every order includes a secret surprise gift from us!</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
