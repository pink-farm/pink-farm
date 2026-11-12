"use client";

import { useEffect } from "react";
import {
  getCustomerCartPersistenceRevision,
  initializeCustomerCartPersistence,
} from "@/store/cartStore";
import { useSessionStore } from "@/store/sessionStore";

/** Keep carts in memory for guests and persist them only during customer sessions. */
export function CartPersistenceSync() {
  const ensureSession = useSessionStore((state) => state.ensureSession);

  useEffect(() => {
    const bootstrapRevision = getCustomerCartPersistenceRevision();

    ensureSession()
      .then((session) => {
        if (!session) throw new Error("Could not confirm customer session");
        initializeCustomerCartPersistence(session.isCustomer === true, bootstrapRevision);
      })
      .catch(() => {
        // Don't restore a saved cart when the session could not be confirmed.
        initializeCustomerCartPersistence(null, bootstrapRevision);
      });
  }, [ensureSession]);

  return null;
}
