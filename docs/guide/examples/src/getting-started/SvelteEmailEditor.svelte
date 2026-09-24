<script lang="ts">
  import { PigeonEditor, type PigeonDocument } from '@lit-pigeon/svelte';
  import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

  export let initial: PigeonDocument | undefined = undefined;
  export let onSave: (result: { mjml: string; html: string }) => void = () => {};

  const renderer = new MjmlRenderer();
  let latest: PigeonDocument | undefined = initial;

  function handleChange(event: CustomEvent<{ document: PigeonDocument }>) {
    latest = event.detail.document;
  }

  async function save() {
    if (!latest) return;
    const mjml = documentToMjml(latest);
    const { html } = await renderer.render(latest);
    onSave({ mjml, html });
  }
</script>

<div style="height: 80vh">
  <PigeonEditor document={initial} {renderer} {documentToMjml} on:change={handleChange} />
</div>
<button type="button" on:click={save}>Save</button>
