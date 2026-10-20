"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/store/settingsStore";
import { useHydrated } from "@/lib/use-hydrated";

export function BottomAnnouncementBar() {
  const pathname = usePathname();
  const mounted = useHydrated();
  const bottomAnnouncementText = useSettingsStore((state) => state.bottomAnnouncementText);
  const bottomAnnouncementEnabled = useSettingsStore((state) => state.bottomAnnouncementEnabled);
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(Boolean(data.isAdmin));
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [pathname]);

  // Hide on admin routes or when not mounted yet
  if (!mounted || pathname?.startsWith("/admin")) {
    return null;
  }

  // Admin wish: completely removed / disabled by admin or dismissed by visitor
  const text = (bottomAnnouncementText ?? "").trim();
  if (!bottomAnnouncementEnabled || !text || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        role="region"
        aria-label="Bottom Announcement"
        className="fixed bottom-0 left-0 right-0 z-40 w-full bg-gradient-to-r from-brand-green to-brand-green-light text-brand-ivory text-center py-2 text-xs md:text-sm font-medium tracking-wide flex justify-center items-center overflow-hidden px-4 shadow-[0_-4px_22px_rgba(26,60,52,0.22)] border-t border-brand-green-light/40 print:hidden select-none"
      >
        <div className="container mx-auto flex items-center justify-center relative min-w-0 px-8">
          <span className="animate-pulse truncate">
            ✨ {text}
          </span>

          {/* Admin shortcut badge if logged in */}
          {isAdmin && (
            <Link
              href="/admin/settings?tab=store"
              className="hidden sm:inline-flex items-center gap-1.5 ml-3 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors shadow-2xs shrink-0"
              title="Admin Quick Access: Edit or Remove Banner in Settings"
            >
              <SlidersHorizontal size={12} />
              <span>Admin: Edit / Remove</span>
            </Link>
          )}

          {/* Visitor Dismiss Button */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss announcement"
            title="Dismiss"
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-brand-ivory/80 hover:text-brand-ivory hover:bg-white/15 rounded-full transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
