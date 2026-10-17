import { createHmac, randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getTrustedClientIp } from "@/lib/request-security.mjs";

/** Shared MongoDB-backed fixed-window limiter for authentication endpoints. */
export async function consumeAuthRateLimit(scope: string, identity: string, limit: number, windowMs: number) {
  const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "local-development-only-change-me-32-chars" : "");
  if (secret.length < 32) throw new Error("Authentication rate limiting requires SESSION_SECRET.");

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
  if (!bucket) throw new Error("Could not initialize authentication rate limit.");

  if (bucket.resetAt <= now) {
    const reset = await prisma.authRateLimit.updateMany({
      where: { id: bucket.id, resetAt: { lte: now } },
      data: { count: 1, resetAt },
    });
    if (reset.count === 1) return { allowed: true, retryAfterSeconds: 0 };
    bucket = await prisma.authRateLimit.findUnique({ where: { key } });
    if (!bucket) throw new Error("Could not reload authentication rate limit.");
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
}

function rateLimitKey(scope: string, identity: string) {
  const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "local-development-only-change-me-32-chars" : "");
  if (secret.length < 32) throw new Error("Authentication rate limiting requires SESSION_SECRET.");
  return createHmac("sha256", secret).update(`${scope}:${identity.trim().toLowerCase()}`).digest("hex");
}

export async function consumeAuthRequestRateLimit(request: Request, scope: string, identity: string, identityLimit: number, windowMs: number, ipLimit: number) {
  const identityResult = await consumeAuthRateLimit(`${scope}-identity`, identity, identityLimit, windowMs);
  if (!identityResult.allowed) return identityResult;

  const clientIp = getTrustedClientIp(request, process.env.VERCEL === "1");
  if (!clientIp) return identityResult;
  const ipResult = await consumeAuthRateLimit(`${scope}-ip`, clientIp, ipLimit, windowMs);
  if (!ipResult.allowed) return ipResult;
  return identityResult;
}

export async function clearAuthRequestRateLimit(scope: string, identity: string) {
  const identityKey = rateLimitKey(`${scope}-identity`, identity);
  await prisma.authRateLimit.deleteMany({ where: { key: identityKey } });
  // Keep the IP bucket intact; otherwise a successful account could reset the
  // shared source limit and permit password spraying from that address.
}

// Opportunistically remove old rows so arbitrary account identifiers cannot
// leave an unbounded trail of expired limiter records.
export async function pruneAuthRateLimits() {
  if (randomInt(0, 100) === 0) {
    await prisma.authRateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  }
}
