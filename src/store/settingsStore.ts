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
  deliveryFee: number; // in paise
  freeDeliveryThreshold: number; // in paise
  isAcceptingOrders: boolean;
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
  deliveryFee: 5000, // ₹50
  freeDeliveryThreshold: 50000, // ₹500
  isAcceptingOrders: true,
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
                deliveryFee: typeof data.deliveryFee === "number" ? data.deliveryFee : get().deliveryFee,
                freeDeliveryThreshold:
                  typeof data.freeDeliveryThreshold === "number"
                    ? data.freeDeliveryThreshold
                    : get().freeDeliveryThreshold,
                isAcceptingOrders:
                  typeof data.isAcceptingOrders === "boolean"
                    ? data.isAcceptingOrders
                    : get().isAcceptingOrders,
                isLoading: false,
              });
            }
          }
        } catch (error) {
          console.warn("Could not fetch remote store settings, using cache:", error);
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
        deliveryFee: state.deliveryFee,
        freeDeliveryThreshold: state.freeDeliveryThreshold,
        isAcceptingOrders: state.isAcceptingOrders,
      }),
    }
  )
);
