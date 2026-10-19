"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, Menu, X, User, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useCustomerStore } from "@/store/customerStore";
import { motion, AnimatePresence } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const announcementText = useSettingsStore((state) => state.announcementText);
  const isAcceptingOrders = useSettingsStore((state) => state.isAcceptingOrders);
  const storeName = useSettingsStore((state) => state.storeName);
  const customer = useCustomerStore();

  const mounted = useHydrated();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        // Hysteresis deadband: activate compact mode when scrolling down past 80px,
        // and only restore full mode when scrolled all the way back near the top (< 20px).
        // This completely prevents the rapid big/small oscillation jitter loop.
        if (!prev && y > 80) return true;
        if (prev && y < 20) return false;
        return prev;
      });
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    // Run once on mount
    updateScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/products" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  // Hide customer navbar on all admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 print:hidden">
      
      {/* Premium Announcement Bar */}
      <div className="bg-gradient-to-r from-brand-green to-brand-green-light text-brand-ivory text-center py-2 text-xs md:text-sm font-medium tracking-wide flex justify-center items-center overflow-hidden px-4">
        <span className="animate-pulse">✨ {announcementText || "Welcome to Pink Farm — Goodness in Every Bite."}</span>
        {!isAcceptingOrders && (
          <span className="ml-3 bg-amber-500 text-brand-charcoal text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            Orders Paused
          </span>
        )}
      </div>

      {/* Main Navigation Bar */}
      <div
        className={`w-full backdrop-blur-xl border-b transition-all duration-300 ease-out ${
          scrolled
            ? "bg-brand-ivory/95 border-brand-pink-accent/40 shadow-[0_10px_30px_rgba(26,60,52,0.06)] h-16 md:h-[70px]"
            : "bg-brand-ivory/85 border-brand-pink-accent/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] h-20"
        }`}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 h-full flex items-center justify-between min-w-0">
          
          {/* Mobile Menu Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-1.5 sm:p-2 text-brand-green hover:bg-brand-pink-accent/20 rounded-full transition-colors shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 sm:gap-2 group min-w-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="shrink-0"
            >
              <Image 
                src="/lotus-logo-gold.png" 
                alt={`${storeName || "Pink Farm"} Logo`} 
                width={180} 
                height={180} 
                quality={100}
                priority
                className={`object-contain -translate-y-[5%] group-hover:scale-110 transition-transform duration-300 drop-shadow-sm -mr-1 md:-mr-2 ${
                  scrolled ? "w-[48px] h-[48px] sm:w-[65px] sm:h-[65px] md:w-[75px] md:h-[75px]" : "w-[56px] h-[56px] sm:w-[75px] sm:h-[75px] md:w-[95px] md:h-[95px]"
                }`}
              />
            </motion.div>
            <span 
              className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-brand-green tracking-tight group-hover:scale-105 transition-transform duration-300 truncate"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {storeName || "Pink Farm"}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10 font-medium text-brand-charcoal/80">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || (link.path !== "/" && pathname.startsWith(link.path));
              return (
                <Link 
                  key={link.name} 
                  href={link.path} 
                  className={`relative text-[15px] py-2 transition-colors duration-300 ${
                    isActive ? "text-brand-green font-semibold" : "hover:text-brand-green"
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive ? (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-green"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 md:gap-5 text-brand-green shrink-0">
            {mounted && isAdmin && (
              <Link 
                href="/admin/settings" 
                title="Go to Admin Settings"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-green text-white hover:bg-brand-green/90 transition-all shadow-sm active:scale-95"
              >
                <ShieldCheck size={14} />
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}

            <Link href="/products">
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.95 }}
                aria-label="Search" 
                className="hover:text-brand-green-light transition-all duration-200"
              >
                <Search size={22} strokeWidth={2.2} />
              </motion.button>
            </Link>
            
            {(() => {
              const isLoggedIn = mounted ? customer.isLoggedIn : false;
              const userHref = isLoggedIn ? "/account" : isAdmin ? "/admin/settings" : "/login";
              const userTitle = isLoggedIn
                ? customer.profile.name
                  ? `My Account (${customer.profile.name})`
                  : "My Account"
                : isAdmin
                ? "Admin Settings (Logged In)"
                : "Sign In / Register";

              return (
                <Link 
                  href={userHref} 
                  aria-label={userTitle} 
                  title={userTitle}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative hover:text-brand-green-light transition-all duration-200"
                  >
                    <User size={22} strokeWidth={2.2} />
                    {isLoggedIn ? (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                    ) : isAdmin ? (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" title="Admin Active" />
                    ) : null}
                  </motion.div>
                </Link>
              );
            })()}
            
            {/* Cart with animated badge */}
            <Link href="/cart" aria-label="Cart">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group flex items-center justify-center bg-brand-pink/40 p-2.5 rounded-full hover:bg-brand-pink transition-colors duration-300"
              >
                <ShoppingCart size={22} strokeWidth={2.2} className="group-hover:scale-110 transition-transform duration-300" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute -top-1 -right-1 bg-brand-green text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md ring-2 ring-brand-ivory"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-brand-ivory/95 backdrop-blur-xl border-b border-brand-pink-accent absolute w-full shadow-lg"
          >
            <nav className="flex flex-col gap-6 p-6 text-lg font-medium text-brand-charcoal">
              {[
                { name: "Home", path: "/" },
                { name: "Shop", path: "/products" },
                { name: "About Us", path: "/about" },
                { name: "Contact", path: "/contact" },
                ...(mounted && isAdmin ? [{ name: "⚙️ Admin Settings Panel", path: "/admin/settings" }] : []),
                { 
                  name: (mounted && customer.isLoggedIn) ? "My Account & Orders" : "Sign In / Register", 
                  path: (mounted && customer.isLoggedIn) ? "/account" : "/login" 
                }
              ].map((link) => (
                <Link 
                  key={link.name} 
                  href={link.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between border-b border-brand-pink/50 pb-2 hover:text-brand-green transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
