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

            const key = data.caseMatching
              ? entry.short
              : entry.short.toLowerCase(); // <-- mettre en minuscule si caseMatching est falsy

            map.set(key, entry);
          }
        }

        return {
          ...value,
          abbreviations: map,
          dynamicCasing: data.dynamicCasing ?? value.dynamicCasing,
          addSpace: data.addSpace ?? value.addSpace,
          caseMatching: data.caseMatching ?? value.caseMatching,
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

      const { dynamicCasing, addSpace, caseMatching } = pluginState;

      // Exemple : espace déclenche l'abbreviation si preventTrigger activé
      if (key === " " && abbrevMap && abbrevMap.size > 0) {
        return abbreviate(
          event,
          view.dispatch,
          view.state,
          abbrevMap,
          dynamicCasing,
          addSpace,
          caseMatching
        );
      }

      return false;
    },
  },
});

// Fonction de remplacement des abréviations
function abbreviate(
  event,
  dispatch,
  state,
  abbrevMap,
  dynamicCasing,
  addSpace,
  caseMatching
) {
  const { $from } = state.selection;
  const textBefore = $from.parent.textBetween(0, $from.parentOffset);
  const lastWord = textBefore.split(/\s+/).pop();
  if (!lastWord) return false;

  const word = caseMatching ? lastWord : lastWord.toLowerCase();
  const entry = abbrevMap.get(word);

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

  let space = addSpace ? " " : "";

  event.preventDefault();
  const from = $from.pos - lastWord.length;
  dispatch(state.tr.insertText(replacement + space, from, $from.pos));

  return true;
}
