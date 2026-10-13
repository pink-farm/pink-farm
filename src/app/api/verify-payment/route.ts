import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

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
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
