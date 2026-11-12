"use client";

import { useEffect } from "react";
import { useSettingsStore, type StoreSettingsData } from "@/store/settingsStore";

export function SettingsSync({ initialSettings }: { initialSettings?: Partial<StoreSettingsData> }) {
  const setSettings = useSettingsStore((state) => state.setSettings);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings, setSettings]);

  return null;
}
