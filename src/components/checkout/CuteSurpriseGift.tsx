"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Heart, Info, Check } from "lucide-react";

interface CuteAnimatedGiftIconProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  interactive?: boolean;
}

export function CuteAnimatedGiftIcon({
  size = "md",
  className = "",
  interactive = true,
}: CuteAnimatedGiftIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Dimension presets
  const dims = {
    sm: { box: 36, svg: 32 },
    md: { box: 48, svg: 42 },
    lg: { box: 64, svg: 56 },
  }[size];

  const handleClick = () => {
    if (!interactive) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 1200);
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      title="Surprise Gift included with every order!"
      style={{ width: dims.box, height: dims.box }}
    >
      {/* Soft Ambient Radial Glow */}
      <motion.div
        animate={{
          scale: isHovered || isClicked ? [1, 1.3, 1.1] : [0.95, 1.1, 0.95],
          opacity: isHovered || isClicked ? 0.75 : [0.35, 0.55, 0.35],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.4,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-300 via-rose-200 to-amber-200 blur-md pointer-events-none"
      />

      {/* Floating Sparkle Particles */}
      <AnimatePresence>
        <motion.div
          animate={{
            y: [-2, -6, -2],
            x: [0, 2, 0],
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
          className="absolute -top-1 -right-1 text-amber-500 pointer-events-none z-10"
        >
          <Sparkles className={size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
        </motion.div>

        <motion.div
          animate={{
            y: [0, -3, 0],
            opacity: [0.3, 0.9, 0.3],
            scale: [0.7, 1.1, 0.7],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            delay: 0.7,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1 -left-1 text-rose-400 pointer-events-none z-10"
        >
          <Heart className={size === "sm" ? "w-2 h-2 fill-current" : "w-3 h-3 fill-current"} />
        </motion.div>
      </AnimatePresence>

      {/* Main Animated Gift Box Graphic */}
      <motion.div
        animate={
          isClicked
            ? {
                rotate: [0, -14, 14, -10, 10, -4, 4, 0],
                scale: [1, 1.25, 1.15, 1],
                y: [0, -8, -4, 0],
              }
            : isHovered
            ? {
                rotate: [-4, 4, -4],
                scale: 1.08,
                y: -3,
              }
            : {
                rotate: [-2, 2, -2],
                y: [0, -3, 0],
              }
        }
        transition={
          isClicked
            ? { duration: 0.8, ease: "easeOut" }
            : isHovered
            ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
            : { repeat: Infinity, duration: 2.6, ease: "easeInOut" }
        }
        className="relative z-10 flex items-center justify-center cursor-pointer"
        style={{ width: dims.svg, height: dims.svg }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Subtle Shadow under Box */}
          <ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0,0,0,0.12)" />

          {/* Gift Box Base Body */}
          <rect
            x="12"
            y="26"
            width="40"
            height="28"
            rx="6"
            fill="url(#giftBodyGrad)"
          />

          {/* Gift Box Body Shading */}
          <path
            d="M12 32C12 28.6863 14.6863 26 18 26H46C49.3137 26 52 28.6863 52 32V34H12V32Z"
            fill="white"
            fillOpacity="0.2"
          />

          {/* Vertical Body Ribbon */}
          <rect x="28" y="26" width="8" height="28" fill="url(#ribbonGrad)" />

          {/* Horizontal Body Ribbon */}
          <rect x="12" y="37" width="40" height="6" fill="url(#ribbonGrad)" />

          {/* Cute Blushing Cheeks (Japanese Kawaii Style) */}
          <circle cx="21" cy="42" r="2.5" fill="#FF85A1" fillOpacity="0.65" />
          <circle cx="43" cy="42" r="2.5" fill="#FF85A1" fillOpacity="0.65" />

          {/* Cute Mini Smile on Box */}
          <path
            d="M29 43C30 44.5 34 44.5 35 43"
            stroke="#9F1239"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Gift Box Lid (Gently floats & pops) */}
          <g>
            <rect
              x="9"
              y="18"
              width="46"
              height="10"
              rx="4"
              fill="url(#giftLidGrad)"
              stroke="#F43F5E"
              strokeWidth="0.8"
            />
            {/* Lid vertical ribbon */}
            <rect x="28" y="18" width="8" height="10" fill="url(#ribbonGrad)" />
            {/* Lid highlight shine */}
            <line
              x1="13"
              y1="20"
              x2="25"
              y2="20"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.6"
            />
          </g>

          {/* Bow on Top */}
          {/* Left Bow Loop */}
          <path
            d="M32 18C28 11 18 10 20 16C21 19 28 18 32 18Z"
            fill="url(#ribbonGrad)"
            stroke="#D97706"
            strokeWidth="0.8"
          />
          {/* Right Bow Loop */}
          <path
            d="M32 18C36 11 46 10 44 16C43 19 36 18 32 18Z"
            fill="url(#ribbonGrad)"
            stroke="#D97706"
            strokeWidth="0.8"
          />
          {/* Center Bow Knot */}
          <circle
            cx="32"
            cy="18"
            r="3.2"
            fill="#FEF08A"
            stroke="#D97706"
            strokeWidth="0.8"
          />

          {/* Mini sparkle star on top bow */}
          <path
            d="M32 8L33 11L36 12L33 13L32 16L31 13L28 12L31 11Z"
            fill="#FBBF24"
          />

          {/* Color Gradients */}
          <defs>
            <linearGradient id="giftBodyGrad" x1="12" y1="26" x2="52" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FB7185" />
              <stop offset="0.5" stopColor="#F43F5E" />
              <stop offset="1" stopColor="#E11D48" />
            </linearGradient>

            <linearGradient id="giftLidGrad" x1="9" y1="18" x2="55" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDA4AF" />
              <stop offset="1" stopColor="#F43F5E" />
            </linearGradient>

            <linearGradient id="ribbonGrad" x1="28" y1="10" x2="36" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#FBBF24" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}

/**
 * SurpriseGiftCheckoutRow:
 * Lists the Surprise Gift directly inside the products checkout summary
 * with rich cute animations, free badges, and heartwarming messaging.
 */
export function SurpriseGiftCheckoutRow({
  className = "",
}: {
  className?: string;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-pink-200/90 bg-gradient-to-r from-pink-50/90 via-rose-50/50 to-amber-50/70 p-3 transition-all hover:border-pink-300 hover:shadow-xs ${className}`}
    >
      {/* Decorative subtle background sparkle pattern */}
      <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-pink-200/30 blur-xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Left: Cute Animated Gift & Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex items-center justify-center p-0.5 rounded-xl bg-white/90 border border-pink-200/80 shadow-xs">
            <CuteAnimatedGiftIcon size="md" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs bg-rose-600 text-white px-2 py-0.5 rounded-md shrink-0 shadow-xs">
                1x
              </span>
              <h4 className="font-serif font-bold text-sm text-brand-green flex items-center gap-1.5 leading-snug">
                <span>Surprise Gift</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-extrabold uppercase tracking-wider bg-gradient-to-r from-rose-500 to-pink-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" /> FREE
                </span>
              </h4>
            </div>

            <p className="text-xs text-brand-charcoal/75 mt-0.5 truncate flex items-center gap-1">
              <span>Handpicked treat packed with love in your parcel</span>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex text-rose-600 hover:text-rose-800 shrink-0"
                title="Click for gift info"
              >
                <Info className="w-3 h-3" />
              </button>
            </p>
          </div>
        </div>

        {/* Right: Crossed-Out Price + 100% Free Badge */}
        <div className="flex flex-col items-end shrink-0 pl-2 text-right">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-brand-charcoal/40 line-through">
              ₹149
            </span>
            <span className="font-extrabold text-emerald-700 bg-emerald-100/90 text-xs px-2 py-0.5 rounded-full border border-emerald-200/80">
              ₹0.00
            </span>
          </div>
          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 mt-0.5">
            <Check className="w-2.5 h-2.5" /> On the house
          </span>
        </div>
      </div>

      {/* Expandable Explanation Note */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 pt-2 border-t border-pink-200/70 text-[11px] text-brand-charcoal/80 flex items-start gap-1.5 bg-white/70 p-2 rounded-xl">
              <Gift className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-green">A token of gratitude from Pink Farm:</strong>{" "}
                We add a complimentary surprise treat (sample snack, mini pantry favourite, or seasonal goodie) to every single parcel we ship!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
