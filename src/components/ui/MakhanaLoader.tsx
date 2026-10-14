"use client";

import React from "react";
import Image from "next/image";

export interface MakhanaLoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  text?: string;
  subtext?: string;
  className?: string;
  speedSec?: number;
}

const SIZES = {
  xs: { px: 28, textClass: "text-xs", shadowW: "w-6", shadowH: "h-1" },
  sm: { px: 40, textClass: "text-sm", shadowW: "w-8", shadowH: "h-1.5" },
  md: { px: 64, textClass: "text-base", shadowW: "w-12", shadowH: "h-2" },
  lg: { px: 92, textClass: "text-lg", shadowW: "w-16", shadowH: "h-2.5" },
  xl: { px: 120, textClass: "text-xl", shadowW: "w-24", shadowH: "h-3" },
};

export function MakhanaLoader({
  size = "lg",
  fullScreen = false,
  text = "Goodness in Every Bite...",
  subtext = "Crafted with pure care",
  className = "",
  speedSec = 2.4,
}: MakhanaLoaderProps) {
  const { px, textClass, shadowW, shadowH } = SIZES[size] || SIZES.lg;

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading..."
      className={`flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Makhana Stage with Ambient Glow & Float */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Ambient Warm Golden Aura */}
        <div
          className="absolute -inset-4 rounded-full pointer-events-none transition-all duration-700"
          style={{
            background:
              "radial-gradient(circle, rgba(230, 184, 192, 0.45) 0%, rgba(26, 60, 52, 0.08) 50%, transparent 75%)",
            filter: "blur(14px)",
          }}
        />

        {/* Floating Pod */}
        <div
          className="relative flex items-center justify-center"
          style={{
            animation: "float-makhana 2.6s ease-in-out infinite",
          }}
        >
          {/* Continuously Rotating Makhana Ball */}
          <div
            className="relative will-change-transform drop-shadow-[0_8px_18px_rgba(26,60,52,0.18)]"
            style={{
              width: `${px}px`,
              height: `${px}px`,
              animation: `spin-makhana ${speedSec}s linear infinite`,
            }}
          >
            <Image
              src="/images/makhana-ball.png"
              alt="Rotating Organic Makhana"
              width={px}
              height={px}
              priority
              className="w-full h-full object-contain pointer-events-none drop-shadow-sm select-none"
            />
          </div>
        </div>

        {/* Soft Organic Shadow Underneath */}
        <div
          className={`mt-2 rounded-full bg-brand-green/25 blur-[3px] ${shadowW} ${shadowH}`}
          style={{
            animation: "pulse-makhana-shadow 2.6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Accompanying Typography */}
      {text && (
        <div className="mt-5 text-center px-4 animate-fade-in">
          <p
            className={`font-serif tracking-wide text-brand-green font-medium ${textClass}`}
          >
            {text}
          </p>
          {subtext && (
            <p className="text-xs uppercase tracking-widest text-brand-sage/80 mt-1 font-sans">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#FDFBF7]/85 backdrop-blur-md transition-all duration-300">
        {content}
      </div>
    );
  }

  return content;
}
