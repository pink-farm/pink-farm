import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Please sign in to manage this order." }, { status: 401 });
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order || order.customerId !== String(session.userId)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentFulfillment = (order.fulfillmentStatus || "PENDING").toUpperCase();

    // Once shipped or delivered, order cannot be cancelled
    if (
      currentFulfillment === "SHIPPED" ||
      currentFulfillment === "OUT_FOR_DELIVERY" ||
      currentFulfillment === "DELIVERED"
    ) {
      return NextResponse.json(
        {
          error:
            "This order has already been shipped and handed over to the courier. It can no longer be cancelled.",
        },
        { status: 400 }
      );
    }

    if (currentFulfillment === "CANCELLED") {
      return NextResponse.json(
        { error: "This order has already been cancelled." },
        { status: 400 }
      );
    }

    // Cancel order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({ where: { id, customerId: String(session.userId), fulfillmentStatus: currentFulfillment }, data: { fulfillmentStatus: "CANCELLED" } });
      if (changed.count !== 1) throw new Error("ORDER_CHANGED");
      for (const item of await tx.orderItem.findMany({ where: { orderId: id } })) {
        if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
        else await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      }
      return tx.order.findUnique({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: "Order has been successfully cancelled.",
      order: updatedOrder,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_CHANGED") {
      return NextResponse.json({ error: "This order changed and could not be cancelled. Refresh and try again." }, { status: 409 });
    }
    console.error("Failed to cancel customer order:", error);
    return NextResponse.json(
      { error: "Internal Server Error cancelling order" },
      { status: 500 }
    );
  }
}
