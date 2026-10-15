import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { minimumSubtotal: "asc" },
      select: {
        code: true,
        discountType: true,
        discountValue: true,
        minimumSubtotal: true,
        maximumDiscount: true,
        expiresAt: true,
        usageLimit: true,
        usedCount: true,
        perCustomerLimit: true,
        firstOrderOnly: true,
      },
    });
    return NextResponse.json({ coupons: coupons.filter((coupon) => coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) });
  } catch (error) {
    console.error("Could not load active coupons:", error);
    return NextResponse.json({ coupons: [] });
  }
}
