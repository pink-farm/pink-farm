import { Suspense } from "react";
import { ProductListClient } from "./ProductListClient";
import { FadeIn } from "@/components/ui/MotionWrappers";
import ComboBuilder from "@/components/products/ComboBuilder";
import { getStoreProducts, getStoreSettings } from "@/lib/defaultProducts";

export const instant = false;

export default async function ProductsPage() {
  const [allProducts, settings] = await Promise.all([getStoreProducts({ includeUnavailable: false }), getStoreSettings()]);
  const products = allProducts.filter((p) => p.isAvailable !== false);
  const maxDiscount = Math.max(settings.comboTier1Discount || 11, settings.comboTier2Discount || 15);
  const showCombo = settings.comboEnabled !== false;

  return (
    <div className="flex flex-col gap-12 pb-16 overflow-x-hidden">
      <div className="container mx-auto px-4 pt-12 md:pt-16">
        <FadeIn direction="up">
          <div className="text-center mb-8 space-y-3">
            <h1 className="font-serif text-4xl md:text-5xl text-brand-green">Our Products</h1>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Thoughtfully curated essentials for your home.
            </p>
            {/* Quick jump to custom combo builder */}
            {showCombo && (
              <div className="pt-2">
                <a
                  href="#combo-builder"
                  className="inline-flex max-w-full text-center flex-wrap justify-center items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs md:text-sm font-bold bg-brand-pink text-brand-green border border-brand-pink-accent/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300"
                >
                  <span>🌸</span>
                  <span>Want to bundle &amp; save? Build your own combo (Up to {maxDiscount}% OFF)</span>
                  <span className="text-brand-green font-extrabold">↓</span>
                </a>
              </div>
            )}
          </div>
        </FadeIn>

        <Suspense fallback={<div className="py-12 text-center text-sm font-semibold text-brand-green">Loading products...</div>}>
          <ProductListClient
            initialProducts={products}
            initialCategories={settings.storeCategories}
          />
        </Suspense>
      </div>

      {/* MAKE YOUR OWN COMBO SECTION */}
      {showCombo && <ComboBuilder products={products} />}
    </div>
  );
}
