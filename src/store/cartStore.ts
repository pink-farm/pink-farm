import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // Product ID
  name: string;
  slug: string;
  variantId?: string;
  variantName?: string;
  price: number;
  imageUrl: string;
  quantity: number;
  maxQuantity: number;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  message: string;
}

interface CartStore {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon) => void;
  clearAppliedCoupon: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      appliedCoupon: null,
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
      clearAppliedCoupon: () => set({ appliedCoupon: null }),
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.id === item.id && i.variantId === item.variantId
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
            updatedItems[existingItemIndex].quantity = Math.min(newQuantity, item.maxQuantity);
            return { items: updatedItems };
          }
          return { items: [...state.items, { ...item, quantity: Math.min(quantity, item.maxQuantity) }] };
        }),
      removeItem: (id, variantId) =>
        set((state) => {
          const items = state.items.filter((i) => !(i.id === id && i.variantId === variantId));
          return { items, appliedCoupon: items.length > 0 ? state.appliedCoupon : null };
        }),
      updateQuantity: (id, variantId, quantity) =>
        set((state) => {
          const updatedItems = state.items.map((i) => {
            if (i.id === id && i.variantId === variantId) {
              return { ...i, quantity: Math.min(Math.max(1, quantity), i.maxQuantity) };
            }
            return i;
          });
          return { items: updatedItems };
        }),
      clearCart: () => set({ items: [], appliedCoupon: null }),
    }),
    {
      name: "pink-farm-cart",
    }
  )
);
