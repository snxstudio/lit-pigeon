import '@lit-pigeon/editor';
import type { PigeonEditor } from '@lit-pigeon/editor';
import type { PigeonDocument } from '@lit-pigeon/core';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

const editor = document.querySelector<PigeonEditor>('pigeon-editor')!;

// Object and function values are set as properties, never as attributes.
editor.renderer = new MjmlRenderer();
editor.documentToMjml = documentToMjml;

let latest: PigeonDocument | undefined;
editor.addEventListener('pigeon:change', (event) => {
  latest = (event as CustomEvent<{ document: PigeonDocument }>).detail.document;
});

export async function save(): Promise<{ mjml: string | null; html: string | null }> {
  return { mjml: editor.exportMjml(), html: await editor.exportHtml() };
}

export function lastChange(): PigeonDocument | undefined {
  return latest;
}
