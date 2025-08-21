import { useEffect, useRef } from 'react';
import { abbreviationPluginKey } from '../Editor/plugins/abbreviationPlugin';
import { useEditorEffect } from '@handlewithcare/react-prosemirror';

const defaultAbbreviations = [
  { short: "js", full: "JavaScript", caseMatching: false, dynamic: true },
  { short: "css", full: "Cascading Style Sheets", caseMatching: false, dynamic: true },
  { short: "py", full: "Python", caseMatching: false, dynamic: true },
  { short: "html", full: "Hypertext Markup Language", caseMatching: false, dynamic: true },
  { short: "abvr", full: "Abréviation", caseMatching: false, dynamic: false },
];

export default function ProseMirrorDispatcher() {
  const pendingObj = useRef(null);
  const viewRef = useRef(null);
  const isInitialized = useRef(false);

  // Charge les abréviations depuis localStorage et retourne un objet
  const loadAbbreviations = () => {
    const stored = localStorage.getItem("abbreviations");
    const entries = stored ? JSON.parse(stored) : defaultAbbreviations;

    // On convertit en dictionnaire { short: { full, caseMatching, dynamic } }
    const obj = {};
    for (const entry of entries) {
      const short = entry.short?.trim();
      const full = entry.full?.trim();
      if (short && full) {
        obj[short.toLowerCase()] = {
          full,
          caseMatching: entry.caseMatching ?? false,
          dynamic: entry.dynamic ?? false,
        };
      }
    }
    return obj;
  };

  // Garde une référence à la view quand elle est prête
  useEditorEffect((view) => {
    viewRef.current = view;

    if (view && !isInitialized.current) {
      isInitialized.current = true;

      // Charger les abréviations initiales
      const initialObj = loadAbbreviations();
      const tr = view.state.tr.setMeta(abbreviationPluginKey, {
        type: 'update',
        abbreviations: initialObj, // <-- objet
      });
      view.dispatch(tr);
    }

    if (view && pendingObj.current) {
      const pendingTr = view.state.tr.setMeta(abbreviationPluginKey, {
        type: 'update',
        abbreviations: pendingObj.current,
      });
      view.dispatch(pendingTr);
      pendingObj.current = null;
    }
  });

  // Mises à jour en temps réel
  const dispatchUpdate = (abbrevObj) => {
    const view = viewRef.current;
    if (!view) {
      pendingObj.current = abbrevObj;
      return;
    }

    const tr = view.state.tr.setMeta(abbreviationPluginKey, {
      type: 'update',
      abbreviations: abbrevObj,
    });
    view.dispatch(tr);
  };

  useEffect(() => {
    const handler = (event) => dispatchUpdate(event.detail);
    window.addEventListener('abbreviation-update', handler);
    return () => window.removeEventListener('abbreviation-update', handler);
  }, []);

  return null;
}
