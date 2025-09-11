import { useState, useCallback, useRef, useEffect } from "react";
import defaults from "./default.json";
import schema from './schema.json'
import merge from './validate'
import { deepEqual } from 'fast-equals'


// 1. Fetch depuis le storageKey dans le localStorage.
// 2. Si les paramètres se trouvent dans le localStorage
//    ils sont transformer en objet JSON puis passe à 
//    travers merge, une fonctionne qui analyse chaque 
//    key et value selon le schema, si ceux-ci ne sont
//    respecte pas le scheme, ils sont remplacé par les
//    default values.
// 3. Si une erreur dans le fetch ou si rien s'y trouve
//    fallback au settings par defaut.
export function useSettings(storageKey = "app-settings") {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return merge(parsed, defaults, schema);
      }
      return defaults;
    } catch {
      return defaults;
    }
  });



// settingRef: stocke les derniers settings envoyés.
// timeRef: stocke le dernier setTimeout
  const settingRef = useRef(structuredClone(settings))
  const timeRef = useRef(null)




// Réagis au changement dans le localStorage si il y
// a de nouvelle valeur dans le storageKey. Si oui, elle
// s'assure que les settings reflète ces valeurs. Ces
// valeurs sont valider et merge si nécessaire, puis après
// settingRef devient la nouvelle référence au dernier changement.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const newSettings = merge(JSON.parse(e.newValue), defaults, schema);
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




  // setSetting est une fonction qui permet de modifier
  // un seul setting à la fois en mettant en paramètre:
  // 1. path: Chemin qui permet de sélectionner 
  //    le bon paramètre. (ex: abbreviationPlugin.dynamicCasing)
  // 2. value: La nouvelle valeur du paramètre.
  //
  // Keys transforme le path en Array, afin de ne pas
  // muter le valeur précédente (prev) on en fait une copie.
  // On parcours chaque clés de l'objet sauf la dernière.
  // Si le niveau n'existe pas, on le crée, puis on descend
  // à ce niveau. Finalement au dernier niveau, on affecte
  // à la dernière clés la nouvelle valeur. Après avoir modfier
  // les réglages, si timeRef.current n'est pas null on clear
  // le Timeout en cours. Puis après on en pars un de 1000s.
  // Après ces 1000s on regarde si les settings que l'on 
  // se prépare à envoyer sont différent de ceux dejà stocker
  // si oui l'envoie est fait et cette envoie devient la dernière
  // version des settings envoyer et le timeRef dans tout les cas
  // redevient null car il n'y a plus de Timeout en cours.
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
      }, 1000);

      return copy;
    });
  }, [storageKey]);



// Parcours les settings avec le path reçu en
// paramètre et la retourne.
  const getSetting = useCallback(
    path => {
      const keys = path.split(".");
      return keys.reduce((acc, k) => acc?.[k], settings);
    },
    [settings]
  );


  
// Parcours le schema avec le path reçu en
// paramètre et la retourne.
  const getSchema = useCallback((path) => {
    const keys = path.split(".");
    return keys.reduce((acc, k) => acc?.properties?.[k] || acc?.items || {}, schema);
  }, [])

  return [setSetting, getSetting, settings, getSchema];
}

