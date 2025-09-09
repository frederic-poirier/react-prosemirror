import { useEffect, useRef } from "react";
import { useSettings } from "../utils/useSettings";
import { useEditorEffect } from "@handlewithcare/react-prosemirror";
import { abbreviationPluginKey } from './plugins/abbreviationPlugin'

// Liste des plugins et le chemin dans settings
const pluginMap = [
  { pluginKey: abbreviationPluginKey, path: "abbreviationPlugin" },
  { pluginKey: "anotherPluginKey", path: "anotherPlugin" },
  // ajouter ici d’autres plugins
];

export default function ProseMirrorDispatcher() {
  const [_, getSetting] = useSettings();
  const viewRef = useRef(null);
  const initialDispatchDone = useRef(false);

  // Stocke la view
  useEditorEffect((view) => {
    viewRef.current = view;
    if (view && !initialDispatchDone.current) {
      initialDispatchDone.current = true;

      // Initial dispatch
      pluginMap.forEach(({ pluginKey, path }) => {
        const data = getSetting(path);
        console.log(data)
        if (data && view) {
          const tr = view.state.tr.setMeta(pluginKey, {
            type: "update",
            data,
          });
          view.dispatch(tr);
        }
      });
    }
  });

  // Dispatch à chaque changement
  useEffect(() => {
    if (!viewRef.current || !initialDispatchDone.current) return;

    pluginMap.forEach(({ pluginKey, path }) => {
      const data = getSetting(path);
      console.log(data)
      if (!data) return;

      const tr = viewRef.current.state.tr.setMeta(pluginKey, {
        type: "update",
        data,
      });
      viewRef.current.dispatch(tr);
    });
  }, [getSetting]); // getSetting est stable via useCallback
  // Si besoin, tu peux optimiser avec useMemo pour ne dispatcher que si data change

  return null;
}
