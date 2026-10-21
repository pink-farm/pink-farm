"use client";

import { useEffect } from "react";
import {
  getCustomerCartPersistenceRevision,
  initializeCustomerCartPersistence,
} from "@/store/cartStore";

/** Keep carts in memory for guests and persist them only during customer sessions. */
export function CartPersistenceSync() {
  useEffect(() => {
    const bootstrapRevision = getCustomerCartPersistenceRevision();

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not confirm customer session");
        return response.json() as Promise<{ isCustomer?: boolean }>;
      })
      .then((session) => {
        initializeCustomerCartPersistence(session.isCustomer === true, bootstrapRevision);
      })
      .catch(() => {
        // Don't restore a saved cart when the session could not be confirmed.
        initializeCustomerCartPersistence(null, bootstrapRevision);
      });
  }, []);

  return null;
}
