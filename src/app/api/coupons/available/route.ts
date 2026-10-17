import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    // Allow a 24-hour buffer for startsAt to account for client/server timezone differences
    const startCutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        startsAt: { lte: startCutoff },
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

    const activeList = coupons.filter(
      (coupon) => coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit
    );

    return NextResponse.json(
      { coupons: activeList },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    logServerError("security.coupons.available.failed", error);
    return NextResponse.json({ coupons: [] }, { status: 500 });
  }
}
