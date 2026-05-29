# Lit Pigeon — Custom Block Plugin API

**Status:** The plugin API is end-to-end. A `BlockDefinition` can now register a custom block that **renders on the canvas** (`renderCanvas`), **exports to MJML** (`renderMjml`), and is **edited in the properties panel** (`propertySchema`) — plus commands and plugin state — all without forking `@lit-pigeon/editor`. See the per-feature sections below.

This guide is for developers who want to add a custom block type, register editor commands, or extend the document with their own state. It assumes familiarity with the [AI authoring spec](../ai-spec/) for the document shape.

---

## Plugin model in 30 seconds

A plugin is a plain object implementing `PigeonPlugin`. It can declare any combination of: block definitions registered into the global block registry, named commands, per-plugin state stored on `EditorState`, and a state-change hook. The shape lives in [`packages/core/src/types/editor.ts`](../../packages/core/src/types/editor.ts):

```typescript
export interface PigeonPlugin {
  /** Unique name; collisions throw at registration time. */
  name: string;

  /** Build the plugin's initial state. Called once when the editor mounts. */
  init?(state: EditorStateSnapshot): unknown;

  /** Called after every transaction; returns the next plugin state. */
  apply?(tr: TransactionSnapshot, pluginState: unknown): unknown;

  /** Optional notification hook fired after a state swap. */
  onStateChange?(newState: EditorStateSnapshot, oldState: EditorStateSnapshot): void;

  /** Block definitions to register into the global block registry. */
  blocks?: BlockDefinition[];

  /** Editor commands. Each is a `(state, dispatch?) => boolean`. */
  commands?: Record<string, Command>;
}
```

The history plugin in [`packages/core/src/history/history-plugin.ts`](../../packages/core/src/history/history-plugin.ts) is the canonical example. It implements `name`, `init`, and `apply` — undo and redo are exported as commands that read history state through `state.plugins.get('history')`.

Plugins are passed to `EditorState.create({ plugins })`. The editor shell (`<pigeon-editor>`) accepts additional plugins through its `config` property and always injects history if you don't supply it yourself.

---

## Anatomy of a custom block

Three pieces, in this order:

### 1. A TypeScript type for the block

The core `ContentBlock` is a closed discriminated union exported from [`packages/core/src/types/document.ts`](../../packages/core/src/types/document.ts). It cannot be extended via declaration merging because it's a union, not an interface. Instead, declare your block locally and widen the union in your own code:

```typescript
import type { ContentBlock, Spacing } from '@lit-pigeon/core';

export interface QuoteBlock {
  id: string;
  type: 'quote';
  values: {
    quote: string;
    attribution: string;
    padding: Spacing;
    alignment: 'left' | 'center' | 'right';
  };
}

/** Use this everywhere a "block in your app" is meant. */
export type AppBlock = ContentBlock | QuoteBlock;
```

When you read a block back from the document (e.g. from `doc.body.rows[…].columns[…].blocks`), narrow on `block.type`. The TypeScript compiler will treat unknown `type` values as exhaustive `never` against the core union, so cast through `AppBlock` at the consumer boundary.

### 2. A `BlockDefinition` registered into the block registry

The registry in [`packages/core/src/schema/block-registry.ts`](../../packages/core/src/schema/block-registry.ts) holds the metadata used by tooling (defaults factory, MCP `list_block_types`, palette enumeration when you wire one). Either register manually with `registerBlock(...)` or — preferred — return the definition from your plugin's `blocks` array. The plugin registry will register them for you.

```typescript
import type { BlockDefinition } from '@lit-pigeon/core';

export const quoteDefinition: BlockDefinition = {
  type: 'quote',
  label: 'Quote',
  icon: '"',
  defaultValues: {
    quote: 'A short, memorable line.',
    attribution: '— Anonymous',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    alignment: 'left',
  },
};
```

`isKnownBlockType('quote')` will return `true` after registration. `getBlockDefinition('quote')` returns the same object.

### 3. A canvas renderer and a property panel

The editor ships per-block Lit components for both. Use the existing files as templates:

- Canvas renderers: [`packages/editor/src/components/blocks/image-block.ts`](../../packages/editor/src/components/blocks/image-block.ts) and [`button-block.ts`](../../packages/editor/src/components/blocks/button-block.ts) — selected-outline styling and `block-select` dispatch live there.
- Property panels: [`packages/editor/src/components/properties/panels/text-panel.ts`](../../packages/editor/src/components/properties/panels/text-panel.ts) and [`button-panel.ts`](../../packages/editor/src/components/properties/panels/button-panel.ts) — `property-change` event shape lives there.

The pieces are reusable Lit elements; the limitation is wiring them into the canvas. See [Known gaps](#known-gaps).

---

## Walk-through: a "Quote" block

A full example showing every piece. All code blocks compile against `@lit-pigeon/core` 0.1 and Lit 3.

### Type and factory

```typescript
// quote-block.ts
import type { ContentBlock, Spacing } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';

export interface QuoteBlock {
  id: string;
  type: 'quote';
  values: {
    quote: string;
    attribution: string;
    padding: Spacing;
    alignment: 'left' | 'center' | 'right';
  };
}

export type AppBlock = ContentBlock | QuoteBlock;

export function createQuoteBlock(
  overrides: Partial<QuoteBlock['values']> = {},
): QuoteBlock {
  return {
    id: generateId(),
    type: 'quote',
    values: {
      quote: 'A short, memorable line.',
      attribution: '— Anonymous',
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      alignment: 'left',
      ...overrides,
    },
  };
}
```

### Block definition

```typescript
// quote-definition.ts
import type { BlockDefinition } from '@lit-pigeon/core';

export const quoteDefinition: BlockDefinition = {
  type: 'quote',
  label: 'Quote',
  icon: '"',
  defaultValues: {
    quote: 'A short, memorable line.',
    attribution: '— Anonymous',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    alignment: 'left',
  },
};
```

### Insert command

Commands construct an invertible `Step` and dispatch a transaction. Pattern lifted from [`packages/core/src/commands/block-commands.ts`](../../packages/core/src/commands/block-commands.ts):

```typescript
// quote-commands.ts
import type {
  Command,
  EditorStateSnapshot,
  TransactionSnapshot,
  ContentBlock,
} from '@lit-pigeon/core';
import { createDocStep, createBlockSelection } from '@lit-pigeon/core';
import { createQuoteBlock } from './quote-block.js';

export function insertQuote(rowId: string, columnId: string): Command {
  return (state: EditorStateSnapshot, dispatch?: (tr: TransactionSnapshot) => void) => {
    const rowIndex = state.doc.body.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return false;
    const colIndex = state.doc.body.rows[rowIndex].columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) return false;

    if (!dispatch) return true;

    const block = createQuoteBlock();
    const insertIndex = state.doc.body.rows[rowIndex].columns[colIndex].blocks.length;

    const tr = state.createTransaction();
    tr.addStep(createDocStep(
      'insertQuote',
      `body.rows[${rowIndex}].columns[${colIndex}].blocks`,
      (doc) => {
        // QuoteBlock widens ContentBlock at the consumer boundary.
        doc.body.rows[rowIndex].columns[colIndex].blocks.splice(
          insertIndex, 0, block as unknown as ContentBlock,
        );
      },
      (doc) => {
        doc.body.rows[rowIndex].columns[colIndex].blocks.splice(insertIndex, 1);
      },
    ));
    tr.setSelection(createBlockSelection(rowId, columnId, block.id));
    dispatch(tr);
    return true;
  };
}
```

### Canvas component

Match the conventions in `image-block.ts` and `button-block.ts`: a `block` property, a reflected `selected` boolean attribute, and a `block-select` event on click.

```typescript
// pigeon-quote-block.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { QuoteBlock } from './quote-block.js';

@customElement('pigeon-quote-block')
export class PigeonQuoteBlock extends LitElement {
  @property({ type: Object })
  block!: QuoteBlock;

  @property({ type: Boolean, reflect: true })
  selected = false;

  static styles = css`
    :host { display: block; cursor: pointer; }
    :host([selected]) .wrapper {
      outline: 2px solid var(--pigeon-selected-outline, #3b82f6);
      outline-offset: 0;
    }
    blockquote { margin: 0; font-style: italic; }
    .cite { display: block; margin-top: 8px; font-size: 13px; opacity: 0.7; }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const pad = `padding: ${v.padding.top}px ${v.padding.right}px ${v.padding.bottom}px ${v.padding.left}px;`;
    return html`
      <div class="wrapper" style="${pad} text-align: ${v.alignment};" @click=${this._select}>
        <blockquote>${v.quote}</blockquote>
        <span class="cite">${v.attribution}</span>
      </div>
    `;
  }

  private _select(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('block-select', {
      detail: { blockId: this.block.id },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-quote-block': PigeonQuoteBlock;
  }
}
```

### Property panel

Match the shape of `pigeon-spacer-panel` / `pigeon-text-panel` — emit a `property-change` event with `{ rowId, columnId, blockId, values }`. The editor shell already wires `property-change` to `updateBlock`, so partial `values` patches are committed and history-tracked.

```typescript
// pigeon-quote-panel.ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { QuoteBlock } from './quote-block.js';

@customElement('pigeon-quote-panel')
export class PigeonQuotePanel extends LitElement {
  @property({ type: Object })
  block!: QuoteBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    return html`
      <h3>Quote Properties</h3>
      <label>Quote</label>
      <textarea .value=${v.quote} @change=${this._onQuote}></textarea>
      <label>Attribution</label>
      <input type="text" .value=${v.attribution} @change=${this._onAttribution} />
    `;
  }

  private _emit(values: Partial<QuoteBlock['values']>) {
    this.dispatchEvent(new CustomEvent('property-change', {
      detail: {
        rowId: this.rowId,
        columnId: this.columnId,
        blockId: this.block.id,
        values,
      },
      bubbles: true,
      composed: true,
    }));
  }

  private _onQuote(e: Event) {
    this._emit({ quote: (e.target as HTMLTextAreaElement).value });
  }

  private _onAttribution(e: Event) {
    this._emit({ attribution: (e.target as HTMLInputElement).value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-quote-panel': PigeonQuotePanel;
  }
}
```

### The plugin

```typescript
// quote-plugin.ts
import type { PigeonPlugin } from '@lit-pigeon/core';
import { quoteDefinition } from './quote-definition.js';
import { insertQuote } from './quote-commands.js';

export function createQuotePlugin(): PigeonPlugin {
  return {
    name: 'quote',
    blocks: [quoteDefinition],
    commands: {
      // Bind the curried command here, or call insertQuote(rowId, colId)
      // from your toolbar code and pass it to state.apply().
      insertQuoteAtSelection: (state, dispatch) => {
        const sel = state.selection;
        if (!sel || sel.type !== 'block' || !sel.rowId || !sel.columnId) return false;
        return insertQuote(sel.rowId, sel.columnId)(state, dispatch);
      },
    },
  };
}
```

### Consumer usage

```typescript
import { EditorState, createDefaultDocument, createHistoryPlugin } from '@lit-pigeon/core';
import { createQuotePlugin } from './quote-plugin.js';
import './pigeon-quote-block.js';
import './pigeon-quote-panel.js';

const state = EditorState.create({
  doc: createDefaultDocument('My Email'),
  plugins: [createHistoryPlugin(), createQuotePlugin()],
});
```

Or via the editor shell:

```html
<pigeon-editor id="editor"></pigeon-editor>
<script type="module">
  import '@lit-pigeon/editor';
  import { createQuotePlugin } from './quote-plugin.js';
  const editor = document.querySelector('#editor');
  editor.config = { plugins: [createQuotePlugin()] };
</script>
```

---

## <a id="known-gaps"></a> Known gaps

> **Canvas & MJML dispatch now fall back to the registry.** When `block.type`
> isn't a built-in, [`pigeon-column.ts`](../../packages/editor/src/components/canvas/pigeon-column.ts)
> calls your `BlockDefinition.renderCanvas(block)` (returning an HTML string)
> and [`document-to-mjml.ts`](../../packages/renderer-mjml/src/document-to-mjml.ts)
> calls `renderMjml(block)`. If you omit `renderCanvas`, the canvas shows a
> labelled, selectable placeholder instead of an error; if you omit
> `renderMjml`, export emits an explanatory comment. `createBlock(type)`
> constructs registry blocks from their `defaultValues`.
>
> ```ts
> registerBlock({
>   type: 'quote',
>   label: 'Quote',
>   icon: 'quote',
>   defaultValues: { text: '', cite: '' },
>   renderCanvas: (b) => `<blockquote>${b.values.text}</blockquote>`,
>   renderMjml: (b) => `<mj-text font-style="italic">${b.values.text}</mj-text>`,
> });
> ```
>
> **Property panel — declare a `propertySchema`.** Add a `propertySchema` to
> your `BlockDefinition` and selecting the block renders an editable form that
> writes straight back to `block.values` (no custom panel component needed):
>
> ```ts
> registerBlock({
>   type: 'quote',
>   label: 'Quote',
>   icon: 'quote',
>   defaultValues: { text: '', cite: '', align: 'left' },
>   renderCanvas: (b) => `<blockquote>${b.values.text}</blockquote>`,
>   renderMjml: (b) => `<mj-text>${b.values.text}</mj-text>`,
>   propertySchema: [
>     { key: 'text', label: 'Quote', type: 'textarea' },
>     { key: 'cite', label: 'Attribution', type: 'text' },
>     { key: 'align', label: 'Align', type: 'select',
>       options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] },
>   ],
> });
> ```
>
> Field `type`s: `text`, `textarea`, `number` (`min`/`max`/`step`), `color`,
> `checkbox`, `select` (`options`). Blocks with no `propertySchema` still show a
> labelled placeholder. For richer/interactive editors beyond these field
> types, build your own panel and drive `updateBlock` from your commands.
>
> `renderCanvas` output is injected with `unsafeHTML`, so the plugin author is
> responsible for sanitising any user-derived content it interpolates.

---

## Commands

A command is `(state: EditorStateSnapshot, dispatch?: (tr: TransactionSnapshot) => void) => boolean`. The shape lives in [`packages/core/src/types/editor.ts`](../../packages/core/src/types/editor.ts). It must return `true` when the command would apply, and `false` when the preconditions don't hold. When `dispatch` is omitted, the command is in "would-this-work" probe mode and must not mutate state.

The built-in commands in [`packages/core/src/commands/`](../../packages/core/src/commands/) (`insertBlock`, `updateBlock`, `moveBlock`, `deleteBlock`, `duplicateBlock`, `insertRow`, `moveRow`, `deleteRow`, `duplicateRow`, `addColumn`, `removeColumn`, `resizeColumns`, `updateRowAttributes`) are the reference for the pattern: factory function returns a curried command bound to ids.

Plugin commands are merged into one registry by `PluginRegistry.getCommands()` ([`plugin-registry.ts`](../../packages/core/src/plugins/plugin-registry.ts)). Two plugins exposing a command under the same key will collide silently — last one wins. Namespace your command keys (`quote.insert` is safer than `insertQuote`).

---

## Custom plugins (not blocks)

A plugin doesn't have to register blocks. It can be pure state: subscribe to every transaction, accumulate something, and expose it back via `state.plugins.get(name)`. The history plugin is the worked example.

```typescript
// excerpt from packages/core/src/history/history-plugin.ts
export function createHistoryPlugin(): PigeonPlugin {
  return {
    name: HISTORY_PLUGIN_NAME,

    init(): HistoryState {
      return createHistoryState();
    },

    apply(tr: TransactionSnapshot, pluginState: unknown): HistoryState {
      const history = pluginState as HistoryState;
      if (tr.meta.get('isUndo') || tr.meta.get('isRedo')) {
        return tr.meta.get('newHistory') as HistoryState ?? history;
      }
      if (tr.steps.length === 0 || tr.meta.get('skipHistory')) {
        return history;
      }
      return pushToHistory(history, {
        steps: [...tr.steps],
        doc: tr.doc,
        timestamp: Date.now(),
      });
    },
  };
}
```

Lifecycle:

- `init(state)` runs once when `EditorState.create` is called. The return value becomes the plugin's initial state.
- `apply(tr, pluginState)` runs after each transaction, before the new `EditorState` is returned. Its return value replaces the plugin state.
- `onStateChange(newState, oldState)` is a notification hook for side effects (analytics, telemetry, autosave). It must not call `dispatch`.

Read plugin state with `state.plugins.get(name)`. Communicate between commands and `apply` through `tr.setMeta(key, value)` — see how `undo` and `redo` set `isUndo`/`isRedo`/`newHistory` meta in [`history-plugin.ts`](../../packages/core/src/history/history-plugin.ts).

---

## MJML rendering

The MJML renderer in [`packages/renderer-mjml/src/document-to-mjml.ts`](../../packages/renderer-mjml/src/document-to-mjml.ts) maps each block type through an internal `switch (block.type)`. Per-block render functions live in [`packages/renderer-mjml/src/block-renderers/`](../../packages/renderer-mjml/src/block-renderers/) — e.g. `text.ts`:

```typescript
import type { TextBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

export function renderTextBlock(block: TextBlock): string {
  const { content, padding, textAlign, lineHeight } = block.values;
  return `<mj-text padding="${spacingToMjml(padding)}" align="${textAlign}" line-height="${lineHeight}">${content}</mj-text>`;
}
```

A renderer for the Quote block:

```typescript
import type { QuoteBlock } from './quote-block.js';

export function renderQuoteBlock(block: QuoteBlock): string {
  const { quote, attribution, padding, alignment } = block.values;
  const pad = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return [
    `<mj-text padding="${pad}" align="${alignment}">`,
    `  <blockquote>${esc(quote)}</blockquote>`,
    `  <p style="opacity:0.7;font-size:13px">${esc(attribution)}</p>`,
    `</mj-text>`,
  ].join('\n');
}
```

> **Wiring it in.** Assign this function to your `BlockDefinition.renderMjml`
> and `document-to-mjml.ts` calls it automatically for `quote` blocks — no fork
> needed:
>
> ```ts
> registerBlock({ /* …quote def… */, renderMjml: renderQuoteBlock });
> ```
>
> Passing your own `documentToMjml` to `<pigeon-editor>` still works if you want
> to override the whole pipeline, but for a single block the `renderMjml` hook
> is the simplest path.

---

## Testing custom blocks

The block-registry tests in [`packages/core/__tests__/schema.test.ts`](../../packages/core/__tests__/schema.test.ts) are the template for verifying defaults and discoverability:

```typescript
import { describe, it, expect } from 'vitest';
import { getBlockDefinition, isKnownBlockType, registerBlock } from '@lit-pigeon/core';
import { quoteDefinition } from './quote-definition.js';

describe('quote block', () => {
  beforeAll(() => {
    registerBlock(quoteDefinition);
  });

  it('is registered', () => {
    expect(isKnownBlockType('quote')).toBe(true);
    expect(getBlockDefinition('quote')?.label).toBe('Quote');
  });

  it('exposes sane defaults', () => {
    const def = getBlockDefinition('quote');
    expect(def?.defaultValues).toMatchObject({
      attribution: '— Anonymous',
      alignment: 'left',
    });
  });
});
```

Property-panel tests follow the pattern in [`packages/editor/__tests__/spacer-panel.test.ts`](../../packages/editor/__tests__/spacer-panel.test.ts): mount the panel with a hand-rolled block, dispatch a control event, assert the `property-change` event detail. Use `panel.updateComplete` to wait for Lit's render before querying the shadow DOM.

---

## Reference

| File | What's in it |
|---|---|
| [`packages/core/src/types/editor.ts`](../../packages/core/src/types/editor.ts) | `PigeonPlugin`, `BlockDefinition`, `Command`, `EditorStateSnapshot`, `TransactionSnapshot`, `Step`. |
| [`packages/core/src/plugins/plugin-registry.ts`](../../packages/core/src/plugins/plugin-registry.ts) | `PluginRegistry` — register, unregister, enumerate, gather commands. |
| [`packages/core/src/schema/block-registry.ts`](../../packages/core/src/schema/block-registry.ts) | `registerBlock`, `getBlockDefinition`, `getAllBlockDefinitions`, `isKnownBlockType`. |
| [`packages/core/src/history/history-plugin.ts`](../../packages/core/src/history/history-plugin.ts) | Canonical worked example of a stateful plugin. |
| [`packages/core/src/commands/`](../../packages/core/src/commands/) | Reference commands — `block-commands.ts`, `row-commands.ts`, `column-commands.ts`. |
| [`packages/renderer-mjml/src/document-to-mjml.ts`](../../packages/renderer-mjml/src/document-to-mjml.ts) | MJML render pipeline (switch-based). |
| [`packages/renderer-mjml/src/block-renderers/`](../../packages/renderer-mjml/src/block-renderers/) | Per-block MJML renderers — copy `text.ts` as a starting point. |
