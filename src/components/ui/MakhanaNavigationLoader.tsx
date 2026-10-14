"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MakhanaLoader } from "./MakhanaLoader";

export function MakhanaNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startTimestampRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startNavigation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    startTimestampRef.current = Date.now();
    setIsNavigating(true);
    setProgress(25);

    // Increment progress bar smoothly
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        return prev + Math.random() * 12;
      });
    }, 120);

    // Safety timeout: auto dismiss after 6s
    safetyTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 6000);
  }, []);

  const completeNavigation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setProgress(100);

    // Keep the lotus visible for a smooth, pleasant moment (~450ms)
    // so the bloom animation is appreciated without feeling sluggish
    const elapsed = Date.now() - startTimestampRef.current;
    const minDisplayTime = 450;
    const remainingTime = Math.max(0, minDisplayTime - elapsed);

    dismissTimerRef.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
      window.scrollTo(0, 0);
    }, remainingTime);
  }, []);

  // When pathname or searchParams change, navigation finished
  useEffect(() => {
    if (isNavigating) {
      window.scrollTo(0, 0);
      completeNavigation();
    }
  }, [pathname, searchParams, completeNavigation, isNavigating]);

  // Intercept navigation link clicks across the application
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, hash jumps, new tab targets, and modifier clicks
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        target.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const destinationUrl = new URL(href, window.location.origin);

      if (
        currentUrl.pathname === destinationUrl.pathname &&
        currentUrl.search === destinationUrl.search
      ) {
        return;
      }

      startNavigation();
    };

    // Custom events for manual triggers
    const handleCustomStart = () => startNavigation();
    const handleCustomStop = () => completeNavigation();

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("pinkfarm:buffering:start", handleCustomStart);
    window.addEventListener("pinkfarm:buffering:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("pinkfarm:buffering:start", handleCustomStart);
      window.removeEventListener("pinkfarm:buffering:stop", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [startNavigation, completeNavigation]);

  return (
    <>
      {/* 1. Top Luxury Gradient Progress Bar */}
      {(isNavigating || progress > 0) && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[3px] z-[99999] pointer-events-none overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-brand-green via-brand-pink-accent to-[#88E2B0] shadow-[0_0_12px_rgba(42,89,78,0.6)]"
            initial={{ width: "0%", opacity: 1 }}
            animate={{
              width: `${progress}%`,
              opacity: progress === 100 ? 0 : 1,
            }}
            transition={{
              width: { ease: "easeOut", duration: 0.2 },
              opacity: { duration: 0.25, delay: progress === 100 ? 0.1 : 0 },
            }}
          />
        </div>
      )}

      {/* 2. Floating Lotus Loader Card (NOT full screen — page remains visible behind it) */}
      <AnimatePresence>
        {isNavigating && (
          <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 pointer-events-none">
            {/* Soft, translucent vignette (page remains visible underneath) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-brand-charcoal/15 backdrop-blur-[2px]"
            />

            {/* Centered Floating Lotus Card */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              transition={{
                type: "spring",
                damping: 24,
                stiffness: 300,
              }}
              className="relative z-10 bg-white/95 backdrop-blur-xl border border-brand-green/15 rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(26,60,52,0.18)] flex flex-col items-center justify-center text-center max-w-[280px] w-full"
            >
              <MakhanaLoader
                size="md"
                text="Loading Freshness..."
                subtext="Crafted with pure care"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
export default MakhanaNavigationLoader;
