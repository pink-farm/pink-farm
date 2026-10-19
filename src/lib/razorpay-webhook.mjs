import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyRazorpayWebhookSignature(rawBody, signature, secret) {
  if (typeof rawBody !== "string" || typeof signature !== "string" || !/^[0-9a-f]{64}$/i.test(signature) || typeof secret !== "string" || secret.length === 0) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const supplied = Buffer.from(signature, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
