import { useState, useCallback } from "react";
import defaultSettingsJson from "./defaultSettings.json";

export function useSettings(storageKey = "app-settings") {
  // Initialisation du state depuis localStorage ou defaultSettings
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
      return defaultSettingsJson; // valeur initiale du JSON
    } catch {
      return defaultSettingsJson; // fallback si JSON corrompu
    }
  });

  // Fonction pour setter et écrire directement dans localStorage
  const setSetting = useCallback((path, value) => {
    setSettings(prev => {
      const keys = path.split(".");
      const copy = { ...prev };
      let curr = copy;

      // Descend dans l'objet jusqu'à la clé finale
      keys.slice(0, -1).forEach(k => {
        if (!curr[k]) curr[k] = {};
        curr = curr[k];
      });

      curr[keys[keys.length - 1]] = value; // modifie la valeur
      localStorage.setItem(storageKey, JSON.stringify(copy)); // persiste
      return copy;
    });
  }, [storageKey]);

  // Fonction pour récupérer une valeur depuis un chemin
  const getSetting = useCallback(
    path => {
      const keys = path.split(".");
      return keys.reduce((acc, k) => acc?.[k], settings);
    },
    [settings]
  );

  return [setSetting, getSetting, settings];
}
