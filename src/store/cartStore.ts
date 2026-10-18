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
  removeItem: (id: string, variantId?: string, variantName?: string) => void;
  updateQuantity: (id: string, variantId: string | undefined, quantity: number, variantName?: string) => void;
  clearCart: () => void;
}

function matchCartItem(
  item: { id: string; variantId?: string; variantName?: string },
  targetId: string,
  targetVariantId?: string,
  targetVariantName?: string
) {
  if (item.id !== targetId) return false;
  if ((item.variantId || "") !== (targetVariantId || "")) return false;
  if (targetVariantName !== undefined) {
    return (item.variantName || "") === (targetVariantName || "");
  }
  return true;
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
          const max = item.maxQuantity || 10;
          const safeQty = Math.max(1, Number(quantity) || 1);
          const existingItemIndex = state.items.findIndex((i) =>
            matchCartItem(i, item.id, item.variantId, item.variantName)
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            const newQuantity = updatedItems[existingItemIndex].quantity + safeQty;
            updatedItems[existingItemIndex].quantity = Math.min(newQuantity, max);
            return { items: updatedItems };
          }
          return { items: [...state.items, { ...item, maxQuantity: max, quantity: Math.min(safeQty, max) }] };
        }),
      removeItem: (id, variantId, variantName) =>
        set((state) => {
          const items = state.items.filter((i) => !matchCartItem(i, id, variantId, variantName));
          return { items, appliedCoupon: items.length > 0 ? state.appliedCoupon : null };
        }),
      updateQuantity: (id, variantId, quantity, variantName) =>
        set((state) => {
          if (quantity <= 0) {
            const items = state.items.filter((i) => !matchCartItem(i, id, variantId, variantName));
            return { items, appliedCoupon: items.length > 0 ? state.appliedCoupon : null };
          }
          const updatedItems = state.items.map((i) => {
            if (matchCartItem(i, id, variantId, variantName)) {
              const max = i.maxQuantity || 10;
              const safeQty = Math.max(1, Number(quantity) || 1);
              return { ...i, quantity: Math.min(safeQty, max) };
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
