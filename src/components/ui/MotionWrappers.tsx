"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

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
  duration = 1.1,
  direction = "up",
  distance = 32,
  className = "",
}: FadeInProps) {
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
      initial={{ opacity: 0, ...initialOffset }}
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
  staggerDelay = 0.18,
  className = "",
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: staggerDelay,
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
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.95,
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
  return (
    <motion.div
      whileHover={{
        y: lift,
        scale: 1.015,
        transition: { type: "spring", stiffness: 280, damping: 26 },
      }}
      whileTap={{ scale: 0.985 }}
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
  return (
    <motion.div
      animate={{
        y: [-amplitude / 2, amplitude / 2, -amplitude / 2],
        rotate: [-1, 1, -1],
      }}
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
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
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
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)", y: 36 }}
      whileInView={{ opacity: 1, clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)", y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 1.3,
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
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
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
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <motion.div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 rounded-[inherit]"
        style={{
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 80%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
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
  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={{
          opacity: [0.35, 0.7, 0.35],
          scale: [0.97, 1.05, 0.97],
        }}
        transition={{
          duration: 4.5,
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
  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none skew-x-12"
        initial={{ x: "-100%" }}
        whileHover={{
          x: "200%",
          transition: { duration: 0.85, ease: "easeInOut" },
        }}
      />
    </div>
  );
}
