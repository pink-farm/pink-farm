import { create } from "zustand";

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

const CART_STORAGE_KEY = "pink-farm-cart";

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === "string"
    && typeof item.name === "string"
    && typeof item.slug === "string"
    && typeof item.price === "number"
    && typeof item.quantity === "number";
}

/** Load the existing cart format, but only after the server confirms a customer session. */
export function loadCustomerCart() {
  if (typeof window === "undefined") return { items: [] as CartItem[], appliedCoupon: null as AppliedCoupon | null };
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [] as CartItem[], appliedCoupon: null as AppliedCoupon | null };
    const parsed = JSON.parse(raw) as { state?: { items?: unknown; appliedCoupon?: unknown } };
    const state = parsed.state;
    const items = Array.isArray(state?.items) ? state.items.filter(isCartItem) : [];
    const coupon = state?.appliedCoupon;
    const appliedCoupon = coupon && typeof coupon === "object"
      && typeof (coupon as AppliedCoupon).code === "string"
      && typeof (coupon as AppliedCoupon).discount === "number"
      && typeof (coupon as AppliedCoupon).message === "string"
      ? coupon as AppliedCoupon
      : null;
    return { items, appliedCoupon };
  } catch {
    return { items: [] as CartItem[], appliedCoupon: null as AppliedCoupon | null };
  }
}

export function saveCustomerCart(state: Pick<CartStore, "items" | "appliedCoupon">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ state, version: 0 }));
  } catch {
    // Storage can be unavailable or full; the in-memory cart remains usable.
  }
}

export function removeCustomerCart() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Ignore storage failures; the in-memory cart is still cleared.
  }
}

let customerCartPersistenceEnabled = false;
let customerCartPersistenceRevision = 0;

export function getCustomerCartPersistenceRevision() {
  return customerCartPersistenceRevision;
}

/** Initialize persistence from a server-verified session, unless a newer auth event occurred. */
export function initializeCustomerCartPersistence(
  isCustomer: boolean | null,
  expectedRevision: number
) {
  if (customerCartPersistenceRevision !== expectedRevision) return;
  customerCartPersistenceRevision += 1;

  if (isCustomer === true) {
    customerCartPersistenceEnabled = true;
    useCartStore.setState(loadCustomerCart());
    saveCustomerCart(useCartStore.getState());
    return;
  }

  customerCartPersistenceEnabled = false;
  useCartStore.getState().clearCart();
  if (isCustomer === false) removeCustomerCart();
}

/** Called after a customer sign-in or authenticated profile refresh. */
export function activateCustomerCartPersistence() {
  customerCartPersistenceRevision += 1;
  const currentCart = useCartStore.getState();
  if (currentCart.items.length === 0 && !currentCart.appliedCoupon) {
    const savedCart = loadCustomerCart();
    if (savedCart.items.length > 0 || savedCart.appliedCoupon) {
      useCartStore.setState(savedCart);
    }
  }
  customerCartPersistenceEnabled = true;
  saveCustomerCart(useCartStore.getState());
}

/** Called on customer sign-out. */
export function deactivateCustomerCartPersistence() {
  customerCartPersistenceRevision += 1;
  customerCartPersistenceEnabled = false;
  removeCustomerCart();
  useCartStore.getState().clearCart();
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
    })
);

useCartStore.subscribe((state) => {
  if (customerCartPersistenceEnabled) saveCustomerCart(state);
});
