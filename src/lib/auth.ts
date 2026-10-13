import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_JWT_SECRET || (process.env.NODE_ENV === "development" ? "local-development-only-change-me-32-chars" : "");
  if (secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
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

export async function getSession(sessionValue?: string) {
  const session = sessionValue ?? (await cookies()).get("admin_session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function createSession(userId: string, role: "admin" | "customer") {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, role, expiresAt });
  const cookieStore = await cookies();
  
  cookieStore.set("admin_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    maxAge: 7 * 24 * 60 * 60,
    sameSite: "lax",
    path: "/",
  });
}

export async function getCustomerSession(sessionValue?: string) {
  const session = await getSession(sessionValue);
  return session?.role === "customer" && typeof session.userId === "string" ? session : null;
}

export async function requireAdminSession() {
  const session = await getSession();
  return session?.role === "admin" && typeof session.userId === "string" ? session : null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}
