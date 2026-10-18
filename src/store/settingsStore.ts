import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StoreSettingsData {
  storeName: string;
  announcementText: string;
  heroMainImage: string;
  heroGheeImage: string;
  heroAlmondsImage: string;
  heartProductId: string;
  heartProductTitle: string;
  heartProductTagline: string;
  heartProductFeatures: string[];
  heartProductButtonText: string;
  heartProductButtonUrl: string;
  heartProductSubtitle: string;
  heartProductImage: string;
  featuredProductId: string;
  featuredProductHeading: string;
  featuredProductDescription: string;
  featuredProductImage: string;
  featuredProductButtonText: string;
  founderName: string;
  founderImage: string;
  founderRole: string;
  founderStoryFirst: string;
  founderStorySecond: string;
  founderQuote: string;
  founderTags: string[];
  supportPhone: string;
  supportEmail: string;
  businessAddress: string;
  fssaiNumber: string;
  deliveryFee: number; // in paise
  freeDeliveryThreshold: number; // in paise
  isAcceptingOrders: boolean;
  // Combo Builder Settings
  comboEnabled: boolean;
  comboEyebrow: string;
  comboTitlePrefix: string;
  comboTitleHighlight: string;
  comboSubtitle: string;
  comboTier1Count: number;
  comboTier1Discount: number;
  comboTier1Label: string;
  comboTier1Tagline: string;
  comboTier1Badge: string;
  comboTier1Emoji: string;
  comboTier2Count: number;
  comboTier2Discount: number;
  comboTier2Label: string;
  comboTier2Tagline: string;
  comboTier2Badge: string;
  comboTier2Emoji: string;
  comboButtonText: string;
  comboFooterNote: string;
  comboProductIds: string[];
  storeCategories: string[];
}

export const DEFAULT_SETTINGS: StoreSettingsData = {
  storeName: "Pink Farm",
  announcementText: "Welcome to Pink Farm — Goodness in Every Bite.",
  heroMainImage: "/images/makhana_sig.jpg",
  heroGheeImage: "/images/ghee.jpg",
  heroAlmondsImage: "/images/almonds.jpg",
  heartProductId: "",
  heartProductTitle: "Premium Phool Makhana",
  heartProductTagline: "Why not? You deserve the best.",
  heartProductFeatures: ["Plant-Based", "Gluten-Free", "Low Calorie", "High Calcium", "No Frying", "No Preservatives", "Farm to Table", "Hygienically Packed"],
  heartProductButtonText: "Shop Now",
  heartProductButtonUrl: "",
  heartProductSubtitle: "Our Heart Product",
  heartProductImage: "",
  featuredProductId: "",
  featuredProductHeading: "Meet Your New Favourite Snack.",
  featuredProductDescription: "Handpicked, light & wholesome",
  featuredProductImage: "",
  featuredProductButtonText: "View Details & Add to Cart",
  founderName: "Anjali",
  founderImage: "",
  founderRole: "Founder & Dietitian",
  founderStoryFirst: "Anjali started her journey as a trained dietitian — someone who spent years understanding the deep connection between what we eat and how we feel. She knew that truly good food doesn't need artificial anything. It just needs care, intention, and the right source.",
  founderStorySecond: "That belief became the seed of Pink Farm. What began as a personal mission to bring honest, nutritious snacks to her own family soon turned into something much bigger — a food brand built on trust, quality, and a quiet promise to never cut corners.",
  founderQuote: "Pure in nature, good for you. Simple food, stronger you.",
  founderTags: ["Nutrition", "Food Science", "Innovation", "Entrepreneur", "Founder", "Curator"],
  supportPhone: "+91 8437504040",
  supportEmail: "wecare@pinkfarm.in",
  businessAddress: "Dugri, Ludhiana, Punjab - 141003",
  fssaiNumber: "22126026000144",
  deliveryFee: 5000, // ₹50
  freeDeliveryThreshold: 50000, // ₹500
  isAcceptingOrders: true,
  comboEnabled: true,
  comboEyebrow: "Make Your Own Combo",
  comboTitlePrefix: "Curate Your",
  comboTitleHighlight: "Pink Farm Combo",
  comboSubtitle: "Mix & match your favourite flavoured makhanas. Add multiple packs of any flavour — combo discounts apply directly on the original MRP!",
  comboTier1Count: 3,
  comboTier1Discount: 11,
  comboTier1Label: "Trio Combo",
  comboTier1Tagline: "Pick any 3 — save 11% on MRP",
  comboTier1Badge: "✦ 11% OFF",
  comboTier1Emoji: "🌿",
  comboTier2Count: 5,
  comboTier2Discount: 15,
  comboTier2Label: "Penta Combo",
  comboTier2Tagline: "Pick any 5 — save 15% on MRP",
  comboTier2Badge: "✦ 15% OFF",
  comboTier2Emoji: "🌸",
  comboButtonText: "Shop My Combo",
  comboFooterNote: "✦ Combo discount applies to total MRP ✦ Multiples allowed ✦",
  comboProductIds: [],
  storeCategories: ["Makhana", "Nuts", "Pantry"],
};

interface SettingsStore extends StoreSettingsData {
  isLoading: boolean;
  setSettings: (settings: Partial<StoreSettingsData>) => void;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      isLoading: false,

      setSettings: (newSettings) => {
        set((state) => ({ ...state, ...newSettings }));
      },

      fetchSettings: async () => {
        try {
          const res = await fetch("/api/admin/settings");
          if (res.ok) {
            const data = await res.json();
            if (data && data.storeName) {
              set({
                storeName: data.storeName,
                announcementText: data.announcementText ?? get().announcementText,
                heroMainImage: data.heroMainImage ?? get().heroMainImage,
                heroGheeImage: data.heroGheeImage ?? get().heroGheeImage,
                heroAlmondsImage: data.heroAlmondsImage ?? get().heroAlmondsImage,
                heartProductId: data.heartProductId ?? get().heartProductId,
                heartProductTitle: data.heartProductTitle ?? get().heartProductTitle,
                heartProductTagline: data.heartProductTagline ?? get().heartProductTagline,
                heartProductFeatures: Array.isArray(data.heartProductFeatures) ? data.heartProductFeatures : get().heartProductFeatures,
                heartProductButtonText: data.heartProductButtonText ?? get().heartProductButtonText,
                heartProductButtonUrl: data.heartProductButtonUrl ?? get().heartProductButtonUrl,
                heartProductSubtitle: data.heartProductSubtitle ?? get().heartProductSubtitle,
                heartProductImage: data.heartProductImage ?? get().heartProductImage,
                featuredProductId: data.featuredProductId ?? get().featuredProductId,
                featuredProductHeading: data.featuredProductHeading ?? get().featuredProductHeading,
                featuredProductDescription: data.featuredProductDescription ?? get().featuredProductDescription,
                featuredProductImage: data.featuredProductImage ?? get().featuredProductImage,
                featuredProductButtonText: data.featuredProductButtonText ?? get().featuredProductButtonText,
                founderName: data.founderName ?? get().founderName,
                founderImage: data.founderImage ?? get().founderImage,
                founderRole: data.founderRole ?? get().founderRole,
                founderStoryFirst: data.founderStoryFirst ?? get().founderStoryFirst,
                founderStorySecond: data.founderStorySecond ?? get().founderStorySecond,
                founderQuote: data.founderQuote ?? get().founderQuote,
                founderTags: Array.isArray(data.founderTags) ? data.founderTags : get().founderTags,
                supportPhone: data.supportPhone ?? get().supportPhone,
                supportEmail: data.supportEmail ?? get().supportEmail,
                businessAddress: data.businessAddress ?? get().businessAddress,
                fssaiNumber: data.fssaiNumber ?? get().fssaiNumber ?? "22126026000144",
                deliveryFee: typeof data.deliveryFee === "number" ? data.deliveryFee : get().deliveryFee,
                freeDeliveryThreshold:
                  typeof data.freeDeliveryThreshold === "number"
                    ? data.freeDeliveryThreshold
                    : get().freeDeliveryThreshold,
                isAcceptingOrders:
                  typeof data.isAcceptingOrders === "boolean"
                    ? data.isAcceptingOrders
                    : get().isAcceptingOrders,
                comboEnabled:
                  typeof data.comboEnabled === "boolean" ? data.comboEnabled : get().comboEnabled,
                comboEyebrow: data.comboEyebrow ?? get().comboEyebrow,
                comboTitlePrefix: data.comboTitlePrefix ?? get().comboTitlePrefix,
                comboTitleHighlight: data.comboTitleHighlight ?? get().comboTitleHighlight,
                comboSubtitle: data.comboSubtitle ?? get().comboSubtitle,
                comboTier1Count:
                  typeof data.comboTier1Count === "number" ? data.comboTier1Count : get().comboTier1Count,
                comboTier1Discount:
                  typeof data.comboTier1Discount === "number" ? data.comboTier1Discount : get().comboTier1Discount,
                comboTier1Label: data.comboTier1Label ?? get().comboTier1Label,
                comboTier1Tagline: data.comboTier1Tagline ?? get().comboTier1Tagline,
                comboTier1Badge: data.comboTier1Badge ?? get().comboTier1Badge,
                comboTier1Emoji: data.comboTier1Emoji ?? get().comboTier1Emoji,
                comboTier2Count:
                  typeof data.comboTier2Count === "number" ? data.comboTier2Count : get().comboTier2Count,
                comboTier2Discount:
                  typeof data.comboTier2Discount === "number" ? data.comboTier2Discount : get().comboTier2Discount,
                comboTier2Label: data.comboTier2Label ?? get().comboTier2Label,
                comboTier2Tagline: data.comboTier2Tagline ?? get().comboTier2Tagline,
                comboTier2Badge: data.comboTier2Badge ?? get().comboTier2Badge,
                comboTier2Emoji: data.comboTier2Emoji ?? get().comboTier2Emoji,
                comboButtonText: data.comboButtonText ?? get().comboButtonText,
                comboFooterNote: data.comboFooterNote ?? get().comboFooterNote,
                comboProductIds: Array.isArray(data.comboProductIds) ? data.comboProductIds : get().comboProductIds,
                storeCategories:
                  Array.isArray(data.storeCategories) && data.storeCategories.length > 0
                    ? data.storeCategories
                    : get().storeCategories?.length > 0
                    ? get().storeCategories
                    : DEFAULT_SETTINGS.storeCategories,
                isLoading: false,
              });
            }
          }
        } catch {
          console.warn("Could not fetch remote store settings; using cached values.");
        }
      },
    }),
    {
      name: "pinkfarm_store_settings",
      partialize: (state) => ({
        storeName: state.storeName,
        announcementText: state.announcementText,
        supportPhone: state.supportPhone,
        supportEmail: state.supportEmail,
        businessAddress: state.businessAddress,
        fssaiNumber: state.fssaiNumber,
        deliveryFee: state.deliveryFee,
        freeDeliveryThreshold: state.freeDeliveryThreshold,
        isAcceptingOrders: state.isAcceptingOrders,
        comboEnabled: state.comboEnabled,
        comboEyebrow: state.comboEyebrow,
        comboTitlePrefix: state.comboTitlePrefix,
        comboTitleHighlight: state.comboTitleHighlight,
        comboSubtitle: state.comboSubtitle,
        comboTier1Count: state.comboTier1Count,
        comboTier1Discount: state.comboTier1Discount,
        comboTier1Label: state.comboTier1Label,
        comboTier1Tagline: state.comboTier1Tagline,
        comboTier1Badge: state.comboTier1Badge,
        comboTier1Emoji: state.comboTier1Emoji,
        comboTier2Count: state.comboTier2Count,
        comboTier2Discount: state.comboTier2Discount,
        comboTier2Label: state.comboTier2Label,
        comboTier2Tagline: state.comboTier2Tagline,
        comboTier2Badge: state.comboTier2Badge,
        comboTier2Emoji: state.comboTier2Emoji,
        comboButtonText: state.comboButtonText,
        comboFooterNote: state.comboFooterNote,
        comboProductIds: state.comboProductIds,
        storeCategories: state.storeCategories,
      }),
    }
  )
);
