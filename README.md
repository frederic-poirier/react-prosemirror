# React ProseMirror (editor plugins)

This repository contains a small React + Vite playground and a set of ProseMirror plugins used by the editor components.

This README documents the editor plugins found under `src/Editor/plugins/` and shows how to wire them into a ProseMirror `EditorState`.

Plugins included
- `abbreviationPlugin` — replace typed abbreviations with full text when the user types a space
- `pairedCharPlugin` — automatic insertion, skipping and removal of paired characters (parentheses, quotes, etc.)
- `placeholderPlugin` — show a data-placeholder when the document is empty

Table of contents
- Overview
- Installation
- Plugins (usage & examples)
  - Abbreviation plugin
  - Paired character plugin
  - Placeholder plugin
- Example: adding the plugins to your editor
- Notes

## Installation

This project uses Vite + React. Install dependencies with:

```powershell
npm install
```

## Abbreviation plugin

File: `src/Editor/plugins/abbreviationPlugin.js`

What it does
- Maintains a small object of abbreviations in plugin state. When the user types a space and the last word matches a configured abbreviation, the plugin replaces the short word with the full text and preserves a trailing space.

State shape and updates
- The plugin stores a plain object (not a Map). The expected shape is an object keyed by the short form (usually lower-cased):

```js
{
  "brb": { full: "be right back", caseMatching: false },
  "omw": { full: "on my way" }
}
```

- To update the abbreviations you dispatch a transaction with a meta keyed by `abbreviationPluginKey`. Example (anywhere you have access to `view`):

```js
import { abbreviationPluginKey } from './src/Editor/plugins/abbreviationPlugin';

view.dispatch(
  view.state.tr.setMeta(abbreviationPluginKey, {
    type: 'update',
    abbreviations: {
      brb: { full: 'be right back' }
    }
  })
);
```

Behavior notes
- Replacement triggers on typing a space (`handleKeyDown` checks for the space key).
- If an abbreviation entry has `caseMatching: true`, the plugin will only replace when exact case matches are present (the plugin checks the token and plugin state accordingly).

## Paired character plugin

File: `src/Editor/plugins/pairedCharPlugin.js`

What it does
- Auto-inserts matching closing characters (e.g. `(` -> `)`), wraps a selection when present, skips insertion when appropriate (pressing a closing character next to an auto-inserted one), and removes empty pairs on Backspace.

Highlights
- Supports common pairs: parentheses, brackets, braces, angle brackets, double/single/backticks.
- Keeps a small history of inserted pairs in plugin state (bounded by `MAX_PAIRS`, default 24) so skipping and removal can be handled correctly.

API & interactions
- The plugin reacts to keydown events. Typical behaviors:
  - Typing an opening character inserts the pair and places the caret between them (or wraps the selection).
  - Typing a closing character when the next character is the expected auto-inserted closer will skip over it.
  - Pressing Backspace when the caret is between an empty pair removes both.

Notes
- Symmetric characters (e.g. `"`, `'`, `` ` ``) have special handling: the plugin tracks them and decides whether to skip or add depending on surrounding state.

## Placeholder plugin

File: `src/Editor/plugins/placeholderPlugin.js`

What it does
- Adds a `Decoration` when the document is empty to show a placeholder text. The plugin is a factory: `placeholderPlugin(text)` returns a ProseMirror `Plugin` instance configured with `text`.

Usage example

```js
import placeholderPlugin from './src/Editor/plugins/placeholderPlugin';

const placeholder = placeholderPlugin('Start typing...');
```

The plugin sets a node decoration with `data-placeholder` and `.empty` class which you can style in your CSS to show the placeholder.

## Example: adding plugins to your ProseMirror editor

This is a minimal example showing how to import and add the plugins to the `plugins` array used when creating an `EditorState`.

```js
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { abbreviationPlugin } from './src/Editor/plugins/abbreviationPlugin';
import { pairedCharPlugin } from './src/Editor/plugins/pairedCharPlugin';
import placeholderPlugin from './src/Editor/plugins/placeholderPlugin';

const plugins = [
  abbreviationPlugin,
  pairedCharPlugin,
  placeholderPlugin('Write something…'),
];

const state = EditorState.create({
  schema: mySchema,
  plugins,
});

const view = new EditorView(document.querySelector('#editor'), {
  state,
});
```

Tip: to programmatically update abbreviations at runtime, dispatch a transaction with the `abbreviationPluginKey` meta (see the Abbreviation section above).

## Styling

The placeholder plugin adds a node decoration with `class="empty"` and `data-placeholder` attribute. The project contains CSS files under `src/Editor/styles/` where you can add rules like:

```css
.empty::before {
  content: attr(data-placeholder);
  color: #999;
  pointer-events: none;
}
```

## Contributing

- If you improve plugin behavior, please add small unit tests or example usage pages in the `src/` folder.
- Keep plugin state serializable (avoid circular refs) so transactions and debugging remain simple.

## License

This repository follows the license in the root `package.json`.

---

If you'd like, I can:
- add live examples inside `src/` showing the plugins in action,
- add a small helper to update abbreviations from a React settings panel, or
- create CSS for the placeholder so it matches the app's theme.

Tell me which of these you'd like next.
