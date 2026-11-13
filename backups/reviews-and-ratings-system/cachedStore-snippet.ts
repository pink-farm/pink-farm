// Snippet from src/lib/cachedStore.ts for product review stats
import { cacheLife, cacheTag } from "next/cache";
import { prisma, queryDatabase } from "@/lib/db";

export async function getCachedProductReviewStats(productId: string, slug: string) {
  "use cache";
  cacheTag("store-products", `product-reviews-${slug}`);

  try {
    const reviewStats = await queryDatabase(() =>
      prisma.productReview.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    );
    cacheLife("minutes");
    return {
      reviewCount: reviewStats?._count?._all || 0,
      avgRating: reviewStats?._avg?.rating ? reviewStats._avg.rating.toFixed(1) : null,
    };
  } catch {
    cacheLife("minutes");
    return { reviewCount: 0, avgRating: null };
  }
}
