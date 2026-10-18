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
  const currentPathnameRef = useRef<string>(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startNavigation = useCallback((waitForRoute = false) => {
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

    // Authentication transitions stay covered until the destination template
    // reports that its route has mounted. Ordinary navigation keeps a fallback.
    if (!waitForRoute) {
      safetyTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 6000);
    }
  }, []);

  const completeNavigation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setProgress(100);

    // Ensure the lotus animation is shown for at least minDisplayTime (300ms)
    // so it doesn't flicker away instantly on super-fast cached pages,
    // but dismisses smoothly once the new page is mounted.
    const elapsed = Date.now() - startTimestampRef.current;
    const minDisplayTime = 300;
    const remainingTime = Math.max(0, minDisplayTime - elapsed);

    dismissTimerRef.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, remainingTime);
  }, []);

  // Listen for the new route to be mounted into the DOM via template.tsx
  useEffect(() => {
    const handleRouteMounted = () => {
      currentPathnameRef.current = window.location.pathname;
      window.scrollTo(0, 0);
      completeNavigation();
    };

    window.addEventListener("pinkfarm:route:mounted", handleRouteMounted);
    return () => {
      window.removeEventListener("pinkfarm:route:mounted", handleRouteMounted);
    };
  }, [completeNavigation]);

  // Reactive fallback: detect when pathname or searchParams change to a different URL
  useEffect(() => {
    if (currentPathnameRef.current !== pathname) {
      currentPathnameRef.current = pathname;
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        completeNavigation();
      });
    }
  }, [pathname, searchParams, completeNavigation]);

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
    const handleCustomStart = (event: Event) => {
      const waitForRoute = (event as CustomEvent<{ waitForRoute?: boolean }>).detail?.waitForRoute === true;
      startNavigation(waitForRoute);
    };
    const handleCustomStop = () => completeNavigation();

    // Listen to browser Back / Forward buttons
    const handlePopState = () => startNavigation();

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pinkfarm:buffering:start", handleCustomStart);
    window.addEventListener("pinkfarm:buffering:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pinkfarm:buffering:start", handleCustomStart);
      window.removeEventListener("pinkfarm:buffering:stop", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [startNavigation, completeNavigation]);

  return (
    <>
      {/* 1. Top Luxury Gradient Progress Bar (Flat, no glow shadow) */}
      {(isNavigating || progress > 0) && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] pointer-events-none overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-brand-green via-brand-pink-accent to-[#88E2B0]"
            initial={{ width: "0%", opacity: 1 }}
            animate={{
              width: `${progress}%`,
              opacity: progress === 100 ? 0 : 1,
            }}
            transition={{
              width: { ease: "easeOut", duration: 0.2 },
              opacity: { duration: 0.3, delay: progress === 100 ? 0.08 : 0 },
            }}
          />
        </div>
      )}

      {/* 2. Smooth Lotus Transition (No reflections, no shadows, no harsh flash) */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="navigation-lotus-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FDFBF7] pointer-events-auto select-none"
          >
            <MakhanaLoader
              size="xl"
              text="Loading Freshness..."
              subtext="Every bite crafted with love"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
export default MakhanaNavigationLoader;
