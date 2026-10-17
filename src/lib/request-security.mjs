import { isIP } from "node:net";

/** Reject browser requests initiated by a different origin. Requests without browser-origin metadata remain supported for trusted server clients. */
export function isSameOriginMutation(request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const requestUrl = new URL(request.url);
    const requestHost = request.headers.get("host");
    const expectedOrigin = requestHost ? `${requestUrl.protocol}//${requestHost}` : requestUrl.origin;
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

export function parseGeocodeCoordinates(latitude, longitude) {
  if (
    typeof latitude !== "string" ||
    typeof longitude !== "string" ||
    latitude.length === 0 ||
    longitude.length === 0 ||
    latitude.length > 32 ||
    longitude.length > 32
  ) return null;

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (
    !Number.isFinite(parsedLatitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    !Number.isFinite(parsedLongitude) ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) return null;

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

export async function readBoundedJson(request, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new RangeError("maxBytes must be a positive safe integer.");
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, status: 415, error: "Content-Type must be application/json." };

  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) return { ok: false, status: 400, error: "Content-Length is invalid." };
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length)) return { ok: false, status: 400, error: "Content-Length is invalid." };
    if (length > maxBytes) return { ok: false, status: 413, error: "Request body is too large." };
  }

  if (!request.body) return { ok: false, status: 400, error: "A JSON request body is required." };
  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try { await reader.cancel(); } catch {}
        return { ok: false, status: 413, error: "Request body is too large." };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    try { await reader.cancel(); } catch {}
    return { ok: false, status: 400, error: "Request body must contain valid JSON." };
  } finally {
    reader.releaseLock();
  }
}

export function isValidCheckoutQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 20;
}

export function getTrustedClientIp(request, trustedVercelProxy) {
  if (!trustedVercelProxy) return null;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return null;
  const clientIp = forwardedFor.split(",", 1)[0].trim();
  return isIP(clientIp) ? clientIp : null;
}

export function getComboDiscountPercent(label, allowedDiscounts = [11, 15]) {
  if (typeof label !== "string") return null;
  const match = /^Combo (\d{1,2})% OFF$/.exec(label);
  if (!match) return null;
  const discount = Number(match[1]);
  return discount >= 1 && discount <= 95 && allowedDiscounts.includes(discount) ? discount : null;
}

export function comboQuantityQualifies(percent, quantity, requiredQuantity) {
  const minimum = requiredQuantity ?? (percent === 11 ? 3 : percent === 15 ? 5 : Number.POSITIVE_INFINITY);
  return Number.isInteger(minimum) && minimum >= 1 && quantity >= minimum;
}
