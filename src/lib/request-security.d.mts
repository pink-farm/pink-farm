export function isSameOriginMutation(request: Request): boolean;
export function parseGeocodeCoordinates(latitude: unknown, longitude: unknown): { latitude: number; longitude: number } | null;
export type BoundedJsonResult = { ok: true; value: unknown } | { ok: false; status: 400 | 413 | 415; error: string };
export function readBoundedJson(request: Request, maxBytes: number): Promise<BoundedJsonResult>;
export function isValidCheckoutQuantity(quantity: unknown): boolean;
export function getTrustedClientIp(request: Request, trustedVercelProxy: boolean): string | null;
export function getComboDiscountPercent(label: unknown, allowedDiscounts?: number[]): number | null;
export function comboQuantityQualifies(percent: number, quantity: number, requiredQuantity?: number): boolean;
