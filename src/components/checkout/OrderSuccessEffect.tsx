"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

export function OrderSuccessEffect({ isPaid }: { isPaid: boolean }) {
  useEffect(() => {
    if (isPaid) {
      try {
        useCartStore.getState().clearCart();
        localStorage.removeItem("pinkfarm_guest_address");
      } catch {
        // Ignore localStorage / state errors
      }
    }
  }, [isPaid]);

  return null;
}
