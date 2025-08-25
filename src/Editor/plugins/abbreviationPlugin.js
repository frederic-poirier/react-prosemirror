import { Plugin, PluginKey } from "prosemirror-state";

export const abbreviationPluginKey = new PluginKey("abbreviationPlugin");

export const abbreviationPlugin = new Plugin({
  key: abbreviationPluginKey,
  state: {
    init() {
      return new Map(); // plugin state = Map
    },
    apply(tr, value) {
      const meta = tr.getMeta(abbreviationPluginKey);
      if (meta?.type === "update" && Array.isArray(meta.abbreviations)) {
        const map = new Map();
        for (const entry of meta.abbreviations) {
          if (!entry.short) continue;
          map.set(entry.short.toLowerCase(), entry);
        }
        return map;
      }
      return value;
    },
  },
  props: {
    handleKeyDown(view, event) {
      const key = event.key;
      const pluginState = abbreviationPluginKey.getState(view.state);
      if (key === " " && pluginState && pluginState.size > 0) {
        return abbreviate(event, view.dispatch, view.state, pluginState);
      }
      return false;
    },
  },
});

function abbreviate(event, dispatch, state, abbrevMap) {
  const { $from } = state.selection;
  const textBefore = $from.parent.textBetween(0, $from.parentOffset);
  const lastWord = textBefore.split(/\s+/).pop();
  if (!lastWord) return false;

  const lowerWord = lastWord.toLowerCase();
  const entry = abbrevMap.get(lowerWord);
  if (!entry) return false;

  let replacement = entry.full;
  let shouldReplace = true;

  if (entry.caseMatching) {
    // Vérifie si la casse doit correspondre strictement
    const exactEntry = abbrevMap.get(lastWord);
    if (exactEntry) replacement = exactEntry.full;
    else shouldReplace = false;
  }

  if (shouldReplace) {
    event.preventDefault();
    const from = $from.pos - lastWord.length;
    dispatch(state.tr.insertText(replacement + " ", from, $from.pos));
    return true;
  }

  return false;
}
