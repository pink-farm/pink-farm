import { resolveAdminEmail } from "@/lib/admin-identity.mjs";

// Use the store owner's address by default; deployments can override it with ADMIN_EMAIL.
export const ADMIN_EMAIL = resolveAdminEmail(process.env.ADMIN_EMAIL, process.env.NODE_ENV);
