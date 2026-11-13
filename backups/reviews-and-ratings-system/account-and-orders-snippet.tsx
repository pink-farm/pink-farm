// Snippets from Customer Account and Order Confirmation pages

// 1. In src/app/account/CustomerAccountClient.tsx (inside order items list):
/*
{item.product?.slug && (
  <Link
    href={`/products/${item.product.slug}?review=1#reviews`}
    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded-md transition shadow-2xs"
  >
    <Star size={11} className="fill-amber-400 text-amber-500" />
    <span>Rate &amp; Review Product</span>
  </Link>
)}
*/

// 2. In src/app/order/[orderNumber]/page.tsx (inside ordered items card):
/*
{item.product?.slug && (
  <Link
    href={`/products/${item.product.slug}?review=1#reviews`}
    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 px-2.5 py-1 rounded-full transition-all shadow-2xs"
  >
    <Star size={12} className="fill-amber-400 text-amber-500" />
    <span>Rate &amp; Review</span>
  </Link>
)}
*/
