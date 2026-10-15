import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FadeIn, StaggerContainer, StaggerItem, HoverCard, ScaleOnTap, SpotlightCard, GlowPulse, ShimmerSheen } from "@/components/ui/MotionWrappers";

export const metadata = {
  title: "About Us — Pink Farm",
  description: "Meet Anjali, the dietitian-turned-food-entrepreneur behind Pink Farm. Learn our story, our mission, and our uncompromising promise on quality.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">

      {/* HERO */}
      <section className="relative w-full bg-brand-green text-brand-ivory pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #88E2B0 0%, transparent 60%), radial-gradient(circle at 80% 20%, #F7E1D7 0%, transparent 50%)' }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <FadeIn direction="up">
            <p className="text-brand-champagne text-sm font-medium tracking-widest uppercase mb-4">Our Story</p>
            <h1 className="font-serif text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Not Just a Brand.<br />
              <span className="italic font-light text-brand-pink">It&apos;s a Dream.</span>
            </h1>
            <p className="text-lg md:text-xl opacity-80 leading-relaxed max-w-2xl mx-auto">
              Born from a dietitian&apos;s passion for real, wholesome food — Pink Farm is where nutrition meets love, and quality is never negotiated.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FOUNDER STORY */}
      <section className="bg-brand-ivory py-20 md:py-28">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16 max-w-6xl">
          {/* Visual */}
          <div className="flex-shrink-0 relative">
            <HoverCard lift={-6}>
              <GlowPulse color="rgba(230, 184, 192, 0.45)">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-brand-pink to-brand-cream border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-105">
                  <span className="text-9xl select-none">👩‍💼</span>
                </div>
              </GlowPulse>
            </HoverCard>
            <div className="absolute -bottom-4 -right-4 bg-brand-green text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg">
              Founder & Dietitian
            </div>
          </div>

          {/* Text */}
          <FadeIn direction="left" className="flex-1 space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl text-brand-green leading-tight">
              Meet <span className="italic text-brand-green-light">Anjali.</span>
            </h2>
            <p className="text-brand-charcoal/80 text-lg leading-relaxed">
              Anjali started her journey as a trained dietitian — someone who spent years understanding the deep connection between what we eat and how we feel. She knew that truly good food doesn&apos;t need artificial anything. It just needs care, intention, and the right source.
            </p>
            <p className="text-brand-charcoal/80 text-lg leading-relaxed">
              That belief became the seed of <strong className="text-brand-green">Pink Farm</strong>. What began as a personal mission to bring honest, nutritious snacks to her own family soon turned into something much bigger — a food brand built on trust, quality, and a quiet promise to never cut corners.
            </p>
            <blockquote className="border-l-4 border-brand-pink pl-6 italic text-brand-green font-serif text-xl">
              &ldquo;Pure in nature, good for you. Simple food, stronger you.&rdquo;
            </blockquote>
            <div className="flex flex-wrap gap-3 pt-2">
              {["Nutrition", "Food Science", "Innovation", "Entrepreneur", "Founder", "Curator"].map(tag => (
                <span key={tag} className="px-4 py-1.5 rounded-full bg-brand-pink text-brand-green text-sm font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* MISSION & VALUES */}
      <section className="bg-brand-cream py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <FadeIn>
            <div className="text-center mb-16 space-y-3">
              <p className="text-brand-green text-sm font-medium tracking-widest uppercase">What We Stand For</p>
              <h2 className="font-serif text-4xl md:text-5xl text-brand-green">
                Our <span className="italic text-brand-green-light">Promise</span> to You
              </h2>
            </div>
          </FadeIn>
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                emoji: "🏆",
                title: "Zero Compromise on Quality",
                desc: "We inspect every batch meticulously. We once rejected 4.5 kg out of 20 kg in a single batch — because anything below our standard simply doesn't leave our door."
              },
              {
                emoji: "🌾",
                title: "Sourced with Care",
                desc: "Every product is thoughtfully sourced from trusted origins, carefully selected for its quality, authenticity, and natural goodness."
              },
              {
                emoji: "📦",
                title: "PAN-India Delivery",
                desc: "Wherever you are in India, your order of goodness is just a WhatsApp message away. Fast dispatch, careful packing."
              },
              {
                emoji: "🤍",
                title: "Trust First",
                desc: "Pink Farm was built on relationships, not transactions. We believe the food we eat is personal — and so is the brand you choose to trust."
              },
              {
                emoji: "🎁",
                title: "A Little Extra Love",
                desc: "Every order comes with a secret free gift — because we believe every customer deserves to feel special."
              },
            ].map(item => (
              <StaggerItem key={item.title}>
                <SpotlightCard className="h-full rounded-[2rem]" glowColor="rgba(230, 184, 192, 0.2)">
                  <div className="h-full bg-white p-8 rounded-[2rem] shadow-sm border border-brand-pink-accent/30 hover:shadow-xl transition-all duration-300">
                    <div className="w-14 h-14 bg-brand-pink rounded-full flex items-center justify-center text-2xl mb-5 shadow-inner transition-transform duration-300 hover:rotate-6">{item.emoji}</div>
                    <h3 className="font-serif text-xl text-brand-green font-bold mb-3">{item.title}</h3>
                    <p className="text-brand-charcoal/75 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* PRODUCT SPOTLIGHT */}
      <section className="bg-brand-green text-brand-ivory py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-8">
          <FadeIn>
            <p className="text-brand-champagne text-sm font-medium tracking-widest uppercase">Our Heart Product</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
              Premium Phool Makhana<br />
              <span className="italic font-light text-brand-pink text-3xl md:text-4xl">Why not? You deserve the best.</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 max-w-3xl mx-auto">
              {["Plant-Based", "Gluten-Free", "Low Calorie", "High Calcium", "No Frying", "No Preservatives", "Farm to Table", "Hygienically Packed"].map(feat => (
                <div key={feat} className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl py-3 px-4 text-sm font-medium">
                  {feat}
                </div>
              ))}
            </div>
            <div className="pt-4">
              <ScaleOnTap>
                <Button asChild size="lg" className="rounded-full px-10 py-6 text-base bg-brand-pink text-brand-green font-bold hover:scale-105 transition-all duration-300 border-0">
                  <Link href="/products">Shop Now</Link>
                </Button>
              </ScaleOnTap>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-ivory py-20 text-center">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          <FadeIn>
            <h2 className="font-serif text-3xl md:text-4xl text-brand-green">
              Have Questions? We&apos;d Love to Hear From You.
            </h2>
            <p className="text-brand-charcoal/70 text-lg">
              Reach out on WhatsApp or Instagram — Anjali and the Pink Farm team are always happy to help.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <ScaleOnTap>
                <a
                  href="https://wa.me/918437504040"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#25D366] text-white font-bold hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  💬 Chat on WhatsApp
                </a>
              </ScaleOnTap>
              <ScaleOnTap>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="rounded-full px-8 py-4 border-brand-green/30 hover:bg-brand-green hover:text-white transition-all duration-300">
                    Contact Us
                  </Button>
                </Link>
              </ScaleOnTap>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
