import { PrismaClient } from "@prisma/client";

const DB_QUERY_TIMEOUT_MS = 8_000;
const DB_RETRY_COOLDOWN_MS = 3_000;
let databaseUnavailableUntil = 0;
let lastDatabaseWarningAt = 0;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// During development a hot reload can retain a client generated from an older
// Prisma schema. Recreate it when the generated client lacks the current models.
const cachedPrisma = globalForPrisma.prisma as (PrismaClient & { coupon?: unknown }) | undefined;
export const prisma =
  (cachedPrisma?.coupon ? cachedPrisma : undefined) ??
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

export async function queryDatabase<T>(operation: () => Promise<T>): Promise<T> {
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
          DB_QUERY_TIMEOUT_MS,
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
