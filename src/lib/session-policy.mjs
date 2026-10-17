import { jwtVerify } from "jose";

export const ADMIN_SESSION_IDLE_TIMEOUT_SECONDS = 20 * 60;

export function nextAdminSessionIdleExpiry(expiresAtSeconds, nowMs = Date.now()) {
  if (!Number.isFinite(expiresAtSeconds)) return null;
  const expiryMs = Math.min(
    nowMs + ADMIN_SESSION_IDLE_TIMEOUT_SECONDS * 1000,
    expiresAtSeconds * 1000,
  );
  return expiryMs > nowMs ? new Date(expiryMs) : null;
}

export async function verifySessionToken(token, secret) {
  if (typeof token !== "string" || token.length === 0 || !secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: "pink-farm",
      audience: "pink-farm-session",
    });
    return payload;
  } catch {
    return null;
  }
}

export function isAdminSession(payload, adminEmail) {
  return Boolean(
    payload && payload.role === "admin" && payload.email === adminEmail &&
    typeof payload.userId === "string" && typeof payload.jti === "string" && payload.jti.length > 0
  );
}

export function isCustomerSession(payload) {
  return Boolean(
    payload && payload.role === "customer" && typeof payload.userId === "string" &&
    typeof payload.jti === "string" && payload.jti.length > 0
  );
}

export function customerOwnsResource(sessionUserId, resourceOwnerId) {
  return typeof sessionUserId === "string" && sessionUserId.length > 0 && sessionUserId === resourceOwnerId;
}

export function isPublicOrderReference(orderNumber) {
  return typeof orderNumber === "string" && /^PF-\d{4}-[A-F0-9]{32}$/i.test(orderNumber);
}

export function canAccessOrderReference(orderNumber, sessionUserId, resourceOwnerId) {
  return isPublicOrderReference(orderNumber) || customerOwnsResource(sessionUserId, resourceOwnerId);
}
