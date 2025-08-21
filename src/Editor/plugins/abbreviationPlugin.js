import { Plugin, PluginKey } from "prosemirror-state";

export const abbreviationPluginKey = new PluginKey("abbreviationPlugin");

export const abbreviationPlugin = new Plugin({
  key: abbreviationPluginKey,
  state: {
    init() {
      return {}; // objet vide au lieu d’une Map
    },
    apply(tr, value) {
      const meta = tr.getMeta(abbreviationPluginKey);
      if (meta?.type === "update") {
        return meta.abbreviations || {}; // objet {short: {...}}
      }
      return value;
    },
  },
  props: {
    handleKeyDown(view, event) {
      const key = event.key;
      const pluginState = abbreviationPluginKey.getState(view.state);
      if (key === " " && pluginState && Object.keys(pluginState).length > 0) {
        return abbreviate(event, view.dispatch, view.state, pluginState);
      }
      return false;
    },
  },
});

function abbreviate(event, dispatch, state, abbrevObj) {
  const { $from } = state.selection;
  const textBefore = $from.parent.textBetween(0, $from.parentOffset);
  const lastWord = textBefore.split(/\s+/).pop();
  if (!lastWord) return false;

  const lowerWord = lastWord.toLowerCase();
  const entry = abbrevObj[lowerWord];
  if (!entry) return false;

  let shouldReplace = true;
  let replacement = entry.full;

  if (entry.caseMatching) {
    // Vérifie si la casse doit correspondre strictement
    if (abbrevObj[lastWord]) {
      replacement = abbrevObj[lastWord].full;
    } else {
      shouldReplace = false;
    }
  }

  if (shouldReplace) {
    event.preventDefault();
    const from = $from.pos - lastWord.length;
    dispatch(state.tr.insertText(replacement + " ", from, $from.pos));
    return true;
  }

  return false;
}
