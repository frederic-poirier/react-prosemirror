import { useState } from "react";
import { ProseMirror, ProseMirrorDoc } from "@handlewithcare/react-prosemirror";
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";
import { history, undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";

import { pairedCharPlugin } from "./plugins/pairedCharPlugin";
import { abbreviationPlugin } from "./plugins/abbreviationPlugin";
import placeholderPlugin from "./plugins/placeholderPlugin";
import ProseMirrorDispatcher from './ProseMirroDispatcher'

import './styles/editor.css'
import './styles/prosemirror.css'


let PLACEHOLDER = 'Type here';

export default function Editor() {
  const [state, setState] = useState(
    EditorState.create({
      schema,
      plugins: [
        pairedCharPlugin,
        placeholderPlugin(PLACEHOLDER),
        history(),
        keymap(baseKeymap),
        keymap({
          "Mod-z": undo,
          "Shift-Mod-z": redo,
          "Mod-y": redo,
        }),
        abbreviationPlugin,
      ],
    })
  );

  return (
    <main className="editor">
      <input type="text" name="title" id="editor-title" placeholder="Title" />
      <ProseMirror
        state={state}
        dispatchTransaction={(tr) => setState((prev) => prev.apply(tr))}
      >
        <ProseMirrorDoc />
        <ProseMirrorDispatcher />
      </ProseMirror>
    </main>
  );
}
