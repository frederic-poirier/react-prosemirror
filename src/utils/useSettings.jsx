import { useState, useCallback, useRef, useEffect } from "react";
import defaultSettingsJson from "./defaultSettings.json";
import { deepEqual } from 'fast-equals'

// [ ] Versionné les réglages et filtrer les artéfacts de settings.
// [ ] Passer de localStorage à une vrai DB et donc async compatible.
// [x] Batch les envoies au localstorage avec un trottle ou depuis le UI.
//     Cleanup useEffect à la fermeture d'une page de settings qui signale 
//     la fin des changements coupler avec un envoie périodique. 
//     Faire un diff pour déterminer les réellement changement.
// [ ] Fonction qui retourne les values et une autre qui retourne les metadatas.
//     Trouver la fine ligne entre dsl et séparation.

const CURRENT_SETTINGS_VERSION = defaultSettingsJson.version

export function useSettings(storageKey = "app-settings") {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        let parsedSettings = JSON.parse(stored);
        if (parsedSettings.version === CURRENT_SETTINGS_VERSION) return parsedSettings

      }
      return defaultSettingsJson;

    } catch {
      return defaultSettingsJson;
    }
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSettings(newSettings); // met à jour ton état React
          settingRef.current = structuredClone(newSettings)
        } catch (err) {
          console.error("Erreur parsing settings", err);
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey]);


  const timeRef = useRef(null)
  const settingRef = useRef(structuredClone(settings))
  // Fonction pour setter et écrire directement dans localStorage
  const setSetting = useCallback((path, value) => {
    setSettings(prev => {

      const keys = path.split(".");
      const copy = { ...prev };
      let curr = copy;

      keys.slice(0, -1).forEach(k => {
        if (!curr[k]) curr[k] = {};
        curr = curr[k];
      });

      curr[keys[keys.length - 1]] = value;

      if (timeRef.current) clearTimeout(timeRef.current)


      timeRef.current = setTimeout(() => {
        if (!deepEqual(settingRef.current, copy)) {
          localStorage.setItem(storageKey, JSON.stringify(copy));
          settingRef.current = structuredClone(copy)
        } 
        timeRef.current = null
      }, 1000)


      return copy;
    });
  }, [storageKey]);

  const getSetting = useCallback(
    path => {
      const keys = path.split(".");
      return keys.reduce((acc, k) => acc?.[k], settings);
    },
    [settings]
  );

  return [setSetting, getSetting, settings];
}
