import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Truck, Lock, Package } from "lucide-react";
import { 
  FadeIn, 
  StaggerContainer, 
  StaggerItem, 
  HoverCard, 
  FloatingElement, 
  ScaleOnTap,
  SpotlightCard,
  GlowPulse,
  ShimmerSheen
} from "@/components/ui/MotionWrappers";
import { formatPrice } from "@/lib/utils";
import ComboBuilder from "@/components/products/ComboBuilder";
import { getStoreProducts, getStoreSettings } from "@/lib/defaultProducts";

export const instant = false;

export default async function Home() {
  const [products, storeSettings] = await Promise.all([getStoreProducts(), getStoreSettings()]);
  const homepageProducts = products.filter((p) => p.isFeatured);
  const featuredProduct = (storeSettings.featuredProductId
    ? products.find((p) => p.id === storeSettings.featuredProductId || p.slug === storeSettings.featuredProductId)
    : null) || homepageProducts.find((p) => p.category.toLowerCase() === 'makhana') || homepageProducts[0] || products[0];

  return (
    <div className="flex flex-col gap-8 md:gap-12 pb-28 sm:pb-20 overflow-x-hidden min-w-0">
      
      {/* C. HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-brand-ivory pt-24 pb-16 md:pt-28 md:pb-20">
        {/* Dynamic Abstract CSS Mesh Background */}
        <div 
          className="absolute inset-0 z-0 animate-mesh opacity-90"
          style={{
            backgroundImage: 'radial-gradient(at 0% 0%, rgba(247, 225, 215, 0.95) 0px, transparent 60%), radial-gradient(at 100% 0%, rgba(157, 180, 160, 0.8) 0px, transparent 60%), radial-gradient(at 100% 100%, rgba(255, 245, 230, 0.9) 0px, transparent 60%), radial-gradient(at 0% 100%, rgba(240, 210, 220, 0.8) 0px, transparent 60%)',
            backgroundSize: '200% 200%'
          }}
        />
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

        <div className="container relative z-10 mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left Text Column */}
          <div className="flex-1 space-y-8 max-w-2xl relative z-20">
            
            <FadeIn direction="up" delay={0.1}>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl leading-[1.1] tracking-tight">
                <span className="bg-[linear-gradient(110deg,#1A4031_0%,#1A4031_10%,#2A614C_19%,#54A982_23%,#8EE2B6_25%,#54A982_27%,#2A614C_31%,#1A4031_40%,#1A4031_60%,#2A614C_69%,#54A982_73%,#8EE2B6_75%,#54A982_77%,#2A614C_81%,#1A4031_90%,#1A4031_100%)] bg-[length:200%_100%] text-transparent bg-clip-text animate-text-gradient inline-block drop-shadow-sm">
                  Goodness That <br/><span className="italic font-light">Feels Like Home.</span>
                </span>
              </h1>
            </FadeIn>
            
            <FadeIn direction="up" delay={0.25}>
              <p className="text-lg md:text-xl opacity-90 leading-relaxed">
                <span className="bg-[linear-gradient(110deg,#2D2D2D_0%,#2D2D2D_10%,#484848_19%,#7A7A7A_23%,#A8A8A8_25%,#7A7A7A_27%,#484848_31%,#2D2D2D_40%,#2D2D2D_60%,#484848_69%,#7A7A7A_73%,#A8A8A8_75%,#7A7A7A_77%,#484848_81%,#2D2D2D_90%,#2D2D2D_100%)] bg-[length:200%_100%] text-transparent bg-clip-text animate-text-gradient inline-block">
                  Discover thoughtfully selected everyday favourites, with premium quality at the heart of Pink Farm. Direct from farms to your family.
                </span>
              </p>
            </FadeIn>
            
            <FadeIn direction="up" delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <ScaleOnTap>
                  <ShimmerSheen className="rounded-full">
                    <Button asChild size="lg" className="w-full sm:w-auto text-base rounded-full px-8 py-6 shadow-md hover:shadow-xl border-0 text-white bg-[linear-gradient(110deg,#1A4031_0%,#1A4031_10%,#255E47_19%,#3B8E67_23%,#56B887_25%,#3B8E67_27%,#255E47_31%,#1A4031_40%,#1A4031_60%,#255E47_69%,#3B8E67_73%,#56B887_75%,#3B8E67_77%,#255E47_81%,#1A4031_90%,#1A4031_100%)] bg-[length:200%_100%] animate-text-gradient transition-transform duration-300">
                      <Link href="/products">Shop Now</Link>
                    </Button>
                  </ShimmerSheen>
                </ScaleOnTap>
              </div>
            </FadeIn>
          </div>

          {/* Right Visual Column - FLOATING IMAGES WITH LUXURY GLOW & MOTION */}
          <div className="flex-1 flex relative h-[320px] sm:h-[400px] md:h-[500px] w-full justify-center items-center z-10 mt-6 md:mt-0">
            {/* Center Main Floating Image with GlowPulse */}
            <FloatingElement amplitude={14} duration={7} delay={0} className="absolute z-30">
              <HoverCard lift={-6}>
                <GlowPulse color="rgba(230, 184, 192, 0.45)">
                  <div className="shadow-2xl rounded-full overflow-hidden border-4 sm:border-6 md:border-8 border-brand-ivory/60 w-[220px] h-[220px] sm:w-[270px] sm:h-[270px] md:w-[320px] md:h-[320px] relative transition-transform duration-700 hover:scale-105">
                    <Image 
                      src={storeSettings.heroMainImage || "/images/makhana_sig.jpg"}
                      alt="Signature Makhana" 
                      fill
                      sizes="(min-width: 768px) 320px, 220px"
                      className="object-cover"
                      priority
                      unoptimized={Boolean(storeSettings.heroMainImage?.startsWith("data:"))}
                    />
                  </div>
                </GlowPulse>
              </HoverCard>
            </FloatingElement>
            
            {/* Top Right Floating Image */}
            <FloatingElement amplitude={18} duration={8} delay={1} className="absolute -top-2 -right-2 sm:top-2 sm:right-4 md:top-4 md:right-8 z-20">
              <HoverCard lift={-5}>
                <div className="shadow-xl rounded-full overflow-hidden border-2 sm:border-4 border-brand-ivory/50 opacity-95 w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] md:w-[190px] md:h-[190px] relative transition-transform duration-700 hover:scale-105">
                  <Image 
                    src={storeSettings.heroGheeImage || "/images/ghee.jpg"}
                    alt="Premium Ghee" 
                    fill
                    sizes="(min-width: 768px) 190px, 130px"
                    className="object-cover"
                    unoptimized={Boolean(storeSettings.heroGheeImage?.startsWith("data:"))}
                  />
                </div>
              </HoverCard>
            </FloatingElement>

            {/* Bottom Left Floating Image */}
            <FloatingElement amplitude={16} duration={6.5} delay={0.5} className="absolute -bottom-2 -left-2 sm:bottom-2 sm:left-4 md:bottom-4 md:left-8 z-40">
              <HoverCard lift={-5}>
                <div className="shadow-2xl rounded-full overflow-hidden border-2 sm:border-4 border-brand-ivory/50 opacity-95 w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] md:w-[220px] md:h-[220px] relative transition-transform duration-700 hover:scale-105">
                  <Image 
                    src={storeSettings.heroAlmondsImage || "/images/almonds.jpg"}
                    alt="Premium Almonds" 
                    fill
                    sizes="(min-width: 768px) 220px, 140px"
                    className="object-cover"
                    unoptimized={Boolean(storeSettings.heroAlmondsImage?.startsWith("data:"))}
                  />
                </div>
              </HoverCard>
            </FloatingElement>
          </div>
        </div>
      </section>

      {/* D. INFINITE MARQUEE TICKER */}
      <div className="w-full bg-brand-green text-brand-ivory py-3 overflow-hidden flex whitespace-nowrap border-y border-brand-green-light/30">
        <div className="animate-marquee inline-block font-medium tracking-widest text-sm uppercase">
          ✦ PURE & HYGIENIC ✦ PREMIUM GOODS ✦ FAST PAN-INDIA DISPATCH ✦ NO ARTIFICIAL PRESERVATIVES ✦ FARM TO TABLE ✦ ACCOUNT-HOLDER REVIEWS ✦ PURE & HYGIENIC ✦ PREMIUM GOODS ✦ FAST PAN-INDIA DISPATCH ✦ NO ARTIFICIAL PRESERVATIVES ✦ FARM TO TABLE ✦ ACCOUNT-HOLDER REVIEWS ✦
        </div>
      </div>

      {/* D. TRUST HIGHLIGHTS */}
      <section className="container mx-auto px-4">
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-y border-brand-green-light/20 py-10">
            {[
              { icon: Package, text: "Carefully Packed" },
              { icon: ShieldCheck, text: "Quality-Focused" },
              { icon: Truck, text: "Easy Online Ordering" },
              { icon: Lock, text: "UPI, Cards & NetBanking" }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <HoverCard key={i} lift={-4}>
                  <div className="flex flex-col items-center gap-3 text-brand-green p-2 group transition-transform">
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      <Icon className="w-8 h-8 opacity-80" />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </div>
                </HoverCard>
              );
            })}
          </div>
        </FadeIn>
      </section>

      {/* E. SHOP BY CATEGORY (7 PRODUCT SLOTS) WITH CURSOR SPOTLIGHT */}
      <section className="container mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif text-3xl md:text-5xl text-brand-green uppercase tracking-wide">
              Our Signature <span className="italic text-brand-green-light lowercase font-light text-4xl md:text-6xl align-baseline">collection</span>
            </h2>
            <p className="text-brand-charcoal opacity-80 tracking-wide uppercase text-sm">Thoughtfully curated essentials, perfected for your home.</p>
          </div>
        </FadeIn>

        {homepageProducts.length > 0 ? (
          <StaggerContainer staggerDelay={0.16} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {homepageProducts.map((product, index) => (
              <StaggerItem key={product.id}>
                <SpotlightCard className="rounded-[2rem] h-full" glowColor="rgba(42, 89, 78, 0.15)">
                  <Link href={`/products/${product.slug}`} className="group flex flex-col gap-4 h-full p-2">
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-pink-accent/40 to-brand-cream shadow-sm group-hover:shadow-xl transition-all duration-500 border border-brand-pink-accent/20 p-2 sm:p-4">
                      {product.imageUrl ? (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-brand-green/30">
                          Placeholder
                        </div>
                      )}
                      {product.variants?.[0]?.packSize ? (
                        <div className="absolute top-3 left-3 bg-brand-green/90 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                          {product.variants[0].packSize}
                        </div>
                      ) : index === 0 ? (
                        <div className="absolute top-3 left-3 bg-brand-green text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                          Signature
                        </div>
                      ) : null}
                      {product.originalPrice && product.originalPrice > product.basePrice && (
                        <div className="absolute top-3 right-3 bg-brand-pink text-brand-green border border-brand-green/20 text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full shadow-md">
                          {Math.round((1 - product.basePrice / product.originalPrice) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="pt-2 px-1">
                      <h3 className="font-serif text-base sm:text-lg lg:text-xl font-bold text-brand-green group-hover:text-brand-green-light transition-colors leading-tight">{product.name}</h3>
                      <p className="hidden sm:block text-sm text-brand-charcoal opacity-60 line-clamp-1 mt-1 mb-2">{product.shortDescription}</p>
                      
                      {/* Price & Discount */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                        <div className="bg-brand-green text-brand-ivory px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-transform duration-300 group-hover:scale-105">
                          ₹{formatPrice(product.basePrice)}
                        </div>
                        {product.originalPrice && product.originalPrice > product.basePrice && (
                          <span className="text-xs text-brand-charcoal/50 line-through font-medium">
                            ₹{formatPrice(product.originalPrice)}
                          </span>
                        )}
                        <div className="bg-brand-cream border border-brand-green/20 text-brand-green px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wider">
                          PREMIUM
                        </div>
                      </div>
                    </div>
                  </Link>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="text-center py-12 text-brand-charcoal opacity-70 bg-brand-pink/20 rounded-2xl">
            <p className="font-semibold text-brand-green">No featured products currently displayed on the storefront homepage.</p>
            <p className="text-sm mt-1 text-brand-charcoal/70">Check &quot;Feature on storefront&quot; in the admin panel on products you wish to showcase here.</p>
          </div>
        )}
      </section>

      {/* F. FEATURED PRODUCT SECTION */}
      {featuredProduct && (
        <section className="container mx-auto px-4">
          <FadeIn>
            <div className="bg-brand-pink rounded-3xl p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-12 shadow-soft">
              <div className="flex-1 relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden">
                <HoverCard lift={-4}>
                  <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden">
                    {storeSettings.featuredProductImage || featuredProduct.imageUrl ? (
                      <Image
                        src={storeSettings.featuredProductImage || featuredProduct.imageUrl}
                        alt={storeSettings.featuredProductHeading || featuredProduct.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        unoptimized={Boolean(storeSettings.featuredProductImage)}
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-cream flex items-center justify-center">
                        <span className="text-brand-green/30 font-serif">Featured Product Image</span>
                      </div>
                    )}
                  </div>
                </HoverCard>
              </div>
              <div className="flex-1 space-y-6">
                <h2 className="font-serif text-3xl md:text-5xl text-brand-green">
                  {storeSettings.featuredProductHeading || featuredProduct.name}
                </h2>
                <p className="text-lg opacity-90 leading-relaxed">
                  {storeSettings.featuredProductDescription || featuredProduct.shortDescription || featuredProduct.description}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">₹{formatPrice(featuredProduct.basePrice)}</span>
                  {featuredProduct.originalPrice && featuredProduct.originalPrice > featuredProduct.basePrice && (
                    <span className="text-lg line-through opacity-50">₹{formatPrice(featuredProduct.originalPrice)}</span>
                  )}
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <ScaleOnTap>
                    <ShimmerSheen className="rounded-md">
                      <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link href={`/products/${featuredProduct.slug}`}>
                          {storeSettings.featuredProductButtonText || "View Details & Add to Cart"}
                        </Link>
                      </Button>
                    </ShimmerSheen>
                  </ScaleOnTap>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>
      )}

      {/* G2. MAKE YOUR OWN COMBO SECTION */}
      <ComboBuilder products={products} />

      {/* G. WHY PINK FARM? WITH SPOTLIGHT CARDS */}
      <section className="container mx-auto px-4 text-center max-w-5xl space-y-12 py-16">
        <FadeIn>
          <div className="space-y-2">
            <h2 className="font-serif text-4xl md:text-5xl text-brand-green uppercase tracking-wide">
              Why Choose <span className="italic text-brand-green-light lowercase font-light text-5xl md:text-6xl align-baseline">pink farm?</span>
            </h2>
          </div>
        </FadeIn>
        <StaggerContainer staggerDelay={0.20} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <StaggerItem>
            <SpotlightCard className="h-full rounded-[2.5rem]" glowColor="rgba(230, 184, 192, 0.2)">
              <div className="h-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-pink-accent/30 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-brand-pink rounded-full flex items-center justify-center text-2xl mb-6 shadow-inner transition-transform duration-300 hover:rotate-6">🌱</div>
                <h3 className="font-serif text-2xl text-brand-green mb-3 uppercase tracking-wide">Rooted in Origin</h3>
                <p className="text-brand-charcoal/80 leading-relaxed text-sm">
                  We source each product from the region where it naturally belongs, bringing you authentic quality straight from its roots.
                </p>
              </div>
            </SpotlightCard>
          </StaggerItem>
          <StaggerItem>
            <SpotlightCard className="h-full rounded-[2.5rem]" glowColor="rgba(230, 184, 192, 0.2)">
              <div className="h-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-pink-accent/30 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-brand-pink rounded-full flex items-center justify-center text-2xl mb-6 shadow-inner transition-transform duration-300 hover:rotate-6">🍃</div>
                <h3 className="font-serif text-2xl text-brand-green mb-3 uppercase tracking-wide">Pure by Nature</h3>
                <p className="text-brand-charcoal/80 leading-relaxed text-sm">
                  Rich in wholesome goodness with no unnecessary additives — just simple, honest food as nature intended.
                </p>
              </div>
            </SpotlightCard>
          </StaggerItem>
          <StaggerItem>
            <SpotlightCard className="h-full rounded-[2.5rem]" glowColor="rgba(230, 184, 192, 0.2)">
              <div className="h-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-pink-accent/30 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-brand-pink rounded-full flex items-center justify-center text-2xl mb-6 shadow-inner transition-transform duration-300 hover:rotate-6">✨</div>
                <h3 className="font-serif text-2xl text-brand-green mb-3 uppercase tracking-wide">Crafted with Care</h3>
                <p className="text-brand-charcoal/80 leading-relaxed text-sm">
                  Thoughtfully sourced, carefully prepared, and made with attention to every detail — because quality is in the care we put into every product.
                </p>
              </div>
            </SpotlightCard>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* YOUTUBE RECIPES SECTION WITH RED GLOW PULSE */}
      <section className="relative w-full overflow-hidden bg-[#0f1f17] text-brand-ivory py-20 md:py-28">
        {/* Subtle glow background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse at 60% 50%, rgba(255,0,0,0.08) 0%, transparent 65%), radial-gradient(ellipse at 20% 50%, rgba(136,226,176,0.06) 0%, transparent 60%)' }}
        />
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12 max-w-5xl">
          {/* Left — YouTube icon block */}
          <FadeIn direction="right">
            <div className="flex-shrink-0 flex flex-col items-center gap-5">
              <HoverCard lift={-5}>
                <GlowPulse color="rgba(255, 0, 0, 0.35)">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#FF0000] to-[#cc0000] flex items-center justify-center shadow-[0_0_60px_rgba(255,0,0,0.35)] hover:shadow-[0_0_80px_rgba(255,0,0,0.55)] transition-shadow duration-500">
                    <svg viewBox="0 0 24 24" fill="white" className="w-14 h-14 md:w-18 md:h-18">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                </GlowPulse>
              </HoverCard>
              <span className="text-white/50 text-xs font-medium tracking-widest uppercase">youtube</span>
            </div>
          </FadeIn>

          {/* Right — Text + CTA */}
          <FadeIn direction="left" className="flex-1 space-y-5 text-center md:text-left">
            <p className="text-[#FF6B6B] text-sm font-semibold tracking-widest uppercase">Our Pink Farm Channel</p>
            <h2 className="font-serif text-4xl md:text-5xl font-extrabold leading-tight">
              Feel Free To Check<br />
              <span className="italic font-light text-brand-pink">Our Pink Farm Channel On YouTube.</span>
            </h2>
            <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-lg">
              Wholesome, easy &amp; delicious ideas made with love — from Anjali&apos;s kitchen to yours. Watch recipes, product reels, and farm stories.
            </p>
            <div className="pt-2">
              <ScaleOnTap>
                <ShimmerSheen className="rounded-full inline-block">
                  <a
                    href="https://www.youtube.com/@pinkfarm.official"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#FF0000] text-white font-bold text-base shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:shadow-[0_0_50px_rgba(255,0,0,0.5)] hover:scale-105 transition-all duration-300"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Watch on YouTube
                  </a>
                </ShimmerSheen>
              </ScaleOnTap>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* I. SIMPLE SHOPPING PROCESS */}
      <section className="bg-brand-green text-brand-ivory py-16 md:py-24 mt-8">
        <div className="container mx-auto px-4">
          <FadeIn>
            <h2 className="text-center font-serif text-3xl md:text-4xl mb-16 text-brand-champagne">Simple. Secure. Satisfying.</h2>
          </FadeIn>
          
          <StaggerContainer staggerDelay={0.22} className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <StaggerItem>
              <HoverCard lift={-5}>
                <div className="flex flex-col items-center text-center gap-6 relative z-10 group">
                  <div className="w-16 h-16 rounded-full bg-brand-pink text-brand-green flex items-center justify-center text-2xl font-bold transition-transform duration-300 group-hover:scale-110 shadow-lg">1</div>
                  <h3 className="font-serif text-xl">Choose Your Products</h3>
                  <p className="opacity-80">Select from our curated list of 7 premium everyday essentials.</p>
                </div>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard lift={-5}>
                <div className="flex flex-col items-center text-center gap-6 relative z-10 group">
                  <div className="w-16 h-16 rounded-full bg-brand-pink text-brand-green flex items-center justify-center text-2xl font-bold transition-transform duration-300 group-hover:scale-110 shadow-lg">2</div>
                  <h3 className="font-serif text-xl">Pay Securely Online</h3>
                  <p className="opacity-80">Fast, 100% secure checkout via UPI, Cards, and NetBanking.</p>
                </div>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard lift={-5}>
                <div className="flex flex-col items-center text-center gap-6 relative z-10 group">
                  <div className="w-16 h-16 rounded-full bg-brand-pink text-brand-green flex items-center justify-center text-2xl font-bold transition-transform duration-300 group-hover:scale-110 shadow-lg">3</div>
                  <h3 className="font-serif text-xl">Receive Your Order</h3>
                  <p className="opacity-80">We pack it carefully and deliver it straight to your doorstep.</p>
                </div>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* K. FAQ PREVIEW */}
      <section className="container mx-auto px-4 max-w-4xl">
        <FadeIn>
          <h2 className="text-center font-serif text-3xl md:text-4xl text-brand-green mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <HoverCard lift={-3}>
              <div className="border border-brand-green-light/20 p-6 rounded-xl bg-white/70 shadow-sm transition-shadow hover:shadow-md">
                <h3 className="font-bold text-lg mb-2 text-brand-green">How should I store Pink Farm Makhana?</h3>
                <p className="opacity-80 text-sm leading-relaxed">Store in a cool, dry place away from direct sunlight and moisture. Once opened, keep the pack/jar tightly sealed to retain maximum freshness and crunch.</p>
              </div>
            </HoverCard>
            <HoverCard lift={-3}>
              <div className="border border-brand-green-light/20 p-6 rounded-xl bg-white/70 shadow-sm transition-shadow hover:shadow-md">
                <h3 className="font-bold text-lg mb-2 text-brand-green">What is the shelf life of the product?</h3>
                <p className="opacity-80 text-sm leading-relaxed">The shelf life is mentioned on the product packaging. For the best taste, freshness and crunch, we recommend consuming the product within the mentioned period.</p>
              </div>
            </HoverCard>
            <HoverCard lift={-3}>
              <div className="border border-brand-green-light/20 p-6 rounded-xl bg-white/70 shadow-sm transition-shadow hover:shadow-md">
                <h3 className="font-bold text-lg mb-2 text-brand-green">Can I place a bulk or corporate gifting order?</h3>
                <p className="opacity-80 text-sm leading-relaxed">Absolutely. Pink Farm offers bulk and corporate gifting options with premium packaging and multiple flavour choices. For customised requirements, please contact us directly.</p>
              </div>
            </HoverCard>
          </div>
          <div className="text-center mt-8">
            <Button variant="link" asChild>
              <Link href="/faq">Read all FAQs</Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* L. FINAL CTA */}
      <section className="container mx-auto px-4 text-center mt-8">
        <FadeIn>
          <div className="bg-brand-cream border border-brand-pink-accent/50 rounded-3xl p-12 md:p-20 shadow-sm relative overflow-hidden">
            <h2 className="font-serif text-3xl md:text-5xl text-brand-green mb-6">A Little Goodness Goes a Long Way.</h2>
            <ScaleOnTap>
              <ShimmerSheen className="rounded-md inline-block">
                <Button asChild size="lg" className="px-10 py-6 text-lg">
                  <Link href="/products">Shop Pink Farm</Link>
                </Button>
              </ShimmerSheen>
            </ScaleOnTap>
          </div>
        </FadeIn>
      </section>

    </div>
  );
}
