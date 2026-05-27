import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from 'vue';
import '@lit-pigeon/editor';
import type { PigeonEditor as PigeonEditorWC } from '@lit-pigeon/editor';
import type {
  PigeonDocument,
  EditorConfig,
  Renderer,
  Selection,
} from '@lit-pigeon/core';

/** Map of DOM event name -> Vue emit name. */
const EVENT_MAP: ReadonlyArray<readonly [string, string]> = [
  ['pigeon:change', 'change'],
  ['pigeon:select', 'select'],
  ['pigeon:ready', 'ready'],
  ['pigeon:preview', 'preview'],
  ['pigeon:export-html', 'exportHtml'],
  ['pigeon:export-mjml', 'exportMjml'],
  ['pigeon:export-json', 'exportJson'],
  ['pigeon:merge-tag-request', 'mergeTagRequest'],
];

/**
 * Vue 3 wrapper around the `<pigeon-editor>` custom element.
 *
 * Object-shaped inputs (`document`, `config`, `renderer`, `documentToMjml`)
 * are assigned as DOM properties on the underlying element rather than
 * stringified into attributes. DOM events fired by the element are
 * re-emitted as idiomatic Vue events with the original `event.detail`
 * payload.
 */
export const PigeonEditor = defineComponent({
  name: 'PigeonEditor',
  props: {
    document: {
      type: Object as PropType<PigeonDocument>,
      default: undefined,
    },
    config: {
      type: Object as PropType<Partial<EditorConfig>>,
      default: undefined,
    },
    renderer: {
      type: Object as PropType<Renderer>,
      default: undefined,
    },
    documentToMjml: {
      type: Function as PropType<(doc: PigeonDocument) => string>,
      default: undefined,
    },
  },
  emits: {
    change: (_payload: { document: PigeonDocument }) => true,
    select: (_payload: { selection: Selection | null }) => true,
    ready: () => true,
    preview: (_payload: unknown) => true,
    exportHtml: (_payload: { html: string }) => true,
    exportMjml: (_payload: { mjml: string | null }) => true,
    exportJson: (_payload: { document: PigeonDocument }) => true,
    mergeTagRequest: (_payload: unknown) => true,
  },
  setup(props, { emit }) {
    const elRef = ref<PigeonEditorWC | null>(null);
    const listeners: Array<[string, EventListener]> = [];

    const syncProp = <K extends keyof PigeonEditorWC>(
      el: PigeonEditorWC,
      key: K,
      value: PigeonEditorWC[K] | undefined,
    ) => {
      if (value !== undefined) {
        el[key] = value;
      }
    };

    onMounted(() => {
      const el = elRef.value;
      if (!el) return;

      syncProp(el, 'document', props.document);
      syncProp(el, 'config', props.config);
      syncProp(el, 'renderer', props.renderer);
      syncProp(el, 'documentToMjml', props.documentToMjml);

      for (const [domEvent, vueEvent] of EVENT_MAP) {
        const handler: EventListener = (e) => {
          const detail = (e as CustomEvent).detail;
          // Vue's emit signature accepts any payload; cast to satisfy the
          // typed emits map above.
          (emit as (event: string, payload?: unknown) => void)(vueEvent, detail);
        };
        el.addEventListener(domEvent, handler);
        listeners.push([domEvent, handler]);
      }
    });

    watch(
      () => props.document,
      (value) => {
        if (elRef.value && value !== undefined) {
          elRef.value.document = value;
        }
      },
    );
    watch(
      () => props.config,
      (value) => {
        if (elRef.value && value !== undefined) {
          elRef.value.config = value;
        }
      },
    );
    watch(
      () => props.renderer,
      (value) => {
        if (elRef.value && value !== undefined) {
          elRef.value.renderer = value;
        }
      },
    );
    watch(
      () => props.documentToMjml,
      (value) => {
        if (elRef.value && value !== undefined) {
          elRef.value.documentToMjml = value;
        }
      },
    );

    onBeforeUnmount(() => {
      const el = elRef.value;
      if (!el) return;
      for (const [domEvent, handler] of listeners) {
        el.removeEventListener(domEvent, handler);
      }
      listeners.length = 0;
    });

    return () => h('pigeon-editor', { ref: elRef });
  },
});

export type PigeonEditorInstance = InstanceType<typeof PigeonEditor>;

// Re-export core types for consumer convenience.
export type {
  PigeonDocument,
  EditorConfig,
  Renderer,
  RenderOptions,
  RenderResult,
  Selection,
  ContentBlock,
  RowNode,
  ColumnNode,
  BlockType,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  SocialBlock,
  HtmlBlock,
  HeroBlock,
  NavBarBlock,
  NavLink,
  Spacing,
  SocialIcon,
  AssetManagerConfig,
  MergeTag,
  MergeTagConfig,
} from '@lit-pigeon/core';
