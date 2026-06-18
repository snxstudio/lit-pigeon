# Brand-Kit Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consume and manage `EditorConfig.brandKit` in the editor — brand colors as swatches in color pickers, brand fonts in a reusable font picker, and a new "Brand" palette tab for creating/editing/deleting colors, fonts, and logos.

**Architecture:** Brand-kit state lives in the `<pigeon-editor>` web component (parallel to `templateStorage`/`assetStorage`, NOT in the document `EditorState` — brand-kit edits are not document mutations). The editor resolves a single active kit (plain `BrandKit` → use directly; `BrandKitStorage` → first kit from `list()`), prop-drills colors/fonts down through `<pigeon-properties>` and `<pigeon-palette>`, and handles CRUD/apply/insert events bubbled up from a new `<pigeon-brand-tab>`. Persistence goes through `BrandKitStorage.save()` when present; a public `brand-kit-change` event always fires.

**Tech Stack:** Lit 3 web components, TypeScript, Vitest + happy-dom. Core types from `@lit-pigeon/core`.

**Spec:** `docs/superpowers/specs/2026-06-15-brand-kit-panel-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/editor/src/components/properties/controls/color-picker.ts` (modify) | Add optional `swatches` row to the existing color control |
| `packages/editor/src/components/properties/controls/font-picker.ts` (create) | Reusable font-family `<select>` merging default + brand fonts |
| `packages/editor/src/components/properties/panels/body-panel.ts` (modify) | Use `<pigeon-font-picker>`; accept + forward `swatches`/`brandFonts` |
| `packages/editor/src/components/properties/panels/button-panel.ts` (modify) | Forward `swatches` to its two color pickers |
| `packages/editor/src/components/properties/pigeon-properties.ts` (modify) | Accept `brandKit`; derive + forward `swatches`/`brandFonts` to panels |
| `packages/editor/src/components/palette/pigeon-brand-tab.ts` (create) | CRUD UI for colors/fonts/logos; emits edit/apply/insert events |
| `packages/editor/src/components/palette/pigeon-palette.ts` (modify) | Add "Brand" tab (shown only when a kit exists); accept `brandKit` |
| `packages/editor/src/editor.ts` (modify) | Resolve kit, hold state, prop-drill, handle CRUD/apply/insert, emit public events |

Tests live in `packages/editor/__tests__/*.test.ts`. Run all editor tests with `npm test` from `packages/editor`; run one file with `npx vitest run __tests__/<file> --reporter=verbose`.

**Shared event contract** (all `bubbles: true, composed: true`):
- `<pigeon-brand-tab>` → editor (internal): `brand-kit-edit` `{ kit: BrandKit }`, `brand-color-apply` `{ value: string }`, `brand-font-apply` `{ family: string }`, `brand-logo-insert` `{ logo: BrandLogo }`
- editor → host (public): `brand-kit-change` `{ brandKit: BrandKit }`, `brand-kit-error` `{ error: unknown; operation: 'list' | 'save' }`

---

## Task 1: Color-picker swatches

**Files:**
- Modify: `packages/editor/src/components/properties/controls/color-picker.ts`
- Test: `packages/editor/__tests__/color-picker-swatches.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/color-picker-swatches.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import type { BrandColor } from '@lit-pigeon/core';
import '../src/components/properties/controls/color-picker.js';
import type { PigeonColorPicker } from '../src/components/properties/controls/color-picker.js';

const SWATCHES: BrandColor[] = [
  { id: 'brand', name: 'Brand', value: '#4f46e5' },
  { id: 'accent', name: 'Accent', value: '#db2777' },
];

async function mount(swatches: BrandColor[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-color-picker label="Color" value="#000000" .swatches=${swatches}></pigeon-color-picker>`,
    container,
  );
  const el = container.querySelector('pigeon-color-picker') as PigeonColorPicker;
  await el.updateComplete;
  return el;
}

describe('pigeon-color-picker swatches', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders one swatch button per brand color', async () => {
    const el = await mount(SWATCHES);
    expect(el.shadowRoot!.querySelectorAll('.swatch').length).toBe(2);
  });

  it('renders no swatch row when swatches is empty', async () => {
    const el = await mount([]);
    expect(el.shadowRoot!.querySelector('.swatches')).toBeNull();
  });

  it('emits color-change with the swatch value when a swatch is clicked', async () => {
    const el = await mount(SWATCHES);
    const events: CustomEvent[] = [];
    el.addEventListener('color-change', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelectorAll('.swatch')[1] as HTMLButtonElement).click();
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ value: '#db2777' });
    expect(el.value).toBe('#db2777');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/color-picker-swatches.test.ts`
Expected: FAIL — `.swatch` elements not found (property `swatches` not rendered).

- [ ] **Step 3: Implement swatch support**

In `color-picker.ts`, add the import, property, styles, and render block. Add at the top:

```ts
import type { BrandColor } from '@lit-pigeon/core';
```

Add the property after the existing `value` property:

```ts
  /** Optional brand-kit swatches rendered as quick-pick buttons. */
  @property({ attribute: false })
  swatches: BrandColor[] = [];
```

Add to `static styles` (inside the css``):

```css
    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }

    .swatch {
      width: 18px;
      height: 18px;
      border-radius: var(--pigeon-radius-sm, 4px);
      border: 1px solid var(--pigeon-input, #cbd5e1);
      padding: 0;
      cursor: pointer;
    }

    .swatch:focus-visible {
      outline: none;
      box-shadow: var(--pigeon-ring-shadow);
    }
```

Replace the `render()` return so the swatch row follows `.color-row`:

```ts
  render() {
    return html`
      <label>${this.label}</label>
      <div class="color-row">
        <input type="color" .value=${this.value} @input=${this._onColorInput} />
        <input type="text" .value=${this.value} @change=${this._onTextChange} maxlength="7" />
      </div>
      ${this.swatches.length
        ? html`<div class="swatches">
            ${this.swatches.map(
              (s) => html`<button
                class="swatch"
                type="button"
                title=${`${s.name} (${s.value})`}
                style=${`background:${s.value}`}
                @click=${() => this._applySwatch(s.value)}
              ></button>`,
            )}
          </div>`
        : ''}
    `;
  }

  private _applySwatch(value: string) {
    this.value = value;
    this._emitChange();
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/color-picker-swatches.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/properties/controls/color-picker.ts packages/editor/__tests__/color-picker-swatches.test.ts
git commit -m "feat(editor): brand-color swatches in color picker (#6)"
```

---

## Task 2: Reusable font picker

**Files:**
- Create: `packages/editor/src/components/properties/controls/font-picker.ts`
- Test: `packages/editor/__tests__/font-picker.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/font-picker.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import type { BrandFont } from '@lit-pigeon/core';
import '../src/components/properties/controls/font-picker.js';
import type { PigeonFontPicker } from '../src/components/properties/controls/font-picker.js';

const BRAND: BrandFont[] = [{ id: 'lora', name: 'Lora', family: 'Lora, Georgia, serif' }];

async function mount(value: string, brandFonts: BrandFont[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-font-picker label="Font Family" .value=${value} .brandFonts=${brandFonts}></pigeon-font-picker>`,
    container,
  );
  const el = container.querySelector('pigeon-font-picker') as PigeonFontPicker;
  await el.updateComplete;
  return el;
}

describe('pigeon-font-picker', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('lists default families plus brand fonts', async () => {
    const el = await mount('Arial, Helvetica, sans-serif', BRAND);
    const options = Array.from(el.shadowRoot!.querySelectorAll('option')) as HTMLOptionElement[];
    expect(options.some((o) => o.value === 'Lora, Georgia, serif')).toBe(true);
    expect(options.length).toBeGreaterThan(BRAND.length);
  });

  it('does not duplicate a brand font already in the defaults', async () => {
    const dup: BrandFont[] = [{ id: 'arial', name: 'Arial', family: 'Arial, Helvetica, sans-serif' }];
    const el = await mount('Arial, Helvetica, sans-serif', dup);
    const values = Array.from(el.shadowRoot!.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(values.filter((v) => v === 'Arial, Helvetica, sans-serif')).toHaveLength(1);
  });

  it('emits font-change with the selected family', async () => {
    const el = await mount('Arial, Helvetica, sans-serif', BRAND);
    const events: CustomEvent[] = [];
    el.addEventListener('font-change', (e) => events.push(e as CustomEvent));
    const select = el.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'Lora, Georgia, serif';
    select.dispatchEvent(new Event('change'));
    expect(events[0].detail).toEqual({ value: 'Lora, Georgia, serif' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/font-picker.test.ts`
Expected: FAIL — cannot resolve `font-picker.js` / element not defined.

- [ ] **Step 3: Create the component**

```ts
// packages/editor/src/components/properties/controls/font-picker.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { BrandFont } from '@lit-pigeon/core';

export interface FontOption {
  label: string;
  value: string;
}

/** Built-in, email-safe font stacks. Kept here so every font selector shares one list. */
export const DEFAULT_FONT_OPTIONS: FontOption[] = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, Times, serif' },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
];

/**
 * `<pigeon-font-picker>` — a font-family `<select>` that merges the built-in
 * email-safe stacks with brand fonts (and, later, host `fontConfig` fonts via
 * #23). Emits `font-change` with `{ value }` (the CSS font-family string).
 */
@customElement('pigeon-font-picker')
export class PigeonFontPicker extends LitElement {
  @property({ type: String })
  label = 'Font Family';

  @property({ type: String })
  value = '';

  /** Brand fonts to append after the defaults (de-duplicated by family). */
  @property({ attribute: false })
  brandFonts: BrandFont[] = [];

  static styles = css`
    :host {
      display: block;
      margin-bottom: 12px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
      margin-bottom: 4px;
      font-family: var(--pigeon-font);
    }
    select {
      width: 100%;
      height: 32px;
      border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      box-sizing: border-box;
    }
  `;

  private get _options(): FontOption[] {
    const seen = new Set(DEFAULT_FONT_OPTIONS.map((o) => o.value));
    const brand = this.brandFonts
      .filter((f) => !seen.has(f.family))
      .map((f) => ({ label: f.name, value: f.family }));
    return [...DEFAULT_FONT_OPTIONS, ...brand];
  }

  render() {
    return html`
      <label>${this.label}</label>
      <select @change=${this._onChange}>
        ${this._options.map(
          (o) => html`<option value=${o.value} ?selected=${this.value === o.value}>${o.label}</option>`,
        )}
      </select>
    `;
  }

  private _onChange(e: Event) {
    this.value = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(
      new CustomEvent('font-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-font-picker': PigeonFontPicker;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/font-picker.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/properties/controls/font-picker.ts packages/editor/__tests__/font-picker.test.ts
git commit -m "feat(editor): reusable font-picker control (#6)"
```

---

## Task 3: Body panel uses font-picker + accepts brand data

**Files:**
- Modify: `packages/editor/src/components/properties/panels/body-panel.ts`
- Test: `packages/editor/__tests__/body-panel-brand.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/body-panel-brand.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { BrandColor, BrandFont, PigeonDocument } from '@lit-pigeon/core';
import '../src/components/properties/panels/body-panel.js';
import type { PigeonBodyPanel } from '../src/components/properties/panels/body-panel.js';

async function mount(doc: PigeonDocument, swatches: BrandColor[], brandFonts: BrandFont[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-body-panel .doc=${doc} .swatches=${swatches} .brandFonts=${brandFonts}></pigeon-body-panel>`,
    container,
  );
  const el = container.querySelector('pigeon-body-panel') as PigeonBodyPanel;
  await el.updateComplete;
  return el;
}

describe('pigeon-body-panel brand integration', () => {
  let doc: PigeonDocument;
  beforeEach(() => { document.body.innerHTML = ''; doc = createDefaultDocument(); });

  it('renders a pigeon-font-picker instead of a bare select', async () => {
    const el = await mount(doc, [], []);
    expect(el.shadowRoot!.querySelector('pigeon-font-picker')).toBeTruthy();
  });

  it('forwards swatches to the background color picker', async () => {
    const swatches: BrandColor[] = [{ id: 'b', name: 'Brand', value: '#4f46e5' }];
    const el = await mount(doc, swatches, []);
    const picker = el.shadowRoot!.querySelector('pigeon-color-picker') as HTMLElement & { swatches: BrandColor[] };
    expect(picker.swatches).toEqual(swatches);
  });

  it('emits body-property-change for fontFamily from the font picker', async () => {
    const el = await mount(doc, [], []);
    const events: CustomEvent[] = [];
    el.addEventListener('body-property-change', (e) => events.push(e as CustomEvent));
    const fp = el.shadowRoot!.querySelector('pigeon-font-picker')!;
    fp.dispatchEvent(new CustomEvent('font-change', { detail: { value: 'Georgia, Times, serif' } }));
    expect(events[0].detail).toEqual({ attribute: 'fontFamily', value: 'Georgia, Times, serif' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/body-panel-brand.test.ts`
Expected: FAIL — no `pigeon-font-picker`; `picker.swatches` undefined.

- [ ] **Step 3: Update body-panel**

Add imports near the existing control imports:

```ts
import '../controls/font-picker.js';
import type { BrandColor, BrandFont } from '@lit-pigeon/core';
```

Add properties after `mergeTags`:

```ts
  @property({ attribute: false })
  swatches: BrandColor[] = [];

  @property({ attribute: false })
  brandFonts: BrandFont[] = [];
```

Delete the `private _fontFamilies = [ ... ];` array (now lives in font-picker).

Replace the background color picker to forward swatches:

```ts
      <pigeon-color-picker
        label="Background Color"
        .value=${a.backgroundColor}
        .swatches=${this.swatches}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>
```

Replace the Font Family `<div class="field">...</div>` block with:

```ts
      <pigeon-font-picker
        label="Font Family"
        .value=${a.fontFamily}
        .brandFonts=${this.brandFonts}
        @font-change=${this._onFontFamilyChange}
      ></pigeon-font-picker>
```

Update `_onFontFamilyChange` to read the custom-event detail instead of a `<select>`:

```ts
  private _onFontFamilyChange(e: CustomEvent<{ value: string }>) {
    this._emit({ attribute: 'fontFamily', value: e.detail.value });
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run __tests__/body-panel-brand.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/properties/panels/body-panel.ts packages/editor/__tests__/body-panel-brand.test.ts
git commit -m "feat(editor): body panel uses font-picker + brand swatches (#6)"
```

---

## Task 4: Forward swatches into block color pickers

**Files:**
- Modify: `packages/editor/src/components/properties/panels/button-panel.ts`
- Modify: `packages/editor/src/components/properties/panels/divider-panel.ts`
- Modify: `packages/editor/src/components/properties/panels/hero-panel.ts`
- Modify: `packages/editor/src/components/properties/panels/navbar-panel.ts`
- Modify: `packages/editor/src/components/properties/panels/social-panel.ts`
- Test: `packages/editor/__tests__/button-panel-swatches.test.ts`

> All five panels get the identical change: import `BrandColor`, add a
> `swatches: BrandColor[] = []` property, and add `.swatches=${this.swatches}`
> to every `<pigeon-color-picker>` they render. Only button-panel gets an
> explicit test (the others are mechanically identical and covered by the
> integration test in Task 11). For any panel that has no `<pigeon-color-picker>`,
> skip it.

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/button-panel-swatches.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock } from '@lit-pigeon/core';
import type { BrandColor, ButtonBlock } from '@lit-pigeon/core';
import '../src/components/properties/panels/button-panel.js';
import type { PigeonButtonPanel } from '../src/components/properties/panels/button-panel.js';

const SWATCHES: BrandColor[] = [{ id: 'b', name: 'Brand', value: '#4f46e5' }];

describe('pigeon-button-panel swatches', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('forwards swatches to both color pickers', async () => {
    const block = createBlock('button') as ButtonBlock;
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(
      html`<pigeon-button-panel .block=${block} .swatches=${SWATCHES}></pigeon-button-panel>`,
      container,
    );
    const panel = container.querySelector('pigeon-button-panel') as PigeonButtonPanel;
    await panel.updateComplete;
    const pickers = Array.from(panel.shadowRoot!.querySelectorAll('pigeon-color-picker')) as Array<
      HTMLElement & { swatches: BrandColor[] }
    >;
    expect(pickers).toHaveLength(2);
    expect(pickers.every((p) => p.swatches === SWATCHES)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/button-panel-swatches.test.ts`
Expected: FAIL — `picker.swatches` is `[]`/undefined.

- [ ] **Step 3: Add `swatches` to button-panel (and the other four panels)**

In `button-panel.ts`, add import:

```ts
import type { ButtonBlock, Spacing, BrandColor } from '@lit-pigeon/core';
```

Add property after `columnId`:

```ts
  @property({ attribute: false })
  swatches: BrandColor[] = [];
```

Add `.swatches=${this.swatches}` to both `<pigeon-color-picker>` elements (Background Color and Text Color).

Repeat the same three edits (import `BrandColor`, add `swatches` property, add `.swatches=${this.swatches}` to each `<pigeon-color-picker>`) in `divider-panel.ts`, `hero-panel.ts`, `navbar-panel.ts`, and `social-panel.ts`. (Open each file, find each `<pigeon-color-picker>`, add the binding.)

- [ ] **Step 4: Run test + full panel tests to verify no regression**

Run: `cd packages/editor && npx vitest run __tests__/button-panel-swatches.test.ts __tests__/divider-panel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/properties/panels/*.ts packages/editor/__tests__/button-panel-swatches.test.ts
git commit -m "feat(editor): forward brand swatches into block color pickers (#6)"
```

---

## Task 5: Properties hub forwards brand data to panels

**Files:**
- Modify: `packages/editor/src/components/properties/pigeon-properties.ts`
- Test: `packages/editor/__tests__/properties-brand.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/properties-brand.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument, createBlock } from '@lit-pigeon/core';
import type { BrandKit, BrandColor, ButtonBlock, PigeonDocument, Selection } from '@lit-pigeon/core';
import '../src/components/properties/pigeon-properties.js';
import type { PigeonProperties } from '../src/components/properties/pigeon-properties.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [{ id: 'b', name: 'Brand', value: '#4f46e5' }],
  fonts: [{ id: 'l', name: 'Lora', family: 'Lora, serif' }], logos: [],
  createdAt: '', updatedAt: '',
};

async function mount(doc: PigeonDocument, selection: Selection | null, brandKit: BrandKit | null) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-properties .doc=${doc} .selection=${selection} .brandKit=${brandKit}></pigeon-properties>`,
    container,
  );
  const el = container.querySelector('pigeon-properties') as PigeonProperties;
  await el.updateComplete;
  return el;
}

describe('pigeon-properties brand forwarding', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('forwards swatches + brandFonts to the body panel', async () => {
    const el = await mount(createDefaultDocument(), null, KIT);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & {
      swatches: BrandColor[]; brandFonts: unknown[];
    };
    await (body as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(body.swatches).toEqual(KIT.colors);
    expect(body.brandFonts).toEqual(KIT.fonts);
  });

  it('passes empty arrays when brandKit is null', async () => {
    const el = await mount(createDefaultDocument(), null, null);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & { swatches: BrandColor[] };
    expect(body.swatches).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/properties-brand.test.ts`
Expected: FAIL — `body.swatches` is `[]` even when a kit is provided.

- [ ] **Step 3: Add brandKit to pigeon-properties and forward**

Add `BrandKit`, `BrandColor`, `BrandFont` to the type import from `@lit-pigeon/core`. Add a property after `assetStorage`:

```ts
  @property({ attribute: false })
  brandKit: BrandKit | null = null;
```

Add two getters inside the class:

```ts
  private get _swatches(): BrandColor[] {
    return this.brandKit?.colors ?? [];
  }

  private get _brandFonts(): BrandFont[] {
    return this.brandKit?.fonts ?? [];
  }
```

In `render()`, update the body-panel render to forward both:

```ts
          <pigeon-body-panel
            .doc=${this.doc}
            .mergeTags=${this.mergeTags}
            .swatches=${this._swatches}
            .brandFonts=${this._brandFonts}
          ></pigeon-body-panel>
```

In `_renderBlockPanel`, add `.swatches=${this._swatches}` to the `button`, `divider`, `hero`, `navbar`, and `social` cases (the panels updated in Task 4). Example for button:

```ts
      case 'button':
        return html`<pigeon-button-panel .block=${block} .rowId=${rowId} .columnId=${columnId} .swatches=${this._swatches}></pigeon-button-panel>`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/properties-brand.test.ts __tests__/properties-switch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/properties/pigeon-properties.ts packages/editor/__tests__/properties-brand.test.ts
git commit -m "feat(editor): properties panel forwards brand colors/fonts (#6)"
```

---

## Task 6: Brand tab component (CRUD + apply + insert)

**Files:**
- Create: `packages/editor/src/components/palette/pigeon-brand-tab.ts`
- Test: `packages/editor/__tests__/brand-tab.test.ts`

This is the largest unit. The component receives a `brandKit` and renders three
sections. Every mutation computes a NEW immutable kit and emits `brand-kit-edit`
with the full kit. Clicking a color swatch emits `brand-color-apply`; clicking a
font emits `brand-font-apply`; clicking a logo emits `brand-logo-insert`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/brand-tab.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import type { BrandKit } from '@lit-pigeon/core';
import '../src/components/palette/pigeon-brand-tab.js';
import type { PigeonBrandTab } from '../src/components/palette/pigeon-brand-tab.js';

function kit(): BrandKit {
  return {
    id: 'k', name: 'Kit',
    colors: [{ id: 'c1', name: 'Brand', value: '#4f46e5' }],
    fonts: [{ id: 'f1', name: 'Lora', family: 'Lora, serif' }],
    logos: [{ id: 'l1', name: 'Logo', src: 'https://x/logo.png' }],
    createdAt: '2020-01-01', updatedAt: '2020-01-01',
  };
}

async function mount(brandKit: BrandKit) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-brand-tab .brandKit=${brandKit}></pigeon-brand-tab>`, container);
  const el = container.querySelector('pigeon-brand-tab') as PigeonBrandTab;
  await el.updateComplete;
  return el;
}

describe('pigeon-brand-tab', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders one entry per color, font, and logo', async () => {
    const el = await mount(kit());
    expect(el.shadowRoot!.querySelectorAll('[data-color-id]').length).toBe(1);
    expect(el.shadowRoot!.querySelectorAll('[data-font-id]').length).toBe(1);
    expect(el.shadowRoot!.querySelectorAll('[data-logo-id]').length).toBe(1);
  });

  it('emits brand-color-apply when a color swatch is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-color-apply', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-color-id="c1"] .swatch') as HTMLButtonElement).click();
    expect(events[0].detail).toEqual({ value: '#4f46e5' });
  });

  it('emits brand-font-apply when a font is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-font-apply', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-font-id="f1"] .apply') as HTMLButtonElement).click();
    expect(events[0].detail).toEqual({ family: 'Lora, serif' });
  });

  it('emits brand-logo-insert when a logo is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-logo-insert', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-logo-id="l1"] .apply') as HTMLButtonElement).click();
    expect(events[0].detail.logo.id).toBe('l1');
  });

  it('emits brand-kit-edit with the color removed when delete is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-kit-edit', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('[data-color-id="c1"] .delete') as HTMLButtonElement).click();
    expect(events[0].detail.kit.colors).toHaveLength(0);
    expect(events[0].detail.kit.id).toBe('k');
  });

  it('emits brand-kit-edit with a new color appended when Add Color is clicked', async () => {
    const el = await mount(kit());
    const events: CustomEvent[] = [];
    el.addEventListener('brand-kit-edit', (e) => events.push(e as CustomEvent));
    (el.shadowRoot!.querySelector('.add-color') as HTMLButtonElement).click();
    expect(events[0].detail.kit.colors).toHaveLength(2);
    expect(events[0].detail.kit.colors[1].value).toBe('#000000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/brand-tab.test.ts`
Expected: FAIL — element not defined.

- [ ] **Step 3: Create the component**

```ts
// packages/editor/src/components/palette/pigeon-brand-tab.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { generateId } from '@lit-pigeon/core';
import type { BrandKit, BrandColor, BrandFont, BrandLogo } from '@lit-pigeon/core';

/**
 * `<pigeon-brand-tab>` — the Brand palette tab. Renders the active kit's
 * colors, fonts, and logos with add/edit/delete affordances. Mutations emit
 * `brand-kit-edit` with the full updated kit; clicking an entry emits an
 * apply/insert event handled by `<pigeon-editor>`.
 */
@customElement('pigeon-brand-tab')
export class PigeonBrandTab extends LitElement {
  @property({ attribute: false })
  brandKit: BrandKit | null = null;

  static styles = css`
    :host { display: block; }
    .section { padding: 12px; }
    .section:not(:last-child) { border-bottom: 1px solid var(--pigeon-border, #e2e8f0); }
    .section-head {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
    }
    .section-head h4 {
      margin: 0; font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px; color: var(--pigeon-text-secondary, #64748b); font-family: var(--pigeon-font);
    }
    .add {
      border: 1px solid var(--pigeon-border, #e2e8f0); background: var(--pigeon-surface, #f8fafc);
      border-radius: var(--pigeon-radius-sm, 6px); cursor: pointer; font-size: 12px;
      line-height: 1; padding: 4px 8px; color: var(--pigeon-text-secondary, #64748b);
    }
    .row {
      display: flex; align-items: center; gap: 8px; padding: 4px 0; font-family: var(--pigeon-font);
      font-size: 13px; color: var(--pigeon-text, #1e293b);
    }
    .swatch {
      width: 20px; height: 20px; border-radius: var(--pigeon-radius-sm, 4px);
      border: 1px solid var(--pigeon-input, #cbd5e1); padding: 0; cursor: pointer; flex-shrink: 0;
    }
    .name { flex: 1; }
    .name-input {
      flex: 1; height: 24px; border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 4px); padding: 0 6px; font: inherit; min-width: 0;
    }
    .apply {
      flex: 1; text-align: left; background: none; border: none; cursor: pointer; font: inherit;
      color: var(--pigeon-text, #1e293b); padding: 0; min-width: 0;
    }
    .apply:hover { color: var(--pigeon-primary, #4f46e5); }
    .delete {
      background: none; border: none; cursor: pointer; color: var(--pigeon-text-muted, #94a3b8);
      font-size: 14px; line-height: 1; padding: 2px;
    }
    .delete:hover { color: var(--pigeon-danger, #dc2626); }
    .logo-thumb { width: 28px; height: 28px; object-fit: contain; flex-shrink: 0; }
    .empty { font-size: 12px; color: var(--pigeon-text-muted, #94a3b8); font-family: var(--pigeon-font); }
  `;

  render() {
    const kit = this.brandKit;
    if (!kit) return html``;
    return html`
      ${this._renderColors(kit)}
      ${this._renderFonts(kit)}
      ${this._renderLogos(kit)}
    `;
  }

  private _renderColors(kit: BrandKit) {
    return html`
      <div class="section">
        <div class="section-head">
          <h4>Colors</h4>
          <button class="add add-color" type="button" @click=${this._addColor}>+ Add</button>
        </div>
        ${kit.colors.length === 0 ? html`<div class="empty">No colors yet</div>` : ''}
        ${kit.colors.map(
          (c) => html`<div class="row" data-color-id=${c.id}>
            <button
              class="swatch" type="button" title=${`Apply ${c.name}`}
              style=${`background:${c.value}`} @click=${() => this._applyColor(c)}
            ></button>
            <input
              class="name-input" .value=${c.name}
              @change=${(e: Event) => this._renameColor(c, (e.target as HTMLInputElement).value)}
            />
            <input
              type="color" .value=${c.value}
              @input=${(e: Event) => this._recolor(c, (e.target as HTMLInputElement).value)}
            />
            <button class="delete" type="button" title="Delete" @click=${() => this._deleteColor(c)}>×</button>
          </div>`,
        )}
      </div>
    `;
  }

  private _renderFonts(kit: BrandKit) {
    return html`
      <div class="section">
        <div class="section-head">
          <h4>Fonts</h4>
          <button class="add add-font" type="button" @click=${this._addFont}>+ Add</button>
        </div>
        ${kit.fonts.length === 0 ? html`<div class="empty">No fonts yet</div>` : ''}
        ${kit.fonts.map(
          (f) => html`<div class="row" data-font-id=${f.id}>
            <button class="apply" type="button" title=${`Apply ${f.name}`} @click=${() => this._applyFont(f)}>
              ${f.name}
            </button>
            <button class="delete" type="button" title="Delete" @click=${() => this._deleteFont(f)}>×</button>
          </div>`,
        )}
      </div>
    `;
  }

  private _renderLogos(kit: BrandKit) {
    return html`
      <div class="section">
        <div class="section-head">
          <h4>Logos</h4>
          <button class="add add-logo" type="button" @click=${this._addLogo}>+ Add</button>
        </div>
        ${kit.logos.length === 0 ? html`<div class="empty">No logos yet</div>` : ''}
        ${kit.logos.map(
          (l) => html`<div class="row" data-logo-id=${l.id}>
            <img class="logo-thumb" src=${l.src} alt=${l.name} />
            <button class="apply" type="button" title="Insert logo" @click=${() => this._insertLogo(l)}>
              ${l.name}
            </button>
            <button class="delete" type="button" title="Delete" @click=${() => this._deleteLogo(l)}>×</button>
          </div>`,
        )}
      </div>
    `;
  }

  /* ---- apply / insert (no kit mutation) ---- */

  private _applyColor(c: BrandColor) {
    this._fire('brand-color-apply', { value: c.value });
  }
  private _applyFont(f: BrandFont) {
    this._fire('brand-font-apply', { family: f.family });
  }
  private _insertLogo(l: BrandLogo) {
    this._fire('brand-logo-insert', { logo: l });
  }

  /* ---- mutations: compute new kit, emit brand-kit-edit ---- */

  private _emitKit(kit: BrandKit) {
    this._fire('brand-kit-edit', { kit });
  }
  private _clone(): BrandKit {
    const k = this.brandKit!;
    return { ...k, colors: [...k.colors], fonts: [...k.fonts], logos: [...k.logos] };
  }

  private _addColor() {
    const k = this._clone();
    k.colors = [...k.colors, { id: generateId(), name: 'New color', value: '#000000' }];
    this._emitKit(k);
  }
  private _renameColor(c: BrandColor, name: string) {
    const k = this._clone();
    k.colors = k.colors.map((x) => (x.id === c.id ? { ...x, name } : x));
    this._emitKit(k);
  }
  private _recolor(c: BrandColor, value: string) {
    const k = this._clone();
    k.colors = k.colors.map((x) => (x.id === c.id ? { ...x, value } : x));
    this._emitKit(k);
  }
  private _deleteColor(c: BrandColor) {
    const k = this._clone();
    k.colors = k.colors.filter((x) => x.id !== c.id);
    this._emitKit(k);
  }

  private _addFont() {
    const k = this._clone();
    k.fonts = [...k.fonts, { id: generateId(), name: 'New font', family: 'Arial, Helvetica, sans-serif' }];
    this._emitKit(k);
  }
  private _deleteFont(f: BrandFont) {
    const k = this._clone();
    k.fonts = k.fonts.filter((x) => x.id !== f.id);
    this._emitKit(k);
  }

  private _addLogo() {
    const src = prompt('Logo image URL');
    if (!src) return;
    const k = this._clone();
    k.logos = [...k.logos, { id: generateId(), name: 'Logo', src }];
    this._emitKit(k);
  }
  private _deleteLogo(l: BrandLogo) {
    const k = this._clone();
    k.logos = k.logos.filter((x) => x.id !== l.id);
    this._emitKit(k);
  }

  private _fire(type: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-brand-tab': PigeonBrandTab;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/brand-tab.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/palette/pigeon-brand-tab.ts packages/editor/__tests__/brand-tab.test.ts
git commit -m "feat(editor): brand-tab CRUD component (#6)"
```

---

## Task 7: Palette shows the Brand tab

**Files:**
- Modify: `packages/editor/src/components/palette/pigeon-palette.ts`
- Test: `packages/editor/__tests__/palette-brand-tab.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/palette-brand-tab.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { BrandKit, PigeonDocument } from '@lit-pigeon/core';
import '../src/components/palette/pigeon-palette.js';
import type { PigeonPalette } from '../src/components/palette/pigeon-palette.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [], fonts: [], logos: [], createdAt: '', updatedAt: '',
};

async function mount(doc: PigeonDocument, brandKit: BrandKit | null) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-palette .doc=${doc} .brandKit=${brandKit}></pigeon-palette>`, container);
  const el = container.querySelector('pigeon-palette') as PigeonPalette;
  await el.updateComplete;
  return el;
}

describe('pigeon-palette brand tab', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('hides the Brand tab when no kit is set', async () => {
    const el = await mount(createDefaultDocument(), null);
    expect(el.shadowRoot!.querySelector('#pigeon-tab-brand')).toBeNull();
  });

  it('shows the Brand tab when a kit is set', async () => {
    const el = await mount(createDefaultDocument(), KIT);
    expect(el.shadowRoot!.querySelector('#pigeon-tab-brand')).toBeTruthy();
  });

  it('renders pigeon-brand-tab when the Brand tab is selected', async () => {
    const el = await mount(createDefaultDocument(), KIT);
    (el.shadowRoot!.querySelector('#pigeon-tab-brand') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('pigeon-brand-tab')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/palette-brand-tab.test.ts`
Expected: FAIL — no `#pigeon-tab-brand`.

- [ ] **Step 3: Add the Brand tab to the palette**

Add imports near the top:

```ts
import './pigeon-brand-tab.js';
import type { BrandKit } from '@lit-pigeon/core';
```

Change the tab union type:

```ts
type PaletteTab = 'content' | 'layers' | 'brand';
```

Add a property after `selection`:

```ts
  @property({ attribute: false })
  brandKit: BrandKit | null = null;
```

In `render()`, add a third tab button after the Layers button, rendered only when a kit exists:

```ts
        ${this.brandKit
          ? html`<button
              part="palette-tab"
              role="tab"
              id="pigeon-tab-brand"
              aria-selected=${this._activeTab === 'brand'}
              aria-controls="pigeon-tabpanel"
              class="tab ${this._activeTab === 'brand' ? 'active' : ''}"
              @click=${() => (this._activeTab = 'brand')}
            >Brand</button>`
          : ''}
```

Update the tabpanel's `aria-labelledby` and body to handle three tabs:

```ts
        aria-labelledby=${this._activeTab === 'content'
          ? 'pigeon-tab-content'
          : this._activeTab === 'layers'
            ? 'pigeon-tab-layers'
            : 'pigeon-tab-brand'}
      >
        ${this._activeTab === 'content'
          ? this._renderContentTab()
          : this._activeTab === 'layers'
            ? this._renderLayersTab()
            : this._renderBrandTab()}
```

Add the render helper:

```ts
  private _renderBrandTab() {
    return html`<pigeon-brand-tab .brandKit=${this.brandKit}></pigeon-brand-tab>`;
  }
```

> Note: brand CRUD/apply/insert events bubble (`composed: true`) straight past
> the palette to `<pigeon-editor>`, so the palette needs no event handlers.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/palette-brand-tab.test.ts __tests__/palette-a11y.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/palette/pigeon-palette.ts packages/editor/__tests__/palette-brand-tab.test.ts
git commit -m "feat(editor): Brand tab in palette (#6)"
```

---

## Task 8: Editor resolves the active kit and prop-drills it

**Files:**
- Modify: `packages/editor/src/editor.ts`
- Test: `packages/editor/__tests__/brand-kit-resolve.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/brand-kit-resolve.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import { InMemoryBrandKitStorage } from '@lit-pigeon/core';
import type { BrandKit, EditorConfig } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [{ id: 'c', name: 'Brand', value: '#4f46e5' }],
  fonts: [], logos: [], createdAt: '', updatedAt: '',
};

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor brand-kit resolution', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('passes a plain BrandKit straight to the palette', async () => {
    const el = await mount({ brandKit: KIT });
    await el.updateComplete;
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as HTMLElement & { brandKit: BrandKit | null };
    expect(palette.brandKit).toEqual(KIT);
  });

  it('resolves the first kit from a BrandKitStorage', async () => {
    const storage = new InMemoryBrandKitStorage({ seed: [KIT] });
    const el = await mount({ brandKit: storage });
    // resolution is async (list()); wait a microtask-tick then re-render
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as HTMLElement & { brandKit: BrandKit | null };
    expect(palette.brandKit?.id).toBe('k');
  });

  it('leaves brandKit null when config has none', async () => {
    const el = await mount({});
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as HTMLElement & { brandKit: BrandKit | null };
    expect(palette.brandKit).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/brand-kit-resolve.test.ts`
Expected: FAIL — `palette.brandKit` is undefined (no binding yet).

- [ ] **Step 3: Implement resolution + prop-drill**

Add to the `@lit-pigeon/core` type import in editor.ts: `BrandKit`, `BrandKitStorage`, `BrandLogo`, `ImageBlock`. Add a reactive state field and storage ref near the other `@state` declarations:

```ts
  @state() private _activeBrandKit: BrandKit | null = null;
  private _brandKitStorage: BrandKitStorage | null = null;
```

Call resolution from `connectedCallback()` after `this._initState();`:

```ts
    this._resolveBrandKit();
```

Re-resolve when `config` changes — in `updated()`, add:

```ts
    if (changed.has('config')) {
      this._resolveBrandKit();
    }
```

Add the resolver method:

```ts
  /**
   * Resolve `config.brandKit` into a single active kit. A plain `BrandKit` is
   * used directly; a `BrandKitStorage` (duck-typed by a `list` method) is
   * async-loaded and the first kit becomes active.
   */
  private async _resolveBrandKit() {
    const bk = this.config.brandKit;
    if (!bk) {
      this._brandKitStorage = null;
      this._activeBrandKit = null;
      return;
    }
    if (typeof (bk as BrandKitStorage).list === 'function') {
      this._brandKitStorage = bk as BrandKitStorage;
      try {
        const kits = await this._brandKitStorage.list();
        this._activeBrandKit = kits[0] ?? null;
      } catch (error) {
        this._activeBrandKit = null;
        this._emitBrandKitError(error, 'list');
      }
    } else {
      this._brandKitStorage = null;
      this._activeBrandKit = bk as BrandKit;
    }
    this.requestUpdate();
  }

  private _emitBrandKitError(error: unknown, operation: 'list' | 'save') {
    this.dispatchEvent(
      new CustomEvent('brand-kit-error', {
        detail: { error, operation },
        bubbles: true,
        composed: true,
      }),
    );
  }
```

Bind `_activeBrandKit` into the palette and properties in `render()`:

```ts
        <pigeon-palette
          ...
          .brandKit=${this._activeBrandKit}
          ...
        ></pigeon-palette>
```

and on `<pigeon-properties>`:

```ts
          .brandKit=${this._activeBrandKit}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/brand-kit-resolve.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor.ts packages/editor/__tests__/brand-kit-resolve.test.ts
git commit -m "feat(editor): resolve active brand kit + prop-drill (#6)"
```

---

## Task 9: Editor persists edits + emits public events

**Files:**
- Modify: `packages/editor/src/editor.ts`
- Test: `packages/editor/__tests__/brand-kit-persist.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/brand-kit-persist.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { html, render } from 'lit';
import type { BrandKit, BrandKitStorage, EditorConfig } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [], fonts: [], logos: [], createdAt: '', updatedAt: '',
};
const NEXT: BrandKit = { ...KIT, colors: [{ id: 'c', name: 'Brand', value: '#000000' }] };

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor brand-kit persistence', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('saves to storage and emits brand-kit-change on brand-kit-edit', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const storage = {
      list: async () => [KIT], get: async () => KIT, save, delete: async () => {},
    } as BrandKitStorage;
    const el = await mount({ brandKit: storage });
    await new Promise((r) => setTimeout(r, 0));

    const changes: CustomEvent[] = [];
    el.addEventListener('brand-kit-change', (e) => changes.push(e as CustomEvent));
    el.dispatchEvent(new CustomEvent('brand-kit-edit', { detail: { kit: NEXT }, bubbles: true, composed: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(save).toHaveBeenCalledWith(NEXT);
    expect(changes[0].detail).toEqual({ brandKit: NEXT });
  });

  it('emits brand-kit-error but keeps the edit when save rejects', async () => {
    const storage = {
      list: async () => [KIT], get: async () => KIT,
      save: async () => { throw new Error('disk full'); }, delete: async () => {},
    } as BrandKitStorage;
    const el = await mount({ brandKit: storage });
    await new Promise((r) => setTimeout(r, 0));

    const errors: CustomEvent[] = [];
    const changes: CustomEvent[] = [];
    el.addEventListener('brand-kit-error', (e) => errors.push(e as CustomEvent));
    el.addEventListener('brand-kit-change', (e) => changes.push(e as CustomEvent));
    el.dispatchEvent(new CustomEvent('brand-kit-edit', { detail: { kit: NEXT }, bubbles: true, composed: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(errors[0].detail.operation).toBe('save');
    expect(changes).toHaveLength(1); // optimistic change still emitted
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/brand-kit-persist.test.ts`
Expected: FAIL — no `brand-kit-edit` listener wired.

- [ ] **Step 3: Wire the edit handler**

Add `@brand-kit-edit=${this._handleBrandKitEdit}` to the `<pigeon-palette>` element in `render()` (the event bubbles up from `<pigeon-brand-tab>` through the palette). Then add the handler:

```ts
  private async _handleBrandKitEdit(e: CustomEvent<{ kit: BrandKit }>) {
    e.stopPropagation();
    const kit = e.detail.kit;
    this._activeBrandKit = kit; // optimistic in-memory update
    this.requestUpdate();
    // Emit the public change first so hosts see the new state even if save fails.
    this.dispatchEvent(
      new CustomEvent('brand-kit-change', {
        detail: { brandKit: kit },
        bubbles: true,
        composed: true,
      }),
    );
    if (this._brandKitStorage) {
      try {
        await this._brandKitStorage.save(kit);
      } catch (error) {
        this._emitBrandKitError(error, 'save');
      }
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/brand-kit-persist.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor.ts packages/editor/__tests__/brand-kit-persist.test.ts
git commit -m "feat(editor): persist brand-kit edits + public events (#6)"
```

---

## Task 10: Editor applies colors/fonts to selection + inserts logos

**Files:**
- Modify: `packages/editor/src/editor.ts`
- Test: `packages/editor/__tests__/brand-kit-apply.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/brand-kit-apply.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from 'lit';
import type { BrandKit, BrandLogo, EditorConfig, PigeonDocument } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [], fonts: [], logos: [], createdAt: '', updatedAt: '',
};

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

function fire(el: PigeonEditor, type: string, detail: unknown) {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

describe('pigeon-editor brand apply/insert', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('applies a brand color to body background when nothing is selected', async () => {
    const el = await mount({ brandKit: KIT });
    fire(el, 'brand-color-apply', { value: '#123456' });
    const doc: PigeonDocument = el.getDocument();
    expect(doc.body.attributes.backgroundColor).toBe('#123456');
  });

  it('applies a brand font to the body fontFamily', async () => {
    const el = await mount({ brandKit: KIT });
    fire(el, 'brand-font-apply', { family: 'Lora, serif' });
    expect(el.getDocument().body.attributes.fontFamily).toBe('Lora, serif');
  });

  it('inserts an image block carrying the logo src', async () => {
    const el = await mount({ brandKit: KIT });
    const before = el.getDocument().body.rows.reduce(
      (n, r) => n + r.columns.reduce((m, c) => m + c.blocks.length, 0), 0);
    const logo: BrandLogo = { id: 'l', name: 'Logo', src: 'https://x/logo.png', width: 120 };
    fire(el, 'brand-logo-insert', { logo });
    const doc = el.getDocument();
    const blocks = doc.body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks));
    expect(blocks.length).toBe(before + 1);
    const img = blocks.find((b) => b.type === 'image') as { values: { src: string; width: number } };
    expect(img.values.src).toBe('https://x/logo.png');
    expect(img.values.width).toBe(120);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/brand-kit-apply.test.ts`
Expected: FAIL — handlers not wired, doc unchanged.

- [ ] **Step 3: Wire apply + insert handlers**

Add three listeners to `<pigeon-palette>` in `render()`:

```ts
          @brand-color-apply=${this._handleBrandColorApply}
          @brand-font-apply=${this._handleBrandFontApply}
          @brand-logo-insert=${this._handleBrandLogoInsert}
```

Add a body-attribute helper (factor the step out so apply and `_handleBodyPropertyChange` share it):

```ts
  /** Apply a single body attribute through an undoable transaction. */
  private _applyBodyAttribute(attribute: string, value: unknown) {
    const tr = this._state.createTransaction();
    const attrs = this._state.doc.body.attributes as Record<string, unknown>;
    const oldValue = attrs[attribute];
    const step = createDocStep(
      'updateBodyAttribute',
      `body.attributes.${attribute}`,
      (doc: PigeonDocument) => { (doc.body.attributes as Record<string, unknown>)[attribute] = value; },
      (doc: PigeonDocument) => { (doc.body.attributes as Record<string, unknown>)[attribute] = oldValue; },
    );
    tr.addStep(step);
    this._dispatch(tr);
  }
```

Add the handlers:

```ts
  private _handleBrandColorApply(e: CustomEvent<{ value: string }>) {
    e.stopPropagation();
    const value = e.detail.value;
    const sel = this._state.selection;
    if (sel?.type === 'block' && sel.rowId && sel.columnId && sel.blockId) {
      const block = this._findBlock(sel.rowId, sel.columnId, sel.blockId);
      if (block?.type === 'button') {
        updateBlock(sel.rowId, sel.columnId, sel.blockId, { backgroundColor: value })(this._state, this._dispatch);
      }
      // text/other blocks: no block-level colour → no-op (hint shown by the UI).
      return;
    }
    // body or no selection → body background.
    this._applyBodyAttribute('backgroundColor', value);
  }

  private _handleBrandFontApply(e: CustomEvent<{ family: string }>) {
    e.stopPropagation();
    this._applyBodyAttribute('fontFamily', e.detail.family);
  }

  private _handleBrandLogoInsert(e: CustomEvent<{ logo: BrandLogo }>) {
    e.stopPropagation();
    const { logo } = e.detail;
    const block = createBlock('image') as ImageBlock;
    block.values.src = logo.src;
    block.values.alt = logo.name;
    if (logo.width) block.values.width = logo.width;

    const sel = this._state.selection;
    if (sel?.rowId && sel?.columnId) {
      insertBlock(sel.rowId, sel.columnId, block)(this._state, this._dispatch);
      return;
    }
    const rows = this._state.doc.body.rows;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const col = lastRow.columns[0];
      insertBlock(lastRow.id, col.id, block, col.blocks.length)(this._state, this._dispatch);
    } else {
      const col = createColumn([block]);
      insertRow(createRow([col]), 0)(this._state, this._dispatch);
    }
  }
```

Add a private block finder if one does not already exist (mirror `pigeon-properties._findBlock`):

```ts
  private _findBlock(rowId: string, columnId: string, blockId: string): ContentBlock | undefined {
    const row = this._state.doc.body.rows.find((r) => r.id === rowId);
    const col = row?.columns.find((c) => c.id === columnId);
    return col?.blocks.find((b) => b.id === blockId);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/brand-kit-apply.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor.ts packages/editor/__tests__/brand-kit-apply.test.ts
git commit -m "feat(editor): apply brand colors/fonts + insert logos (#6)"
```

---

## Task 11: Full suite, type-check, and bundle-size verification

**Files:**
- Test: all existing tests (regression)

- [ ] **Step 1: Run the full editor test suite**

Run: `cd packages/editor && npm test`
Expected: PASS — all suites green, including the 8 new brand-kit test files and the pre-existing panel/palette/properties tests (no regressions).

- [ ] **Step 2: Type-check + build the editor package**

Run: `cd packages/editor && npm run build`
Expected: Vite build succeeds with no TypeScript errors.

- [ ] **Step 3: Confirm the bundle-size budget still holds**

Recent history bumped the editor size budget (commit `c04098b`, "bump editor size budget to 43 kB"). The font-picker + brand-tab add to the base bundle.

Run: `cd packages/editor && npm run build` and check the reported gzip size of the main chunk against the CI budget.
Expected: within budget. If it exceeds 43 kB, code-split the Brand tab the same way the template picker is lazily imported (`loadTemplatePicker` pattern in `editor.ts:64-72`): dynamic-`import()` `pigeon-brand-tab.js` only when the Brand tab is first activated, and note the budget delta in the PR.

- [ ] **Step 4: Run the workspace test suite from the repo root**

Run: `cd /Users/mayurrawte/snxstudio/lit-pigeon && pnpm -r test`
Expected: All packages pass (the brand-kit changes are editor-only; core/renderer suites unaffected).

- [ ] **Step 5: Commit any size-budget config change (only if needed)**

```bash
git add -A
git commit -m "chore(editor): adjust size budget for brand-kit panel (#6)"
```

---

## Self-Review (completed against the spec)

- **Spec coverage:** resolution (Task 8) · color swatches (Tasks 1, 4, 5) · font picker (Tasks 2, 3) · Brand tab CRUD (Tasks 6, 7) · persistence + public events (Task 9) · apply mapping + logo insert (Task 10) · error handling (Tasks 8, 9) · "no kit ⇒ no Brand tab, no regression" (Tasks 7, 8) · testing (every task + Task 11). ✓
- **Apply mapping:** matches the corrected spec — button → `backgroundColor`, body/none → body `backgroundColor`, text/other → no-op (Task 10). ✓
- **Type consistency:** event names (`brand-kit-edit`, `brand-color-apply`, `brand-font-apply`, `brand-logo-insert`, `brand-kit-change`, `brand-kit-error`) and detail shapes are identical across emitter (Task 6) and handlers (Tasks 9, 10). `FontOption`/`DEFAULT_FONT_OPTIONS` defined in Task 2 and consumed in Task 3. `swatches`/`brandFonts` property names consistent across Tasks 1–5. ✓
- **Placeholders:** none — every code step is complete.
