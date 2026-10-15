export function parseCoupon(body: Record<string, unknown>) {
  const code = String(body.code || "").trim().toUpperCase();
  const discountType = body.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED";
  const discountValue = Number(body.discountValue);
  const minimumRupees = Number(body.minimumSubtotal || 0);
  const maximumRupees = body.maximumDiscount === "" || body.maximumDiscount == null ? null : Number(body.maximumDiscount);
  const startsAt = body.startsAt ? new Date(String(body.startsAt)) : new Date();
  const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;
  const usageLimit = body.usageLimit === "" || body.usageLimit == null ? null : Number(body.usageLimit);
  const perCustomerLimit = body.perCustomerLimit === "" || body.perCustomerLimit == null ? null : Number(body.perCustomerLimit);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new Error("Coupon code must be 3–32 letters, numbers, dashes, or underscores.");
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "PERCENTAGE" && discountValue > 100)) throw new Error("Enter a valid discount amount (percentage must be from 1 to 100).");
  if (!Number.isFinite(minimumRupees) || minimumRupees < 0) throw new Error("Minimum order value cannot be negative.");
  if (maximumRupees !== null && (!Number.isFinite(maximumRupees) || maximumRupees <= 0)) throw new Error("Maximum discount must be greater than zero.");
  if (discountType === "PERCENTAGE" && maximumRupees === null) throw new Error("Set a maximum discount for percentage coupons.");
  if (Number.isNaN(startsAt.getTime()) || (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt <= startsAt))) throw new Error("Expiry must be later than the start date.");
  for (const limit of [usageLimit, perCustomerLimit]) if (limit !== null && (!Number.isInteger(limit) || limit < 1)) throw new Error("Usage limits must be a positive whole number.");
  return {
    code, discountType, discountValue: discountType === "FIXED" ? Math.round(discountValue * 100) : Math.round(discountValue),
    minimumSubtotal: Math.round(minimumRupees * 100), maximumDiscount: maximumRupees === null ? null : Math.round(maximumRupees * 100),
    startsAt, expiresAt, usageLimit, perCustomerLimit, isActive: body.isActive !== false, firstOrderOnly: body.firstOrderOnly === true,
  };
}
