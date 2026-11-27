import type { PigeonEditor } from '@lit-pigeon/editor';

// The editor only opens its preview panel once it has a renderer.
export function loadRendererOnPreview(editor: PigeonEditor) {
  editor.addEventListener('pigeon:preview', async () => {
    const { MjmlRenderer, documentToMjml } = await import('@lit-pigeon/renderer-mjml');
    editor.renderer = new MjmlRenderer();
    editor.documentToMjml = documentToMjml;
    editor.showPreview();
  }, { once: true });
}
