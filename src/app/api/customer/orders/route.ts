import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Please sign in to view orders." }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: String(session.userId) },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ orders });
  } catch (error) {
    logServerError("security.customer.orders.failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
