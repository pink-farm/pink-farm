import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "./AddToCart";
import { ChevronRight, Star } from "lucide-react";
import { FadeIn, HoverCard, GlowPulse } from "@/components/ui/MotionWrappers";
import { ProductBadges } from "@/components/products/ProductHighlightBadges";
import { ProductFeedback } from "@/components/products/ProductFeedback";
import { ProductImageGallery, ProductDescriptionGallery } from "@/components/products/ProductImageGallery";
import { getStoreProductBySlug } from "@/lib/defaultProducts";
import { prisma } from "@/lib/db";

export const instant = false;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const reviewStats = await prisma.productReview.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { _all: true },
  }).catch(() => null);

  const reviewCount = reviewStats?._count?._all || 0;
  const avgRating = reviewStats?._avg?.rating ? reviewStats._avg.rating.toFixed(1) : null;

  let additionalImages: string[] = [];
  if (product.additionalImages) {
    try {
      const parsed = JSON.parse(product.additionalImages);
      if (Array.isArray(parsed)) {
        additionalImages = parsed.filter((img) => typeof img === "string" && img.trim().length > 0);
      }
    } catch {
      additionalImages = [];
    }
  }
  const allImages = [product.imageUrl, ...additionalImages].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-2 md:py-4 pb-28 sm:pb-16 min-w-0">
      {/* Breadcrumb */}
      <FadeIn direction="down">
        <nav className="flex items-center gap-2 text-xs md:text-sm text-brand-charcoal opacity-70 mb-2">
          <Link href="/" className="hover:text-brand-green">Home</Link>
          <ChevronRight size={13} />
          <Link href="/products" className="hover:text-brand-green">Products</Link>
          <ChevronRight size={13} />
          <span className="text-brand-green font-medium">{product.name}</span>
        </nav>
      </FadeIn>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-10 items-start">
        {/* Showcase: Product Image Gallery + Yogabar-style Badges */}
        <div className="w-full lg:w-[46%] xl:w-[44%] flex flex-col md:flex-row gap-3 items-start shrink-0">
          <div className="flex-1 w-full min-w-0">
            <ProductImageGallery images={allImages} productName={product.name} />
          </div>

          {/* Yogabar-style Vertical Badges Column (Vertically centered with the image) */}
          <div className="w-full md:w-20 lg:w-24 shrink-0 flex flex-col justify-center self-center my-auto">
            <ProductBadges category={product.category} slug={product.slug} />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col pt-0 min-w-0">
          <FadeIn direction="left">
            <a
              href="#reviews"
              className="mb-2.5 inline-flex items-center gap-2 group cursor-pointer"
              title="Click to view customer ratings and reviews"
            >
              {reviewCount > 0 && avgRating ? (
                <>
                  <div className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-900 group-hover:bg-amber-500/25 transition">
                    <span>{avgRating}</span>
                    <Star size={12} className="fill-amber-400 text-amber-500" />
                  </div>
                  <span className="text-xs font-semibold text-brand-charcoal/75 group-hover:text-brand-green underline underline-offset-2 transition-colors">
                    {reviewCount} {reviewCount === 1 ? "Customer Review" : "Customer Reviews"}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    ✓ Verified Purchases
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-charcoal/65 group-hover:text-brand-green underline underline-offset-2 transition-colors">
                  <Star size={13} className="text-amber-500" /> Be the first to rate &amp; review
                </span>
              )}
            </a>

            <h1 className="font-serif text-2xl md:text-3xl lg:text-[32px] text-brand-green mb-1 leading-snug">
              {product.name}
              {(product.slug === "premium-raw-phool-makhana" || product.name.toLowerCase().includes("raw phool makhana")) && !product.name.includes("(Fox Nuts)") && (
                <span className="font-serif font-normal text-lg md:text-xl text-brand-green/85 ml-2 inline-block">
                  (Fox Nuts)
                </span>
              )}
            </h1>
            <p className="text-xs text-brand-charcoal/75 mb-2.5 leading-relaxed">
              {product.shortDescription}
            </p>

            <AddToCart product={product} variants={product.variants} />

            <div className="mt-12 space-y-8 border-t border-brand-green-light/20 pt-8">
              <div>
                <h3 className="font-bold text-lg text-brand-green mb-3">About this product</h3>
                <p className="opacity-90 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                <ProductDescriptionGallery images={allImages} productName={product.name} />
              </div>
              
              {product.ingredients && (
                <div>
                  <h3 className="font-bold text-lg text-brand-green mb-3">Ingredients</h3>
                  <p className="opacity-90 leading-relaxed">{product.ingredients}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm opacity-90 bg-brand-cream p-4 rounded-xl">
                <div>
                  <span className="block font-bold mb-1">Storage</span>
                  <span>{product.storage || "Store in a cool, dry place."}</span>
                </div>
                <div>
                  <span className="block font-bold mb-1">Delivery</span>
                  <span>{product.deliveryNotes || "Delivered within 2-4 business days."}</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="mt-10 md:mt-14">
        <ProductFeedback slug={product.slug} />
      </div>
    </div>
  );
}
