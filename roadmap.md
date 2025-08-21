Roadmap & Implementation notes — editor plugins

Task receipt
I will propose concrete corrections and an implementation roadmap for:
- scoped abbreviations (per-note vs global),
- a customizable placeholder that can show different text per block/node type,
- improvements and customization for the pairedChar plugin,
- a prioritized list of additional useful plugins.

Checklist (requirements)
- [x] Corrections to current plugin designs where needed
- [x] Design + implementation plan for per-block placeholders
- [x] Design + implementation plan for scoped abbreviations (note-specific + global)
- [x] Improvements and config options for pairedChar plugin
- [x] Roadmap of additional plugins and priorities
- [x] Small testing and QA suggestions

High-level goals / constraints
- Keep plugins minimal, predictable and serializable in plugin state.
- Expose small, well-documented APIs so React UI can update plugin configuration at runtime (via transaction meta).
- Keep backward-compatible defaults: existing behavior should remain if user doesn't opt in to new features.

1) Corrections & small fixes (quick wins)
- abbreviationPlugin
  - Current: stores abbreviations as a plain object in plugin state and watches for a space key to trigger replacement.
  - Fixes:
    - Normalize keys consistently (store lowercased keys but preserve original entry's caseMatching flag). Add a normalize step when receiving updates via `setMeta`.
    - Avoid replacing inside code blocks or preformatted nodes — limit replacement to textblock nodes and specific node types (see scoped plan below).
    - Make the plugin's replace trigger configurable (space, punctuation, Enter) — accept an options object.
- pairedCharPlugin
  - Fixes:
    - Add a configuration option to control wrapping selection vs inserting pair when selection present.
    - Improve symmetric char handling (backticks/quotes) by checking for word-boundaries and language-specific rules.
    - Ensure tr.mapping adjustments are correct when transactions transform doc positions (there is already mapping in apply; add more unit tests for edge cases).
- placeholderPlugin
  - Fixes:
    - Make factory accept either a string or a mapping object (per node type) or a callback function (state -> placeholder string).
    - Ensure the decoration is added per-empty node, not only when the whole doc is empty (see implementation below).

2) Scoped placeholders (custom placeholder per block)

Contract
- Inputs: either a string, an object mapping nodeTypeName -> placeholder string, or a function (state, node) => string
- Outputs: Decorations applied to empty nodes with a `.empty` class and `data-placeholder` attribute
- Error modes: if unknown node type, fall back to default placeholder or nothing

Design
- Change placeholderPlugin factory to accept one argument (placeholder) where:
  - string -> global placeholder when any block is empty
  - object -> { paragraph: 'Start typing…', heading: 'Heading…', list_item: 'List item…' }
  - function -> (state, node) => placeholder string or null

Implementation steps
- Update plugin to iterate doc and create decorations for any node that is an empty textblock (node.isTextblock && node.content.size === 0). For each matching node:
  - Determine placeholder text via the provided config
  - Create a Decoration.node covering the node's positions and set `data-placeholder` to the returned string
- Performance: only compute decorations when `doc` changed or when selection/attributes that affect placeholders changed (avoid expensive scans every transaction). Use a small cache keyed by `doc` version or use `tr.docChanged` logic.
- Tests: add unit tests for paragraph, heading, and custom node types; test factory callback behavior.
- Styling: add `.empty::before { content: attr(data-placeholder) }` rules in `src/Editor/styles/prosemirror.css` or `editor.css`.

Example API usage
```js
import placeholderPlugin from './src/Editor/plugins/placeholderPlugin';

// simple per-node map
const placeholder = placeholderPlugin({
  paragraph: 'Start writing…',
  heading: 'Add a heading',
  list_item: 'List item…'
});

// or function form
const placeholder2 = placeholderPlugin((state, node) => {
  if (node.type.name === 'code_block') return null; // no placeholder in code
  return node.type.name === 'heading' ? 'Heading text' : 'Start typing';
});
```

3) Scoped abbreviations (per-note and global)

Problem statement
- Current plugin always applies everywhere. We want:
  - Global abbreviations (applied in all notes)
  - Note-scoped abbreviations that only apply inside a particular document or note (e.g., based on document meta, an attribute on the top-level node, or a namespace supplied when creating the editor)

Contract
- Inputs: plugin config with structure { global: {...}, scoped: { namespace1: {...} }, allowedNodeTypes?: string[] }
- Behavior: when trigger occurs, plugin checks (in order): scoped abbreviations for current namespace, then global abbreviations; only apply if current node type is allowed.
- API: provide helper functions to dispatch updates: setGlobalAbbreviations(view, obj), setScopedAbbreviations(view, namespace, obj), setAllowedNodeTypes(view, array).

Design choices
- How to identify note-scoped context?
  - Option A (recommended): the editor instance receives an `initialMeta` or `namespace` when created (e.g., EditorView or plugin config). The plugin stores the active namespace in its state or reads from a top-level node attribute.
  - Option B: rely on document attributes/top-level node attrs to identify note type. E.g., doc.attrs.noteType === 'meeting'
- Storage: plugin state will hold an object { global: {...}, scoped: { namespace: {...} }, allowedNodeTypes: [] }
- Updates: accept transaction meta `abbreviationPluginKey` with { type: 'update', abbreviations, namespace } semantics like currently but extend to support { scope: 'global'|'namespace', namespace: 'foo' }

Implementation steps
- Update `abbreviationPlugin` state.init to return { global: {}, scoped: {}, allowedNodeTypes: ['paragraph'] }
- Update `apply` to handle meta types: 'update' with full payload, 'update-partial' to merge, 'set-namespace' to change active namespace, 'set-allowed-node-types'.
- On triggered replacement (space/punctuation), use the following resolution order:
  1. If active namespace exists and scoped[ns][token] exists => use it
  2. else if global[token] exists => use it
  3. else no replace
- Ensure caseMatching behavior still works. Keep a function getReplacement(token, nodeType, pluginState)
- UI integration: create small helpers in `src/Editor/ProseMirroDispatcher.jsx` (or new `abbrevApi.js`) implementing the transaction dispatch helpers so UI can call `setScopedAbbreviations(view, ns, obj)`.

Edge cases & tests
- Abbrev inside code blocks, inline code marks — do not replace. So check `state.selection.$from.parent` for marks/nodes.
- Abbrev when caret is not at word boundary — ensure tokenization uses regex and checks boundaries.
- Abbrev collisions (same token in both scoped and global) — scoped wins.

4) PairedChar plugin: customization and improvements

Desired features
- Configurable pairs list (allow adding/removing pairs at runtime)
- Option to toggle wrapping selection vs inserting pair when selection present
- Option for smart skipping: skip only if the closing char was auto-inserted by plugin and positions still match
- Option to disable in certain node types (code block, html block)
- Improve behavior for symmetric quotes (single, double, backtick) to avoid aggressive skipping inside words

API / contract
- Plugin factory: `pairedCharPlugin(options)` where options: { pairs?: Map|Array, maxPairs?: number, wrapSelection?: boolean, disableIn?: ['code_block'] }
- Expose small helpers to update options at runtime via transaction meta

Implementation plan
- Refactor current `pairedCharPlugin` into a factory that accepts options and uses closure to keep default pairs but plugin state still stores inserted pairs list.
- When handling keydown for symmetric chars, test left and right context: prefer to insert if caret is at whitespace or boundary, skip only if the next char is a plugin-inserted closer and mapping still valid.
- Add guard in handleKeyDown to return false in disabled node types.
- Add unit tests covering: adding pair with selection, skipping, removing, symmetric char handling, disabled nodes.

Example usage
```js
import { pairedCharPlugin } from './src/Editor/plugins/pairedCharPlugin';

const plugin = pairedCharPlugin({
  wrapSelection: true,
  disableIn: ['code_block', 'fenced_code']
});
```

5) Tests, linting and QA
- Add unit tests for each plugin (jest + jsdom or small prosemirror-test setup). Minimum tests:
  - abbreviation: replacement in paragraph, not in code_block, scoped vs global precedence
  - placeholder: node-level placeholders and callback-based placeholders
  - pairedChar: add pair, wrap selection, skip, remove with backspace
- Add linting step if not present (ESLint already present in project root). Run `npm run lint` during CI.

6) Small developer ergonomics / UX
- Add helper file `src/Editor/abbrevApi.js` with small fns: setGlobalAbbreviations(view, obj), setScopedAbbreviations(view, ns, obj), enableAbbrevInNodeTypes(view, array)
- Add `src/Editor/pairApi.js` to update pairs at runtime.
- Add a small example page `src/Editor/Examples/PluginSandbox.jsx` showing toggles for placeholder map, pairs, and abbreviation lists.

7) Future plugin ideas (prioritized)
- High priority
  - Linkify plugin: automatically detect URLs on paste/typing and convert to link marks
  - Paste sanitizer: clean HTML on paste and optionally convert to schema nodes
  - Mention/autocomplete: support @mention suggestions
- Mid priority
  - Smart quotes & typographic replacements (— em dash, smart ellipsis)
  - Emoji/autocomplete plugin
  - Table plugin integration (prosemirror-tables or tiptap table)
- Low priority / advanced
  - Collaborative cursors (Yjs integration)
  - Image upload plugin with async upload handler
  - Spellcheck plugin (integrate browser spellcheck markers or server-side spellcheck)

8) Timeline & prioritization (small project-sized iteration)
- Sprint 1 (1-2 days)
  - Placeholder per-block implementation + small CSS
  - Minor fixes to abbreviationPlugin (normalization, exclude code blocks)
  - Add tests for both
- Sprint 2 (2-3 days)
  - Refactor pairedChar into configurable factory, add options, add tests
  - Add abbreviations API helpers and UI wiring example
- Sprint 3 (2-4 days)
  - Add linkify and paste sanitizer
  - Add Plugin sandbox example page and update README with usage

9) Files to change (suggested edits)
- `src/Editor/plugins/placeholderPlugin.js` — extend factory to accept map/function and decorate empty nodes
- `src/Editor/styles/prosemirror.css` — add `.empty::before` rule and theme variables
- `src/Editor/plugins/abbreviationPlugin.js` — expand state, normalization, support meta for scoped/global updates
- `src/Editor/ProseMirroDispatcher.jsx` — add helper dispatch functions to update abbreviations and plugin options
- `src/Editor/plugins/pairedCharPlugin.js` — refactor into factory `pairedCharPlugin(options)`
- `src/Editor/Examples/PluginSandbox.jsx` (new) — small UI for testing
- `roadmap.md` (this file)

10) QA checklist before merging
- [ ] Lint and run existing tests
- [ ] Add unit tests for new behavior and run them
- [ ] Manual test in the browser: placeholder per block, abbreviations scope, pair handling
- [ ] Add short README snippets and examples (done in repo README and can link to PluginSandbox)

If you want, I can implement Sprint 1 now: update `placeholderPlugin.js` to support per-node placeholders and add CSS, plus small unit checks and a short PluginSandbox example. Which sprint or specific task do you want me to start on first?
