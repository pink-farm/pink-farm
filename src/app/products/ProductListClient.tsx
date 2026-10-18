"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard } from "@/components/ui/MotionWrappers";
import { formatPrice } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  originalPrice: number | null;
  category: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export function ProductListClient({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[];
  initialCategories?: string[];
}) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams ? searchParams.get("category") : null;
  const comboEnabled = useSettingsStore((s) => s.comboEnabled);
  const storeCategories = useSettingsStore((s) => s.storeCategories);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Keep the interactive filter aligned with a category deep link.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (categoryParam) {
      const normalized = categoryParam.trim().toLowerCase();
      setSelectedCategory(normalized);
    }
  }, [categoryParam]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const categories = useMemo(() => {
    const configured =
      Array.isArray(storeCategories) && storeCategories.length > 0
        ? storeCategories
        : Array.isArray(initialCategories) && initialCategories.length > 0
        ? initialCategories
        : ["Makhana", "Nuts", "Pantry"];

    const list: { id: string; label: string }[] = [{ id: "all", label: "All" }];
    const seen = new Set<string>();

    configured.forEach((cat) => {
      const trimmed = cat.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push({ id: trimmed.toLowerCase(), label: trimmed });
      }
    });

    return list;
  }, [storeCategories, initialCategories]);

  // If currently selected category was deleted, fallback to "all"
  // Reset the filter when an administrator removes its selected category.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedCategory !== "all" && !categories.some((c) => c.id === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categories, selectedCategory]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((p) => p.isAvailable !== false);

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [initialProducts, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-8">
      
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-8 gap-4 bg-brand-cream p-3 sm:p-4 rounded-xl min-w-0">
        <div className="flex gap-2.5 sm:gap-4 items-center flex-wrap">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`font-medium transition-colors relative py-1 text-sm sm:text-base ${
                  isSelected ? "text-brand-green font-bold" : "text-brand-charcoal opacity-70 hover:text-brand-green"
                }`}
              >
                <span>{cat.label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="productCatIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
          {comboEnabled && (
            <a
              href="#combo-builder"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green bg-brand-pink/70 hover:bg-brand-pink px-3 py-1 rounded-full transition-all border border-brand-pink-accent/40 hover:scale-105"
            >
              <span>🌸</span> Make a Combo
            </a>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center min-w-0 flex-1 sm:flex-none">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-brand-green-light/20 rounded-l-md px-3 py-1.5 focus:outline-none focus:border-brand-green bg-white text-sm flex-1 sm:w-44 min-w-0" 
            />
            <button 
              type="button" 
              className="bg-brand-green text-white px-3.5 py-1.5 rounded-r-md text-sm hover:bg-brand-green-light transition-colors shrink-0"
            >
              Go
            </button>
          </div>

          <div className="flex items-center min-w-0">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-brand-green-light/20 rounded-md px-3 py-1.5 focus:outline-none focus:border-brand-green bg-white text-sm w-full sm:w-auto min-w-0"
            >
              <option value="">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Results Grid */}
      <AnimatePresence mode="popLayout">
        {filteredProducts.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8"
          >
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <SpotlightCard className="h-full rounded-2xl bg-white border border-brand-pink-accent/20 p-3 shadow-sm hover:shadow-md transition-all" glowColor="rgba(42, 89, 78, 0.12)">
                  <Link href={`/products/${product.slug}`} className="group flex flex-col gap-4 h-full">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-brand-pink-accent/20">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-brand-green/30">
                          Placeholder
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-brand-green group-hover:text-brand-green-light transition-colors leading-tight">{product.name}</h3>
                      <p className="text-sm opacity-70 line-clamp-2 mt-1">{product.shortDescription}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <p className="font-bold text-brand-green text-base">
                          ₹{formatPrice(product.basePrice)}
                        </p>
                        {product.originalPrice && product.originalPrice > product.basePrice && (
                          <span className="text-xs text-brand-charcoal/50 line-through font-medium">
                            ₹{formatPrice(product.originalPrice)}
                          </span>
                        )}
                        {product.originalPrice && product.originalPrice > product.basePrice && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            {Math.round((1 - product.basePrice / product.originalPrice) * 100)}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 text-brand-charcoal opacity-70">
            <p>No products found.</p>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
