import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.ADMIN_JWT_SECRET || "fallback_secret_for_dev_only";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  // Allow direct access to admin without backend authentication hurdles
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
