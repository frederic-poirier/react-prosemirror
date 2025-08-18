import { useEffect, useRef } from 'react';
import { abbreviationPluginKey } from '../Editor/plugins/abbreviationPlugin';
import { useEditorEventCallback } from '@handlewithcare/react-prosemirror';

export default function ProseMirroDispatcher() {
  const pendingMap = useRef(null)
  const dispatch = useEditorEventCallback((view, map) => {
    if (!view) return pendingMap.current = map
    const tr = view.state.tr.setMeta(abbreviationPluginKey, {
      type: 'update',
      map: map || pendingMap.current,
    })
    view.dispatch(tr);
    pendingMap.current = null;
  })

  useEffect(() => {
    const handler = (event) => dispatch(event.detail)

    window.addEventListener('abbreviation-update', handler);
    return () => window.removeEventListener('abbreviation-update', handler);
  }, [dispatch]);

  return null;
}

