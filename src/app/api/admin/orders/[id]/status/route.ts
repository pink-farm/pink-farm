import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const text = await request.text();
    let status = "";
    try {
      const body = JSON.parse(text);
      status = body?.status;
    } catch {
      // Fallback for malformed body or string
      const match = text.match(/"?status"?\s*:\s*"?([A-Za-z_]+)"?/);
      if (match) {
        status = match[1];
      } else {
        status = text.replace(/[^a-zA-Z_]/g, "");
      }
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "PROCESSING", "OUT_FOR_DELIVERY"];
    const normalizedStatus = status.toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new Error("ORDER_NOT_FOUND");
      if (current.fulfillmentStatus === "CANCELLED" && normalizedStatus !== "CANCELLED") throw new Error("ORDER_ALREADY_CANCELLED");
      if (normalizedStatus === "CANCELLED" && ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(current.fulfillmentStatus)) throw new Error("CANNOT_CANCEL");
      const changed = await tx.order.updateMany({ where: { id, fulfillmentStatus: current.fulfillmentStatus }, data: {
        fulfillmentStatus: normalizedStatus,
        ...(normalizedStatus === "DELIVERED" && current.paymentMethod === "COD" ? { paymentStatus: "PAID" } : {}),
      } });
      if (changed.count !== 1) throw new Error("ORDER_CHANGED");
      if (normalizedStatus === "CANCELLED" && current.fulfillmentStatus !== "CANCELLED") {
        for (const item of current.items) {
          if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
          else await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
        }
      }
      return tx.order.findUnique({ where: { id } });
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (error instanceof Error && error.message === "CANNOT_CANCEL") return NextResponse.json({ error: "An order that has shipped cannot be cancelled here." }, { status: 409 });
    if (error instanceof Error && (error.message === "ORDER_ALREADY_CANCELLED" || error.message === "ORDER_CHANGED")) return NextResponse.json({ error: "The order has changed and this update could not be applied." }, { status: 409 });
    console.error("Failed to update order fulfillment status:", error);
    return NextResponse.json(
      { error: "Internal Server Error updating order status" },
      { status: 500 }
    );
  }
}
