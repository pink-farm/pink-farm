const DEFAULT_ADMIN_EMAIL = "pinkfarmofficial@gmail.com";

export function resolveAdminEmail(configuredEmail, nodeEnv) {
  const normalized = typeof configuredEmail === "string" ? configuredEmail.trim().toLowerCase() : "";
  if (normalized) return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
  // Keep the store owner identity available when a deployment omits ADMIN_EMAIL.
  // Authentication still requires the matching seeded admin record and password.
  return DEFAULT_ADMIN_EMAIL;
}
