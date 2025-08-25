import { useRef, useEffect } from 'react';
import { abbreviationPluginKey } from './plugins/abbreviationPlugin';
import { useAbbreviations } from '../components/useAbbreviations';
import { useEditorEffect } from '@handlewithcare/react-prosemirror';

export default function ProseMirrorDispatcher() {
  const [abbreviations] = useAbbreviations(); // hook, pas de set ici
  const viewRef = useRef(null);
  const isInitialDispatch = useRef(false);

  // Stocke la view
  useEditorEffect((view) => {
    viewRef.current = view;
    console.log('test', isInitialDispatch, view)

    if (view && !isInitialDispatch.current) {
      isInitialDispatch.current = true;
      const tr = view.state.tr.setMeta(abbreviationPluginKey, {
        type: 'update',
        abbreviations,
      });
      view.dispatch(tr);
    }
  });

  // Dispatch sur changements ultérieurs
  useEffect(() => {
    if (!viewRef.current) return;
    if (!isInitialDispatch.current) return; // attendre que l'initial dispatch soit fait

    const tr = viewRef.current.state.tr.setMeta(abbreviationPluginKey, {
      type: 'update',
      abbreviations,
    });
    viewRef.current.dispatch(tr);
  }, [abbreviations]);

  return null;
}
