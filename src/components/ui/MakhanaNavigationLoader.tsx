"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export function MakhanaNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsNavigating(true);
    setProgress(20);

    // Smoothly crawl up towards 85% while route payload loads
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        return prev + Math.random() * 12;
      });
    }, 120);
  }, []);

  const completeProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    const fadeTimer = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 300);

    return () => clearTimeout(fadeTimer);
  }, []);

  // When pathname or searchParams change, navigation finished
  useEffect(() => {
    if (isNavigating) {
      completeProgress();
    }
  }, [pathname, searchParams, completeProgress, isNavigating]);

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

      startProgress();
    };

    // Custom events for manual triggers
    const handleCustomStart = () => startProgress();
    const handleCustomStop = () => completeProgress();

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("pinkfarm:buffering:start", handleCustomStart);
    window.addEventListener("pinkfarm:buffering:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("pinkfarm:buffering:start", handleCustomStart);
      window.removeEventListener("pinkfarm:buffering:stop", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startProgress, completeProgress]);

  if (!isNavigating && progress === 0) return null;

  return (
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
  );
}
export default MakhanaNavigationLoader;
