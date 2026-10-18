"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// 1. FadeIn Container - Cinematic, Gentle & Slower Scroll Entrance
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.68,
  direction = "up",
  distance = 18,
  className = "",
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const directions = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  const initialOffset = directions[direction];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, ...initialOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 2. StaggerContainer & StaggerItem - Relaxed, Cascading Scroll Reveal
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = "",
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: prefersReducedMotion ? 0.01 : 0.52,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 3. HoverCard with Gentle Spring Lift
export function HoverCard({
  children,
  className = "",
  lift = -6,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: lift * 0.55, transition: { type: "spring", stiffness: 300, damping: 30 } }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.992 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 4. FloatingPill / Organic Slow-Floating Element
export function FloatingElement({
  children,
  amplitude = 12,
  duration = 7,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      animate={prefersReducedMotion ? undefined : { y: [-amplitude * 0.28, amplitude * 0.28, -amplitude * 0.28], rotate: [-0.35, 0.35, -0.35] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 5. ScaleOnTap for Buttons / Pills
export function ScaleOnTap({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: -1 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 6. Smooth Reveal Mask
export function MaskReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, clipPath: "inset(0 0 100% 0)", y: 18 }}
      whileInView={{ opacity: 1, clipPath: "inset(0 0 0% 0)", y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReducedMotion ? 0.01 : 0.72,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 7. Interactive Magnetic Button Effect
export function MagneticWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: -1 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 8. Luxury Scroll Progress Bar
export function LuxuryScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[60] bg-transparent pointer-events-none print:hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-brand-green via-brand-pink-accent to-[#88E2B0]"
        style={{ width: `${scrollProgress}%` }}
        transition={{ ease: "easeOut", duration: 0.2 }}
      />
    </div>
  );
}

// 9. Premium Spotlight Card with Mouse Follow Glow
export function SpotlightCard({
  children,
  className = "",
  glowColor = "rgba(42, 89, 78, 0.12)",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`pf-spotlight-card relative overflow-hidden ${className}`}
      style={{ "--spotlight-tint": glowColor } as React.CSSProperties}
    >
      {children}
    </motion.div>
  );
}

// 10. Ambient Glow Pulse for Signature Elements
export function GlowPulse({
  children,
  color = "rgba(136, 226, 176, 0.25)",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={prefersReducedMotion ? undefined : {
          opacity: [0.22, 0.38, 0.22],
          scale: [0.99, 1.02, 0.99],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -inset-4 rounded-full blur-2xl pointer-events-none -z-10"
        style={{ backgroundColor: color }}
      />
      {children}
    </div>
  );
}

// 11. Subtle Shimmer Sheen Wrapper for Buttons & CTAs
export function ShimmerSheen({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={`relative overflow-hidden group pf-sheen ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none skew-x-12"
        initial={prefersReducedMotion ? false : { x: "-110%" }}
        whileHover={prefersReducedMotion ? undefined : {
          x: "210%",
          transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
        }}
      />
    </div>
  );
}
