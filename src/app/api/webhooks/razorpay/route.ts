import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logServerError } from "@/lib/server-log.mjs";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay-webhook.mjs";

const MAX_WEBHOOK_BYTES = 1_000_000;

type RazorpayCapturedEvent = {
  event?: unknown;
  payload?: {
    payment?: { entity?: { id?: unknown; order_id?: unknown; amount?: unknown; currency?: unknown; status?: unknown } };
  };
};

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim().replace(/^["']|["']$/g, "");
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  let rawBody: string;
  try {
    const declaredLength = request.headers.get("content-length");
    if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_WEBHOOK_BYTES)) {
      return NextResponse.json({ error: "Webhook body is too large or invalid." }, { status: 413 });
    }
    if (!request.body) return NextResponse.json({ error: "Webhook body is required." }, { status: 400 });
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_WEBHOOK_BYTES) {
          await reader.cancel();
          return NextResponse.json({ error: "Webhook body is too large." }, { status: 413 });
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    rawBody = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return NextResponse.json({ error: "Invalid webhook body." }, { status: 400 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: RazorpayCapturedEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayCapturedEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  // Ignore unrelated, signed Razorpay notifications. Subscribe only to payment.captured.
  if (event.event !== "payment.captured") return NextResponse.json({ received: true });

  const payment = event.payload?.payment?.entity;
  if (
    !payment ||
    typeof payment.id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(payment.id) ||
    typeof payment.order_id !== "string" || !/^order_[A-Za-z0-9]+$/.test(payment.order_id) ||
    !Number.isSafeInteger(payment.amount) ||
    payment.currency !== "INR" ||
    payment.status !== "captured"
  ) {
    return NextResponse.json({ error: "Invalid captured payment details." }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({ where: { gatewayOrderId: payment.order_id } });
    if (!order || order.paymentMethod !== "RAZORPAY" || order.totalAmount !== payment.amount) {
      return NextResponse.json({ error: "Payment does not match an order." }, { status: 400 });
    }

    if (order.paymentStatus === "PAID") {
      return order.gatewayPaymentId === payment.id
        ? NextResponse.json({ received: true, alreadyProcessed: true })
        : NextResponse.json({ error: "Order was paid by a different payment." }, { status: 409 });
    }
    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "Captured payment requires order reconciliation." }, { status: 409 });
    }

    const changed = await prisma.order.updateMany({
      where: { id: order.id, gatewayOrderId: payment.order_id, paymentStatus: "PENDING", totalAmount: payment.amount },
      data: { paymentStatus: "PAID", gatewayPaymentId: payment.id },
    });

    if (changed.count === 1) return NextResponse.json({ received: true });

    // A concurrent callback or webhook may have completed this exact payment.
    const latest = await prisma.order.findUnique({ where: { id: order.id } });
    if (latest?.paymentStatus === "PAID" && latest.gatewayPaymentId === payment.id) {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }
    return NextResponse.json({ error: "Payment status changed before confirmation." }, { status: 409 });
  } catch (error) {
    logServerError("security.razorpay_webhook.failed", error);
    return NextResponse.json({ error: "Webhook could not be processed." }, { status: 503 });
  }
}
