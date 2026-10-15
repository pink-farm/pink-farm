import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { parseCoupon } from "@/lib/adminCoupon";

export async function GET() {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Could not load coupons:", error);
    return NextResponse.json({ error: "Could not load coupons." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = parseCoupon(await request.json());
    const coupon = await prisma.coupon.create({ data });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && ["Coupon code", "Enter a valid", "Minimum order", "Maximum discount", "Set a maximum", "Expiry", "Usage limits"].some((prefix) => error.message.startsWith(prefix))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That coupon code already exists. Choose a different code." }, { status: 409 });
    }
    console.error("Could not create coupon:", error);
    return NextResponse.json({ error: "Could not save the coupon. Check the server connection and try again." }, { status: 500 });
  }
}
