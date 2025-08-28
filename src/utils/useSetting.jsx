import { useState, useEffect, useCallback } from "react";

export function useSettings(defaultValues = {}, storageKey = "app-settings") {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? { ...defaultValues, ...JSON.parse(stored) } : defaultValues;
    } catch {
      return defaultValues;
    }
  });

  // Sauvegarde à chaque changement
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings, storageKey]);

  const setSetting = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: typeof value === "function" ? value(prev[key]) : value,
    }));
  }, []);

  return [settings, setSetting];
}
