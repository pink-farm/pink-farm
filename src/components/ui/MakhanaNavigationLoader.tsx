"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MakhanaLoader, preloadLotusBlob } from "./LotusLoader";

declare global {
  interface Window {
    pinkfarmNavigate?: (url: string) => void;
  }
}

function getMainElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const mains = document.querySelectorAll("main");
  return mains.length > 0 ? (mains[mains.length - 1] as HTMLElement) : null;
}

function getMainSignature(): string {
  const mainEl = getMainElement();
  return mainEl ? (mainEl.textContent || "").slice(0, 300) : "";
}

export function MakhanaNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchString = searchParams ? searchParams.toString() : "";
  const currentRouteUrl = searchString ? `${pathname}?${searchString}` : pathname;

  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [navKey, setNavKey] = useState<number>(() => Date.now());

  const committedRouteRef = useRef<string>(currentRouteUrl);
  const committedSignatureRef = useRef<string>("");
  const originUrlRef = useRef<string>(currentRouteUrl);
  const targetUrlRef = useRef<string>("");
  const originSignatureRef = useRef<string>("");
  const isNavigatingRef = useRef<boolean>(false);
  const isCompletingRef = useRef<boolean>(false);
  const routeMountedRef = useRef<boolean>(false);
  const minTimeElapsedRef = useRef<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum time (in ms) the lotus bloom loader remains visible so transitions feel polished without stalling cached routes
  const MIN_BLOOM_DURATION_MS = 160;

  // Track the currently committed route and DOM signature whenever idle
  useEffect(() => {
    if (!isNavigatingRef.current) {
      committedRouteRef.current = currentRouteUrl;
      committedSignatureRef.current = getMainSignature();
    }
  }, [currentRouteUrl]);

  // Preload lotus blob into memory on initial mount
  useEffect(() => {
    preloadLotusBlob();
  }, []);

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

      const timer = setTimeout(dismissCurtain, 250);
      return () => clearTimeout(timer);
    }
  }, []);

  // Attempt dismissal: ONLY dissolves when BOTH the new page is in the DOM AND min bloom time is reached
  const attemptDismissal = useCallback(() => {
    if (!isNavigatingRef.current || isCompletingRef.current) return;

    // Wait until BOTH the new page has mounted into the DOM AND min bloom time is reached
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
      targetUrlRef.current = "";
      if (typeof window !== "undefined") {
        const settledUrl = window.location.pathname + window.location.search;
        committedRouteRef.current = settledUrl;
        originUrlRef.current = settledUrl;
      }
      const settledSig = getMainSignature();
      committedSignatureRef.current = settledSig;
      originSignatureRef.current = settledSig;
      setTimeout(() => setProgress(0), 200);
    }, 60);
  }, []);

  const startNavigation = useCallback(
    (targetUrl?: string, options?: { fromCommittedOrigin?: boolean }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

      const now = Date.now();
      // On popstate, window.location is already updated to the destination URL, so keep the last committed origin.
      if (options?.fromCommittedOrigin) {
        originUrlRef.current = committedRouteRef.current;
        originSignatureRef.current = committedSignatureRef.current || getMainSignature();
      } else {
        originUrlRef.current =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : committedRouteRef.current;
        originSignatureRef.current = getMainSignature();
      }

      targetUrlRef.current = targetUrl || "";
      setNavKey(now);
      isNavigatingRef.current = true;
      isCompletingRef.current = false;
      routeMountedRef.current = false;
      minTimeElapsedRef.current = false;

      setIsNavigating(true);
      setProgress(35);

      // Continuous smooth progress bar: climbs to 78% quickly, then gently creeps up to 98%
      // so it NEVER freezes even on slow 4G network requests
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 78) return prev + 6;
          if (prev < 90) return prev + 1.5;
          if (prev < 96) return prev + 0.4;
          return Math.min(prev + 0.08, 98.5);
        });
      }, 110);

      // Minimum bloom display timer
      minTimerRef.current = setTimeout(() => {
        minTimeElapsedRef.current = true;
        attemptDismissal();
      }, MIN_BLOOM_DURATION_MS);

      // Safety fallback (12s) for stalled network transitions
      safetyTimeoutRef.current = setTimeout(() => {
        routeMountedRef.current = true;
        minTimeElapsedRef.current = true;
        attemptDismissal();
      }, 12000);
    },
    [attemptDismissal],
  );

  // Primary completion detector: when Next.js commits the new pathname/searchParams in React
  useEffect(() => {
    if (!isNavigatingRef.current || routeMountedRef.current) return;
    if (originUrlRef.current && currentRouteUrl === originUrlRef.current) return;

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        committedRouteRef.current = currentRouteUrl;
        committedSignatureRef.current = getMainSignature();
        if (!isNavigatingRef.current || routeMountedRef.current) return;
        window.scrollTo(0, 0);
        routeMountedRef.current = true;
        attemptDismissal();
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [currentRouteUrl, isNavigating, attemptDismissal]);

  // Listener A: When template.tsx fires pinkfarm:route:mounted, verify route commit & DOM arrival
  useEffect(() => {
    const handleRouteMounted = (e: Event) => {
      if (!isNavigatingRef.current || routeMountedRef.current) return;
      const customEvent = e as CustomEvent<{ pathname?: string; url?: string }>;
      const arrivedUrl =
        customEvent.detail?.url ||
        customEvent.detail?.pathname ||
        (typeof window !== "undefined" ? window.location.pathname + window.location.search : "");

      const routeCommitted = Boolean(
        originUrlRef.current &&
          arrivedUrl !== originUrlRef.current &&
          currentRouteUrl !== originUrlRef.current,
      );
      if (!routeCommitted) {
        return;
      }

      committedRouteRef.current = arrivedUrl || currentRouteUrl;
      committedSignatureRef.current = getMainSignature();
      window.scrollTo(0, 0);
      routeMountedRef.current = true;
      attemptDismissal();
    };

    window.addEventListener("pinkfarm:route:mounted", handleRouteMounted);
    return () => {
      window.removeEventListener("pinkfarm:route:mounted", handleRouteMounted);
    };
  }, [currentRouteUrl, attemptDismissal]);

  // Listener B: MutationObserver handles streaming swaps after React commits the new route
  useEffect(() => {
    if (!isNavigating) return;

    const rootMain = document.querySelector("main");
    if (!rootMain) return;

    const checkAndComplete = () => {
      if (!isNavigatingRef.current || routeMountedRef.current) return;

      const browserUrl =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : pathname;

      // Never dismiss before Next.js React router has actually switched to the new route
      const routeCommitted = Boolean(
        originUrlRef.current &&
          browserUrl !== originUrlRef.current &&
          currentRouteUrl !== originUrlRef.current,
      );
      if (!routeCommitted) {
        return;
      }

      const currentSignature = getMainSignature();
      if (originSignatureRef.current && currentSignature === originSignatureRef.current) {
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isNavigatingRef.current || routeMountedRef.current) return;
          committedRouteRef.current = browserUrl;
          committedSignatureRef.current = getMainSignature();
          routeMountedRef.current = true;
          attemptDismissal();
        });
      });
    };

    // Run once immediately in case Next.js swapped the DOM in the same tick as popstate
    checkAndComplete();

    const observer = new MutationObserver(checkAndComplete);
    observer.observe(rootMain, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const pollTimer = setInterval(checkAndComplete, 120);

    return () => {
      observer.disconnect();
      clearInterval(pollTimer);
    };
  }, [isNavigating, pathname, currentRouteUrl, attemptDismissal]);

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

    // Listen to browser Back / Forward buttons in capture phase before Next's router mutates state
    const handlePopState = () => {
      const destination =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "";

      // Ignore same-route hash back/forward navigations (e.g. #reviews -> top)
      if (destination && destination === committedRouteRef.current) {
        return;
      }

      startNavigation(destination, { fromCommittedOrigin: true });
    };

    // Use CAPTURE phase so we intercept before any child or router prevents default
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState, true);
    window.addEventListener("pinkfarm:buffering:start", handleCustomStart);
    window.addEventListener("pinkfarm:buffering:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState, true);
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
              opacity: { duration: 0.25, delay: progress === 100 ? 0.05 : 0 },
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
            animate={{ opacity: 1, transition: { duration: 0.1, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.22, ease: "easeOut" } }}
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
