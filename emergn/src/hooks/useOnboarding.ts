"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "emergn_onboarded";
const STORAGE_VERSION = "1";

export function useOnboarding() {
  // null = not yet determined (SSR/hydration safe)
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setShowOnboarding(stored !== STORAGE_VERSION);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, STORAGE_VERSION);
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  }, []);

  return { showOnboarding, completeOnboarding, resetOnboarding };
}
