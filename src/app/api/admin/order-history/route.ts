import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { ADMIN_EMAIL, requireAdminSession } from "@/lib/auth";
import { consumeAuthRequestRateLimit, pruneAuthRateLimits } from "@/lib/rate-limit";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import type { Prisma } from "@prisma/client";

const OTP_PURPOSE = "admin_order_history_delete";
const GRANT_PURPOSE = "admin_order_history_delete_approved";
const otpSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "local-development-only-change-me-32-chars" : "");

type DeletionScope =
  | { type: "all" }
  | { type: "range"; from: string; to: string }
  | { type: "single"; orderId: string };

function parseDeletionScope(value: unknown): DeletionScope | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const scope = value as Record<string, unknown>;
  if (scope.type === "all") return { type: "all" };
  if (scope.type === "single" && typeof scope.orderId === "string" && /^[a-f\d]{24}$/i.test(scope.orderId)) {
    return { type: "single", orderId: scope.orderId };
  }
  if (scope.type === "range" && typeof scope.from === "string" && typeof scope.to === "string") {
    const from = new Date(scope.from);
    const to = new Date(scope.to);
    if (Number.isFinite(from.getTime()) && Number.isFinite(to.getTime()) && from.toISOString() === scope.from && to.toISOString() === scope.to && from < to) {
      return { type: "range", from: scope.from, to: scope.to };
    }
  }
  return null;
}

function scopePurpose(scope: DeletionScope) {
  return `${OTP_PURPOSE}:${hashValue(JSON.stringify(scope))}`;
}

function orderWhere(scope: DeletionScope): Prisma.OrderWhereInput {
  if (scope.type === "single") return { id: scope.orderId };
  if (scope.type === "range") return { createdAt: { gte: new Date(scope.from), lt: new Date(scope.to) } };
  return {};
}

function hashValue(value: string) {
  return createHmac("sha256", otpSecret).update(`${ADMIN_EMAIL}:${value}`).digest("hex");
}

async function sendCode(code: string) {
  const delivery = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY || "",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_FROM_EMAIL, name: process.env.BREVO_FROM_NAME || "Pink Farm" },
      to: [{ email: ADMIN_EMAIL }],
      subject: "Confirm Pink Farm order history deletion",
      textContent: `Your one-time code to clear Pink Farm order history is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#20342c"><h2 style="color:#287447">Confirm order history deletion</h2><p>Use this one-time code to continue with the order history deletion request:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request this, ignore this email.</p></div>`,
    }),
  });
  if (!delivery.ok) throw new Error(`Brevo returned status ${delivery.status}`);
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });

  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
    if (!ADMIN_EMAIL) return NextResponse.json({ error: "The administrator email is not configured." }, { status: 503 });
    if (otpSecret.length < 32) return NextResponse.json({ error: "Secure email verification is not configured." }, { status: 503 });
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_FROM_EMAIL) {
      return NextResponse.json({ error: "Email verification is not configured." }, { status: 503 });
    }

    const parsed = await readBoundedJson(request, 4_096);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return NextResponse.json({ error: "Choose an order history action." }, { status: 400 });
    }

    const values = parsed.value as Record<string, unknown>;
    const action = values.action;
    if (action !== "send" && action !== "verify" && action !== "delete") {
      return NextResponse.json({ error: "That order history action is not supported." }, { status: 400 });
    }
    const scope = parseDeletionScope(values.scope);
    if (!scope) return NextResponse.json({ error: "Choose a valid order history deletion target." }, { status: 400 });
    const requestedPurpose = scopePurpose(scope);

    try {
      const limits = action === "send"
        ? [3, 15 * 60_000, 20]
        : action === "verify"
          ? [10, 15 * 60_000, 40]
          : [3, 15 * 60_000, 20];
      const limit = await consumeAuthRequestRateLimit(request, `clear-order-history-${action}`, ADMIN_EMAIL, limits[0], limits[1], limits[2]);
      await pruneAuthRateLimits();
      if (!limit.allowed) {
        return NextResponse.json({ error: "Too many attempts. Try again later." }, {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        });
      }
    } catch {
      return NextResponse.json({ error: "Security verification is temporarily unavailable." }, { status: 503 });
    }

    if (action === "send") {
      const recent = await prisma.otpChallenge.findFirst({
        where: { email: ADMIN_EMAIL, purpose: requestedPurpose, createdAt: { gt: new Date(Date.now() - 60_000) } },
        select: { id: true },
      });
      if (recent) return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 });

      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      await prisma.otpChallenge.deleteMany({ where: { email: ADMIN_EMAIL, purpose: { in: [requestedPurpose, GRANT_PURPOSE] } } });
      const challenge = await prisma.otpChallenge.create({
        data: {
          email: ADMIN_EMAIL,
          purpose: requestedPurpose,
          codeHash: hashValue(`otp:${code}`),
          expiresAt: new Date(Date.now() + 10 * 60_000),
        },
        select: { id: true },
      });
      try {
        await sendCode(code);
      } catch (error) {
        await prisma.otpChallenge.deleteMany({ where: { id: challenge.id } });
        logServerError("security.admin.order-history-otp.failed", error);
        return NextResponse.json({ error: "We could not send the verification code. Please try again." }, { status: 502 });
      }
      return NextResponse.json({ success: true, message: "A verification code was sent to the administrator email." });
    }

    if (action === "verify") {
      const code = typeof values.code === "string" ? values.code.trim() : "";
      if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
      const challenge = await prisma.otpChallenge.findFirst({
        where: { email: ADMIN_EMAIL, purpose: requestedPurpose },
        orderBy: { createdAt: "desc" },
      });
      if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5) {
        return NextResponse.json({ error: "This code has expired. Request a new code." }, { status: 400 });
      }

      const expected = Buffer.from(challenge.codeHash, "hex");
      const actual = Buffer.from(hashValue(`otp:${code}`), "hex");
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        await prisma.otpChallenge.updateMany({
          where: { id: challenge.id, purpose: requestedPurpose, attempts: challenge.attempts, expiresAt: { gt: new Date() } },
          data: { attempts: { increment: 1 } },
        });
        return NextResponse.json({ error: "That code is not correct." }, { status: 400 });
      }

      const grant = randomBytes(32).toString("base64url");
      const claimed = await prisma.otpChallenge.updateMany({
        where: { id: challenge.id, purpose: requestedPurpose, attempts: challenge.attempts, expiresAt: { gt: new Date() } },
        data: {
          purpose: GRANT_PURPOSE,
          codeHash: hashValue(`grant:${grant}:${requestedPurpose}`),
          attempts: 0,
          expiresAt: new Date(Date.now() + 5 * 60_000),
        },
      });
      if (claimed.count !== 1) return NextResponse.json({ error: "This code has already been used. Request a new code." }, { status: 409 });

      const orderCount = await prisma.order.count({ where: orderWhere(scope) });
      return NextResponse.json({ success: true, grant, orderCount });
    }

    const grant = typeof values.grant === "string" ? values.grant : "";
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(grant)) return NextResponse.json({ error: "Verify the email code before continuing." }, { status: 400 });
    const grantHash = hashValue(`grant:${grant}:${requestedPurpose}`);
    const where = orderWhere(scope);
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.otpChallenge.deleteMany({
        where: {
          email: ADMIN_EMAIL,
          purpose: GRANT_PURPOSE,
          codeHash: grantHash,
          expiresAt: { gt: new Date() },
        },
      });
      if (claimed.count !== 1) throw new Error("ORDER_HISTORY_GRANT_INVALID");
      const itemWhere: Prisma.OrderItemWhereInput = scope.type === "all" ? {} : { order: { is: where } };
      await tx.orderItem.deleteMany({ where: itemWhere });
      return await tx.order.deleteMany({ where });
    });

    console.info("security.admin.order_history.deleted", { scope: scope.type, deletedOrders: result.count });
    return NextResponse.json({ success: true, deletedOrders: result.count });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_HISTORY_GRANT_INVALID") {
      return NextResponse.json({ error: "Your verification expired or was already used. Request a new code." }, { status: 409 });
    }
    logServerError("security.admin.order-history.failed", error);
    return NextResponse.json({ error: "We could not complete this order history action. Please try again." }, { status: 500 });
  }
}
