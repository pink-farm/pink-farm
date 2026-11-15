import { NextResponse, connection } from "next/server";
import { prisma, resolveDatabaseUrl } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/auth";

export async function GET() {
  await connection();
  const rawEnv = process.env.DATABASE_URL;
  const resolved = resolveDatabaseUrl();
  const result: Record<string, unknown> = {
    status: "ok",
    nodeVersion: process.version,
    platform: process.platform,
    envDatabaseUrlSet: Boolean(rawEnv),
    envDatabaseUrlType: rawEnv ? (rawEnv.startsWith("mongodb+srv") ? "srv" : "direct") : "none",
    resolvedUrlType: resolved.startsWith("mongodb+srv") ? "srv" : "direct",
    envSessionSecretSet: Boolean(process.env.SESSION_SECRET),
    adminEmail: ADMIN_EMAIL,
  };

  try {
    const startTime = Date.now();
    const adminCount = await prisma.adminUser.count();
    result.databaseConnected = true;
    result.adminCount = adminCount;
    result.latencyMs = Date.now() - startTime;
  } catch (error) {
    result.databaseConnected = false;
    result.databaseError = error instanceof Error ? error.message : String(error);
    result.databaseErrorCode = error && typeof error === "object" && "code" in error ? (error as { code: unknown }).code : undefined;
  }

  return NextResponse.json(result);
}
