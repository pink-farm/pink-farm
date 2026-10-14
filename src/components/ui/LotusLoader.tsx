"use client";

import React from "react";

export interface LotusLoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  text?: string;
  subtext?: string;
  className?: string;
  speedSec?: number;
}

const SIZES = {
  xs: { width: 52, height: 52, textClass: "text-xs" },
  sm: { width: 76, height: 76, textClass: "text-sm" },
  md: { width: 120, height: 120, textClass: "text-base" },
  lg: { width: 190, height: 190, textClass: "text-lg" },
  xl: { width: 260, height: 260, textClass: "text-xl" },
};

export function LotusLoader({
  size = "lg",
  fullScreen = false,
  text = "Loading Freshness...",
  subtext = "Crafted with pure care",
  className = "",
}: LotusLoaderProps) {
  const { width, height, textClass } = SIZES[size] || SIZES.lg;

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading..."
      className={`flex flex-col items-center justify-center select-none ${className}`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Soft Golden/Blush Ambient Glow */}
        <div
          className="absolute inset-4 rounded-full pointer-events-none transition-all duration-700 animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(230, 184, 192, 0.45) 0%, rgba(246, 211, 101, 0.16) 45%, transparent 75%)",
            filter: "blur(22px)",
          }}
        />

        {/* Pure Transparent Looping Lotus with Zero-Lag Tab Switching */}
        <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
          <img
            src="/images/lotus-loader.webp?v=4"
            alt="Pink Farm Lotus Bloom"
            width={width}
            height={height}
            loading="eager"
            decoding="async"
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
      </div>

      {/* Typography matching luxury Pink Farm brand */}
      {text && (
        <div className="mt-3 text-center px-4 animate-fade-in z-20">
          <p className={`font-serif tracking-wide text-brand-green font-medium ${textClass}`}>
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
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#FDFBF7]/92 backdrop-blur-md transition-all duration-300">
        {content}
      </div>
    );
  }

  return content;
}

export const MakhanaLoader = LotusLoader;
export default LotusLoader;
