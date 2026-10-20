"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const safeImages = images && images.length > 0 ? images.filter(Boolean) : ["/images/makhana_sig.jpg"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      nextImage();
    } else if (diff < -50) {
      prevImage();
    }
    setTouchStart(null);
  };

  return (
    <div className="flex flex-col w-full min-w-0">
      {/* Main Image Viewer */}
      <div
        className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-pink-accent/10 border border-brand-green-light/10 shadow-md group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full h-full"
          >
            <Image
              src={safeImages[currentIndex]}
              alt={`${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              sizes="(max-width: 768px) 100vw, 400px"
              unoptimized={safeImages[currentIndex].startsWith("data:")}
            />
          </motion.div>
        </AnimatePresence>

        {/* Counter Badge */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 pointer-events-none">
            {currentIndex + 1} / {safeImages.length}
          </div>
        )}

        {/* Navigation Arrows (Amazon / Flipkart Style) */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                prevImage();
              }}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-brand-green shadow-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 z-10 hover:scale-110"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                nextImage();
              }}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-brand-green shadow-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 z-10 hover:scale-110"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Navigation Bar (shown when multiple images exist) */}
      {safeImages.length > 1 && (
        <div
          ref={thumbnailsRef}
          className="mt-3 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-brand-green/20"
        >
          {safeImages.map((img, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                onMouseEnter={() => setCurrentIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                  isActive
                    ? "border-brand-green ring-2 ring-brand-green/20 scale-105 shadow-sm"
                    : "border-transparent bg-brand-cream/60 opacity-70 hover:opacity-100 hover:border-brand-green/40"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={img.startsWith("data:")}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Scrollable carousel gallery inside Product Description section (Amazon/Flipkart A+ content style)
 */
export function ProductDescriptionGallery({ images, productName }: ProductImageGalleryProps) {
  const safeImages = images && images.length > 1 ? images.filter(Boolean) : [];
  const scrollRef = useRef<HTMLDivElement>(null);

  if (safeImages.length <= 1) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -280 : 280;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="mt-8 pt-6 border-t border-brand-green-light/20">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
            <ImageIcon size={14} />
          </span>
          <h3 className="font-serif text-lg font-bold text-brand-green">
            Product Gallery &amp; Visuals
          </h3>
          <span className="text-xs text-brand-charcoal/50 font-medium">
            ({safeImages.length} Photos)
          </span>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-7 h-7 rounded-full border border-brand-green/20 bg-white hover:bg-brand-cream flex items-center justify-center text-brand-green transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-7 h-7 rounded-full border border-brand-green/20 bg-white hover:bg-brand-cream flex items-center justify-center text-brand-green transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <p className="text-xs text-brand-charcoal/65 mb-4">
        Scroll through close-ups, packaging, and product details.
      </p>

      {/* Horizontally scrollable strip */}
      <div
        ref={scrollRef}
        className="flex gap-3.5 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-brand-green/20"
      >
        {safeImages.map((img, idx) => (
          <div
            key={idx}
            className="group relative w-56 sm:w-64 aspect-[4/3] rounded-2xl overflow-hidden shrink-0 snap-start bg-brand-cream/40 border border-brand-green/10 shadow-xs hover:shadow-md transition"
          >
            <Image
              src={img}
              alt={`${productName} view ${idx + 1}`}
              fill
              className="object-cover"
              unoptimized={img.startsWith("data:")}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6 text-white text-[11px] font-semibold flex items-center justify-between">
              <span>View #{idx + 1}</span>
              <span className="text-[10px] text-brand-champagne uppercase tracking-wider">
                Pink Farm
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
