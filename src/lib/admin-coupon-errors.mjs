const INPUT_MESSAGES = new Set([
  "Coupon code must be 3–32 letters, numbers, dashes, or underscores.",
  "Enter a valid discount amount (percentage must be from 1 to 100).",
  "Minimum order value cannot be negative.",
  "Maximum discount must be greater than zero.",
  "Set a maximum discount for percentage coupons.",
  "Expiry must be later than the start date.",
  "Usage limits must be a positive whole number.",
]);

/** Return only fixed, reviewed input messages. Never pass through arbitrary exceptions. */
export function getCouponInputErrorMessage(error) {
  return error instanceof Error && INPUT_MESSAGES.has(error.message) ? error.message : null;
}
