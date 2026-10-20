import { PrismaClient } from "@prisma/client";

// Store reads have safe local fallbacks, so don't hold the storefront open
// while MongoDB is unreachable. The cooldown also prevents each route from
// retrying a failed Atlas connection on every request.
const DB_QUERY_TIMEOUT_MS = 2_000;
const DB_RETRY_COOLDOWN_MS = 30_000;
let databaseUnavailableUntil = 0;
let lastDatabaseWarningAt = 0;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

type CachedPrismaSchema = PrismaClient & {
  coupon?: unknown;
  productReview?: unknown;
  productComment?: unknown;
  _runtimeDataModel?: {
    models?: Record<string, { fields?: Array<{ name: string; isRequired: boolean }> }>;
  };
};

// During development a hot reload can retain a client generated from an older
// Prisma schema. Recreate it when the generated client lacks current models or
// the nullable product snapshot fields used to preserve order history on delete.
const cachedPrisma = globalForPrisma.prisma as CachedPrismaSchema | undefined;
const cachedOrderItemFields = cachedPrisma?._runtimeDataModel?.models?.OrderItem?.fields;
const cachedOrderItemSchemaIsCurrent = Boolean(
  cachedOrderItemFields?.some((field) => field.name === "productName") &&
    cachedOrderItemFields?.some((field) => field.name === "productSlug") &&
    cachedOrderItemFields?.some((field) => field.name === "productImageUrl") &&
    cachedOrderItemFields?.some((field) => field.name === "productId" && !field.isRequired),
);
export const prisma =
  (cachedPrisma?.coupon && cachedPrisma.productReview && cachedPrisma.productComment && cachedOrderItemSchemaIsCurrent ? cachedPrisma : undefined) ??
  new PrismaClient({
    log: [],
    ...(process.env.DATABASE_URL
      ? {
          datasources: {
            db: {
              // Keep pages responsive when Atlas is unreachable; MongoDB's default
              // server selection timeout is 30 seconds per query.
              url: withMongoTimeouts(process.env.DATABASE_URL),
            },
          },
        }
      : {}),
  });

function withMongoTimeouts(connectionString: string): string {
  if (!connectionString.startsWith("mongodb")) return connectionString;

  try {
    const url = new URL(connectionString);
    if (!url.searchParams.has("serverSelectionTimeoutMS")) {
      url.searchParams.set("serverSelectionTimeoutMS", "4000");
    }
    if (!url.searchParams.has("connectTimeoutMS")) {
      url.searchParams.set("connectTimeoutMS", "3000");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function queryDatabase<T>(operation: () => Promise<T>, timeoutMs = DB_QUERY_TIMEOUT_MS): Promise<T> {
  if (performance.now() < databaseUnavailableUntil) {
    throw new Error("Database is temporarily unavailable");
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Database query timed out")),
          timeoutMs,
        );
      }),
    ]);
    databaseUnavailableUntil = 0;
    return result;
  } catch (error) {
    databaseUnavailableUntil = performance.now() + DB_RETRY_COOLDOWN_MS;
    if (performance.now() - lastDatabaseWarningAt >= DB_RETRY_COOLDOWN_MS) {
      console.warn("MongoDB is unavailable; serving fallback store data.");
      lastDatabaseWarningAt = performance.now();
    }
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
