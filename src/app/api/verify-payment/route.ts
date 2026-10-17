import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    const parsed = await readBoundedJson(request, 4096);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Payment details must be a JSON object." }, { status: 400 });
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = parsed.value as Record<string, unknown>;
    if (typeof orderId !== "string" || !/^[0-9a-fA-F]{24}$/.test(orderId) || typeof razorpay_payment_id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(razorpay_payment_id) || typeof razorpay_order_id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(razorpay_order_id) || typeof razorpay_signature !== "string" || !/^[0-9a-fA-F]{64}$/.test(razorpay_signature)) {
      return NextResponse.json({ error: "Payment details are invalid." }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    const expected = Buffer.from(digest, "hex");
    const supplied = Buffer.from(String(razorpay_signature || ""), "hex");
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder || existingOrder.gatewayOrderId !== razorpay_order_id || existingOrder.paymentMethod !== "RAZORPAY" || existingOrder.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "Payment does not match a pending order." }, { status: 400 });
    }

    // Update Order to PAID
    const confirmed = await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: orderId, gatewayOrderId: razorpay_order_id, paymentMethod: "RAZORPAY", paymentStatus: "PENDING" },
        data: {
        paymentStatus: "PAID",
        fulfillmentStatus: "PROCESSING",
        gatewayPaymentId: razorpay_payment_id,
        },
      });
      return result.count === 1;
    });
    if (!confirmed) return NextResponse.json({ error: "Payment has already been confirmed or the order changed." }, { status: 409 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logServerError("security.verify-payment.failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
