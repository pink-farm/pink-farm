import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StoreSettingsData {
  storeName: string;
  announcementText: string;
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
