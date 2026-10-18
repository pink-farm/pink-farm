import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/db";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import { verifyCheckoutCancelToken } from "@/lib/payment-token";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const parsed = await readBoundedJson(request, 4096);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return NextResponse.json({ error: "Payment details must be a JSON object." }, { status: 400 });
  }
  const body = parsed.value as Record<string, unknown>;
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const gatewayOrderId = typeof body.razorpayOrderId === "string" ? body.razorpayOrderId : "";
  if (!/^[0-9a-fA-F]{24}$/.test(orderId) || !/^order_[A-Za-z0-9]+$/.test(gatewayOrderId) || !verifyCheckoutCancelToken(orderId, gatewayOrderId, body.cancelToken)) {
    return NextResponse.json({ error: "Payment cancellation details are invalid or expired." }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.gatewayOrderId !== gatewayOrderId || order.paymentMethod !== "RAZORPAY" || order.paymentStatus !== "PENDING" || order.fulfillmentStatus !== "PENDING") {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payments = await razorpay.orders.fetchPayments(gatewayOrderId);
    if (payments.items.some((payment) => payment.status !== "failed")) {
      return NextResponse.json({ error: "Razorpay has a payment in progress. Refresh the order status before trying again." }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({
        where: { id: orderId, gatewayOrderId, paymentStatus: "PENDING", fulfillmentStatus: "PENDING" },
        data: { paymentStatus: "FAILED", fulfillmentStatus: "CANCELLED" },
      });
      if (changed.count !== 1) return;
      if (order.couponCode) {
        await tx.coupon.updateMany({ where: { code: order.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
      }
      for (const item of order.items) {
        if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
        else await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("security.checkout.cancel_payment.failed", error);
    return NextResponse.json({ error: "We could not safely cancel this payment attempt. Please refresh the order status." }, { status: 503 });
  }
}
