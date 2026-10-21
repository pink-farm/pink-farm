import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import Razorpay from "razorpay";
import { logServerError } from "@/lib/server-log.mjs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Check if Razorpay returned an error payload (e.g. user cancelled at bank portal)
    const errorCode = formData.get("error[code]")?.toString();
    const errorDescription = formData.get("error[description]")?.toString() || formData.get("error[reason]")?.toString();

    if (errorCode || errorDescription) {
      logServerError("security.razorpay.callback_payment_failed", {
        code: errorCode,
        description: errorDescription,
      });
      return NextResponse.redirect(
        new URL("/checkout?error=" + encodeURIComponent(errorDescription || "Payment was not completed. Please try again."), request.url),
        { status: 303 }
      );
    }

    const razorpay_payment_id = formData.get("razorpay_payment_id")?.toString();
    const razorpay_order_id = formData.get("razorpay_order_id")?.toString();
    const razorpay_signature = formData.get("razorpay_signature")?.toString();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.redirect(
        new URL("/checkout?error=" + encodeURIComponent("Payment details missing from provider."), request.url),
        { status: 303 }
      );
    }

    // Input format validation
    if (
      !/^[A-Za-z0-9_-]{1,128}$/.test(razorpay_payment_id) ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(razorpay_order_id) ||
      !/^[0-9a-fA-F]{64}$/.test(razorpay_signature)
    ) {
      return NextResponse.redirect(
        new URL("/checkout?error=" + encodeURIComponent("Payment signature format is invalid."), request.url),
        { status: 303 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^["']|["']$/g, "");
    const keyId = process.env.RAZORPAY_KEY_ID?.trim().replace(/^["']|["']$/g, "");
    if (!secret || !keyId) {
      logServerError("security.razorpay.callback_unconfigured", "Secret or Key ID missing");
      return NextResponse.redirect(
        new URL("/checkout?error=" + encodeURIComponent("Payment service is temporarily unconfigured."), request.url),
        { status: 303 }
      );
    }

    // Verify cryptographic signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    const expected = Buffer.from(digest, "hex");
    const supplied = Buffer.from(String(razorpay_signature || ""), "hex");
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      logServerError("security.razorpay.callback_signature_mismatch", { razorpay_order_id, razorpay_payment_id });
      return NextResponse.redirect(
        new URL("/checkout?error=" + encodeURIComponent("Payment verification signature mismatch."), request.url),
        { status: 303 }
      );
    }

    // Locate the matching order in DB
    const existingOrder = await prisma.order.findFirst({
      where: { gatewayOrderId: razorpay_order_id, paymentMethod: "RAZORPAY" },
    });

    if (!existingOrder) {
      logServerError("security.razorpay.callback_order_not_found", { razorpay_order_id });
      return NextResponse.redirect(
        new URL("/checkout?error=" + encodeURIComponent("Order not found for completed payment."), request.url),
        { status: 303 }
      );
    }

    // Double-check capture status with Razorpay
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      if (
        payment.order_id === razorpay_order_id &&
        payment.amount === existingOrder.totalAmount &&
        payment.currency === "INR" &&
        payment.status === "captured"
      ) {
        await prisma.order.updateMany({
          where: {
            id: existingOrder.id,
            gatewayOrderId: razorpay_order_id,
            paymentMethod: "RAZORPAY",
            paymentStatus: "PENDING",
          },
          data: {
            paymentStatus: "PAID",
            gatewayPaymentId: razorpay_payment_id,
          },
        });
      }
    } catch (fetchErr) {
      logServerError("security.razorpay.callback_fetch_warning", fetchErr);
      // Fallback: If signature verified, mark paid
      await prisma.order.updateMany({
        where: {
          id: existingOrder.id,
          gatewayOrderId: razorpay_order_id,
          paymentMethod: "RAZORPAY",
          paymentStatus: "PENDING",
        },
        data: {
          paymentStatus: "PAID",
          gatewayPaymentId: razorpay_payment_id,
        },
      });
    }

    // Smoothly redirect user to their completed order confirmation page
    return NextResponse.redirect(
      new URL(`/order/${existingOrder.orderNumber}?payment=success`, request.url),
      { status: 303 }
    );
  } catch (error: unknown) {
    logServerError("security.razorpay.callback_exception", error);
    return NextResponse.redirect(
      new URL("/checkout?error=" + encodeURIComponent("An error occurred while confirming your payment."), request.url),
      { status: 303 }
    );
  }
}
