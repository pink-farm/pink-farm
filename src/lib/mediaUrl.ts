import crypto from "node:crypto";
import type { StoreProduct } from "@/lib/defaultProducts";

export const SETTINGS_MEDIA_FIELDS = [
  "heroMainImage",
  "heroGheeImage",
  "heroAlmondsImage",
  "heroVideo",
  "heartProductImage",
  "featuredProductImage",
  "founderImage",
] as const;

export type SettingsMediaField = (typeof SETTINGS_MEDIA_FIELDS)[number];

export function isSettingsMediaField(value: string): value is SettingsMediaField {
  return (SETTINGS_MEDIA_FIELDS as readonly string[]).includes(value);
}

export function getMediaHash(value: string): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

export function parseMediaDataUri(dataUri: string): {
  mimeType: string;
  buffer: Buffer;
} | null {
  if (!dataUri.startsWith("data:")) return null;
  const commaIdx = dataUri.indexOf(",");
  if (commaIdx === -1) return null;

  const header = dataUri.slice(5, commaIdx);
  const body = dataUri.slice(commaIdx + 1);
  const parts = header.split(";").filter(Boolean);
  const mimeType = (parts[0] || "").trim().toLowerCase();
  const isBase64 = parts.some((p) => p.trim().toLowerCase() === "base64");

  if (!isBase64) return null;
  if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
    return null;
  }

  return {
    mimeType,
    buffer: Buffer.from(body, "base64"),
  };
}

export function toMediaUrl(value: string | null | undefined, routePath: string): string {
  if (!value) return value ?? "";
  if (!value.startsWith("data:")) return value;
  const hash = getMediaHash(value);
  return `/api/media/${routePath}/${hash}`;
}

export function serializeStoreProductMedia(product: StoreProduct): StoreProduct {
  const rawMain = product.imageUrl || "";
  const isMainDataUri = rawMain.startsWith("data:");
  const mainUrl = isMainDataUri
    ? `/api/media/product/${product.id}/main/${getMediaHash(rawMain)}`
    : rawMain;

  let nextAdditionalImages = product.additionalImages;
  if (product.additionalImages && product.additionalImages.includes("data:")) {
    try {
      const parsed = JSON.parse(product.additionalImages);
      if (Array.isArray(parsed)) {
        const mapped = parsed.map((entry, idx) => {
          if (typeof entry !== "string" || !entry.startsWith("data:")) {
            return entry;
          }
          if (isMainDataUri && entry === rawMain) {
            return mainUrl;
          }
          return `/api/media/product/${product.id}/images/${idx}/${getMediaHash(entry)}`;
        });
        nextAdditionalImages = JSON.stringify(mapped);
      }
    } catch {
      // Keep original value if additionalImages is not valid JSON
    }
  }

  if (mainUrl === rawMain && nextAdditionalImages === product.additionalImages) {
    return product;
  }

  return {
    ...product,
    imageUrl: mainUrl,
    additionalImages: nextAdditionalImages,
  };
}

export function serializeStoreSettingsMedia<T extends Record<string, unknown>>(settings: T): T {
  let changed = false;
  const next: Record<string, unknown> = { ...settings };

  for (const field of SETTINGS_MEDIA_FIELDS) {
    const rawVal = next[field];
    if (typeof rawVal === "string" && rawVal.startsWith("data:")) {
      next[field] = `/api/media/settings/${field}/${getMediaHash(rawVal)}`;
      changed = true;
    }
  }

  return changed ? (next as T) : settings;
}

export function pickProductCardData(product: StoreProduct) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    imageUrl: product.imageUrl,
    basePrice: product.basePrice,
    originalPrice: product.originalPrice,
    category: product.category,
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
  };
}

export function pickComboProductData(product: StoreProduct) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    basePrice: product.basePrice,
    originalPrice: product.originalPrice,
    imageUrl: product.imageUrl,
    shortDescription: product.shortDescription,
    variants: Array.isArray(product.variants)
      ? product.variants.map((v) => ({ packSize: v.packSize }))
      : [],
  };
}

