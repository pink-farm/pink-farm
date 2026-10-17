import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_EMAIL, createSession } from "@/lib/auth";
import bcrypt from "bcrypt";
import { clearAuthRequestRateLimit, consumeAuthRequestRateLimit, pruneAuthRateLimits } from "@/lib/rate-limit";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    const parsed = await readBoundedJson(request, 4_096);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.value;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    }
    const { password } = body as Record<string, unknown>;
    if (typeof password !== "string" || password.length > 128 || !password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    }
    if (!ADMIN_EMAIL) return NextResponse.json({ error: "Administrator sign-in is not configured." }, { status: 503 });
    let limit;
    try {
      limit = await consumeAuthRequestRateLimit(request, "admin-login", ADMIN_EMAIL, 8, 15 * 60_000, 20);
      await pruneAuthRateLimits();
    } catch {
      console.error("security.auth_rate_limit_unavailable", { scope: "admin-login" });
      return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
    if (!limit.allowed) {
      console.warn("security.auth_rate_limit.activated", { scope: "admin-login" });
      return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    }
    const user = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.warn("security.admin_login.failed");
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    await createSession(user.id, "admin");
    await clearAuthRequestRateLimit("admin-login", ADMIN_EMAIL);
    console.info("security.admin_login.succeeded");
    return NextResponse.json({ success: true });
  } catch {
    console.error("security.admin_login.error");
    return NextResponse.json({ error: "Unable to sign in right now. Please try again." }, { status: 500 });
  }
}
