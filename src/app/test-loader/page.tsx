"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LotusLoader } from "@/components/ui/LotusLoader";

export default function TestLoaderPage() {
  const [selectedSize, setSelectedSize] = useState<"xs" | "sm" | "md" | "lg" | "xl">("lg");
  const [isDark, setIsDark] = useState(false);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ${
        isDark ? "bg-[#111c18]" : "bg-[#FDFBF7]"
      }`}
    >
      <div className="absolute top-6 left-6 flex items-center gap-4">
        <Link
          href="/"
          className="text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full border border-brand-green/20 text-brand-green bg-white/80 shadow-sm hover:bg-white"
        >
          ← Back to Store
        </Link>
      </div>

      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest font-bold text-brand-gold bg-brand-gold/10 px-3.5 py-1.5 rounded-full border border-brand-gold/30">
          Pink Farm Sacred Lotus Animation
        </span>
        <h1
          className={`text-3xl font-serif mt-4 font-semibold ${
            isDark ? "text-white" : "text-brand-green"
          }`}
        >
          Seamless Transparent 3D Lotus Loop
        </h1>
        <p
          className={`text-sm mt-1 max-w-md mx-auto ${
            isDark ? "text-stone-300" : "text-brand-sage"
          }`}
        >
          Buttery smooth, muted, transparent looping lotus bloom with 24k gold trims.
        </p>
      </div>

      {/* Main Preview */}
      <div className="relative flex items-center justify-center p-8">
        <LotusLoader
          size={selectedSize}
          text="Loading Freshness..."
          subtext="Crafted with pure care"
        />
      </div>

      {/* Size and Theme Switcher */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-brand-green/10 text-xs">
        <span className="font-semibold text-brand-green mr-2">Preset Size:</span>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSize(s)}
            className={`px-3 py-1.5 rounded-lg uppercase font-bold tracking-wider transition-all ${
              selectedSize === s
                ? "bg-brand-green text-white shadow-sm"
                : "border border-brand-green/20 text-brand-green hover:bg-brand-green/10"
            }`}
          >
            {s}
          </button>
        ))}

        <div className="h-4 w-px bg-stone-300 mx-2" />

        <button
          onClick={() => setIsDark(!isDark)}
          className="px-3.5 py-1.5 rounded-lg border border-brand-green/20 hover:bg-brand-green hover:text-white transition-colors font-semibold text-brand-green"
        >
          {isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        </button>
      </div>
    </div>
  );
}
