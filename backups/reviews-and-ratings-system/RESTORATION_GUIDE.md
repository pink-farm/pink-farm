# Pink Farm — Reviews & Rating System Backup

This folder contains the complete, battle-tested source code and integration snippets for the **Customer Reviews, Star Ratings, and Q&A / Comments System** of Pink Farm.

---

## Files in this Backup

1. **`ProductFeedback.tsx`**
   * Complete client UI component (~1000 lines) with:
     * Overall average rating display with 5-star visual breakdown
     * Rating distribution bar chart (5★, 4★, 3★, 2★, 1★ percentages)
     * Star rating filter buttons & sorting (Most Recent, Highest Rated, Lowest Rated)
     * Interactive Star rating selector with hover effects and labels
     * Verified Purchase badge
     * Review submission form for verified customers & guests (name + email)
     * Community Questions & Comments tab with hourly rate limiting
     * Admin delete review / comment capability with real-time UI removal

2. **`feedback-api-route.ts`**
   * Next.js App Router API endpoint (`/api/products/[slug]/feedback`):
     * `GET`: Fetches product reviews, aggregate average, star distributions, and user purchase status
     * `POST`: Authenticates or captures customer info, validates input bounds, upserts `ProductReview` or creates `ProductComment`, revalidates tags
     * `DELETE`: Allows authenticated admins to permanently delete offending reviews or comments

3. **`cachedStore-snippet.ts`**
   * Server-side cached review statistics helper (`getCachedProductReviewStats`) utilizing Next.js `"use cache"`.

4. **`product-page-snippet.tsx`**
   * Integration JSX for `src/app/products/[slug]/page.tsx` showing the exact location of the star rating badge above product title and `<ProductFeedback>` at the bottom of the page.

5. **`account-and-orders-snippet.tsx`**
   * "Rate & Review Product" buttons for the customer dashboard and order confirmation pages.

---

## How to Restore

1. **Restore Component:**
   * Copy `ProductFeedback.tsx` to `src/components/products/ProductFeedback.tsx`.

2. **Restore API Route:**
   * Copy `feedback-api-route.ts` to `src/app/api/products/[slug]/feedback/route.ts`.

3. **Restore cachedStore function:**
   * Paste the `getCachedProductReviewStats` function from `cachedStore-snippet.ts` into `src/lib/cachedStore.ts`.

4. **Restore Product Page UI:**
   * In `src/app/products/[slug]/page.tsx`, import `ProductFeedback` and `Star`, and place the badge and `<ProductFeedback slug={product.slug} />` as shown in `product-page-snippet.tsx`.

5. **Restore Account & Order Buttons (Optional):**
   * Place the "Rate & Review" links back in `src/app/account/CustomerAccountClient.tsx` and `src/app/order/[orderNumber]/page.tsx`.
