"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Returns false on the server and true after the browser hydrates. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
