import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import {
  comboQuantityQualifies,
  getTrustedClientIp,
  getComboDiscountPercent,
  isSameOriginMutation,
  isValidCheckoutQuantity,
  parseGeocodeCoordinates,
  readBoundedJson,
} from "../src/lib/request-security.mjs";
import { ADMIN_SESSION_IDLE_TIMEOUT_SECONDS, canAccessOrderReference, customerOwnsResource, isAdminSession, isCustomerSession, isPublicOrderReference, nextAdminSessionIdleExpiry, verifySessionToken } from "../src/lib/session-policy.mjs";
import { AdminProductInputError, classifyAdminProductError } from "../src/lib/admin-product-errors.mjs";
import { logServerError } from "../src/lib/server-log.mjs";
import { getCouponInputErrorMessage } from "../src/lib/admin-coupon-errors.mjs";
import { resolveAdminEmail } from "../src/lib/admin-identity.mjs";
import { classifyRazorpayOrderError, getRazorpayErrorDiagnostics } from "../src/lib/razorpay-errors.mjs";
import { readFile } from "node:fs/promises";
import { verifyRazorpayWebhookSignature } from "../src/lib/razorpay-webhook.mjs";
import { createHmac } from "node:crypto";

test("same-origin writes are allowed and cross-origin browser writes are rejected", () => {
  assert.equal(isSameOriginMutation(new Request("https://shop.example/api", { method: "POST", headers: { origin: "https://shop.example" } })), true);
  assert.equal(isSameOriginMutation(new Request("https://shop.example/api", { method: "POST", headers: { origin: "https://attacker.example" } })), false);
  assert.equal(isSameOriginMutation(new Request("http://localhost/api", { method: "POST", headers: { host: "shop.example", origin: "http://shop.example" } })), true);
  assert.equal(isSameOriginMutation(new Request("https://shop.example/api", { method: "POST", headers: { "sec-fetch-site": "cross-site" } })), false);
  assert.equal(isSameOriginMutation(new Request("https://shop.example/api", { method: "POST" })), true);
  assert.equal(getTrustedClientIp(new Request("https://shop.example/api", { headers: { "x-forwarded-for": "203.0.113.8" } }), true), "203.0.113.8");
  assert.equal(getTrustedClientIp(new Request("https://shop.example/api", { headers: { "x-forwarded-for": "203.0.113.8" } }), false), null);
  assert.equal(getTrustedClientIp(new Request("https://shop.example/api", { headers: { "x-forwarded-for": "attacker-value" } }), true), null);
});

test("checkout quantities accept only bounded positive integers", () => {
  assert.equal(isValidCheckoutQuantity(1), true);
  assert.equal(isValidCheckoutQuantity(20), true);
  for (const quantity of [0, -1, 21, 1.5, "2", NaN]) assert.equal(isValidCheckoutQuantity(quantity), false);
});

test("geocode coordinates must be numeric, bounded, and short", () => {
  assert.deepEqual(parseGeocodeCoordinates("90", "-180"), { latitude: 90, longitude: -180 });
  assert.deepEqual(parseGeocodeCoordinates("-90", "180"), { latitude: -90, longitude: 180 });
  for (const pair of [[null, "0"], ["", "0"], ["91", "0"], ["0", "-181"], ["NaN", "0"], ["0", "1&format=xml"], ["1".repeat(33), "0"]]) {
    assert.equal(parseGeocodeCoordinates(...pair), null);
  }
});

test("JSON request bodies enforce content type, syntax, and declared and streamed size limits", async () => {
  const jsonHeaders = { "content-type": "application/json" };
  assert.deepEqual(await readBoundedJson(new Request("https://shop.example/api", { method: "POST", headers: jsonHeaders, body: '{"ok":true}' }), 32), { ok: true, value: { ok: true } });
  assert.deepEqual(await readBoundedJson(new Request("https://shop.example/api", { method: "POST", body: "{}" }), 32), { ok: false, status: 415, error: "Content-Type must be application/json." });
  assert.deepEqual(await readBoundedJson(new Request("https://shop.example/api", { method: "POST", headers: jsonHeaders, body: "{" }), 32), { ok: false, status: 400, error: "Request body must contain valid JSON." });
  assert.deepEqual(await readBoundedJson(new Request("https://shop.example/api", { method: "POST", headers: { ...jsonHeaders, "content-length": "100" }, body: "{}" }), 16), { ok: false, status: 413, error: "Request body is too large." });
  assert.deepEqual(await readBoundedJson(new Request("https://shop.example/api", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ value: "x".repeat(128) }) }), 16), { ok: false, status: 413, error: "Request body is too large." });
});

test("combo discounts require exact server-recognized labels and minimum quantities", () => {
  assert.equal(getComboDiscountPercent("Combo 11% OFF"), 11);
  assert.equal(getComboDiscountPercent("Combo 15% OFF"), 15);
  assert.equal(getComboDiscountPercent("Combo 90% OFF"), null);
  assert.equal(getComboDiscountPercent("Combo 22% OFF", [22]), 22);
  assert.equal(getComboDiscountPercent("Combo 90% OFF", [90]), 90);
  assert.equal(getComboDiscountPercent("Combo 96% OFF", [96]), null);
  assert.equal(getComboDiscountPercent("Combo 22% OFF", [11, 15]), null);
  assert.equal(getComboDiscountPercent("Combo 11% OFF "), null);
  assert.equal(comboQuantityQualifies(11, 3), true);
  assert.equal(comboQuantityQualifies(11, 2), false);
  assert.equal(comboQuantityQualifies(15, 5), true);
  assert.equal(comboQuantityQualifies(15, 4), false);
  assert.equal(comboQuantityQualifies(22, 4, 4), true);
  assert.equal(comboQuantityQualifies(22, 3, 4), false);
});

test("signed sessions require the expected algorithm, issuer, audience, expiry, role, and purpose claims", async () => {
  const secret = new TextEncoder().encode("unit-test-only-session-signing-secret");
  const validAdmin = await new SignJWT({ userId: "admin-id", role: "admin", email: "owner@example.com" })
    .setProtectedHeader({ alg: "HS256" }).setIssuer("pink-farm").setAudience("pink-farm-session")
    .setJti("admin-session-id").setIssuedAt().setExpirationTime("5m").sign(secret);
  const validCustomer = await new SignJWT({ userId: "customer-a", role: "customer" })
    .setProtectedHeader({ alg: "HS256" }).setIssuer("pink-farm").setAudience("pink-farm-session")
    .setJti("customer-session-id").setIssuedAt().setExpirationTime("5m").sign(secret);
  const expired = await new SignJWT({ userId: "admin-id", role: "admin", email: "owner@example.com" })
    .setProtectedHeader({ alg: "HS256" }).setIssuer("pink-farm").setAudience("pink-farm-session")
    .setJti("expired-session-id").setIssuedAt().setExpirationTime("-1s").sign(secret);

  const adminPayload = await verifySessionToken(validAdmin, secret);
  const customerPayload = await verifySessionToken(validCustomer, secret);
  assert.equal(isAdminSession(adminPayload, "owner@example.com"), true);
  assert.equal(isAdminSession(adminPayload, "other@example.com"), false);
  assert.equal(isAdminSession(customerPayload, "owner@example.com"), false);
  assert.equal(isCustomerSession(customerPayload), true);
  assert.equal(await verifySessionToken(expired, secret), null);
  assert.equal(await verifySessionToken(validAdmin, new TextEncoder().encode("too-short")), null);
});

test("customer ownership checks reject another customer's resource", () => {
  assert.equal(customerOwnsResource("customer-a", "customer-a"), true);
  assert.equal(customerOwnsResource("customer-a", "customer-b"), false);
  assert.equal(customerOwnsResource(undefined, "customer-a"), false);
});

test("administrator idle expiry is capped at 20 minutes and never exceeds the absolute session expiry", () => {
  const now = 1_800_000_000_000;
  const withinIdleWindow = nextAdminSessionIdleExpiry((now + 60 * 60 * 1000) / 1000, now);
  assert.equal(withinIdleWindow?.getTime(), now + ADMIN_SESSION_IDLE_TIMEOUT_SECONDS * 1000);

  const nearAbsoluteExpiry = nextAdminSessionIdleExpiry((now + 5_000) / 1000, now);
  assert.equal(nearAbsoluteExpiry?.getTime(), now + 5_000);

  assert.equal(nextAdminSessionIdleExpiry((now - 1) / 1000, now), null);
});

test("product API errors expose only input and conflict messages, never internal exception details", () => {
  assert.deepEqual(classifyAdminProductError(new AdminProductInputError("Name is required.")), {
    status: 400,
    message: "Name is required.",
  });
  assert.deepEqual(classifyAdminProductError(new SyntaxError("unexpected token at private path")), {
    status: 400,
    message: "Product data must be valid JSON.",
  });
  assert.deepEqual(classifyAdminProductError({ code: "P2002", message: "internal unique index detail" }), {
    status: 409,
    message: "That slug or SKU is already in use.",
  });
  assert.deepEqual(classifyAdminProductError(new Error("DATABASE_URL or database internals")), {
    status: 500,
    message: "Could not save product.",
  });
});

test("server error logs omit exception messages and unsafe event names", () => {
  const originalError = console.error;
  const captured = [];
  console.error = (...args) => captured.push(args);
  try {
    logServerError("security.checkout.failed", new Error("customer phone and secret details"));
    logServerError("bad event with customer input", { code: "P2002", message: "private database detail" });
  } finally {
    console.error = originalError;
  }
  assert.deepEqual(captured, [
    ["security.checkout.failed", { errorType: "Error" }],
    ["security.internal_error", { errorType: "UnknownError", code: "P2002" }],
  ]);
});

test("Razorpay failures log only safe provider diagnostics and map auth, outage, and request errors accurately", () => {
  const authFailure = { statusCode: 401, error: { code: "BAD_REQUEST_ERROR", description: "private message" }, message: "secret data" };
  assert.deepEqual(getRazorpayErrorDiagnostics(authFailure), { statusCode: 401, code: "BAD_REQUEST_ERROR" });
  assert.deepEqual(classifyRazorpayOrderError(authFailure), {
    status: 503,
    code: "PAYMENT_CONFIGURATION_ERROR",
    message: "Online payments are temporarily unavailable. Please contact the store.",
  });
  assert.equal(classifyRazorpayOrderError({ statusCode: 503 }).status, 503);
  assert.equal(classifyRazorpayOrderError({ statusCode: 429 }).code, "PAYMENT_PROVIDER_UNAVAILABLE");
  assert.equal(classifyRazorpayOrderError({ statusCode: 400 }).status, 502);
  assert.deepEqual(getRazorpayErrorDiagnostics({ statusCode: 999, code: "private data" }), {});
});

test("production CSP explicitly permits Razorpay Checkout without a wildcard script source", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /script-src[^`]*https:\/\/checkout\.razorpay\.com/);
  assert.doesNotMatch(config, /script-src[^`]*\*/);
  assert.match(config, /connect-src 'self' https:\/\/api\.razorpay\.com https:\/\/checkout\.razorpay\.com https:\/\/api\.postalpincode\.in/);
  assert.doesNotMatch(config, /connect-src[^`]*https:\s*;/);
});

test("Razorpay webhook signature checks the exact raw body and rejects malformed signatures", () => {
  const body = '{"event":"payment.captured"}';
  const secret = "test-webhook-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyRazorpayWebhookSignature(body, signature, secret), true);
  assert.equal(verifyRazorpayWebhookSignature(`${body} `, signature, secret), false);
  assert.equal(verifyRazorpayWebhookSignature(body, "bad", secret), false);
  assert.equal(verifyRazorpayWebhookSignature(body, signature, ""), false);
});

test("coupon APIs expose only exact known validation messages", () => {
  assert.equal(getCouponInputErrorMessage(new Error("Coupon code must be 3–32 letters, numbers, dashes, or underscores.")), "Coupon code must be 3–32 letters, numbers, dashes, or underscores.");
  assert.equal(getCouponInputErrorMessage(new Error("Coupon code internal database detail")), null);
  assert.equal(getCouponInputErrorMessage(new Error("Unexpected database failure")), null);
});

test("administrator identity defaults to the store owner when configuration is omitted", () => {
  assert.equal(resolveAdminEmail(" Owner@Example.com ", "production"), "owner@example.com");
  assert.equal(resolveAdminEmail("not-an-email", "production"), "");
  assert.equal(resolveAdminEmail("x".repeat(255) + "@example.com", "production"), "");
  assert.equal(resolveAdminEmail(undefined, "development"), "pinkfarmofficial@gmail.com");
  assert.equal(resolveAdminEmail(undefined, undefined), "pinkfarmofficial@gmail.com");
  assert.equal(resolveAdminEmail(undefined, "production"), "pinkfarmofficial@gmail.com");
  assert.equal(resolveAdminEmail(undefined, "test"), "pinkfarmofficial@gmail.com");
});

test("public order references require at least 128 bits of random identifier", () => {
  assert.equal(isPublicOrderReference("PF-2026-0123456789ABCDEF0123456789ABCDEF"), true);
  assert.equal(isPublicOrderReference("PF-2026-01234567"), false);
  assert.equal(canAccessOrderReference("PF-2026-01234567", "customer-a", "customer-b"), false);
  assert.equal(canAccessOrderReference("PF-2026-01234567", "customer-a", "customer-a"), true);
});
