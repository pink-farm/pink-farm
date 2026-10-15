import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { ADMIN_EMAIL } from "@/lib/auth-constants";
export { ADMIN_EMAIL } from "@/lib/auth-constants";

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_JWT_SECRET || (process.env.NODE_ENV === "development" ? "local-development-only-change-me-32-chars" : "");
  if (secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export const ADMIN_COOKIE_NAME = "admin_session";
export const CUSTOMER_COOKIE_NAME = "customer_session";
const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60; // 365 days persistent until logout

export async function encrypt(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getEncodedKey());
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(sessionValue?: string, cookieName: string = ADMIN_COOKIE_NAME) {
  const cookieStore = await cookies();
  const session = sessionValue ?? cookieStore.get(cookieName)?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function createSession(userId: string, role: "admin" | "customer") {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await encrypt({ userId, role, ...(role === "admin" ? { email: ADMIN_EMAIL } : {}), expiresAt: expiresAt.toISOString() });
  const cookieStore = await cookies();
  const cookieName = role === "admin" ? ADMIN_COOKIE_NAME : CUSTOMER_COOKIE_NAME;

  cookieStore.set(cookieName, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_SECONDS,
    sameSite: "lax",
    path: "/",
  });
}

export async function getCustomerSession(sessionValue?: string) {
  if (sessionValue) {
    const payload = await decrypt(sessionValue);
    if (payload?.role === "customer" && typeof payload.userId === "string") {
      return payload;
    }
  }

  const cookieStore = await cookies();
  // Check customer_session first
  const custVal = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (custVal) {
    const payload = await decrypt(custVal);
    if (payload?.role === "customer" && typeof payload.userId === "string") {
      return payload;
    }
  }

  // Fallback to legacy admin_session if role was customer
  const legacyVal = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (legacyVal) {
    const payload = await decrypt(legacyVal);
    if (payload?.role === "customer" && typeof payload.userId === "string") {
      return payload;
    }
  }

  return null;
}

export async function requireAdminSession() {
  const session = await getSession(undefined, ADMIN_COOKIE_NAME);
  return session?.role === "admin" && session.email === ADMIN_EMAIL && typeof session.userId === "string" ? session : null;
}

export async function deleteSession(role?: "admin" | "customer") {
  const cookieStore = await cookies();
  if (role === "admin") {
    cookieStore.delete(ADMIN_COOKIE_NAME);
  } else if (role === "customer") {
    cookieStore.delete(CUSTOMER_COOKIE_NAME);
  } else {
    cookieStore.delete(ADMIN_COOKIE_NAME);
    cookieStore.delete(CUSTOMER_COOKIE_NAME);
  }
}
