"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  PackageOpen, 
  Settings, 
  Store, 
  ArrowUpRight, 
  Menu, 
  X, 
  ShieldCheck 
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: PackageOpen },
  { href: "/admin/settings", label: "Store Settings", icon: Settings },
];

export function AdminSidebarNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Determine current active page label for mobile header
  const currentItem = NAV_ITEMS.find(
    (item) => item.href === pathname || (item.href !== "/admin" && pathname.startsWith(item.href))
  ) || NAV_ITEMS[0];

  return (
    <>
      {/* ============================================================== */}
      {/* MOBILE TOP BAR WITH BURGER MENU (Visible only on < md screens) */}
      {/* ============================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-2xs print:hidden">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-serif text-lg font-extrabold text-brand-green tracking-tight">
              Pink Farm
            </span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
            <currentItem.icon size={13} className="text-brand-green" />
            <span>{currentItem.label}</span>
          </span>
        </div>

        {/* Burger Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          className="relative p-2 rounded-xl text-brand-green hover:bg-brand-pink/40 border border-gray-200/80 active:scale-95 transition-all cursor-pointer"
        >
          {isOpen ? (
            <X size={22} className="text-gray-800" />
          ) : (
            <Menu size={22} className="text-brand-green" />
          )}
        </button>
      </header>

      {/* Mobile Burger Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 top-[57px] bg-black/30 backdrop-blur-xs z-40 print:hidden"
            />

            {/* Slide-Down Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden fixed top-[57px] inset-x-0 bg-white border-b border-gray-200 shadow-xl z-50 p-4 space-y-3 print:hidden max-h-[calc(100vh-65px)] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-brand-green" />
                  <span>Admin Navigation</span>
                </div>
                <span className="text-[11px] text-gray-400">Settings &amp; Management</span>
              </div>

              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === pathname ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <React.Fragment key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-brand-green text-white shadow-sm"
                            : "text-gray-700 hover:bg-brand-pink/30 hover:text-brand-green"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} className={isActive ? "text-emerald-300" : "text-gray-500"} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </Link>

                      {/* Quick jump sub-sections when in Settings on mobile */}
                      {isActive && item.href === "/admin/settings" && (
                        <div className="pl-3 pr-2 py-1.5 space-y-1 bg-gray-50/90 rounded-xl border border-gray-100 my-1">
                          <div className="text-[10px] uppercase font-bold text-gray-400 px-2 pt-0.5">
                            Jump to Section:
                          </div>
                          {[
                            { id: "settings-identity", label: "🏷️ Store Identity & Top Bar" },
                            { id: "settings-hero-images", label: "🖼️ Homepage Bubble Images" },
                            { id: "settings-status", label: "⚡ Store Online / Pause Toggle" },
                            { id: "settings-delivery", label: "🚚 Delivery Fees & Shipping" },
                            { id: "settings-support", label: "📞 Support Phone, Email & Address" },
                            { id: "settings-coupons", label: "🎟️ Coupon Management" },
                          ].map((sec) => (
                            <button
                              key={sec.id}
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                setTimeout(() => {
                                  const el = document.getElementById(sec.id);
                                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }, 150);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-brand-green hover:bg-brand-pink/30 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span>{sec.label}</span>
                              <span className="text-gray-300">↓</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-brand-green bg-brand-pink/30 hover:bg-brand-pink/60 border border-brand-pink-accent/40 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Store size={18} />
                    <span>Go to Public Storefront</span>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>

                <div className="pt-1">
                  <LogoutButton />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR (Permanently fixed/sticky to viewport height)   */}
      {/* ============================================================== */}
      <aside className="hidden md:flex w-56 lg:w-64 bg-white border-r border-gray-200/80 flex-col shrink-0 sticky top-0 h-screen max-h-screen z-30 print:hidden justify-between">
        <div className="p-4 lg:p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <Link href="/admin" className="font-serif text-xl font-bold text-brand-green tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand-green text-white flex items-center justify-center text-xs font-bold shadow-xs">PF</span>
            <span>Pink Farm Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === pathname ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-pink/60 text-brand-green font-bold shadow-2xs border border-brand-pink-accent/40"
                    : "text-gray-700 hover:bg-brand-pink/30 hover:text-brand-green"
                }`}
              >
                <Icon size={18} className={isActive ? "text-brand-green" : "text-gray-500"} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2">
            <div className="border-t border-gray-100 my-2" />
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-brand-green bg-brand-pink/30 hover:bg-brand-pink/60 border border-brand-pink-accent/40 text-xs font-bold transition-all group"
            >
              <Store size={16} className="text-brand-green group-hover:scale-105 transition-transform" />
              <span>Go to Storefront</span>
              <ArrowUpRight size={14} className="ml-auto text-brand-green/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </nav>

        {/* Pinned Fixed Bottom-Left Logout Section */}
        <div className="p-3.5 border-t border-gray-100/90 bg-white/95 backdrop-blur-xs shrink-0 mt-auto">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Floating Quick Sign-Out Button (always fixed at bottom-left, zero scroll) */}
      <div className="md:hidden fixed bottom-4 left-4 z-40 print:hidden">
        <LogoutButton compact />
      </div>
    </>
  );
}
