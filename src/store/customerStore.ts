import { create } from "zustand";
import { persist } from "zustand/middleware";
import { activateCustomerCartPersistence, deactivateCustomerCartPersistence } from "@/store/cartStore";

export interface CustomerAddress {
  id: string;
  label: "Home" | "Work" | "Other";
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  dob?: string;
  gender?: string;
  avatarUrl?: string;
  membershipTier: string;
  walletBalance: number; // in paise (e.g. 15000 = ₹150)
  dietaryPreferences: string[];
}

export interface CustomerPreferences {
  whatsappAlerts: boolean;
  smsUpdates: boolean;
  emailNewsletter: boolean;
  preferredDeliverySlot: "morning" | "evening" | "any";
  deliveryNotes: string;
}

export interface CustomerStoreState {
  isLoggedIn: boolean;
  profile: CustomerProfile;
  addresses: CustomerAddress[];
  preferences: CustomerPreferences;

  // Actions
  loginCustomer: (customProfile?: Partial<CustomerProfile>) => void;
  hydrateCustomer: (data: { profile: Partial<CustomerProfile>; addresses: CustomerAddress[]; preferences: CustomerPreferences }) => void;
  logoutCustomer: () => void;
  updateProfile: (updated: Partial<CustomerProfile>) => void;
  updatePreferences: (updated: Partial<CustomerPreferences>) => void;
  addAddress: (address: Omit<CustomerAddress, "id">) => void;
  updateAddress: (id: string, updated: Partial<CustomerAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

const DEFAULT_PROFILE: CustomerProfile = {
  name: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  avatarUrl: "",
  membershipTier: "Pink Farm Member",
  walletBalance: 0,
  dietaryPreferences: [],
};

const DEFAULT_ADDRESSES: CustomerAddress[] = [];

const DEFAULT_PREFERENCES: CustomerPreferences = {
  whatsappAlerts: false,
  smsUpdates: false,
  emailNewsletter: false,
  preferredDeliverySlot: "any",
  deliveryNotes: "",
};

export const useCustomerStore = create<CustomerStoreState>()(
  persist(
    (set) => ({
      isLoggedIn: false, // Default to false so logged-out state is respected
      profile: DEFAULT_PROFILE,
      addresses: DEFAULT_ADDRESSES,
      preferences: DEFAULT_PREFERENCES,

      loginCustomer: (customProfile) => {
        activateCustomerCartPersistence();
        set(() => ({
          isLoggedIn: true,
          profile: {
            ...DEFAULT_PROFILE,
            ...customProfile,
          },
          addresses: [],
          preferences: DEFAULT_PREFERENCES,
        }));
      },

      hydrateCustomer: (data) => {
        activateCustomerCartPersistence();
        set({
          isLoggedIn: true,
          profile: { ...DEFAULT_PROFILE, ...data.profile },
          addresses: data.addresses,
          preferences: { ...DEFAULT_PREFERENCES, ...data.preferences },
        });
      },

      logoutCustomer: () => {
        deactivateCustomerCartPersistence();
        set({
          isLoggedIn: false,
          profile: DEFAULT_PROFILE,
          addresses: [],
          preferences: DEFAULT_PREFERENCES,
        });
      },

      updateProfile: (updated) => {
        set((state) => ({
          profile: {
            ...state.profile,
            ...updated,
          },
        }));
      },

      updatePreferences: (updated) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...updated,
          },
        }));
      },

      addAddress: (newAddr) => {
        const id = "addr-" + Date.now();
        set((state) => {
          let updatedList = [...state.addresses];
          if (newAddr.isDefault) {
            updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
          }
          return {
            addresses: [
              ...updatedList,
              {
                ...newAddr,
                id,
                isDefault: state.addresses.length === 0 ? true : newAddr.isDefault,
              },
            ],
          };
        });
      },

      updateAddress: (id, updated) => {
        set((state) => ({
          addresses: state.addresses.map((a) => {
            if (a.id === id) {
              return { ...a, ...updated };
            }
            if (updated.isDefault) {
              return { ...a, isDefault: false };
            }
            return a;
          }),
        }));
      },

      deleteAddress: (id) => {
        set((state) => {
          const filtered = state.addresses.filter((a) => a.id !== id);
          if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
            filtered[0].isDefault = true;
          }
          return { addresses: filtered };
        });
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        }));
      },
    }),
    {
      name: "pinkfarm_customer_store_v2",
    }
  )
);
