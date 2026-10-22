"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
interface HeroSectionProps {
  storeSettings?: {
    heroMainImage?: string | null;
    heroGheeImage?: string | null;
  };
}

export function HeroSection({ storeSettings }: HeroSectionProps) {
  // Configurable & replaceable hero images (uses admin upload if valid custom image, else default premium photography)
  const isCustomMain = storeSettings?.heroMainImage &&
    !storeSettings.heroMainImage.includes("festive") &&
    storeSettings.heroMainImage !== "/images/makhana_sig.jpg";

  const isCustomSecondary = storeSettings?.heroGheeImage &&
    !storeSettings.heroGheeImage.includes("festive") &&
    storeSettings.heroGheeImage !== "/images/ghee.jpg";

  const heroImages = {
    main: isCustomMain && storeSettings?.heroMainImage ? storeSettings.heroMainImage : "/images/hero_makhana_bowl.jpg",
    secondary: isCustomSecondary && storeSettings?.heroGheeImage ? storeSettings.heroGheeImage : "/images/hero_lotus_harvest.jpg",
  };

  return (
    <section
      id="hero"
      aria-label="Welcome to Pink Farm"
      className="relative w-full overflow-hidden bg-[#FFFBFC] min-h-[auto] lg:min-h-[calc(100vh-120px)] flex items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20 select-none"
      style={{
        background: "linear-gradient(135deg, #FFFBFC 0%, #FDF7F8 50%, #FAF0F3 100%)",
      }}
    >

      {/* Subtle Ambient Background Hearth Glow in Very Light Blush Tones */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      >
        <div
          className="absolute -top-32 right-[-10%] w-[36rem] sm:w-[48rem] lg:w-[58rem] h-[36rem] sm:h-[48rem] lg:h-[58rem] rounded-full blur-[100px] sm:blur-[140px] opacity-35 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #FDECEF 0%, rgba(253, 236, 239, 0.35) 50%, transparent 75%)"
          }}
        />
        <div
          className="absolute -bottom-24 -left-20 w-[28rem] sm:w-[38rem] h-[28rem] sm:h-[38rem] rounded-full blur-[120px] opacity-25 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #FFF4F7 0%, rgba(255, 244, 247, 0.25) 60%, transparent 80%)"
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#C47592 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Main Container */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-center">

          {/* ================= LEFT COLUMN: EDITORIAL TYPOGRAPHY & BRAND ================= */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left space-y-5 sm:space-y-6 lg:space-y-7 z-20">

            {/* Headline with Luxury Animated Light Shine */}
            <div className="space-y-1 sm:space-y-1.5 w-full">
              <h1 className="font-serif text-[2.25rem] xs:text-[2.65rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold leading-[1.08] tracking-tight block">
                <span className="hero-forest-shine">Goodness That</span>
              </h1>
              <span
                className="font-serif italic font-normal text-[2.25rem] xs:text-[2.65rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.12] tracking-normal block select-text drop-shadow-[0_2px_10px_rgba(196,117,146,0.12)]"
              >
                <span className="hero-rose-shine">Feels Like Home.</span>
              </span>
            </div>

            {/* Supporting Paragraph */}
            <p className="text-[#5A4F53] text-sm xs:text-base sm:text-lg md:text-[1.05rem] font-normal leading-relaxed max-w-lg">
              Discover thoughtfully selected everyday favourites, with premium quality at the heart of Pink Farm. Direct from farms to your family.
            </p>

            {/* Action Button */}
            <div className="pt-0.5 sm:pt-1 flex items-center w-full xs:w-auto">
              <Link
                href="/products"
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3 sm:px-8 sm:py-3.5 rounded-full bg-[#1A3C34] hover:bg-[#235045] text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_10px_24px_rgba(26,60,52,0.22)] hover:shadow-[0_14px_30px_rgba(26,60,52,0.28)] hover:-translate-y-0.5 active:translate-y-0 ring-1 ring-[#FCE4EC]/40 w-full xs:w-auto"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Feature Strip (PURE • PREMIUM • TRUSTED) - Mobile 3-col grid, desktop flex */}
            <div className="pt-5 sm:pt-7 w-full border-t border-[#F4E3E8]/80">
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 xs:gap-3 sm:gap-9 text-[#8C4F65] w-full">

                {/* 1. PURE */}
                <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 group cursor-default text-center sm:text-left">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#8C4F65] transition-all duration-300 group-hover:bg-[#F6E5EB] group-hover:scale-110 shadow-xs shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                      <line x1="16" y1="8" x2="2" y2="22" />
                      <line x1="17.5" y1="15" x2="9" y2="15" />
                    </svg>
                  </div>
                  <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-[#4D3A42]">PURE</span>
                </div>

                {/* 2. PREMIUM */}
                <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 group cursor-default text-center sm:text-left">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#8C4F65] transition-all duration-300 group-hover:bg-[#F6E5EB] group-hover:scale-110 shadow-xs shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-[#4D3A42]">PREMIUM</span>
                </div>

                {/* 3. TRUSTED */}
                <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 group cursor-default text-center sm:text-left">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#8C4F65] transition-all duration-300 group-hover:bg-[#F6E5EB] group-hover:scale-110 shadow-xs shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-[#4D3A42]">TRUSTED</span>
                </div>

              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: EXACT REFERENCE IMAGE COMPOSITION ================= */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center mt-8 sm:mt-10 lg:mt-0 w-full">

            {/* The Composition Stage Container (Shifted left by ~5% for optimal visual balance on desktop, centered on mobile) */}
            <div className="relative w-full max-w-[340px] xs:max-w-[390px] sm:max-w-[460px] lg:max-w-[510px] mx-auto lg:-translate-x-6">

              {/* 1. Subtle Whisper Pink Circular Aura Behind Main Image */}
              <div
                aria-hidden="true"
                className="absolute -top-10 -right-6 sm:-top-16 sm:-right-10 w-[280px] xs:w-[330px] sm:w-[470px] lg:w-[500px] aspect-square rounded-full pointer-events-none z-0"
                style={{
                  background: "radial-gradient(circle at 45% 45%, #FDF3F5 0%, #F8E6EB 55%, rgba(248, 230, 235, 0) 75%)",
                }}
              />

              {/* 2. Harmonious Blooming Botanical Golden Lotus Illustration
                     Flawlessly smooth, harmonic 7.5s cycle with zero velocity at endpoints to eliminate all stutter/kinks */}
              <motion.div
                aria-hidden="true"
                animate={{
                  scale: [0.99, 1.03, 0.99],
                  y: [0, -6, 0],
                  rotate: [-25.5, -21.5, -25.5],
                }}
                transition={{
                  duration: 7.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                }}
                style={{ willChange: "transform" }}
                className="absolute top-[10%] sm:top-[14%] -left-10 xs:-left-12 sm:-left-20 lg:-left-28 w-[210px] xs:w-[240px] sm:w-[300px] lg:w-[340px] aspect-square pointer-events-none z-0 select-none mix-blend-multiply opacity-95 origin-[60%_60%]"
              >
                <div className="relative w-full h-full">
                  <Image
                    src="/images/botanical_lotus_blossom.png"
                    alt="Botanical golden lotus floral line art"
                    fill
                    sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 340px"
                    priority
                    className="object-contain"
                  />
                </div>
              </motion.div>

              {/* 3. Main Image Container (Landscape 1000 × 800, signature arched top-right corner, soft whisper pink rim) */}
              <div className="relative z-10 w-full aspect-[5/4] rounded-tl-[1.75rem] rounded-tr-[4.75rem] rounded-br-[1.75rem] rounded-bl-[1.75rem] sm:rounded-tl-[2.25rem] sm:rounded-tr-[6.5rem] sm:rounded-br-[2.25rem] sm:rounded-bl-[2.25rem] overflow-hidden border-[2.5px] sm:border-[3px] border-[#F6DFE5] shadow-[0_20px_50px_-10px_rgba(175,100,125,0.14)] ring-1 ring-white/80 group bg-[#FAF2F4]">
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={heroImages.main}
                    alt="Pink Farm Premium Artisanal Roasted Makhana in handcrafted bowl"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 510px"
                    priority
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Subtle Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10 pointer-events-none" />
                </div>
              </div>

              {/* 4. Secondary Image Container (Nearly square 400 × 400, overlapping bottom-left corner) */}
              <div className="absolute -bottom-3.5 -left-2.5 sm:-bottom-6 sm:-left-6 md:-bottom-7 md:-left-7 w-[36%] sm:w-[32%] aspect-square rounded-[1.25rem] sm:rounded-[1.85rem] overflow-hidden border-[2.5px] sm:border-[3px] border-[#F6DFE5] shadow-[0_14px_30px_rgba(145,75,95,0.12)] sm:shadow-[0_18px_38px_rgba(145,75,95,0.15)] ring-1 ring-white/80 z-20 group bg-[#FAF2F4]">
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={heroImages.secondary}
                    alt="Artisanal organic lotus harvest held by farm growers"
                    fill
                    sizes="(max-width: 640px) 130px, (max-width: 768px) 150px, 180px"
                    priority
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Subtle Light Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/20 pointer-events-none" />
                </div>
              </div>

              {/* 5. Luxury Soft Rose 4-Point Starlight Twinkle Animation */}
              <motion.div
                aria-hidden="true"
                animate={{
                  scale: [1, 1.25, 0.95, 1.2, 1],
                  opacity: [0.75, 0.95, 0.65, 0.92, 0.75],
                  rotate: [0, 8, -6, 4, 0],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-3 -right-2 sm:-top-4 sm:-right-3 pointer-events-none z-20 select-none"
              >
                {/* Ambient Soft Pink Glow Aura */}
                <div className="absolute inset-0 rounded-full blur-[6px] bg-[#F9A8D4]/25 scale-110" />

                {/* Crisp 4-Pointed Star SVG in Lighter Shades of Pink */}
                <svg
                  viewBox="0 0 40 40"
                  className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-[0_2px_8px_rgba(244,114,182,0.30)]"
                  fill="none"
                >
                  <path
                    d="M20 0 C20 12 28 20 40 20 C28 20 20 28 20 40 C20 28 12 20 0 20 C12 20 20 12 20 0 Z"
                    fill="url(#roseStarGrad)"
                  />
                  <defs>
                    <radialGradient id="roseStarGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="35%" stopColor="#FFF5F8" />
                      <stop offset="70%" stopColor="#F9A8D4" />
                      <stop offset="100%" stopColor="#C47592" />
                    </radialGradient>
                  </defs>
                </svg>
              </motion.div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

export default HeroSection;
