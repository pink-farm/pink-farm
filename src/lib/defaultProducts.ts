import { prisma, queryDatabase } from "@/lib/db";

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  packSize: string;
  price: number;
  originalPrice: number | null;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  additionalImages: string;
  basePrice: number;
  originalPrice: number | null;
  sku: string;
  category: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isFeatured: boolean;
  tags: string;
  ingredients: string | null;
  nutritionalInfo: string | null;
  storage: string | null;
  allergens: string | null;
  deliveryNotes: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
}

export const FALLBACK_PRODUCTS: StoreProduct[] = [
  {
    id: "17941128-e66d-415e-a2ac-359f8c474148",
    name: "Premium Raw Phool Makhana",
    slug: "premium-raw-phool-makhana",
    shortDescription: "Handpicked, light & wholesome",
    description: "Made from carefully selected makhana, kept simple and unflavoured for pure versatility. Roast it, season it, or enjoy creating your own snack!",
    imageUrl: "/images/makhana_sig.jpg",
    additionalImages: "[]",
    basePrice: 37425,
    originalPrice: 49900,
    sku: "PF-MAK-01",
    category: "Makhana",
    stockQuantity: 150,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    tags: "[]",
    ingredients: null,
    nutritionalInfo: null,
    storage: null,
    allergens: null,
    deliveryNotes: null,
    seoTitle: null,
    seoDesc: null,
    createdAt: "2026-10-09T13:24:38.676Z",
    updatedAt: "2026-10-10T06:02:17.570Z",
    variants: [
      {
        id: "bd351ab6-2af0-4a21-ada8-3cd5a15ccc3d",
        productId: "17941128-e66d-415e-a2ac-359f8c474148",
        name: "200 gms",
        packSize: "200 gms",
        price: 37425,
        originalPrice: 49900,
        stockQuantity: 150,
        isAvailable: true,
      },
    ],
  },
  {
    id: "e885c11e-9676-41f6-9b76-bc3a864f5210",
    name: "Peri Peri Makhana",
    slug: "peri-peri-makhana",
    shortDescription: "A spicy kick in every crunchy bite.",
    description: "Carefully selected makhana, perfectly coated with a bold peri peri seasoning. Every crunchy bite brings a spicy twist to your everyday snacking!",
    imageUrl: "/images/makhana_sig.jpg",
    additionalImages: "[]",
    basePrice: 18900,
    originalPrice: 21000,
    sku: "PF-MAK-02",
    category: "Makhana",
    stockQuantity: 120,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    tags: "[]",
    ingredients: null,
    nutritionalInfo: null,
    storage: null,
    allergens: null,
    deliveryNotes: null,
    seoTitle: null,
    seoDesc: null,
    createdAt: "2026-10-09T13:24:38.714Z",
    updatedAt: "2026-10-10T06:37:35.007Z",
    variants: [
      {
        id: "30af76d7-7145-43b9-8b1b-cff270c3e240",
        productId: "e885c11e-9676-41f6-9b76-bc3a864f5210",
        name: "70 gms",
        packSize: "70 gms",
        price: 18900,
        originalPrice: 21000,
        stockQuantity: 120,
        isAvailable: true,
      },
    ],
  },
  {
    id: "caa0c62d-6b47-4bb2-b8f7-7b2683c26e86",
    name: "Punjabi Tadka Makhana",
    slug: "punjabi-tadka-makhana",
    shortDescription: "Desi tadka, bold flavour, perfect crunch.",
    description: "Premium handpicked makhana tossed in a flavourful Punjabi tadka seasoning. Enjoy the perfect desi twist in every crunchy bite!",
    imageUrl: "/images/makhana_sig.jpg",
    additionalImages: "[]",
    basePrice: 18900,
    originalPrice: 21000,
    sku: "PF-MAK-03",
    category: "Makhana",
    stockQuantity: 120,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    tags: "[]",
    ingredients: null,
    nutritionalInfo: "7.19g Protein per 100g",
    storage: null,
    allergens: null,
    deliveryNotes: null,
    seoTitle: null,
    seoDesc: null,
    createdAt: "2026-10-10T05:49:10.854Z",
    updatedAt: "2026-10-10T06:02:17.618Z",
    variants: [
      {
        id: "adb26549-0d45-4868-baaf-a15e7efbd1df",
        productId: "caa0c62d-6b47-4bb2-b8f7-7b2683c26e86",
        name: "70 gms",
        packSize: "70 gms",
        price: 18900,
        originalPrice: 21000,
        stockQuantity: 120,
        isAvailable: true,
      },
    ],
  },
  {
    id: "87993055-e73f-43bf-8fab-3b575c4ea418",
    name: "Pudina Makhana",
    slug: "pudina-makhana",
    shortDescription: "Refreshing mint with a chatpata twist.",
    description: "Carefully selected makhana blended with refreshing minty pudina seasoning. A flavourful, chatpata companion for your everyday snack cravings!",
    imageUrl: "/images/makhana_sig.jpg",
    additionalImages: "[]",
    basePrice: 18900,
    originalPrice: 21000,
    sku: "PF-MAK-04",
    category: "Makhana",
    stockQuantity: 120,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    tags: "[]",
    ingredients: null,
    nutritionalInfo: null,
    storage: null,
    allergens: null,
    deliveryNotes: null,
    seoTitle: null,
    seoDesc: null,
    createdAt: "2026-10-10T05:49:10.877Z",
    updatedAt: "2026-10-10T06:02:17.640Z",
    variants: [
      {
        id: "b877b820-9f21-49c2-8c4a-03b26482d25b",
        productId: "87993055-e73f-43bf-8fab-3b575c4ea418",
        name: "70 gms",
        packSize: "70 gms",
        price: 18900,
        originalPrice: 21000,
        stockQuantity: 120,
        isAvailable: true,
      },
    ],
  },
  {
    id: "99035279-5432-4b47-85c0-4439e418684e",
    name: "Caramel Gud Makhana",
    slug: "caramel-gud-makhana",
    shortDescription: "Makhana meets the goodness of gud.",
    description: "Premium makhana coated with a delightful caramel-gud flavour for a sweet, crunchy treat. Perfect for satisfying your sweet cravings, one bite at a time!",
    imageUrl: "/images/makhana_sig.jpg",
    additionalImages: "[]",
    basePrice: 20700,
    originalPrice: 23000,
    sku: "PF-MAK-05",
    category: "Makhana",
    stockQuantity: 100,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    tags: "[]",
    ingredients: null,
    nutritionalInfo: null,
    storage: null,
    allergens: null,
    deliveryNotes: null,
    seoTitle: null,
    seoDesc: null,
    createdAt: "2026-10-10T05:49:10.898Z",
    updatedAt: "2026-10-10T06:02:17.661Z",
    variants: [
      {
        id: "4cd1eb9f-31a7-4a15-b400-d5b88ccbd868",
        productId: "99035279-5432-4b47-85c0-4439e418684e",
        name: "70 gms",
        packSize: "70 gms",
        price: 20700,
        originalPrice: 23000,
        stockQuantity: 100,
        isAvailable: true,
      },
    ],
  },
  {
    id: "dc0dd925-8619-4721-ab89-3b178ac967cb",
    name: "Himalayan Pink Salted Makhana",
    slug: "himalayan-pink-salted-makhana",
    shortDescription: "Simply salted, perfectly crunchy.",
    description: "Carefully selected makhana seasoned with a simple, savoury Himalayan salt flavour. Light, crunchy and perfect for everyday munching!",
    imageUrl: "/images/makhana_sig.jpg",
    additionalImages: "[]",
    basePrice: 18000,
    originalPrice: 20000,
    sku: "PF-MAK-06",
    category: "Makhana",
    stockQuantity: 130,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    tags: "[]",
    ingredients: null,
    nutritionalInfo: null,
    storage: null,
    allergens: null,
    deliveryNotes: null,
    seoTitle: null,
    seoDesc: null,
    createdAt: "2026-10-10T05:49:10.919Z",
    updatedAt: "2026-10-10T06:53:28.299Z",
    variants: [
      {
        id: "ae43c275-8693-47fd-81cf-568ba65e4fd6",
        productId: "dc0dd925-8619-4721-ab89-3b178ac967cb",
        name: "70 gms",
        packSize: "70 gms",
        price: 18000,
        originalPrice: 20000,
        stockQuantity: 130,
        isAvailable: true,
      },
    ],
  },
];

export const DEFAULT_SETTINGS = {
  id: "default",
  storeName: "Pink Farm",
  announcementText: "Welcome to Pink Farm — Goodness in Every Bite.",
  heroMainImage: "/images/makhana_sig.jpg",
  heroGheeImage: "/images/ghee.jpg",
  heroAlmondsImage: "/images/almonds.jpg",
  supportPhone: "+91 8437504040",
  supportEmail: "wecare@pinkfarm.in",
  businessAddress: "Dugri, Ludhiana, Punjab - 141003",
  deliveryFee: 5000,
  freeDeliveryThreshold: 50000,
  isAcceptingOrders: true,
};

/**
 * Returns store products. Queries the database first;
 * if empty or if database is inaccessible (e.g. cold start / read-only SQLite on Vercel),
 * safely returns the official 6 Makhana catalog.
 */
export async function getStoreProducts(options?: { includeUnavailable?: boolean }): Promise<StoreProduct[]> {
  try {
    const products = await queryDatabase(() =>
      prisma.product.findMany({
        where: options?.includeUnavailable ? undefined : { isAvailable: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
        include: { variants: true },
      }),
    );

    if (products && products.length > 0) {
      return products as unknown as StoreProduct[];
    }
  } catch {
    // The shared database helper logs one concise warning and opens a short
    // cooldown so an Atlas outage cannot stall every shop navigation.
  }

  return FALLBACK_PRODUCTS;
}

/**
 * Finds a single product by its slug.
 */
export async function getStoreProductBySlug(slug: string): Promise<StoreProduct | null> {
  try {
    const product = await queryDatabase(() =>
      prisma.product.findUnique({
        where: { slug },
        include: { variants: true },
      }),
    );

    if (product) {
      return product as unknown as StoreProduct;
    }
  } catch {
    // Fall through to the built-in catalog.
  }

  const fallback = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
  return fallback || null;
}

/**
 * Finds a single product by its ID.
 */
export async function getStoreProductById(id: string): Promise<StoreProduct | null> {
  try {
    const product = await queryDatabase(() =>
      prisma.product.findUnique({
        where: { id },
        include: { variants: true },
      }),
    );

    if (product) {
      return product as unknown as StoreProduct;
    }
  } catch {
    // Fall through to the built-in catalog.
  }

  const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id);
  return fallback || null;
}

/**
 * Returns store settings with safe fallback.
 */
export async function getStoreSettings() {
  try {
    const settings = await queryDatabase(() =>
      prisma.storeSettings.findUnique({
        where: { id: "default" },
      }),
    );
    if (settings) return settings;
  } catch {
    // Fall through to the default settings.
  }
  return DEFAULT_SETTINGS;
}
