"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, ShoppingCart, X, ChevronRight, Plus, Minus, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useSettingsStore } from "@/store/settingsStore";

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  shortDescription?: string | null;
  variants?: { packSize?: string | null }[];
};

export default function ComboBuilder({ products }: { products: Product[] }) {
  const settings = useSettingsStore();

  const comboTiers = [
    {
      count: settings.comboTier1Count || 3,
      discount: settings.comboTier1Discount || 11,
      label: settings.comboTier1Label || "Trio Combo",
      tagline: settings.comboTier1Tagline || "Pick any 3 — save 11% on MRP",
      badge: settings.comboTier1Badge || "✦ 11% OFF",
      emoji: settings.comboTier1Emoji || "🌿",
    },
    {
      count: settings.comboTier2Count || 5,
      discount: settings.comboTier2Discount || 15,
      label: settings.comboTier2Label || "Penta Combo",
      tagline: settings.comboTier2Tagline || "Pick any 5 — save 15% on MRP",
      badge: settings.comboTier2Badge || "✦ 15% OFF",
      emoji: settings.comboTier2Emoji || "🌸",
    },
  ];

  const [activeTier, setActiveTier] = useState<0 | 1>(0);
  // Store quantities selected per tier: { 0: { [productId]: count }, 1: { [productId]: count } }
  const [selectedCounts, setSelectedCounts] = useState<{
    0: Record<string, number>;
    1: Record<string, number>;
  }>({
    0: {},
    1: {},
  });

  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  // If combo feature is disabled in store settings, don't display
  if (settings.comboEnabled === false) {
    return null;
  }

  const tier = comboTiers[activeTier] || comboTiers[0];
  const currentCounts = selectedCounts[activeTier] || {};

  // Filter products for combo builder:
  // 1. If admin explicitly configured comboProductIds in Store Settings, use exactly those products.
  // 2. Otherwise default to all flavoured makhanas (exclude raw).
  const comboProducts = (() => {
    if (Array.isArray(settings.comboProductIds) && settings.comboProductIds.length > 0) {
      const selected = products.filter((p) => settings.comboProductIds.includes(p.id));
      if (selected.length > 0) return selected;
    }
    return products.filter(
      (p) =>
        !p.slug.toLowerCase().includes("raw") &&
        !p.name.toLowerCase().includes("raw")
    );
  })();

  // Total items chosen so far in the active tier
  const totalSelectedCount = Object.values(currentCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const remainingSlots = Math.max(0, tier.count - totalSelectedCount);
  const isComplete = totalSelectedCount === tier.count;

  // Add 1 quantity of a product
  const incrementProduct = (id: string) => {
    if (totalSelectedCount >= tier.count) return;
    setSelectedCounts((prev) => {
      const tierCounts = { ...(prev[activeTier] || {}) };
      tierCounts[id] = (tierCounts[id] || 0) + 1;
      return { ...prev, [activeTier]: tierCounts };
    });
  };

  // Remove 1 quantity of a product
  const decrementProduct = (id: string) => {
    setSelectedCounts((prev) => {
      const tierCounts = { ...(prev[activeTier] || {}) };
      if (!tierCounts[id]) return prev;
      if (tierCounts[id] <= 1) {
        delete tierCounts[id];
      } else {
        tierCounts[id] -= 1;
      }
      return { ...prev, [activeTier]: tierCounts };
    });
  };

  const clearAll = () => {
    setSelectedCounts((prev) => ({ ...prev, [activeTier]: {} }));
  };

  // Pricing based on original MRP (originalPrice, fallback to basePrice)
  const selectedItemsDetails = comboProducts
    .filter((p) => (currentCounts[p.id] || 0) > 0)
    .map((p) => {
      const qty = currentCounts[p.id] || 0;
      const mrp =
        p.originalPrice && p.originalPrice > p.basePrice
          ? p.originalPrice
          : p.basePrice;
      const comboUnitPrice = Math.round(mrp * (1 - tier.discount / 100));
      return {
        product: p,
        quantity: qty,
        mrp,
        comboUnitPrice,
        totalMrp: mrp * qty,
        totalCombo: comboUnitPrice * qty,
      };
    });

  const totalMrp = selectedItemsDetails.reduce(
    (sum, item) => sum + item.totalMrp,
    0
  );
  const discountedTotal = selectedItemsDetails.reduce(
    (sum, item) => sum + item.totalCombo,
    0
  );
  const savings = totalMrp - discountedTotal;

  // Checkout with combo items
  const handleShopCombo = () => {
    selectedItemsDetails.forEach(({ product, quantity, comboUnitPrice }) => {
      addItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: comboUnitPrice,
          imageUrl: product.imageUrl ?? "",
          maxQuantity: 10,
          variantId: undefined,
          variantName: `Combo ${tier.discount}% OFF`,
        },
        quantity
      );
    });
    router.push("/checkout");
  };

  return (
    <section id="combo-builder" className="relative w-full overflow-hidden py-20 md:py-28">
      {/* Luxury dark background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 60%, rgba(230,184,192,0.13) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(42,89,78,0.18) 0%, transparent 55%), linear-gradient(160deg, #0d1a16 0%, #12261f 40%, #1a1a2e 100%)",
        }}
      />
      {/* Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none z-[1]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <p className="text-brand-pink-accent text-xs font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            {settings.comboEyebrow || "Make Your Own Combo"}
            <Sparkles className="w-3.5 h-3.5" />
          </p>
          <h2 className="font-serif text-4xl md:text-6xl text-white leading-tight">
            {settings.comboTitlePrefix || "Curate Your"}{" "}
            <span
              className="italic font-light bg-[linear-gradient(110deg,#E6B8C0,45%,#FDF2F4,55%,#E6B8C0)] bg-[length:200%_100%] text-transparent bg-clip-text animate-text-gradient"
            >
              {settings.comboTitleHighlight || "Pink Farm Combo"}
            </span>
          </h2>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {settings.comboSubtitle || "Mix & match your favourite flavoured makhanas. Add multiple packs of any flavour — combo discounts apply directly on the original MRP!"}
          </p>
        </div>

        {/* Tier Switcher - BOTH buttons turn stylish pink when active */}
        <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
          {comboTiers.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTier(i as 0 | 1)}
              className={`relative flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 border ${
                activeTier === i
                  ? "bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC] text-brand-green border-[#E6B8C0] shadow-[0_0_30px_rgba(230,184,192,0.45)] scale-105"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="font-bold">{t.label}</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  activeTier === i
                    ? "bg-brand-green/20 text-brand-green"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {t.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Progress bar + status */}
        <div className="mb-8 text-center space-y-3">
          <p className="text-white/80 text-sm">
            <span className="text-[#E6B8C0] font-bold text-lg">{totalSelectedCount}</span>
            <span className="text-white/40"> / {tier.count} items chosen</span>
            {" · "}
            <span className="text-white/70 italic">{tier.tagline}</span>
          </p>
          <div className="w-full max-w-sm mx-auto h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC]"
              style={{
                width: `${Math.min(100, (totalSelectedCount / tier.count) * 100)}%`,
              }}
            />
          </div>
          {remainingSlots > 0 ? (
            <p className="text-xs text-white/40">
              Add <span className="text-brand-pink-accent font-semibold">{remainingSlots} more</span> item{remainingSlots > 1 ? "s" : ""} to unlock {tier.discount}% off!
            </p>
          ) : (
            <p className="text-xs text-[#88E2B0] font-semibold flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" /> {tier.label} Complete! {tier.discount}% OFF unlocked.
            </p>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-10">
          {comboProducts.map((product) => {
            const count = currentCounts[product.id] || 0;
            const isFull = totalSelectedCount >= tier.count;
            const canAdd = !isFull;
            const mrp =
              product.originalPrice && product.originalPrice > product.basePrice
                ? product.originalPrice
                : product.basePrice;
            const comboUnitPrice = Math.round(mrp * (1 - tier.discount / 100));

            return (
              <div
                key={product.id}
                className={`relative group rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                  count > 0
                    ? "border-[#E6B8C0] shadow-[0_0_25px_rgba(230,184,192,0.35)] bg-[#E6B8C0]/10 scale-[1.02]"
                    : canAdd
                    ? "border-white/10 hover:border-white/30 bg-white/[0.04] hover:scale-[1.01]"
                    : "border-white/5 bg-white/[0.02] opacity-50"
                }`}
                style={{ backdropFilter: "blur(12px)" }}
              >
                {/* Product image area */}
                <div className="relative aspect-square w-full overflow-hidden bg-white/5">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className={`object-cover transition-transform duration-500 ${
                        count > 0 ? "scale-105" : "group-hover:scale-105"
                      }`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/10 text-3xl">
                      🌱
                    </div>
                  )}

                  {/* Quantity badge top-right */}
                  {count > 0 && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC] text-brand-green font-bold text-xs px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-scale-in">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{count} in combo</span>
                    </div>
                  )}

                  {/* Pack size badge top-left */}
                  {product.variants?.[0]?.packSize && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {product.variants[0].packSize}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h3 className="font-serif text-sm text-white leading-snug font-semibold line-clamp-2">
                      {product.name}
                    </h3>
                    {/* Price display with MRP struck out and Combo Price */}
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-white/40 line-through text-[11px]">
                        MRP ₹{formatPrice(mrp)}
                      </span>
                      <span className="text-[#E6B8C0] font-bold text-[11px] sm:text-xs bg-white/10 px-2 py-0.5 rounded-full">
                        ₹{formatPrice(comboUnitPrice)} in combo
                      </span>
                    </div>
                  </div>

                  {/* Quantity Selector / Add Button */}
                  <div className="pt-2">
                    {count === 0 ? (
                      <button
                        onClick={() => incrementProduct(product.id)}
                        disabled={!canAdd}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                          canAdd
                            ? "bg-white/10 hover:bg-[#E6B8C0] text-white hover:text-brand-green border border-white/20 hover:border-[#E6B8C0]"
                            : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-black/40 border border-[#E6B8C0]/40 rounded-xl p-1">
                        <button
                          onClick={() => decrementProduct(product.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                          aria-label={`Remove one ${product.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-white px-2">
                          {count}
                        </span>
                        <button
                          onClick={() => incrementProduct(product.id)}
                          disabled={!canAdd}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            canAdd
                              ? "bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC] text-brand-green hover:opacity-90 font-bold"
                              : "bg-white/5 text-white/20 cursor-not-allowed"
                          }`}
                          aria-label={`Add another ${product.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Panel */}
        <div
          className={`rounded-3xl border p-4 sm:p-6 md:p-8 transition-all duration-500 ${
            isComplete
              ? "border-[#E6B8C0]/50 shadow-[0_0_50px_rgba(230,184,192,0.2)] bg-[#E6B8C0]/10"
              : "border-white/10 bg-white/[0.03]"
          }`}
          style={{ backdropFilter: "blur(16px)" }}
        >
          {isComplete ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Selected items list & avatars */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left min-w-0">
                <div className="flex -space-x-3 shrink-0 max-w-full overflow-x-auto py-1">
                  {selectedItemsDetails.map((item) => (
                    <div
                      key={item.product.id}
                      className="w-14 h-14 rounded-full border-2 border-[#E6B8C0] overflow-hidden bg-white/10 relative shadow-md"
                      title={`${item.quantity}x ${item.product.name}`}
                    >
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🌱
                        </div>
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute bottom-0 right-0 bg-brand-green text-brand-pink text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-white/20">
                          {item.quantity}x
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                    {tier.label} ({tier.count} items)
                  </p>
                  <p className="text-white text-xs font-medium line-clamp-2">
                    {selectedItemsDetails
                      .map((item) => `${item.quantity}× ${item.product.name}`)
                      .join(" + ")}
                  </p>
                </div>
              </div>

              {/* Pricing summary */}
              <div className="text-center md:text-right space-y-1">
                <div className="flex items-baseline gap-3 justify-center md:justify-end flex-wrap">
                  <span className="text-3xl font-bold text-white">
                    ₹{formatPrice(discountedTotal)}
                  </span>
                  <span className="text-white/40 line-through text-lg">
                    ₹{formatPrice(totalMrp)}
                  </span>
                  <span className="text-[#88E2B0] text-xs font-bold bg-[#2A594E]/60 px-3 py-1 rounded-full border border-[#88E2B0]/30">
                    Save ₹{formatPrice(savings)} ({tier.discount}% OFF on MRP)
                  </span>
                </div>
                <p className="text-white/40 text-xs">
                  Original MRP ₹{formatPrice(totalMrp)} with {tier.discount}% combo savings applied
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleShopCombo}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-sm tracking-wide bg-gradient-to-r from-[#E6B8C0] to-[#F7D4DC] text-brand-green shadow-[0_0_30px_rgba(230,184,192,0.4)] hover:shadow-[0_0_50px_rgba(230,184,192,0.6)] hover:scale-105 transition-all duration-300"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {settings.comboButtonText || "Shop My Combo"}
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={clearAll}
                  className="text-white/40 hover:text-white/80 text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Reset selection
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-white/40 text-sm">
                {totalSelectedCount === 0
                  ? `Choose any ${tier.count} items above to unlock your ${tier.discount}% discount on MRP.`
                  : `${remainingSlots} more item${remainingSlots > 1 ? "s" : ""} to complete your ${tier.label}! You can pick multiples of any flavour.`}
              </p>
              {totalSelectedCount > 0 && (
                <div className="flex items-center justify-center gap-4">
                  <span className="text-xs text-white/60">
                    Current MRP: ₹{formatPrice(totalMrp)}
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom trust notes */}
        <p className="text-center text-white/30 text-xs mt-6 tracking-wider">
          {settings.comboFooterNote || "✦ Combo discount applies to total MRP ✦ Multiples allowed ✦"}
        </p>
      </div>
    </section>
  );
}
