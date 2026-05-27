<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import '@lit-pigeon/editor';
  import type { PigeonEditor as PigeonEditorWC } from '@lit-pigeon/editor';
  import type {
    PigeonDocument,
    EditorConfig,
    Renderer,
    Selection,
  } from '@lit-pigeon/core';

  /** Optional initial document. */
  export let document: PigeonDocument | undefined = undefined;
  /** Optional editor configuration. */
  export let config: Partial<EditorConfig> | undefined = undefined;
  /** Optional renderer for preview mode. */
  export let renderer: Renderer | undefined = undefined;
  /** Optional function to convert a document to MJML. */
  export let documentToMjml:
    | ((doc: PigeonDocument) => string)
    | undefined = undefined;

  /**
   * Typed Svelte event map. Each DOM event from `<pigeon-editor>` is
   * forwarded as a Svelte event with the original `event.detail` payload.
   */
  type Events = {
    change: { document: PigeonDocument };
    select: { selection: Selection | null };
    ready: void;
    preview: unknown;
    exportHtml: { html: string };
    exportMjml: { mjml: string | null };
    exportJson: { document: PigeonDocument };
    mergeTagRequest: unknown;
  };

  const dispatch = createEventDispatcher<Events>();

  let el: PigeonEditorWC | undefined;
  const listeners: Array<[string, EventListener]> = [];

  // Map of underlying DOM event -> Svelte event name.
  const EVENT_MAP: ReadonlyArray<readonly [string, keyof Events]> = [
    ['pigeon:change', 'change'],
    ['pigeon:select', 'select'],
    ['pigeon:ready', 'ready'],
    ['pigeon:preview', 'preview'],
    ['pigeon:export-html', 'exportHtml'],
    ['pigeon:export-mjml', 'exportMjml'],
    ['pigeon:export-json', 'exportJson'],
    ['pigeon:merge-tag-request', 'mergeTagRequest'],
  ];

  function syncProp<K extends keyof PigeonEditorWC>(
    target: PigeonEditorWC,
    key: K,
    value: PigeonEditorWC[K] | undefined,
  ) {
    if (value !== undefined) {
      target[key] = value;
    }
  }

  // Reactive prop -> DOM property sync. Object inputs become properties, never
  // attributes, mirroring the React/Angular/Vue wrappers.
  $: if (el && document !== undefined) el.document = document;
  $: if (el && config !== undefined) el.config = config;
  $: if (el && renderer !== undefined) el.renderer = renderer;
  $: if (el && documentToMjml !== undefined) el.documentToMjml = documentToMjml;

  onMount(() => {
    if (!el) return;

    syncProp(el, 'document', document);
    syncProp(el, 'config', config);
    syncProp(el, 'renderer', renderer);
    syncProp(el, 'documentToMjml', documentToMjml);

    for (const [domEvent, svelteEvent] of EVENT_MAP) {
      const handler: EventListener = (e) => {
        const detail = (e as CustomEvent).detail;
        // `dispatch` is strictly typed; cast at the boundary since DOM
        // event payloads are not statically narrowed.
        (dispatch as (event: string, payload?: unknown) => void)(
          svelteEvent,
          detail,
        );
      };
      el.addEventListener(domEvent, handler);
      listeners.push([domEvent, handler]);
    }
  });

  onDestroy(() => {
    if (!el) return;
    for (const [domEvent, handler] of listeners) {
      el.removeEventListener(domEvent, handler);
    }
    listeners.length = 0;
  });
</script>

<pigeon-editor bind:this={el}></pigeon-editor>

<style>
  pigeon-editor {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
