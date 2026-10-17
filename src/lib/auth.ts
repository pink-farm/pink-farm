import { SignJWT, type JWTPayload } from "jose";
import { createHmac, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/auth-constants";
import { isAdminSession, isCustomerSession, nextAdminSessionIdleExpiry, verifySessionToken } from "@/lib/session-policy.mjs";
export { ADMIN_EMAIL } from "@/lib/auth-constants";

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "local-development-only-change-me-32-chars" : "");
  if (secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export const ADMIN_COOKIE_NAME = "admin_session";
export const CUSTOMER_COOKIE_NAME = "customer_session";
const CUSTOMER_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function sessionRevocationKey(jti: string) {
  return createHmac("sha256", getEncodedKey()).update(`revoked-session:${jti}`).digest("hex");
}

function adminSessionIdleKey(jti: string) {
  return createHmac("sha256", getEncodedKey()).update(`admin-session-idle:${jti}`).digest("hex");
}

async function touchAdminSession(payload: JWTPayload) {
  if (typeof payload.jti !== "string" || typeof payload.exp !== "number") return false;
  const now = new Date();
  const resetAt = nextAdminSessionIdleExpiry(payload.exp, now.getTime());
  if (!resetAt) return false;

  const key = adminSessionIdleKey(payload.jti);
  let record = await prisma.authRateLimit.findUnique({ where: { key }, select: { id: true, resetAt: true } });
  if (!record) {
    try {
      record = await prisma.authRateLimit.create({ data: { key, count: 0, resetAt }, select: { id: true, resetAt: true } });
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "P2002")) throw error;
      record = await prisma.authRateLimit.findUnique({ where: { key }, select: { id: true, resetAt: true } });
    }
  }
  if (!record || record.resetAt <= now) return false;

  const touched = await prisma.authRateLimit.updateMany({
    where: { id: record.id, resetAt: { gt: now } },
    data: { resetAt },
  });
  return touched.count === 1;
}

async function isSessionRevoked(payload: JWTPayload) {
  if (typeof payload.jti !== "string") return true;
  const record = await prisma.authRateLimit.findUnique({ where: { key: sessionRevocationKey(payload.jti) }, select: { id: true } });
  return Boolean(record);
}

export async function decrypt(session: string | undefined = "") {
  return verifySessionToken(session, getEncodedKey());
}

export async function getSession(sessionValue?: string, cookieName: string = ADMIN_COOKIE_NAME) {
  const cookieStore = await cookies();
  const session = sessionValue ?? cookieStore.get(cookieName)?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function createSession(userId: string, role: "admin" | "customer") {
  const maxAge = role === "admin" ? ADMIN_SESSION_MAX_AGE_SECONDS : CUSTOMER_SESSION_MAX_AGE_SECONDS;
  const expiresAt = new Date(Date.now() + maxAge * 1000);
  const expiresAtSeconds = Math.floor(expiresAt.getTime() / 1000);
  const session = await new SignJWT({ userId, role, ...(role === "admin" ? { email: ADMIN_EMAIL } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("pink-farm")
    .setAudience("pink-farm-session")
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(expiresAtSeconds)
    .sign(getEncodedKey());
  if (role === "admin") {
    const payload = await decrypt(session);
    if (!payload || !(await touchAdminSession(payload))) throw new Error("Could not initialize the administrator idle session.");
  }
  const cookieStore = await cookies();
  const cookieName = role === "admin" ? ADMIN_COOKIE_NAME : CUSTOMER_COOKIE_NAME;

  cookieStore.set(cookieName, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    maxAge,
    sameSite: "lax",
    path: "/",
  });
}

export async function getCustomerSession(sessionValue?: string) {
  if (sessionValue) {
    const payload = await decrypt(sessionValue);
    if (payload && isCustomerSession(payload) && !(await isSessionRevoked(payload))) return payload;
  }

  const cookieStore = await cookies();
  const customerValue = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (customerValue) {
    const payload = await decrypt(customerValue);
    if (payload && isCustomerSession(payload) && !(await isSessionRevoked(payload))) return payload;
  }

  return null;
}

export async function requireAdminSession() {
  const session = await getSession(undefined, ADMIN_COOKIE_NAME);
  let valid = session !== null && isAdminSession(session, ADMIN_EMAIL) && !(await isSessionRevoked(session));
  if (valid && session) {
    try {
      valid = await touchAdminSession(session);
    } catch {
      console.error("security.admin_session.activity_unavailable");
      valid = false;
    }
  }
  if (!valid) console.warn("security.admin_authorization.failed");
  return valid ? session : null;
}

export async function deleteSession(role?: "admin" | "customer") {
  const cookieStore = await cookies();
  const revokeAndDelete = async (cookieName: string) => {
    try {
      const value = cookieStore.get(cookieName)?.value;
      if (value) {
        const payload = await decrypt(value);
        if (typeof payload?.jti === "string" && typeof payload.exp === "number") {
          await prisma.authRateLimit.create({ data: { key: sessionRevocationKey(payload.jti), count: 1, resetAt: new Date(payload.exp * 1000) } }).catch(async (error: unknown) => {
            if (!(error instanceof Error && "code" in error && error.code === "P2002")) throw error;
          });
          console.info("security.session.revoked", { type: cookieName === ADMIN_COOKIE_NAME ? "admin" : "customer" });
        }
      }
    } finally {
      cookieStore.delete(cookieName);
    }
  };
  if (role === "admin") await revokeAndDelete(ADMIN_COOKIE_NAME);
  else if (role === "customer") await revokeAndDelete(CUSTOMER_COOKIE_NAME);
  else {
    await revokeAndDelete(ADMIN_COOKIE_NAME);
    await revokeAndDelete(CUSTOMER_COOKIE_NAME);
  }
}
