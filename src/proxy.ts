import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminSession, verifySessionToken } from "@/lib/session-policy.mjs";
import { ADMIN_EMAIL } from "@/lib/auth-constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "local-development-only-change-me-32-chars" : "");
  const token = request.cookies.get("admin_session")?.value;
  if (secret && secret.length >= 32 && token) {
    const payload = await verifySessionToken(token, new TextEncoder().encode(secret));
    if (ADMIN_EMAIL && isAdminSession(payload, ADMIN_EMAIL)) {
      return NextResponse.next();
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
