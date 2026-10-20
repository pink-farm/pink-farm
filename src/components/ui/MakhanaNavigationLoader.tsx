"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MakhanaLoader } from "./MakhanaLoader";

declare global {
  interface Window {
    pinkfarmNavigate?: (url: string) => void;
  }
}

export function MakhanaNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Frame-0 initial loading is handled instantaneously by layout.tsx SSR splash.
  // isNavigating is activated smoothly during client-side route transitions.
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startTimestampRef = useRef<number>(0);
  const currentPathnameRef = useRef<string>(pathname);
  const isNavigatingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialProgressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startNavigation = useCallback((waitForRoute = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (initialProgressTimerRef.current) clearTimeout(initialProgressTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    startTimestampRef.current = Date.now();
    isNavigatingRef.current = true;
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
    }, 100);

    // Safety fallback: if destination takes too long, dismiss overlay so user is never locked out
    safetyTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      isNavigatingRef.current = false;
      setProgress(0);
    }, 6000);
  }, []);

  const completeNavigation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (initialProgressTimerRef.current) clearTimeout(initialProgressTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setProgress(100);

    // Ensure the lotus bloom animation plays gracefully for at least 780ms
    // and allows the newly mounted route to finish layout and image paint
    // before the screen cover dissolves away.
    const elapsed = startTimestampRef.current > 0 ? Date.now() - startTimestampRef.current : 0;
    const minDisplayTime = 780;
    const remainingTime = Math.max(180, minDisplayTime - elapsed);

    dismissTimerRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsNavigating(false);
          isNavigatingRef.current = false;
          setProgress(0);
        });
      });
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

  // When pathname or searchParams change, update progress
  useEffect(() => {
    if (currentPathnameRef.current !== pathname) {
      currentPathnameRef.current = pathname;
      setProgress((prev) => Math.max(prev, 85));

      // Safety fallback: if pinkfarm:route:mounted doesn't fire within 1.4s of pathname change,
      // gracefully complete so user is never stuck.
      const fallbackTimer = setTimeout(() => {
        completeNavigation();
      }, 1400);

      return () => clearTimeout(fallbackTimer);
    }
  }, [pathname, searchParams, completeNavigation]);

  // Expose global helper for programmatic navigations across the application
  useEffect(() => {
    window.pinkfarmNavigate = (url: string) => {
      startNavigation(true);
      router.push(url);
    };

    return () => {
      delete window.pinkfarmNavigate;
    };
  }, [router, startNavigation]);

  // Trigger loader smoothly on navigation link clicks without breaking Next.js Link lifecycle
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // Only primary left clicks

      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      if (target.hasAttribute("download")) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, mailto, tel, hash jumps, new tab targets, and modifier clicks
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

      let destinationUrl: URL;
      try {
        destinationUrl = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (destinationUrl.origin !== window.location.origin) return;

      const currentUrl = new URL(window.location.href);

      // Same page (pathname and query identical)
      if (
        currentUrl.pathname === destinationUrl.pathname &&
        currentUrl.search === destinationUrl.search
      ) {
        return;
      }

      // Smoothly activate loader; let Next.js Link execute natively without preventDefault
      startNavigation(true);
    };

    // Custom events for manual triggers
    const handleCustomStart = (event: Event) => {
      const waitForRoute = (event as CustomEvent<{ waitForRoute?: boolean }>).detail?.waitForRoute === true;
      startNavigation(waitForRoute);
    };
    const handleCustomStop = () => completeNavigation();

    // Listen to browser Back / Forward buttons
    const handlePopState = () => {
      startNavigation(true);
    };

    document.addEventListener("click", handleDocumentClick, { passive: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pinkfarm:buffering:start", handleCustomStart);
    window.addEventListener("pinkfarm:buffering:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pinkfarm:buffering:start", handleCustomStart);
      window.removeEventListener("pinkfarm:buffering:stop", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
      if (initialProgressTimerRef.current) clearTimeout(initialProgressTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [router, startNavigation, completeNavigation]);

  return (
    <>
      {/* 1. Top Luxury Gradient Progress Bar */}
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

      {/* 2. Smooth Lotus Transition (Covers screen smoothly, renders next page behind it, dissolves out) */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="navigation-lotus-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.28, ease: "easeInOut" } }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              transform: "translateZ(0)",
              willChange: "opacity",
              backfaceVisibility: "hidden",
            }}
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
