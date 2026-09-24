import { useRef, useState } from 'react';
import { PigeonEditor, type PigeonDocument } from '@lit-pigeon/react';
import type { PigeonEditor as PigeonEditorElement } from '@lit-pigeon/editor';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

// Create the renderer once, outside the component, so the prop stays stable.
const renderer = new MjmlRenderer();

interface Props {
  initial?: PigeonDocument;
  onSave: (result: { mjml: string | null; html: string | null }) => void;
}

export function EmailEditor({ initial, onSave }: Props) {
  const editorRef = useRef<PigeonEditorElement>(null);
  // Keep the initial document stable: a new object on every render reloads the editor.
  const [document] = useState(initial);
  const [dirty, setDirty] = useState(false);

  async function save() {
    const editor = editorRef.current;
    if (!editor) return;
    onSave({ mjml: editor.exportMjml(), html: await editor.exportHtml() });
    setDirty(false);
  }

  return (
    <>
      <PigeonEditor
        ref={editorRef}
        document={document}
        renderer={renderer}
        documentToMjml={documentToMjml}
        style={{ display: 'block', height: '80vh' }}
        // pigeon:change also fires when a document is loaded; only a new object is an edit.
        onChange={(e) => setDirty(e.detail.document !== document)}
      />
      <button type="button" onClick={save} disabled={!dirty}>
        Save
      </button>
    </>
  );
}
