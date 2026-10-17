import type { JWTPayload } from "jose";
export const ADMIN_SESSION_IDLE_TIMEOUT_SECONDS: number;
export function nextAdminSessionIdleExpiry(expiresAtSeconds: number, nowMs?: number): Date | null;
export function verifySessionToken(token: unknown, secret: Uint8Array): Promise<JWTPayload | null>;
export function isAdminSession(payload: JWTPayload | null, adminEmail: string): boolean;
export function isCustomerSession(payload: JWTPayload | null): boolean;
export function customerOwnsResource(sessionUserId: unknown, resourceOwnerId: unknown): boolean;
export function isPublicOrderReference(orderNumber: unknown): boolean;
export function canAccessOrderReference(orderNumber: unknown, sessionUserId: unknown, resourceOwnerId: unknown): boolean;
