"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Check, Sparkles, Percent, Copy, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScaleOnTap, ShimmerSheen } from "@/components/ui/MotionWrappers";
import { BulkOrderModal } from "@/components/products/BulkOrderModal";

type Product = any;
type Variant = any;

export function AddToCart({ product, variants }: { product: Product; variants: Variant[] }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants?.length > 0 ? variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const isAcceptingOrders = useSettingsStore((state) => state.isAcceptingOrders);
  const router = useRouter();

  const isRawMakhana = Boolean(
    product?.slug?.toLowerCase().includes("raw") ||
    product?.name?.toLowerCase().includes("raw")
  );
  const minBulkKg = isRawMakhana ? 5 : 2;

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const isMakhana = product.category?.toLowerCase().includes("makhana") || product.slug?.includes("makhana");
  const isNuts = product.category?.toLowerCase().includes("nut") || product.slug?.includes("almond") || product.slug?.includes("cashew");

  const getProteinValue = (slug: string, name: string) => {
    const s = `${slug} ${name}`.toLowerCase();
    if (s.includes("peri-peri") || s.includes("peri peri")) return "7.8 g protein per 100 gm";
    if (s.includes("pudina")) return "7.2 g protein per 100 gm";
    if (s.includes("punjabi")) return "7.19g protein per 100 gm";
    if (s.includes("caramel") || s.includes("gud") || s.includes("gur")) return "6.2 gm protein per 100 gm";
    if (s.includes("himalayan") || s.includes("salted")) return "7.4 g protein per 100 gm";
    if (s.includes("raw") || s.includes("phool")) return "9.7 g protein per 100 gm";
    return "7.5 g protein per 100 gm";
  };

  const highlights = isMakhana
    ? [
        "0% Palm Oil — Crafted with clean ingredients, zero trans fats",
        "Roasted Not Fried — Handcrafted slow-roasting for guilt-free crunch",
        `Plant Protein — ${getProteinValue(product.slug || "", product.name || "")}`,
        "No Artificial Colours, Just Authentic Seasonings!",
      ]
    : isNuts
    ? [
        "Plant Protein — High-quality plant protein & dietary fibre",
        "Zero added palm oil & zero trans fats",
        "Rich in Vitamin E, Magnesium & antioxidant nutrients",
        "Vacuum packed for maximum fresh crunch",
      ]
    : [
        "Pure Plant Goodness — Clean label with zero preservatives",
        "Prepared using authentic, traditional processing methods",
        "Sourced ethically directly from farm origin",
      ];

  const currentPrice = selectedVariant ? selectedVariant.price : product.basePrice;
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const maxQty = 10;
  
  const isOutOfStock = !product.isAvailable || (selectedVariant && !selectedVariant.isAvailable) || currentStock <= 0;
  const isDisabled = isOutOfStock || !isAcceptingOrders;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      price: currentPrice,
      imageUrl: product.imageUrl || "",
      maxQuantity: maxQty,
    }, quantity);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const originalPrice = selectedVariant?.originalPrice || product.originalPrice;
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : null;
  const formatPrice = (p: number) => (p / 100) % 1 === 0 ? (p / 100).toFixed(0) : (p / 100).toFixed(2);

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl md:text-3xl font-extrabold text-brand-green">₹{formatPrice(currentPrice)}</span>
        {hasDiscount && (
          <>
            <span className="text-base line-through text-brand-charcoal/40 font-medium">₹{formatPrice(originalPrice)}</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {discountPercent}% OFF
            </span>
          </>
        )}
      </div>

      {variants && variants.length > 0 && (
        <div className="space-y-1">
          <label className="font-bold text-xs text-brand-green">Pack Size</label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v: Variant) => {
              const isSelected = selectedVariant?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                  disabled={!v.isAvailable || v.stockQuantity <= 0}
                  className={`relative px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-brand-green text-white border-2 border-brand-green shadow-xs"
                      : "bg-white border-2 border-brand-green-light/20 text-brand-charcoal hover:border-brand-green-light"
                  } ${(!v.isAvailable || v.stockQuantity <= 0) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="variantIndicator"
                      className="absolute inset-0 bg-brand-green rounded-lg -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    />
                  )}
                  <span>{v.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Yogabar-style Product Highlights Box (Compact) */}
      <div className="bg-brand-pink/50 border border-brand-pink-accent/40 rounded-xl p-2.5 space-y-1 shadow-2xs">
        <div className="text-[11px] font-bold text-brand-green uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-brand-green" /> Why You'll Love This
        </div>
        <ul className="space-y-0.5 text-xs text-brand-charcoal/85 leading-snug">
          {highlights.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Yogabar-style Coupon Discount Banner (Compact) */}
      <div className="flex items-center justify-between gap-2.5 bg-gradient-to-r from-amber-50/80 via-brand-pink/60 to-brand-cream/80 border border-dashed border-amber-300/80 rounded-xl p-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 text-brand-green flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
            <Percent className="w-3 h-3 stroke-[2.8]" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-brand-green leading-tight">
              Flat ₹499 OFF <span className="text-[10px] font-normal text-brand-charcoal/70">| Orders above ₹1999</span>
            </div>
            <div className="text-[10px] text-brand-charcoal/80 mt-0.5 truncate">
              Code: <span className="font-mono font-bold text-brand-green bg-white/90 border border-brand-pink-accent/40 px-1 py-0.2 rounded text-[11px] select-all">FLAT499</span>
              <span className="text-[9px] text-amber-800 font-semibold bg-amber-100/70 px-1 py-0.2 rounded ml-1.5">One-time use</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleCopyCode("FLAT499")}
          className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-brand-green/30 bg-white hover:bg-brand-green hover:text-white text-brand-green transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
        >
          {copiedCode ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>

      <div className="space-y-1">
        <label className="font-bold text-xs text-brand-green">Quantity</label>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center border border-brand-green-light/30 rounded-lg overflow-hidden h-10 w-28 bg-white shadow-2xs">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="flex-1 h-full flex items-center justify-center hover:bg-brand-cream disabled:opacity-50 active:scale-95 transition-transform"
              aria-label="Decrease quantity"
            >
              <Minus size={15} />
            </button>
            
            <div className="w-8 text-center font-medium overflow-hidden relative h-5 flex items-center justify-center text-sm">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={quantity}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {quantity}
                </motion.span>
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
              disabled={quantity >= maxQty || isOutOfStock}
              className="flex-1 h-full flex items-center justify-center hover:bg-brand-cream disabled:opacity-50 active:scale-95 transition-transform"
              aria-label="Increase quantity"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Bulk Order Button on the right side of quantity selection button */}
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="h-10 px-3.5 rounded-lg bg-brand-green hover:bg-brand-green-light text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer group border border-brand-green"
            title={`Bulk Order (${minBulkKg} kg minimum)`}
          >
            <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="tracking-tight">Bulk Order</span>
            <span className="text-[10px] font-bold bg-white/20 text-brand-pink px-1.5 py-0.5 rounded-full border border-white/20">
              {minBulkKg}kg+
            </span>
          </button>
          
          {isOutOfStock && (
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Out of stock
            </span>
          )}
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <ScaleOnTap className="flex-1">
          <Button 
            size="lg" 
            className={`w-full px-6 h-11 text-sm md:text-base font-semibold transition-colors ${added ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            onClick={handleAddToCart}
            disabled={isDisabled}
            variant="outline"
          >
            {added ? (
              <>
                <Check className="mr-1.5 h-4 w-4" /> Added
              </>
            ) : !isAcceptingOrders ? (
              <>
                <ShoppingCart className="mr-1.5 h-4 w-4" /> Orders Paused
              </>
            ) : isOutOfStock ? (
              <>
                <ShoppingCart className="mr-1.5 h-4 w-4" /> Out of Stock
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1.5 h-4 w-4" /> Add to Cart
              </>
            )}
          </Button>
        </ScaleOnTap>

        <ScaleOnTap className="flex-1">
          <ShimmerSheen className="rounded-md">
            <Button 
              size="lg" 
              className="w-full px-6 h-11 text-sm md:text-base bg-brand-pink text-brand-green font-bold hover:bg-brand-pink/90 disabled:opacity-50 shadow-xs"
              onClick={() => {
                handleAddToCart();
                router.push('/checkout');
              }}
              disabled={isDisabled}
            >
              {!isAcceptingOrders ? "Ordering Paused" : isOutOfStock ? "Out of Stock" : "Buy Now"}
            </Button>
          </ShimmerSheen>
        </ScaleOnTap>
      </div>

      {!isAcceptingOrders && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs text-center font-medium">
          🔔 Store ordering is temporarily paused. You can still browse our products!
        </div>
      )}

      {/* Bulk Order Modal */}
      <BulkOrderModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        product={product}
        selectedVariant={selectedVariant}
      />
    </div>
  );
}
