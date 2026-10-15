import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth";
import { calculateCouponDiscount, getCouponFailure } from "@/lib/coupons";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal);
    const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
    if (!code || !Number.isSafeInteger(subtotal) || subtotal < 0) return NextResponse.json({ error: "Enter a coupon code and valid cart." }, { status: 400 });
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return NextResponse.json({ error: "Invalid coupon code." }, { status: 404 });
    const session = await getCustomerSession();
    const customerId = typeof session?.userId === "string" && /^[0-9a-fA-F]{24}$/.test(session.userId) ? session.userId : undefined;
    const failure = await getCouponFailure({ coupon, subtotal, phone: phone.length === 10 ? phone : undefined, customerId });
    if (failure) return NextResponse.json({ error: failure }, { status: 400 });
    const discount = calculateCouponDiscount(coupon, subtotal);
    return NextResponse.json({ code: coupon.code, discount, message: `${coupon.code} applied successfully.` });
  } catch (error) {
    console.error("Coupon validation failed:", error);
    return NextResponse.json({ error: "Could not validate this coupon. Please try again." }, { status: 500 });
  }
}
