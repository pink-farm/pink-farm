import { create } from "zustand";

interface SessionState {
  isAdmin: boolean;
  isCustomer: boolean;
  loaded: boolean;
  ensureSession: (force?: boolean) => Promise<{ isAdmin: boolean; isCustomer: boolean } | null>;
  setSession: (session: { isAdmin?: boolean; isCustomer?: boolean }) => void;
}

let inFlightSessionPromise: Promise<{ isAdmin: boolean; isCustomer: boolean } | null> | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  isAdmin: false,
  isCustomer: false,
  loaded: false,

  setSession: (session) => {
    set((state) => ({
      isAdmin: session.isAdmin ?? state.isAdmin,
      isCustomer: session.isCustomer ?? state.isCustomer,
      loaded: true,
    }));
  },

  ensureSession: async (force = false) => {
    const state = get();
    if (!force && state.loaded) {
      return { isAdmin: state.isAdmin, isCustomer: state.isCustomer };
    }

    if (inFlightSessionPromise) {
      return inFlightSessionPromise;
    }

    inFlightSessionPromise = fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to check session");
        return res.json() as Promise<{ isAdmin?: boolean; isCustomer?: boolean }>;
      })
      .then((data) => {
        const next = {
          isAdmin: Boolean(data.isAdmin),
          isCustomer: Boolean(data.isCustomer),
        };
        set({ ...next, loaded: true });
        return next;
      })
      .catch(() => {
        set({ isAdmin: false, isCustomer: false, loaded: true });
        return null;
      })
      .finally(() => {
        inFlightSessionPromise = null;
      });

    return inFlightSessionPromise;
  },
}));

