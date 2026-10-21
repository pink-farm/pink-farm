import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import { verifyCheckoutCancelToken } from "@/lib/payment-token";
import { getRazorpayPaymentFailureDiagnostics } from "@/lib/razorpay-errors.mjs";

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
  if (
    !/^[0-9a-fA-F]{24}$/.test(orderId) ||
    !/^order_[A-Za-z0-9]+$/.test(gatewayOrderId) ||
    !verifyCheckoutCancelToken(orderId, gatewayOrderId, body.cancelToken)
  ) {
    return NextResponse.json({ error: "Payment failure details are invalid or expired." }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, gatewayOrderId: true, paymentMethod: true, paymentStatus: true },
    });
    if (!order || order.gatewayOrderId !== gatewayOrderId || order.paymentMethod !== "RAZORPAY" || order.paymentStatus !== "PENDING") {
      return NextResponse.json({ success: true });
    }

    const diagnostics = getRazorpayPaymentFailureDiagnostics(body.failure);
    console.warn("security.checkout.razorpay_payment_failed", {
      orderNumber: order.orderNumber,
      ...diagnostics,
    });
    return NextResponse.json({ success: true });
  } catch {
    // Diagnostics must never disrupt checkout or expose customer/payment data.
    return NextResponse.json({ success: true });
  }
}
