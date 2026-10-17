import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { parseCoupon } from "@/lib/adminCoupon";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import { getCouponInputErrorMessage } from "@/lib/admin-coupon-errors.mjs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return NextResponse.json({ error: "Invalid coupon." }, { status: 400 });
    const parsed = await readBoundedJson(request, 8_192);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Coupon data must be a JSON object." }, { status: 400 });
    const coupon = await prisma.coupon.update({ where: { id }, data: parseCoupon(parsed.value as Record<string, unknown>) });
    return NextResponse.json({ coupon });
  } catch (error) {
    const inputError = getCouponInputErrorMessage(error);
    if (inputError) return NextResponse.json({ error: inputError }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Coupon data must be valid JSON." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That coupon code already exists. Choose a different code." }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    logServerError("security.admin.coupon.update_failed", error);
    return NextResponse.json({ error: "Could not save the coupon. Check the server connection and try again." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return NextResponse.json({ error: "Invalid coupon." }, { status: 400 });
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    logServerError("security.admin.coupon.delete_failed", error);
    return NextResponse.json({ error: "Could not delete coupon." }, { status: 500 });
  }
}
