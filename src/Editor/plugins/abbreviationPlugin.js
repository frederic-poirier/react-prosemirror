import { Plugin, PluginKey } from "prosemirror-state";


export const abbreviationPluginKey = new PluginKey("abbreviationPlugin");

export const abbreviationPlugin = new Plugin({
  key: abbreviationPluginKey,
  state: {
    init() {
        return new Map([])
    },
    apply(tr, value) {
      const meta = tr.getMeta(abbreviationPluginKey);
      if (meta?.type === "update") return meta.map;
      return value;
    },
  },
  props: {
    handleKeyDown(view, event) {
      const key = event.key;
      const pluginState = abbreviationPluginKey.getState(view.state);

      if (key === " " && pluginState?.size > 0)
        return abbreviate(event, view.dispatch, view.state, pluginState);
      return false;
    },
  },
});

function abbreviate(event, dispatch, state, pluginState) {
  const { $from } = state.selection;
  const textBefore = $from.parent.textBetween(0, $from.parentOffset);
  const lastWord = textBefore.split(/\s+/).pop().toLowerCase();
  const abbrevMap = pluginState;

  console.log(abbrevMap, lastWord, abbrevMap.has(lastWord))

  if (abbrevMap.has(lastWord)) {
    event.preventDefault();
    const fullWord = abbrevMap.get(lastWord) + " ";
    const from = $from.pos - lastWord.length;
    dispatch(state.tr.insertText(fullWord, from, $from.pos));
    return true;
  }
  return false;
}
