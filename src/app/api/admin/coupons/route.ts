import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { parseCoupon } from "@/lib/adminCoupon";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import { getCouponInputErrorMessage } from "@/lib/admin-coupon-errors.mjs";

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ coupons });
  } catch (error) {
    logServerError("security.admin.coupons.failed", error);
    return NextResponse.json({ error: "Could not load coupons." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = await readBoundedJson(request, 8_192);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Coupon data must be a JSON object." }, { status: 400 });
    const data = parseCoupon(parsed.value as Record<string, unknown>);
    const coupon = await prisma.coupon.create({ data });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    const inputError = getCouponInputErrorMessage(error);
    if (inputError) return NextResponse.json({ error: inputError }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Coupon data must be valid JSON." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That coupon code already exists. Choose a different code." }, { status: 409 });
    }
    logServerError("security.admin.coupons.failed", error);
    return NextResponse.json({ error: "Could not save the coupon. Check the server connection and try again." }, { status: 500 });
  }
}
