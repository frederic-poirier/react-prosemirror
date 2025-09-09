import { Plugin, PluginKey } from "prosemirror-state";

export const abbreviationPluginKey = new PluginKey("abbreviationPlugin");

export const abbreviationPlugin = new Plugin({
  key: abbreviationPluginKey,
  state: {
    init() {
      return {
        abbreviations: new Map(), // Map pour lookup rapide
        dynamicCasing: true,
        preventTrigger: true,
      };
    },

    apply(tr, value) {
      const meta = tr.getMeta(abbreviationPluginKey);

      if (meta?.type === "update") {
        const data = meta.data || {};
        const map = new Map();

        if (Array.isArray(data.abbreviations)) {
          for (const entry of data.abbreviations) {
            if (!entry.short) continue;
            map.set(entry.short.toLowerCase(), entry);
          }
        }

        return {
          ...value,
          abbreviations: map,
          dynamicCasing: data.dynamicCasing ?? value.dynamicCasing,
          preventTrigger: data.preventTrigger ?? value.preventTrigger,
        };
      }

      return value;
    },
  },

  props: {
    handleKeyDown(view, event) {
      const key = event.key;
      const pluginState = abbreviationPluginKey.getState(view.state);

      if (!pluginState) return false;

      const abbrevMap = pluginState.abbreviations;
      const { dynamicCasing, preventTrigger } = pluginState;

      // Exemple : espace déclenche l'abbreviation si preventTrigger activé
      if (key === " " && abbrevMap && abbrevMap.size > 0) {
        return abbreviate(
          event,
          view.dispatch,
          view.state,
          abbrevMap,
          dynamicCasing,
          preventTrigger
        );
      }

      return false;
    },
  },
});

// Fonction de remplacement des abréviations
function abbreviate(event, dispatch, state, abbrevMap, dynamicCasing) {
  const { $from } = state.selection;
  const textBefore = $from.parent.textBetween(0, $from.parentOffset);
  const lastWord = textBefore.split(/\s+/).pop();
  if (!lastWord) return false;

  const lowerWord = lastWord.toLowerCase();
  const entry = abbrevMap.get(lowerWord);
  if (!entry) return false;

  let replacement = entry.full;

  if (dynamicCasing) {
    // Adapte la casse à la saisie de l'utilisateur
    if (lastWord === lastWord.toUpperCase())
      replacement = replacement.toUpperCase();
    else if (lastWord === lastWord.toLowerCase())
      replacement = replacement.toLowerCase();
    else if (lastWord[0] === lastWord[0].toUpperCase())
      replacement = replacement[0].toUpperCase() + replacement.slice(1);
  }

  event.preventDefault();
  const from = $from.pos - lastWord.length;
  dispatch(state.tr.insertText(replacement + " ", from, $from.pos));

  return true;
}
