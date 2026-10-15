import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { parseCoupon } from "@/lib/adminCoupon";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return NextResponse.json({ error: "Invalid coupon." }, { status: 400 });
    const coupon = await prisma.coupon.update({ where: { id }, data: parseCoupon(await request.json()) });
    return NextResponse.json({ coupon });
  } catch (error) {
    if (error instanceof Error && ["Coupon code", "Enter a valid", "Minimum order", "Maximum discount", "Set a maximum", "Expiry", "Usage limits", "Invalid coupon"].some((prefix) => error.message.startsWith(prefix))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That coupon code already exists. Choose a different code." }, { status: 409 });
    }
    console.error("Could not update coupon:", error);
    return NextResponse.json({ error: "Could not save the coupon. Check the server connection and try again." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return NextResponse.json({ error: "Invalid coupon." }, { status: 400 });
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not delete coupon." }, { status: 400 });
  }
}
