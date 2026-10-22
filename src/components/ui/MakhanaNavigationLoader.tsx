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
  const [navKey, setNavKey] = useState<number>(() => Date.now());

  const initialUrlRef = useRef<string>("");
  const isNavigatingRef = useRef<boolean>(false);
  const isCompletingRef = useRef<boolean>(false);
  const routeMountedRef = useRef<boolean>(false);
  const minTimeElapsedRef = useRef<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum time (in ms) the lotus bloom loader remains visible so transitions feel polished and intentional
  const MIN_BLOOM_DURATION_MS = 1050;

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

      const timer = setTimeout(dismissCurtain, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Attempt dismissal: ONLY dissolves when BOTH the new page is in the DOM AND min bloom time is reached
  const attemptDismissal = useCallback(() => {
    if (!isNavigatingRef.current || isCompletingRef.current) return;

    // CRITICAL: Must wait until the new page has actually mounted into the DOM!
    if (!routeMountedRef.current || !minTimeElapsedRef.current) {
      return;
    }

    isCompletingRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    if (minTimerRef.current) clearTimeout(minTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setProgress(100);

    // Smoothly dissolve overlay to reveal the new page already fully loaded underneath
    dismissTimerRef.current = setTimeout(() => {
      setIsNavigating(false);
      isNavigatingRef.current = false;
      isCompletingRef.current = false;
      if (typeof window !== "undefined") {
        initialUrlRef.current = window.location.pathname + window.location.search;
      }
      setTimeout(() => setProgress(0), 300);
    }, 220);
  }, []);

  const startNavigation = useCallback((targetUrl?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (minTimerRef.current) clearTimeout(minTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    const now = Date.now();
    if (typeof window !== "undefined") {
      initialUrlRef.current = window.location.pathname + window.location.search;
    }
    setNavKey(now);
    isNavigatingRef.current = true;
    isCompletingRef.current = false;
    routeMountedRef.current = false;
    minTimeElapsedRef.current = false;

    setIsNavigating(true);
    setProgress(30);

    // Increment progress bar smoothly up to 88% while waiting for page
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 88;
        }
        return prev + 6;
      });
    }, 100);

    // Minimum bloom display timer
    minTimerRef.current = setTimeout(() => {
      minTimeElapsedRef.current = true;
      attemptDismissal();
    }, MIN_BLOOM_DURATION_MS);

    // Generous safety fallback (10s) in case a catastrophic network error occurs
    safetyTimeoutRef.current = setTimeout(() => {
      routeMountedRef.current = true;
      minTimeElapsedRef.current = true;
      attemptDismissal();
    }, 10000);
  }, [attemptDismissal]);

  // Listener A: When template.tsx fires pinkfarm:route:mounted, the new route is fully painted in the DOM!
  useEffect(() => {
    const handleRouteMounted = (e: Event) => {
      if (!isNavigatingRef.current) return;
      const customEvent = e as CustomEvent<{ pathname?: string; url?: string }>;
      const arrivedUrl = customEvent.detail?.url || customEvent.detail?.pathname || (typeof window !== "undefined" ? window.location.pathname : "");

      // If the URL is still the initial URL where we started, the new page has not arrived yet!
      if (initialUrlRef.current && arrivedUrl === initialUrlRef.current) {
        return;
      }

      window.scrollTo(0, 0);
      routeMountedRef.current = true;
      attemptDismissal();
    };

    window.addEventListener("pinkfarm:route:mounted", handleRouteMounted);
    return () => {
      window.removeEventListener("pinkfarm:route:mounted", handleRouteMounted);
    };
  }, [attemptDismissal]);

  // Listener B: React pathname/searchParams hook changes as backup
  useEffect(() => {
    if (!isNavigatingRef.current) {
      if (typeof window !== "undefined") {
        initialUrlRef.current = window.location.pathname + window.location.search;
      }
      return;
    }

    const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : pathname;
    if (initialUrlRef.current && currentUrl !== initialUrlRef.current) {
      // The router has committed the new route - wait 2 animation frames to ensure layout paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          routeMountedRef.current = true;
          attemptDismissal();
        });
      });
    }
  }, [pathname, searchParams, attemptDismissal]);

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
      startNavigation(destinationUrl.pathname + destinationUrl.search);
    };

    // Custom events for manual triggers
    const handleCustomStart = () => {
      startNavigation();
    };
    const handleCustomStop = () => {
      routeMountedRef.current = true;
      minTimeElapsedRef.current = true;
      attemptDismissal();
    };

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
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [router, startNavigation, attemptDismissal]);

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

      {/* 2. Instant-on, Silky-dissolve Lotus Transition (covers screen until new route is mounted) */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="navigation-lotus-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.12, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.28, ease: "easeOut" } }}
            style={{
              transform: "translateZ(0)",
              willChange: "opacity",
              backfaceVisibility: "hidden",
            }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FDFBF7] select-none"
          >
            <MakhanaLoader
              key={navKey}
              navKey={navKey}
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
