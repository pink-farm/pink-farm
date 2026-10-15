import { prisma } from "@/lib/db";

export type CouponRecord = Awaited<ReturnType<typeof prisma.coupon.findUnique>>;

export async function getCouponFailure(input: {
  coupon: NonNullable<CouponRecord>;
  subtotal: number;
  phone?: string;
  customerId?: string;
}) {
  const { coupon, subtotal, phone, customerId } = input;
  const now = new Date();
  if (!coupon.isActive) return "This coupon is not active.";
  if (coupon.startsAt > now) return "This coupon is not available yet.";
  if (coupon.expiresAt && coupon.expiresAt <= now) return "This coupon has expired.";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "This coupon has reached its usage limit.";
  if (subtotal < coupon.minimumSubtotal) return `Minimum order of ₹${Math.ceil(coupon.minimumSubtotal / 100)} required.`;

  const phoneFilter = phone ? { customerPhone: phone } : undefined;
  const customerFilter = customerId ? { customerId } : undefined;
  const identityFilter = phoneFilter && customerFilter ? { OR: [phoneFilter, customerFilter] } : phoneFilter || customerFilter;

  if (coupon.firstOrderOnly && identityFilter) {
    const priorOrder = await prisma.order.findFirst({
      where: { ...identityFilter, fulfillmentStatus: { not: "CANCELLED" } },
      select: { id: true },
    });
    if (priorOrder) return "This coupon is only valid on your first order.";
  }

  if (coupon.perCustomerLimit !== null && identityFilter) {
    const count = await prisma.order.count({
      where: { ...identityFilter, couponCode: coupon.code, fulfillmentStatus: { not: "CANCELLED" } },
    });
    if (count >= coupon.perCustomerLimit) return "You have already used this coupon the maximum number of times.";
  }
  return null;
}

export function calculateCouponDiscount(coupon: NonNullable<CouponRecord>, subtotal: number) {
  const amount = coupon.discountType === "PERCENTAGE"
    ? Math.floor(subtotal * coupon.discountValue / 100)
    : coupon.discountValue;
  return Math.min(subtotal, coupon.maximumDiscount === null ? amount : Math.min(amount, coupon.maximumDiscount));
}
