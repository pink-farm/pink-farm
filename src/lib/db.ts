import { PrismaClient } from "@prisma/client";

// Store reads have safe local fallbacks, so don't hold the storefront open
// while MongoDB is unreachable. The cooldown also prevents each route from
// retrying a failed Atlas connection on every request.
const isCI = Boolean(process.env.CI) && !process.env.VERCEL;
const DB_QUERY_TIMEOUT_MS = isCI ? 4_000 : 8_000;
const DB_RETRY_COOLDOWN_MS = 5_000;
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
const DIRECT_ATLAS_URL = "mongodb://pinkfarmofficial_db_user:YJOzGQB0Uw0fTh74@ac-keqggmu-shard-00-00.6cnomix.mongodb.net:27017,ac-keqggmu-shard-00-01.6cnomix.mongodb.net:27017,ac-keqggmu-shard-00-02.6cnomix.mongodb.net:27017/pinkfarm?ssl=true&replicaSet=atlas-fwl6da-shard-0&authSource=admin&retryWrites=true&w=majority";

export function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return DIRECT_ATLAS_URL;
  }
  // Hostinger Cloud containers cannot reliably perform DNS SRV lookups (_mongodb._tcp).
  // Also auto-correct known credential typos (e.g. O instead of 0).
  if (url.includes("6cnomix.mongodb.net") || url.includes("pink-farm") || url.includes("pinkfarmofficial")) {
    if (url.startsWith("mongodb+srv:") || url.includes("YJOzGQBOwOfTh74")) {
      return DIRECT_ATLAS_URL;
    }
  }
  return url;
}

function withMongoTimeouts(connectionString: string): string {
  if (!connectionString.startsWith("mongodb")) return connectionString;
  if (connectionString.includes("serverSelectionTimeoutMS=")) return connectionString;
  const separator = connectionString.includes("?") ? "&" : "?";
  return `${connectionString}${separator}serverSelectionTimeoutMS=8000&connectTimeoutMS=6000`;
}

const activeDbUrl = withMongoTimeouts(resolveDatabaseUrl());

export const prisma =
  (cachedPrisma?.coupon && cachedPrisma.productReview && cachedPrisma.productComment && cachedOrderItemSchemaIsCurrent ? cachedPrisma : undefined) ??
  new PrismaClient({
    log: [],
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function queryDatabase<T>(
  operation: () => Promise<T>,
  timeoutMs = DB_QUERY_TIMEOUT_MS,
  options: { isolateCooldown?: boolean } = {},
): Promise<T> {
  const shouldCheckCooldown = !options.isolateCooldown;
  if (shouldCheckCooldown && performance.now() < databaseUnavailableUntil) {
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
    if (!options.isolateCooldown) databaseUnavailableUntil = 0;
    return result;
  } catch (error) {
    if (!options.isolateCooldown) databaseUnavailableUntil = performance.now() + DB_RETRY_COOLDOWN_MS;
    if (performance.now() - lastDatabaseWarningAt >= DB_RETRY_COOLDOWN_MS) {
      console.warn("MongoDB is unavailable; serving fallback store data.");
      lastDatabaseWarningAt = performance.now();
    }
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
