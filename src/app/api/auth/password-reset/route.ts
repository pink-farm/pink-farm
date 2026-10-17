import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/auth";
import { consumeAuthRequestRateLimit, pruneAuthRateLimits } from "@/lib/rate-limit";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type AccountRole = "customer" | "admin";
const otpSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "local-development-only-change-me-32-chars" : "");

function hashCode(email: string, code: string) {
  return createHmac("sha256", otpSecret)
    .update(`${email}:${code}`)
    .digest("hex");
}

async function sendResetCode(email: string, code: string, role: AccountRole) {
  const isAdmin = role === "admin";
  const delivery = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY || "",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_FROM_EMAIL,
        name: process.env.BREVO_FROM_NAME || "Pink Farm",
      },
      to: [{ email }],
      subject: isAdmin ? "Reset your Pink Farm admin password" : "Reset your Pink Farm password",
      textContent: `Your Pink Farm password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;color:#20342c;background:#fdfbf7"><p style="letter-spacing:3px;color:#9b7840;font-size:12px">PINK FARM · ${isAdmin ? "ADMIN SECURITY" : "ACCOUNT SECURITY"}</p><h2 style="font-family:Georgia,serif;color:#1a3c34">A fresh start, securely.</h2><p>Use this one-time code to reset your password:</p><p style="font-size:34px;font-weight:700;letter-spacing:9px;color:#1a3c34;background:#fff;padding:16px;border-radius:12px">${code}</p><p>This code expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.</p></div>`,
    }),
  });
  if (!delivery.ok) throw new Error(`Brevo returned status ${delivery.status}`);
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    const parsed = await readBoundedJson(request, 4_096);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.value;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Complete the password reset details." }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const role: AccountRole = values.role === "admin" ? "admin" : "customer";
    const email = role === "admin" ? ADMIN_EMAIL : (typeof values.email === "string" ? values.email.trim().toLowerCase() : "");
    const action = values.action === "verify" ? "verify" : "request";
    if (role === "admin" && !ADMIN_EMAIL) return NextResponse.json({ error: "Admin password recovery is not configured." }, { status: 503 });
    if (!emailPattern.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (otpSecret.length < 32) return NextResponse.json({ error: "Secure email verification is not configured yet." }, { status: 503 });
    if (role === "admin" && email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Admin password recovery is available only for the authorized admin email." }, { status: 403 });
    }

    try {
      const limit = await consumeAuthRequestRateLimit(request, `password-reset-${role}-${action}`, email, action === "request" ? 3 : 10, 15 * 60_000, action === "request" ? 20 : 40);
      await pruneAuthRateLimits();
      if (!limit.allowed) {
        console.warn("security.auth_rate_limit.activated", { scope: "password-reset" });
        return NextResponse.json({ error: "Too many password reset attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
      }
    } catch {
      console.error("security.auth_rate_limit_unavailable", { scope: "password-reset" });
      return NextResponse.json({ error: "Password reset is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }

    const account = role === "admin"
      ? await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } })
      : await prisma.customer.findUnique({ where: { email }, select: { id: true } });

    if (action === "request") {
      // Use the same response whether an account exists, to avoid exposing registered addresses.
      const message = "If an account matches that email, a reset code will arrive shortly.";
      if (!account) return NextResponse.json({ success: true, message });
      if (!process.env.BREVO_API_KEY || !process.env.BREVO_FROM_EMAIL) {
        return NextResponse.json({ error: "Email verification is not configured yet." }, { status: 503 });
      }

      const recent = await prisma.otpChallenge.findFirst({
        where: { email, createdAt: { gt: new Date(Date.now() - 60_000) } },
        select: { id: true },
      });
      if (recent) return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 });

      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const purpose = role === "admin" ? "admin_reset" : "customer_reset";
      await prisma.otpChallenge.deleteMany({ where: { OR: [{ email }, { expiresAt: { lt: new Date() } }] } });
      const challenge = await prisma.otpChallenge.create({
        data: { email, purpose, codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + 10 * 60_000) },
        select: { id: true },
      });
      try {
        await sendResetCode(email, code, role);
      } catch (deliveryError) {
        await prisma.otpChallenge.delete({ where: { id: challenge.id } });
        logServerError("security.auth.password-reset.failed", deliveryError);
        return NextResponse.json({ error: "We could not send your reset code. Please try again." }, { status: 502 });
      }
      return NextResponse.json({ success: true, message });
    }

    const code = typeof values.code === "string" ? values.code.trim() : "";
    const password = typeof values.password === "string" ? values.password : "";
    if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Choose a password between 8 and 128 characters." }, { status: 400 });
    }
    if (!account) return NextResponse.json({ error: "That reset request is no longer available. Request a new code." }, { status: 400 });

    const purpose = role === "admin" ? "admin_reset" : "customer_reset";
    const challenge = await prisma.otpChallenge.findFirst({ where: { email, purpose }, orderBy: { createdAt: "desc" } });
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5) {
      return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
    }
    const expected = Buffer.from(challenge.codeHash, "hex");
    const actual = Buffer.from(hashCode(email, code), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      await prisma.otpChallenge.updateMany({
        where: { id: challenge.id, attempts: challenge.attempts, expiresAt: { gt: new Date() } },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "That code is not correct." }, { status: 400 });
    }

    const claimed = await prisma.otpChallenge.updateMany({
      where: { id: challenge.id, attempts: challenge.attempts, expiresAt: { gt: new Date() } },
      data: { attempts: 5 },
    });
    if (claimed.count !== 1) return NextResponse.json({ error: "This code has already been used. Request a new one." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    if (role === "admin") {
      await prisma.adminUser.update({ where: { email: ADMIN_EMAIL }, data: { password: passwordHash } });
      console.info("security.admin_credentials.changed", { action: "password-reset" });
    } else {
      await prisma.customer.update({ where: { email }, data: { passwordHash } });
    }
    await prisma.otpChallenge.deleteMany({ where: { email } });
    return NextResponse.json({ success: true, message: "Your password has been updated. Sign in with your new password." });
  } catch (error) {
    logServerError("security.auth.password-reset.failed", error);
    return NextResponse.json({ error: "We could not complete that request. Please try again." }, { status: 500 });
  }
}
