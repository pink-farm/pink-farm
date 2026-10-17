import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { clearAuthRequestRateLimit, consumeAuthRequestRateLimit, pruneAuthRateLimits } from "@/lib/rate-limit";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    const parsed = await readBoundedJson(request, 4_096);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.value;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
    const password = typeof values.password === "string" ? values.password : "";
    if (!emailPattern.test(email) || email.length > 254 || !password || password.length > 128) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }

    let limit;
    try {
      limit = await consumeAuthRequestRateLimit(request, "customer-login", email, 8, 15 * 60_000, 40);
      await pruneAuthRateLimits();
    } catch {
      console.error("security.auth_rate_limit_unavailable", { scope: "customer-login" });
      return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
    if (!limit.allowed) {
      console.warn("security.auth_rate_limit.activated", { scope: "customer-login" });
      return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    }

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer?.passwordHash || !(await bcrypt.compare(password, customer.passwordHash))) {
      return NextResponse.json(
        { error: "Email or password is incorrect. You can also sign in with an email code." },
        { status: 401 }
      );
    }

    await createSession(customer.id, "customer");
    await clearAuthRequestRateLimit("customer-login", email);
    return NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
    });
  } catch (error) {
    logServerError("security.auth.login.failed", error);
    return NextResponse.json({ error: "Unable to sign in right now. Please try again." }, { status: 500 });
  }
}
