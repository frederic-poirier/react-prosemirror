repair.md — repository scan, bugs & actionable fixes

Task receipt
I scanned the repository (key files under `src/` and `package.json`) and produced a prioritized list of bugs, inconsistencies, and recommended, actionable fixes. This file maps each problem to a file, describes the issue, explains why it matters, and suggests a minimal fix (with implementation notes).

Checklist
- [x] Find bugs and design issues across plugins and components
- [x] Provide fixes and code-location pointers
- [x] Prioritize fixes (safety-first) and list follow-ups

Summary of high-priority findings
1) `ProseMirroDispatcher.jsx` — incorrect import path for `abbreviationPluginKey` (breaks runtime initialization)
2) `AbbreviationComponent.jsx` — popover positioning bug (uses `popoverPos.right` but stored property is `left`) and potential duplicated default data
3) `abbreviationPlugin.js` — normalization, scope, and node-type checks missing; incorrect caseMatching logic
4) `placeholderPlugin.js` — only handles fully empty doc; needs per-node placeholders and better decoration ranges
5) `pairedCharPlugin.js` — behavior issues and UX: console.log left, symmetric chars handling, missing factory config, potential edge case bugs
6) `AbbreviationComponent.css` — earlier edits introduced `.abbrev-popup` grid; JS sets `position: absolute` with inline styles potentially conflicting with CSS anchor-based layout
7) `package.json` — suspicious dependency `vaul` and duplicate/odd dependencies (review)

Details and suggested fixes (actionable)

1) ProseMirroDispatcher import path
- File: `src/Editor/ProseMirroDispatcher.jsx`
- Issue: imports abbreviation key from `../Editor/plugins/abbreviationPlugin` but the file is in the same `Editor` folder at `./plugins/abbreviationPlugin`. The current import resolves to `src/Editor/Editor/plugins/...` which doesn't exist. This likely prevents the dispatcher from finding the pluginKey export at runtime and dispatching the initial abbreviations.
- Fix: change import to use a relative path from `src/Editor/ProseMirroDispatcher.jsx` to the plugins folder.
  - Replace:
    import { abbreviationPluginKey } from '../Editor/plugins/abbreviationPlugin';
  - With:
    import { abbreviationPluginKey } from './plugins/abbreviationPlugin';
- Priority: Critical (initialization bug)

2) AbbreviationComponent popover positioning + data duplication
- File: `src/components/AbbreviationComponent.jsx`
- Issues:
  - Inline styles for the popover use `left: popoverPos.right` but `popoverPos` is set with { top: rect.bottom + scrollY, left: rect.left + scrollX }. There is no `right` property — popover `left` will be `undefined`, causing layout bugs.
  - The component duplicates `defaultAbbreviations` also present in `ProseMirroDispatcher.jsx`. Keep a single source (move to a shared file `src/Editor/defaults/abbreviations.js`).
- Fixes:
  - Change inline style to use `left: popoverPos.left` and consider setting `position: fixed` or using `position: absolute` anchored to document body. If the popover is rendered inside the list, ensure container has `position: relative` or render popover at document body root.
  - Extract default abbreviations to a shared module and import from both components.
- Priority: High (UI bug + maintainability)

3) abbreviationPlugin: normalization, scoping and caseMatching bug
- File: `src/Editor/plugins/abbreviationPlugin.js`
- Issues:
  - Keys are expected to be lowercased (dispatcher lowercases), but `apply` just assigns meta.abbreviations directly with no normalization step. Risk: mixed-case keys lead to failing lookups.
  - `caseMatching` logic is incorrect: it tests `if (abbrevObj[lastWord])` rather than checking the exact-case entry; that code ignores normalized keys and will rarely pass.
  - No protection against replacements inside code blocks, link marks, or disallowed node types.
  - Only triggers on space; might want to allow punctuation triggers or configurable triggers.
- Fixes (minimal):
  - Normalize incoming abbreviations when applying meta: create a helper normalizeAbbrevObject(meta.abbreviations) that lowercases short keys and preserves `caseMatching` and `dynamic`.
  - Fix caseMatching lookup: when caseMatching true, check for exact token (use original case) before falling back to lowercased.
  - Add allowedNodeTypes option or check `state.selection.$from.parent.type.name` against an allowlist (default: paragraph, heading).
  - Make trigger configurable (space/punctuation) via optional plugin meta or plugin factory.
- Priority: High (functional bug)

4) placeholderPlugin: support per-node placeholders and correct decoration ranges
- File: `src/Editor/plugins/placeholderPlugin.js`
- Issues:
  - Current implementation only creates a single Decoration when the entire doc has one empty textblock child. It won't add placeholders to empty nodes elsewhere, or support per-node placeholders.
  - Decoration.node(0, doc.content.size, {...}) covers the whole doc; when not appropriate it may be incorrect.
- Fixes (recommended):
  - Convert the plugin factory to accept string | object | function (see `roadmap.md`).
  - In `decorations(state)` iterate `doc.descendants((node, pos) => { if (node.isTextblock && node.content.size === 0) { compute placeholder; decorations.push(Decoration.node(pos, pos + node.nodeSize, attrs)) }})`.
  - Use `DecorationSet.create(doc, decorations)` as current code does, but ensure we only compute when `tr.docChanged` or state.step changed; ProseMirror will call props.decorations frequently so keep it efficient (small doc scans are ok for small docs; add caching if needed later).
- Priority: High (feature + correctness)

5) pairedCharPlugin: behavior and API improvements
- File: `src/Editor/plugins/pairedCharPlugin.js`
- Issues & suggestions:
  - `console.log(isSymmetric)` left in `shouldSkipInsteadOfAdd`—remove it.
  - Plugin uses a fixed `pairedCharacters` Map and exports a Plugin instance. Convert to a factory `pairedCharPlugin(options)` to allow configuration (wrap selection, disable in node types, custom pairs).
  - `isCharBeforeSpaceOrEmpty` logic is permissive and can insert pairs in undesirable spots; consider checking `nodeBefore`'s last character more carefully and the surrounding marks.
  - `rangeAffected` iterates mapping.maps; it's OK but ensure mapping.map calls use correct bias.
- Fixes (minimal):
  - Remove debug logging.
  - Refactor to a factory in a follow-up (roadmap already suggests this).
  - Add a guard to skip in `code_block` and other disabled nodes.
- Priority: Medium (UX & polish)

6) CSS vs JS popover positioning mismatch
- Files: `src/components/AbbreviationComponent.css` and `src/components/AbbreviationComponent.jsx`
- Issue: CSS expects anchor/position-anchor but JS positions the popover absolutely with top/left. Choose one approach. `position-anchor` and `anchor-name` are experimental; prefer simple absolute positioning and append popover to body or ensure container relative.
- Fix: change CSS to not rely on experimental anchors; or change JS to compute and set top/left based on bounding rect and place popover in body. Also ensure `abbrev-popup` uses `display: grid` (we already changed) and remove conflicting styles.
- Priority: Medium

7) package.json review
- File: `package.json`
- Observations:
  - Dependency `vaul` looks suspicious/uncommon. Verify if intended; if not, remove or replace.
  - `react-router` and `react-router-dom` versions are 7.x — confirm compatibility with React 19. If you target v6, update imports and usage.
- Action: verify, run `npm ls vaul` or inspect where it's used. Consider removing unused deps.
- Priority: Low

Other small issues & suggestions
- Duplicate `defaultAbbreviations` in two files — extract shared file
- `AbbreviationComponent.jsx` uses `crypto.randomUUID()` which is browser-specific; consider fallback for older environments or use a small id util
- Use explicit file extensions in imports when using ESM and Node + Vite sometimes benefits from explicit `.js` in local imports (optional)
- Add unit tests for critical plugin behaviors (abbrev replacement, paired chars, placeholder per-node)

Proposed immediate actions (small PRs)
- PR1 (critical fixes):
  - Fix import path in `ProseMirroDispatcher.jsx` (`../Editor/plugins/...` -> `./plugins/...`).
  - Fix popover inline style in `AbbreviationComponent.jsx` to use `popoverPos.left` not `.right`.
  - Remove `console.log` from `pairedCharPlugin.js`.
  - Update `placeholderPlugin.js` to at least iterate doc and add per-node placeholders (minimal change) — implement the node iteration and per-node Decoration creation.

- PR2 (plugin improvements):
  - Normalize abbreviations in `abbreviationPlugin.js` and fix `caseMatching` logic.
  - Add an allowed-node-types check to prevent abbreviation in code blocks.
  - Extract default abbreviations to `src/Editor/defaults/abbreviations.js` and import from places.

- PR3 (UX and architecture):
  - Decide popover implementation (append to body vs relative). Implement consistent placement and update CSS.
  - Refactor `pairedCharPlugin` into factory supporting options. Add tests.

Testing suggestions
- Add minimal Jest + jsdom tests for `abbreviationPlugin` and `pairedCharPlugin`. For ProseMirror plugins, use the test helpers from ProseMirror (or plain small doc/EditorState runs) to verify plugin.apply/props behaviors.

If you want I can start with PR1 now and implement the immediate, safety-critical fixes. Which of the immediate actions should I do first? I recommend starting with the import/path fix and the popover left fix (two small, fast PRs) and then the placeholder improvement.


---

Architecture review — how components, dispatcher and plugins interact

Goal
- Evaluate how `AbbreviationComponent` (UI), `ProseMirroDispatcher` (bridge) and `abbreviationPlugin` (editor behavior) interact, list risks, and propose a cleaner architecture.

Current flow (existing code)
- `AbbreviationComponent.jsx` is a React UI that manages the list of abbreviations and writes them to `localStorage` and dispatches a browser CustomEvent `abbreviation-update`.
- `ProseMirroDispatcher.jsx` listens for that CustomEvent and, when the `ProseMirror` view is available via `useEditorEffect`, dispatches a transaction with meta keyed by `abbreviationPluginKey` to update the plugin state.
- `abbreviationPlugin.js` stores abbreviations in plugin state and listens for `handleKeyDown` to trigger replacements.

Strengths of current design
- Clear separation of concerns: UI component owns persistence and editing; dispatcher bridges UI and ProseMirror plugin; plugin only implements editor logic.
- Minimal coupling: components do not import ProseMirror view directly.

Risks and issues
- Fragile coupling via CustomEvent: global events are implicit and hard to trace; if multiple editor instances exist they will all receive the same event.
- Initialization race: if `abbreviation-update` fires before ProseMirror view is ready, `ProseMirroDispatcher` stores a pending object; this is handled but it's implicit and scattered.
- Import path fragility: incorrect relative imports (as found) can break the bridge.
- No versioning or payload validation for abbreviation updates — malformed payloads will silently fail.
- Global localStorage as single source of truth prevents multi-document scoping (can't have per-note scoped abbreviations easily).

Recommended architecture improvements (concrete)

1) Replace CustomEvent with explicit API surface exported from dispatcher
- Create `src/Editor/abbrevApi.js` with functions:
  - `initAbbrevForView(view, initialAbbrevs)` — attaches abbrev to a particular view via TR or plugin meta
  - `updateAbbrevsForView(view, abbrevObj)` — update for a specific view
  - `broadcastAbbrevUpdate(abbrevObj)` — optional global broadcast (for multi-editor apps)
- Benefits: explicit imports, type-safety, easier to test, avoids global event bus surprises.

2) Move persistence out of UI component (optional but recommended)
- Create a small persistence module `src/Editor/abbrevStore.js` exposing get/set for abbreviations and supporting namespaced stores (per-note). UI components import and call store APIs; dispatchers read from store and push to plugin.
- This enables per-note scoped abbreviations by passing a `namespace` argument.

3) Make dispatcher per-editor-instance and explicit
- Currently `ProseMirroDispatcher` is a React component that uses `useEditorEffect` to get the view and push initial state. Keep it, but make its API explicit: accept props `initialAbbrevs` and `namespace`. Do not rely on global events. Example:

```jsx
<ProseMirror>
  <ProseMirrorDoc />
  <ProseMirrorDispatcher initialAbbrevs={initial} namespace={noteId} />
</ProseMirror>
```

4) Validate abbreviation payloads before dispatch
- `abbrevApi.updateAbbrevsForView` should validate shape (array vs object, keys are strings, values have `full`) and normalize keys before dispatching.

5) Plugin extension points
- Change `abbreviationPlugin` into a factory `abbreviationPlugin(options)` where `options` can include `allowedNodeTypes`, `triggers`, `namespaceResolver`.
- This allows each editor instance to create a plugin instance configured for its note type and namespace and prevents global state collisions.

6) Consider using plugin state for per-view scoping rather than global events
- Each editor instance should have its own abbreviation plugin instance (created via factory) and receive its initial config via plugin state when the view is created. `ProseMirroDispatcher` would then call `initAbbrevForView(view, obj)` which dispatches a TR with the plugin key for that view's plugin instance.

Example improved flow
1. App reads saved abbreviations from `abbrevStore.get(namespace)`.
2. Editor mounts and creates plugin instances with per-view options: `abbreviationPlugin({ namespace })`.
3. `ProseMirroDispatcher` calls `initAbbrevForView(view, initialObj)`.
4. `AbbreviationComponent` edits the store via `abbrevStore.set(namespace, entries)` and calls `abbrevApi.updateAbbrevsForView(view, entries)` (explicit view) or `abbrevApi.broadcastAbbrevUpdate(entries)` if desired.

Benefits summary
- Explicit view-scoped APIs remove global event reliance and make multi-editor scenarios robust.
- Plugin factory pattern allows per-view customization and safer application of abbreviations.
- Small persistence layer enables namespacing and future cloud sync without UI changes.

Small incremental migration plan
- Step 1: Extract `abbrevApi.js` and change `ProseMirroDispatcher` to import and use its `initAbbrevForView` instead of listening to window events.
- Step 2: Implement `abbrevStore.js` and update `AbbreviationComponent` to use it.
- Step 3: Make `abbreviationPlugin` a factory and update Editor creation to call `abbreviationPlugin({ namespace })`.

Notes about testing & observability
- Add console.debug lines in `abbrevApi` during migration only to validate flow.
- Add unit tests for `abbrevApi` and `abbrevStore` to validate normalization, namespacing, and update flows.

---

End of architecture review.
