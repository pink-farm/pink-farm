"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MakhanaLoader } from "./MakhanaLoader";

export function MakhanaNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isBuffering, setIsBuffering] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startBuffering = useCallback((message?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setCustomMessage(message || null);

    // Subtle 80ms threshold so instant in-memory transitions don't flash,
    // but any actual buffering/network loading immediately brings up the makhana ball
    timerRef.current = setTimeout(() => {
      setIsBuffering(true);
    }, 80);

    // Safety timeout: auto dismiss after 8s to prevent stuck overlays
    safetyTimeoutRef.current = setTimeout(() => {
      setIsBuffering(false);
      setCustomMessage(null);
    }, 8000);
  }, []);

  const stopBuffering = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    setIsBuffering(false);
    setCustomMessage(null);
  }, []);

  // When pathname or searchParams change, the next screen has arrived!
  useEffect(() => {
    stopBuffering();
  }, [pathname, searchParams, stopBuffering]);

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

      // Check if target is same page/hash
      const currentUrl = new URL(window.location.href);
      const destinationUrl = new URL(href, window.location.origin);

      if (
        currentUrl.pathname === destinationUrl.pathname &&
        currentUrl.search === destinationUrl.search
      ) {
        return;
      }

      // User initiated screen navigation!
      startBuffering();
    };

    // Custom events for manual buffering triggers across forms/actions
    const handleCustomStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      startBuffering(customEvent.detail?.message);
    };

    const handleCustomStop = () => {
      stopBuffering();
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("pinkfarm:buffering:start", handleCustomStart);
    window.addEventListener("pinkfarm:buffering:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("pinkfarm:buffering:start", handleCustomStart);
      window.removeEventListener("pinkfarm:buffering:stop", handleCustomStop);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [startBuffering, stopBuffering]);

  return (
    <AnimatePresence>
      {isBuffering && (
        <motion.div
          key="makhana-navigation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FDFBF7]/85 backdrop-blur-md pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 24,
              stiffness: 280,
            }}
          >
            <MakhanaLoader
              size="xl"
              text={customMessage || "Opening next page..."}
              subtext="Goodness on the way"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
