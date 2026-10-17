import { resolveAdminEmail } from "@/lib/admin-identity.mjs";

// Keep the legacy owner convenience in development only. Preview and production
// fail closed until the intended administrator is explicitly configured.
export const ADMIN_EMAIL = resolveAdminEmail(process.env.ADMIN_EMAIL, process.env.NODE_ENV);
