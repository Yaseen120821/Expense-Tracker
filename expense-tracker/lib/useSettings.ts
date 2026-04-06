"use client";

import { useEffect } from "react";
import { db, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/lib/instant";

export function useSettings() {
  const { user } = db.useAuth();

  const { data: settingsData, isLoading } = db.useQuery(
    user ? { settings: { $: { where: { userId: user.id } } } } : null
  );

  const raw = settingsData?.settings?.[0];

  const currency = raw?.currency || DEFAULT_SETTINGS.currency;
  const monthlyBudget = raw?.monthlyBudget || DEFAULT_SETTINGS.monthlyBudget;
  const theme = (raw?.theme || DEFAULT_SETTINGS.theme) as "light" | "dark";
  const aiMode = (raw?.aiMode || DEFAULT_SETTINGS.aiMode) as "normal" | "strict" | "aggressive";

  let categories: string[] = DEFAULT_CATEGORIES;
  try {
    const parsed = JSON.parse(raw?.categories || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) categories = parsed;
  } catch {}

  // Apply theme whenever it changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return {
    currency,
    monthlyBudget,
    theme,
    aiMode,
    categories,
    isLoading,
    settingsId: raw?.id,
  };
}
