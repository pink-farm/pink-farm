import { createHmac, randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getTrustedClientIp } from "@/lib/request-security.mjs";

const DEFAULT_SESSION_SECRET = "jEnN6VuJ_oZhhOGp1hk5clXsZEL6dNS1WErW_qp70hX6eKGEpopbXw_qb-nXw1gg";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "development") return "local-development-only-change-me-32-chars";
  return DEFAULT_SESSION_SECRET;
}

/** Shared MongoDB-backed fixed-window limiter for authentication endpoints. */
export async function consumeAuthRateLimit(scope: string, identity: string, limit: number, windowMs: number) {
  try {
    const secret = getSessionSecret();
    const key = createHmac("sha256", secret).update(`${scope}:${identity.trim().toLowerCase()}`).digest("hex");
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);
    let bucket = await prisma.authRateLimit.findUnique({ where: { key } });

    if (!bucket) {
      try {
        bucket = await prisma.authRateLimit.create({ data: { key, count: 1, resetAt } });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
        bucket = await prisma.authRateLimit.findUnique({ where: { key } });
      }
    }
    if (!bucket) return { allowed: true, retryAfterSeconds: 0 };

    if (bucket.resetAt <= now) {
      const reset = await prisma.authRateLimit.updateMany({
        where: { id: bucket.id, resetAt: { lte: now } },
        data: { count: 1, resetAt },
      });
      if (reset.count === 1) return { allowed: true, retryAfterSeconds: 0 };
      bucket = await prisma.authRateLimit.findUnique({ where: { key } });
      if (!bucket) return { allowed: true, retryAfterSeconds: 0 };
    }

    if (bucket.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)) };
    const updated = await prisma.authRateLimit.updateMany({
      where: { id: bucket.id, resetAt: { gt: now }, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });
    if (updated.count === 1) return { allowed: true, retryAfterSeconds: 0 };

    bucket = await prisma.authRateLimit.findUnique({ where: { key } });
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(((bucket?.resetAt ?? resetAt).getTime() - now.getTime()) / 1000)),
    };
  } catch (error) {
    console.error("security.rate_limit_bypass_on_failure", { scope, error: error instanceof Error ? error.message : String(error) });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

function rateLimitKey(scope: string, identity: string) {
  const secret = getSessionSecret();
  return createHmac("sha256", secret).update(`${scope}:${identity.trim().toLowerCase()}`).digest("hex");
}

export async function consumeAuthRequestRateLimit(request: Request, scope: string, identity: string, identityLimit: number, windowMs: number, ipLimit: number) {
  try {
    const identityResult = await consumeAuthRateLimit(`${scope}-identity`, identity, identityLimit, windowMs);
    if (!identityResult.allowed) return identityResult;

    const isTrustedProxy = process.env.VERCEL === "1" || process.env.TRUST_PROXY === "1" || process.env.NODE_ENV === "production";
    const clientIp = getTrustedClientIp(request, isTrustedProxy);
    if (!clientIp) return identityResult;
    const ipResult = await consumeAuthRateLimit(`${scope}-ip`, clientIp, ipLimit, windowMs);
    if (!ipResult.allowed) return ipResult;
    return identityResult;
  } catch (error) {
    console.error("security.auth_request_rate_limit_error", { scope, error: error instanceof Error ? error.message : String(error) });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export async function clearAuthRequestRateLimit(scope: string, identity: string) {
  try {
    const identityKey = rateLimitKey(`${scope}-identity`, identity);
    await prisma.authRateLimit.deleteMany({ where: { key: identityKey } });
  } catch {}
}

export async function pruneAuthRateLimits() {
  try {
    if (randomInt(0, 100) === 0) {
      await prisma.authRateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    }
  } catch {}
}
