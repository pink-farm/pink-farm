import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

function getTokenSecret() {
  return process.env.SESSION_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
}

function sign(payload: string) {
  const secret = getTokenSecret();
  if (!secret) throw new Error("Payment token secret is not configured.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createCheckoutCancelToken(orderId: string, gatewayOrderId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;
  const payload = `${orderId}.${gatewayOrderId}.${expiresAt}`;
  return `${expiresAt}.${sign(payload)}`;
}

export function verifyCheckoutCancelToken(orderId: string, gatewayOrderId: string, token: unknown) {
  if (typeof token !== "string") return false;
  const [expiresAtText, suppliedSignature, extra] = token.split(".");
  if (!expiresAtText || !suppliedSignature || extra !== undefined || !/^\d{10}$/.test(expiresAtText)) return false;
  const expiresAt = Number(expiresAtText);
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt < now || expiresAt > now + TOKEN_LIFETIME_SECONDS + 60) return false;
  try {
    const expected = Buffer.from(sign(`${orderId}.${gatewayOrderId}.${expiresAt}`), "base64url");
    const supplied = Buffer.from(suppliedSignature, "base64url");
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  } catch {
    return false;
  }
}
