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

  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startTimestampRef = useRef<number>(0);
  const currentPathnameRef = useRef<string>(pathname);
  const isNavigatingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum time (in ms) the lotus bloom loader remains visible to ensure
  // a complete, luxurious bloom experience without cutting off abruptly on fast routes like "/"
  const MIN_BLOOM_DURATION_MS = 1100;

  // 1. Initial Page Load: Smoothly dismiss the server-rendered HTML curtain once React hydrates
  useEffect(() => {
    const curtain = document.getElementById("pinkfarm-initial-curtain");
    if (curtain) {
      const dismissCurtain = () => {
        curtain.style.opacity = "0";
        curtain.style.pointerEvents = "none";
        setTimeout(() => {
          curtain.style.display = "none";
        }, 550);
      };

      // Allow 650ms on first load so user gets the full bloom before smooth reveal
      const timer = setTimeout(dismissCurtain, 650);
      return () => clearTimeout(timer);
    }
  }, []);

  const startNavigation = useCallback((targetUrl?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    startTimestampRef.current = Date.now();
    isNavigatingRef.current = true;
    setIsNavigating(true);
    setProgress(35);

    // Increment progress bar smoothly up to 88% while waiting for page
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 88;
        }
        return prev + 8;
      });
    }, 90);

    // Generous safety fallback (8s) so slow server routes never hang indefinitely
    safetyTimeoutRef.current = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        isNavigatingRef.current = false;
        setTimeout(() => setProgress(0), 300);
      }, 150);
    }, 8000);
  }, []);

  const completeNavigation = useCallback(() => {
    if (!isNavigatingRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    // Calculate how long the loader has been active
    const elapsed = Date.now() - startTimestampRef.current;
    // Allow a smooth, comfortable minimum duration (450ms) so it never flashes or jitters
    const remainingTime = Math.max(0, 450 - elapsed);

    dismissTimerRef.current = setTimeout(() => {
      setProgress(100);

      // Smoothly dissolve overlay into the newly loaded page
      setTimeout(() => {
        setIsNavigating(false);
        isNavigatingRef.current = false;
        currentPathnameRef.current = window.location.pathname;
        setTimeout(() => setProgress(0), 300);
      }, 180);
    }, remainingTime);
  }, []);

  // When pathname changes, it signifies that the new route has arrived from the server!
  // Complete the navigation smoothly and NEVER restart.
  useEffect(() => {
    if (currentPathnameRef.current !== pathname) {
      if (isNavigatingRef.current) {
        completeNavigation();
      } else {
        currentPathnameRef.current = pathname;
      }
    }
  }, [pathname, completeNavigation]);

  // Listen for the new route to be mounted into the DOM via template.tsx
  useEffect(() => {
    const handleRouteMounted = (e: Event) => {
      if (!isNavigatingRef.current) return;
      const customEvent = e as CustomEvent<{ pathname?: string }>;
      // If the event provides the new pathname, verify it matches
      if (customEvent.detail?.pathname && customEvent.detail.pathname === currentPathnameRef.current) {
        // Still on old page, do not dismiss yet
        return;
      }
      window.scrollTo(0, 0);
      completeNavigation();
    };

    window.addEventListener("pinkfarm:route:mounted", handleRouteMounted);
    return () => {
      window.removeEventListener("pinkfarm:route:mounted", handleRouteMounted);
    };
  }, [completeNavigation]);

  // Expose global helper for programmatic navigations across the application
  useEffect(() => {
    window.pinkfarmNavigate = (url: string) => {
      startNavigation(url);
      router.push(url);
    };

    return () => {
      delete window.pinkfarmNavigate;
    };
  }, [router, startNavigation]);

  // Capture link clicks in CAPTURE phase so Next.js Link's preventDefault does not block loader
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only primary left clicks

      const target = e.target instanceof Element ? e.target.closest("a") : null;
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

      // Instantly bring up lotus loader to cover route transition
      startNavigation();
    };

    // Custom events for manual triggers
    const handleCustomStart = () => {
      startNavigation();
    };
    const handleCustomStop = () => completeNavigation();

    // Listen to browser Back / Forward buttons
    const handlePopState = () => {
      startNavigation();
    };

    // Use CAPTURE phase so we intercept before any child prevents default
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pinkfarm:buffering:start", handleCustomStart);
    window.addEventListener("pinkfarm:buffering:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pinkfarm:buffering:start", handleCustomStart);
      window.removeEventListener("pinkfarm:buffering:stop", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
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

      {/* 2. Instant-on, Silky-dissolve Lotus Transition (covers screen instantly, holds full bloom, dissolves into new page) */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="navigation-lotus-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.12, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }}
            style={{
              transform: "translateZ(0)",
              willChange: "opacity",
              backfaceVisibility: "hidden",
            }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FDFBF7] select-none"
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
