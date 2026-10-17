"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSettingsStore } from "@/store/settingsStore";

export function Footer() {
  const pathname = usePathname();
  const storeName = useSettingsStore((state) => state.storeName);
  const supportPhone = useSettingsStore((state) => state.supportPhone);
  const supportEmail = useSettingsStore((state) => state.supportEmail);
  const businessAddress = useSettingsStore((state) => state.businessAddress);

  const cleanPhone = (supportPhone || "8437504040").replace(/[^0-9]/g, "");

  // Hide footer on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-brand-green text-brand-ivory pt-16 pb-8 border-t border-brand-green-light print:hidden">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
        <div>
          <div className="flex items-center gap-1 mb-6">
            <Image 
              src="/lotus-logo-gold.png" 
              alt={`${storeName || "Pink Farm"} Logo`} 
              width={180} 
              height={180} 
              quality={100}
              className="w-[80px] h-[80px] md:w-[95px] md:h-[95px] object-contain -translate-y-[5%] drop-shadow-md -mr-1 md:-mr-2"
            />
            <div className="flex flex-col">
              <h3 
                className="font-serif text-3xl md:text-4xl font-extrabold text-brand-ivory tracking-tight leading-none"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {storeName || "Pink Farm"}
              </h3>
              <span className="text-[11px] md:text-xs text-brand-champagne/90 tracking-wider font-medium mt-1">
                By Suvana Organics
              </span>
            </div>
          </div>
          <p className="opacity-90 mb-4 leading-relaxed">
            Goodness that feels like home. Discover thoughtfully selected everyday favourites, with premium Makhana at our heart.
          </p>
          {businessAddress && (
            <p className="text-xs opacity-75 leading-relaxed">
              📍 {businessAddress}
            </p>
          )}
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-brand-champagne">Shop</h4>
          <ul className="space-y-4 opacity-90">
            <li><Link href="/products" className="hover:text-brand-pink transition-colors">All Products</Link></li>
            <li><Link href="/products?category=makhana" className="hover:text-brand-pink transition-colors">Makhana</Link></li>
            <li><Link href="/products?category=everyday" className="hover:text-brand-pink transition-colors">Everyday Essentials</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-brand-champagne">Help</h4>
          <ul className="space-y-4 opacity-90">
            <li><Link href="/faq" className="hover:text-brand-pink transition-colors">FAQ</Link></li>
            <li><Link href="/shipping" className="hover:text-brand-pink transition-colors">Shipping & Delivery</Link></li>
            <li><Link href="/contact" className="hover:text-brand-pink transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-brand-champagne">Legal</h4>
          <ul className="space-y-4 opacity-90">
            <li><Link href="/privacy" className="hover:text-brand-pink transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-brand-pink transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

      </div>

      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-brand-green-light/20 flex flex-col items-center justify-center text-center opacity-90 space-y-3 py-8">
        <p className="text-brand-champagne font-serif text-2xl mb-1">Get in Touch</p>
        <p className="text-sm">
          WhatsApp:{" "}
          <a
            href={`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-pink font-bold transition-colors"
          >
            {supportPhone || "8437504040"}
          </a>
        </p>
        {supportEmail && (
          <p className="text-sm">
            Email:{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="hover:text-brand-pink font-bold transition-colors"
            >
              {supportEmail}
            </a>
          </p>
        )}
        <p className="text-sm">Instagram: <a href="https://instagram.com/pinkfarm.in" target="_blank" rel="noopener noreferrer" className="hover:text-brand-pink font-bold transition-colors">@pinkfarm.in</a></p>
      </div>

      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-brand-green-light/30 flex flex-col md:flex-row items-center justify-between opacity-80 text-xs">
        <p>&copy; 2026 {storeName || "Pink Farm"}. All rights reserved.</p>
        <div className="mt-4 md:mt-0 flex gap-4">
          <span>Secure checkout with UPI, Cards &amp; NetBanking</span>
        </div>
      </div>
    </footer>
  );
}
