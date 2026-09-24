<script lang="ts">
  import { PigeonEditor } from '@lit-pigeon/svelte';
  import type { PigeonEditor as PigeonEditorElement } from '@lit-pigeon/editor';
  import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';

  const renderer = new MjmlRenderer();
  let container: HTMLDivElement;

  // The wrapper does not expose the element, so find it inside a container you own.
  export async function exportHtml(): Promise<string | null> {
    const editor = container.querySelector<PigeonEditorElement>('pigeon-editor');
    return (await editor?.exportHtml()) ?? null;
  }
</script>

<div bind:this={container} style="height: 80vh">
  <PigeonEditor {renderer} />
</div>
