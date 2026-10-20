import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth";
import { calculateCouponDiscount, getCouponFailure } from "@/lib/coupons";
import { readBoundedJson } from "@/lib/request-security.mjs";

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to use coupons.", code: "CUSTOMER_LOGIN_REQUIRED" }, { status: 401 });
    }
    const parsed = await readBoundedJson(request, 4_096);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Coupon data must be a JSON object." }, { status: 400 });
    const body = parsed.value as Record<string, unknown>;
    const code = String(body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal);
    const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
    if (!code || !Number.isSafeInteger(subtotal) || subtotal < 0) return NextResponse.json({ error: "Enter a coupon code and valid cart." }, { status: 400 });
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return NextResponse.json({ error: "Invalid coupon code." }, { status: 404 });
    const customerId = typeof session?.userId === "string" && /^[0-9a-fA-F]{24}$/.test(session.userId) ? session.userId : undefined;
    const failure = await getCouponFailure({ coupon, subtotal, phone: phone.length === 10 ? phone : undefined, customerId });
    if (failure) return NextResponse.json({ error: failure }, { status: 400 });
    const discount = calculateCouponDiscount(coupon, subtotal);
    return NextResponse.json({ code: coupon.code, discount, message: `${coupon.code} applied successfully.` });
  } catch (error) {
    logServerError("security.coupons.validate.failed", error);
    return NextResponse.json({ error: "Could not validate this coupon. Please try again." }, { status: 500 });
  }
}
