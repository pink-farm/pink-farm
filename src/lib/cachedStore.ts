import { cacheLife, cacheTag } from "next/cache";
import { prisma, queryDatabase } from "@/lib/db";
import { DEFAULT_SETTINGS, FALLBACK_PRODUCTS, type StoreProduct } from "@/lib/defaultProducts";
import {
  serializeStoreProductMedia,
  serializeStoreSettingsMedia,
  type SettingsMediaField,
} from "@/lib/mediaUrl";

export async function getCachedStoreProducts(options?: { includeUnavailable?: boolean }): Promise<StoreProduct[]> {
  "use cache";
  cacheTag("store-products");

  try {
    const products = await queryDatabase(() =>
      prisma.product.findMany({
        where: options?.includeUnavailable ? undefined : { isAvailable: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
        include: { variants: true },
      }),
    );

    if (products && products.length > 0) {
      cacheLife("hours");
      return (products as unknown as StoreProduct[]).map(serializeStoreProductMedia);
    }
  } catch {
    // Fall through to fallback cache so transient DB outages recover gracefully.
  }

  cacheLife("hours");
  return FALLBACK_PRODUCTS.map(serializeStoreProductMedia);
}

export async function getCachedStoreProductBySlug(slug: string): Promise<StoreProduct | null> {
  "use cache";
  cacheTag("store-products", `product-${slug}`);

  try {
    const product = await queryDatabase(() =>
      prisma.product.findUnique({
        where: { slug },
        include: { variants: true },
      }),
    );

    cacheLife("hours");
    if (product) {
      return serializeStoreProductMedia(product as unknown as StoreProduct);
    }
  } catch {
    cacheLife("hours");
    const fallback = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return fallback ? serializeStoreProductMedia(fallback) : null;
  }

  const fallback = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
  return fallback ? serializeStoreProductMedia(fallback) : null;
}

export async function getCachedStoreSettings() {
  "use cache";
  cacheTag("store-settings");

  try {
    const settings = await queryDatabase(() =>
      prisma.storeSettings.findUnique({
        where: { id: "default" },
      }),
      8_000,
      { isolateCooldown: true },
    );
    cacheLife("hours");
    if (settings) {
      return serializeStoreSettingsMedia({
        ...settings,
        freeDeliveryThreshold: settings.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold,
      });
    }
  } catch {
    cacheLife("hours");
    return serializeStoreSettingsMedia(DEFAULT_SETTINGS);
  }
  return serializeStoreSettingsMedia(DEFAULT_SETTINGS);
}

export async function getCachedPublicStoreSettings() {
  "use cache";
  cacheTag("store-settings");

  const fallback = {
    storeName: DEFAULT_SETTINGS.storeName,
    announcementText: DEFAULT_SETTINGS.announcementText,
    bottomAnnouncementText: DEFAULT_SETTINGS.bottomAnnouncementText,
    bottomAnnouncementEnabled: DEFAULT_SETTINGS.bottomAnnouncementEnabled,
    supportPhone: DEFAULT_SETTINGS.supportPhone,
    supportEmail: DEFAULT_SETTINGS.supportEmail,
    businessAddress: DEFAULT_SETTINGS.businessAddress,
    fssaiNumber: DEFAULT_SETTINGS.fssaiNumber,
    deliveryFee: DEFAULT_SETTINGS.deliveryFee,
    freeDeliveryThreshold: DEFAULT_SETTINGS.freeDeliveryThreshold,
    isAcceptingOrders: DEFAULT_SETTINGS.isAcceptingOrders,
    comboEnabled: DEFAULT_SETTINGS.comboEnabled,
    comboEyebrow: DEFAULT_SETTINGS.comboEyebrow,
    comboTitlePrefix: DEFAULT_SETTINGS.comboTitlePrefix,
    comboTitleHighlight: DEFAULT_SETTINGS.comboTitleHighlight,
    comboSubtitle: DEFAULT_SETTINGS.comboSubtitle,
    comboTier1Count: DEFAULT_SETTINGS.comboTier1Count,
    comboTier1Discount: DEFAULT_SETTINGS.comboTier1Discount,
    comboTier1Label: DEFAULT_SETTINGS.comboTier1Label,
    comboTier1Tagline: DEFAULT_SETTINGS.comboTier1Tagline,
    comboTier1Badge: DEFAULT_SETTINGS.comboTier1Badge,
    comboTier1Emoji: DEFAULT_SETTINGS.comboTier1Emoji,
    comboTier2Count: DEFAULT_SETTINGS.comboTier2Count,
    comboTier2Discount: DEFAULT_SETTINGS.comboTier2Discount,
    comboTier2Label: DEFAULT_SETTINGS.comboTier2Label,
    comboTier2Tagline: DEFAULT_SETTINGS.comboTier2Tagline,
    comboTier2Badge: DEFAULT_SETTINGS.comboTier2Badge,
    comboTier2Emoji: DEFAULT_SETTINGS.comboTier2Emoji,
    comboButtonText: DEFAULT_SETTINGS.comboButtonText,
    comboFooterNote: DEFAULT_SETTINGS.comboFooterNote,
    comboProductIds: DEFAULT_SETTINGS.comboProductIds,
    storeCategories: DEFAULT_SETTINGS.storeCategories,
  };

  try {
    const settings = await queryDatabase(() =>
      prisma.storeSettings.findUnique({
        where: { id: "default" },
        select: {
          storeName: true,
          announcementText: true,
          bottomAnnouncementText: true,
          bottomAnnouncementEnabled: true,
          supportPhone: true,
          supportEmail: true,
          businessAddress: true,
          fssaiNumber: true,
          deliveryFee: true,
          freeDeliveryThreshold: true,
          isAcceptingOrders: true,
          comboEnabled: true,
          comboEyebrow: true,
          comboTitlePrefix: true,
          comboTitleHighlight: true,
          comboSubtitle: true,
          comboTier1Count: true,
          comboTier1Discount: true,
          comboTier1Label: true,
          comboTier1Tagline: true,
          comboTier1Badge: true,
          comboTier1Emoji: true,
          comboTier2Count: true,
          comboTier2Discount: true,
          comboTier2Label: true,
          comboTier2Tagline: true,
          comboTier2Badge: true,
          comboTier2Emoji: true,
          comboButtonText: true,
          comboFooterNote: true,
          comboProductIds: true,
          storeCategories: true,
        },
      }),
      8_000,
      { isolateCooldown: true },
    );
    cacheLife("hours");
    if (settings) {
      return {
        ...settings,
        freeDeliveryThreshold: settings.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold,
      };
    }
  } catch {
    cacheLife("hours");
    return fallback;
  }
  return fallback;
}

export async function getCachedRawProductMedia(productId: string) {
  "use cache";
  cacheTag("store-products");

  if (!/^[a-fA-F0-9]{24}$/.test(productId)) {
    cacheLife("minutes");
    return null;
  }

  try {
    const product = await queryDatabase(() =>
      prisma.product.findUnique({
        where: { id: productId },
        select: {
          imageUrl: true,
          additionalImages: true,
        },
      }),
    );
    cacheLife("hours");
    return product;
  } catch {
    cacheLife("hours");
    return null;
  }
}

export async function getCachedRawSettingsMedia(field: SettingsMediaField): Promise<string | null> {
  "use cache";
  cacheTag("store-settings");

  try {
    const settings = await queryDatabase(() =>
      prisma.storeSettings.findUnique({
        where: { id: "default" },
        select: { [field]: true } as Record<SettingsMediaField, true>,
      }),
      8_000,
      { isolateCooldown: true },
    );
    cacheLife("hours");
    const val = settings ? (settings as Record<string, unknown>)[field] : null;
    return typeof val === "string" ? val : null;
  } catch {
    cacheLife("hours");
    return null;
  }
}

