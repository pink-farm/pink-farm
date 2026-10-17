const LEGACY_DEVELOPMENT_ADMIN_EMAIL = "pinkfarmofficial@gmail.com";

export function resolveAdminEmail(configuredEmail, nodeEnv) {
  const normalized = typeof configuredEmail === "string" ? configuredEmail.trim().toLowerCase() : "";
  if (normalized) return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
  return nodeEnv === "development" || nodeEnv === undefined ? LEGACY_DEVELOPMENT_ADMIN_EMAIL : "";
}
