# Custom Font Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let hosts register web fonts (`EditorConfig.fontConfig` / `RenderOptions.fonts`) so they appear in the editor font picker and the MJML renderer emits `<mj-font>` to load them, with email-safe fallback stacks.

**Architecture:** A new core `FontDefinition` type flows two ways — into the editor font picker (selection) and into the renderer's `<mj-head>` as `<mj-font name href>` (loading). The render-set is `fontConfig` plus brand-kit fonts that carry a URL; the editor passes it to preview/export, and hosts pass `fontConfig` to `renderer.render(doc, { fonts })`.

**Tech Stack:** TypeScript, MJML (`@lit-pigeon/renderer-mjml`), Lit 3 (`@lit-pigeon/editor`), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-16-custom-fonts-design.md`
**Branch:** `feat/23-custom-fonts` (stacked on `feat/6-brand-kit-panel`).

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/core/src/types/font.ts` (create) | `FontDefinition` type |
| `packages/core/src/index.ts` (modify) | Re-export `FontDefinition` |
| `packages/core/src/types/editor.ts` (modify) | `EditorConfig.fontConfig`, `RenderOptions.fonts` |
| `packages/renderer-mjml/src/document-to-mjml.ts` (modify) | `DocumentToMjmlOptions.fonts`; emit `<mj-font>` |
| `packages/renderer-mjml/src/mjml-renderer.ts` (modify) | Thread `options.fonts` into `documentToMjml` |
| `packages/editor/src/components/properties/controls/font-picker.ts` (modify) | Widen `brandFonts` type to `FontDefinition[]` |
| `packages/editor/src/components/properties/panels/body-panel.ts` (modify) | Widen `brandFonts` type to `FontDefinition[]` |
| `packages/editor/src/components/properties/pigeon-properties.ts` (modify) | `fontConfig` prop; merge into the font list |
| `packages/editor/src/components/preview/pigeon-preview.ts` (modify) | `fonts` prop; pass `{ fonts }` to render calls |
| `packages/editor/src/editor.ts` (modify) | `_renderFonts()`; bind preview `.fonts`; export passes fonts; pass `.fontConfig` to properties |

Run tests per package from its dir: `npx vitest run <file>`. Core lives at `packages/core`, renderer at `packages/renderer-mjml`, editor at `packages/editor`.

---

## Task 1: Core — FontDefinition type + config/options fields

**Files:**
- Create: `packages/core/src/types/font.ts`
- Modify: `packages/core/src/index.ts`, `packages/core/src/types/editor.ts`
- Test: `packages/core/__tests__/font-definition.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/__tests__/font-definition.test.ts
import { describe, it, expect } from 'vitest';
import type { FontDefinition, EditorConfig, RenderOptions } from '../src/index.js';

describe('FontDefinition', () => {
  it('is exported and structurally usable in config + render options', () => {
    const font: FontDefinition = { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://x/inter.css' };
    const cfg: EditorConfig = { fontConfig: [font] };
    const opts: RenderOptions = { fonts: [font] };
    expect(cfg.fontConfig?.[0].family).toBe('Inter, Arial, sans-serif');
    expect(opts.fonts?.[0].name).toBe('Inter');
    // url is optional
    const bare: FontDefinition = { name: 'Serif', family: 'Georgia, serif' };
    expect(bare.url).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run __tests__/font-definition.test.ts`
Expected: FAIL — `FontDefinition` not exported / `fontConfig`/`fonts` not on the types.

- [ ] **Step 3: Implement**

Create `packages/core/src/types/font.ts`:

```ts
/**
 * A web/brand font a host registers so it appears in the editor font picker
 * and (when `url` is set) is emitted by the renderer as `<mj-font>`.
 */
export interface FontDefinition {
  /** Display name shown in the font picker. */
  name: string;
  /** CSS font-family stack, including email-safe fallbacks (e.g. "Inter, Arial, sans-serif"). */
  family: string;
  /** Optional stylesheet URL that loads the web font (e.g. a Google Fonts CSS link). */
  url?: string;
}
```

In `packages/core/src/index.ts`, add a new export block after the document-types block (after line 22):

```ts
export type { FontDefinition } from './types/font.js';
```

In `packages/core/src/types/editor.ts`:
- At the top, add to the imports: `import type { FontDefinition } from './font.js';`
- In `EditorConfig`, add after `brandKit`:
```ts
  /**
   * Optional host-registered fonts. They appear as options in the editor font
   * picker and, when a `url` is set, are emitted by the renderer as `<mj-font>`
   * so email clients load them. Family stacks should include email-safe
   * fallbacks.
   */
  fontConfig?: FontDefinition[];
```
- In `RenderOptions`, add after `outlookWorkarounds`:
```ts
  /**
   * Web fonts to emit as `<mj-font>` in the document head. Each font with a
   * `url` produces one stylesheet link; URL-less fonts are ignored.
   */
  fonts?: FontDefinition[];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run __tests__/font-definition.test.ts`
Expected: PASS. Also `cd packages/core && npm run build` (tsc) succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types/font.ts packages/core/src/index.ts packages/core/src/types/editor.ts packages/core/__tests__/font-definition.test.ts
git commit -m "feat(core): FontDefinition type + fontConfig/RenderOptions.fonts (#23)"
```

NO "Co-Authored-By: Claude" trailer (project convention).

---

## Task 2: Renderer emits `<mj-font>`

**Files:**
- Modify: `packages/renderer-mjml/src/document-to-mjml.ts`
- Test: `packages/renderer-mjml/__tests__/mj-font.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/renderer-mjml/__tests__/mj-font.test.ts
import { describe, it, expect } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { FontDefinition } from '@lit-pigeon/core';
import { documentToMjml } from '../src/document-to-mjml.js';

const FONTS: FontDefinition[] = [
  { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.example/inter.css' },
  { name: 'No URL', family: 'NoUrl, serif' },
];

describe('documentToMjml <mj-font> emission', () => {
  it('emits <mj-font> with the primary family token as name for url fonts', () => {
    const mjml = documentToMjml(createDefaultDocument(), { fonts: FONTS });
    expect(mjml).toContain('<mj-font name="Inter" href="https://fonts.example/inter.css" />');
  });

  it('skips fonts without a url', () => {
    const mjml = documentToMjml(createDefaultDocument(), { fonts: FONTS });
    expect(mjml).not.toContain('NoUrl');
  });

  it('dedupes by href', () => {
    const dup: FontDefinition[] = [
      { name: 'A', family: 'Inter, sans-serif', url: 'https://x/u1.css' },
      { name: 'B', family: 'Inter Tight, sans-serif', url: 'https://x/u1.css' },
    ];
    const mjml = documentToMjml(createDefaultDocument(), { fonts: dup });
    expect((mjml.match(/<mj-font /g) ?? []).length).toBe(1);
  });

  it('emits no <mj-font> when no fonts option is given', () => {
    const mjml = documentToMjml(createDefaultDocument());
    expect(mjml).not.toContain('<mj-font');
  });

  it('places <mj-font> before <mj-attributes>', () => {
    const mjml = documentToMjml(createDefaultDocument(), { fonts: FONTS });
    expect(mjml.indexOf('<mj-font')).toBeLessThan(mjml.indexOf('<mj-attributes>'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/renderer-mjml && npx vitest run __tests__/mj-font.test.ts`
Expected: FAIL — no `<mj-font>` emitted; `fonts` not an accepted option.

- [ ] **Step 3: Implement**

In `packages/renderer-mjml/src/document-to-mjml.ts`:

a) Add the import near the top:
```ts
import type { FontDefinition } from '@lit-pigeon/core';
```
(If the file has no `@lit-pigeon/core` import yet, add it; otherwise extend the existing type import.)

b) Extend `DocumentToMjmlOptions`:
```ts
export interface DocumentToMjmlOptions {
  outlookWorkarounds?: boolean;
  /**
   * Web fonts to emit as `<mj-font>` in the head. Each font with a `url`
   * produces one stylesheet link (deduped by url); URL-less fonts are skipped.
   */
  fonts?: FontDefinition[];
}
```

c) Add a font-tag builder above `renderHead`:
```ts
/**
 * Builds `<mj-font>` tags for each registered font that has a URL, deduped by
 * href. `name` is the primary family token (first entry of the stack), which
 * is what MJML matches against `font-family` declarations.
 */
function renderFontTags(fonts: FontDefinition[]): string {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const font of fonts) {
    if (!font.url || seen.has(font.url)) continue;
    seen.add(font.url);
    const name = font.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    tags.push(`    <mj-font name="${escapeAttr(name)}" href="${escapeAttr(font.url)}" />`);
  }
  return tags.join('\n');
}
```

d) In `renderHead`, after the `if (options.outlookWorkarounds) { ... }` block and BEFORE the `<mj-attributes>` push, insert:
```ts
  const fontTags = renderFontTags(options.fonts);
  if (fontTags) headParts.push(fontTags);
```

e) In `documentToMjml`, extend the resolved options:
```ts
  const resolved: Required<DocumentToMjmlOptions> = {
    outlookWorkarounds: options?.outlookWorkarounds ?? true,
    fonts: options?.fonts ?? [],
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/renderer-mjml && npx vitest run __tests__/mj-font.test.ts __tests__/renderer.test.ts`
Expected: PASS (new file + existing renderer tests, no regression).

- [ ] **Step 5: Commit**

```bash
git add packages/renderer-mjml/src/document-to-mjml.ts packages/renderer-mjml/__tests__/mj-font.test.ts
git commit -m "feat(renderer-mjml): emit <mj-font> for registered web fonts (#23)"
```

NO "Co-Authored-By: Claude" trailer.

---

## Task 3: Renderer.render threads fonts → HTML

**Files:**
- Modify: `packages/renderer-mjml/src/mjml-renderer.ts`
- Test: `packages/renderer-mjml/__tests__/renderer-fonts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/renderer-mjml/__tests__/renderer-fonts.test.ts
import { describe, it, expect } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { FontDefinition } from '@lit-pigeon/core';
import { MjmlRenderer } from '../src/mjml-renderer.js';

const FONTS: FontDefinition[] = [
  { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.googleapis.com/css?family=Inter' },
];

describe('MjmlRenderer font loading', () => {
  it('includes the registered font stylesheet URL in the rendered HTML head', async () => {
    const renderer = new MjmlRenderer();
    const result = await renderer.render(createDefaultDocument(), { fonts: FONTS });
    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('https://fonts.googleapis.com/css?family=Inter');
  });

  it('does not include any external font URL when no fonts are passed', async () => {
    const renderer = new MjmlRenderer();
    const result = await renderer.render(createDefaultDocument());
    expect(result.html).not.toContain('fonts.googleapis.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/renderer-mjml && npx vitest run __tests__/renderer-fonts.test.ts`
Expected: FAIL — fonts not threaded; URL absent from HTML.

- [ ] **Step 3: Implement**

In `packages/renderer-mjml/src/mjml-renderer.ts`, extend the `documentToMjml` call inside `render`:

```ts
    const mjmlMarkup = documentToMjml(doc, {
      outlookWorkarounds: options?.outlookWorkarounds,
      fonts: options?.fonts,
    });
```

(`RenderOptions.fonts` was added in Task 1, so `options?.fonts` is typed.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/renderer-mjml && npx vitest run __tests__/renderer-fonts.test.ts`
Expected: PASS. Then full renderer suite: `cd packages/renderer-mjml && npm test`.

- [ ] **Step 5: Commit**

```bash
git add packages/renderer-mjml/src/mjml-renderer.ts packages/renderer-mjml/__tests__/renderer-fonts.test.ts
git commit -m "feat(renderer-mjml): thread RenderOptions.fonts into MJML (#23)"
```

NO "Co-Authored-By: Claude" trailer.

---

## Task 4: Editor font picker lists fontConfig

**Files:**
- Modify: `packages/editor/src/components/properties/controls/font-picker.ts`
- Modify: `packages/editor/src/components/properties/panels/body-panel.ts`
- Modify: `packages/editor/src/components/properties/pigeon-properties.ts`
- Test: `packages/editor/__tests__/properties-fontconfig.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/properties-fontconfig.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { BrandKit, FontDefinition, PigeonDocument } from '@lit-pigeon/core';
import '../src/components/properties/pigeon-properties.js';
import type { PigeonProperties } from '../src/components/properties/pigeon-properties.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [],
  fonts: [{ id: 'l', name: 'Lora', family: 'Lora, serif' }], logos: [],
  createdAt: '', updatedAt: '',
};
const FONT_CONFIG: FontDefinition[] = [
  { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://x/inter.css' },
];

async function mount(doc: PigeonDocument, brandKit: BrandKit | null, fontConfig: FontDefinition[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-properties .doc=${doc} .selection=${null} .brandKit=${brandKit} .fontConfig=${fontConfig}></pigeon-properties>`,
    container,
  );
  const el = container.querySelector('pigeon-properties') as PigeonProperties;
  await el.updateComplete;
  return el;
}

describe('pigeon-properties fontConfig', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('passes fontConfig + brand fonts to the body panel font list', async () => {
    const el = await mount(createDefaultDocument(), KIT, FONT_CONFIG);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & {
      brandFonts: FontDefinition[]; updateComplete: Promise<unknown>;
    };
    await body.updateComplete;
    const families = body.brandFonts.map((f) => f.family);
    expect(families).toContain('Inter, Arial, sans-serif'); // from fontConfig
    expect(families).toContain('Lora, serif'); // from brand kit
  });

  it('the font picker lists an Inter option from fontConfig', async () => {
    const el = await mount(createDefaultDocument(), null, FONT_CONFIG);
    const body = el.shadowRoot!.querySelector('pigeon-body-panel') as HTMLElement & { updateComplete: Promise<unknown> };
    await body.updateComplete;
    const picker = (body as unknown as { shadowRoot: ShadowRoot }).shadowRoot.querySelector('pigeon-font-picker') as HTMLElement & { updateComplete: Promise<unknown> };
    await picker.updateComplete;
    const values = Array.from(picker.shadowRoot!.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(values).toContain('Inter, Arial, sans-serif');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/properties-fontconfig.test.ts`
Expected: FAIL — `fontConfig` not a property; Inter not in the merged list.

- [ ] **Step 3: Implement**

a) `controls/font-picker.ts`: widen the `brandFonts` property type from `BrandFont[]` to `FontDefinition[]`. Change the import to `import type { FontDefinition } from '@lit-pigeon/core';` (replace the `BrandFont` import if it is only used for this prop) and the property to:
```ts
  /** Selectable fonts beyond the built-in defaults (brand-kit fonts and/or host fontConfig). De-duped by family. */
  @property({ attribute: false })
  brandFonts: FontDefinition[] = [];
```
The `_options` getter and render are unchanged (they already read `.name`/`.family`).

b) `panels/body-panel.ts`: widen the `brandFonts` property type to `FontDefinition[]`. Update the type import: add `FontDefinition` (and drop `BrandFont` if now unused) from `@lit-pigeon/core`. Property:
```ts
  @property({ attribute: false })
  brandFonts: FontDefinition[] = [];
```
No other body-panel change (it already forwards `.brandFonts` to the picker).

c) `pigeon-properties.ts`:
- Add `FontDefinition` to the `@lit-pigeon/core` type import.
- Add a property after `brandKit`:
```ts
  @property({ attribute: false })
  fontConfig: FontDefinition[] = [];
```
- Change the `_brandFonts` getter to merge fontConfig + brand-kit fonts, deduped by family (fontConfig first so host fonts win on collision):
```ts
  private get _brandFonts(): FontDefinition[] {
    const merged: FontDefinition[] = [...this.fontConfig, ...(this.brandKit?.fonts ?? [])];
    const seen = new Set<string>();
    return merged.filter((f) => (seen.has(f.family) ? false : (seen.add(f.family), true)));
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/properties-fontconfig.test.ts __tests__/properties-brand.test.ts __tests__/body-panel-brand.test.ts __tests__/font-picker.test.ts`
Expected: PASS (new + the #6 font/brand tests still green).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/properties/controls/font-picker.ts packages/editor/src/components/properties/panels/body-panel.ts packages/editor/src/components/properties/pigeon-properties.ts packages/editor/__tests__/properties-fontconfig.test.ts
git commit -m "feat(editor): font picker lists fontConfig + brand fonts (#23)"
```

NO "Co-Authored-By: Claude" trailer.

---

## Task 5: Editor render-set + preview/export pass fonts

**Files:**
- Modify: `packages/editor/src/components/preview/pigeon-preview.ts`
- Modify: `packages/editor/src/editor.ts`
- Test: `packages/editor/__tests__/preview-fonts.test.ts`, `packages/editor/__tests__/editor-render-fonts.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/__tests__/preview-fonts.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import { createDefaultDocument } from '@lit-pigeon/core';
import type { FontDefinition, Renderer } from '@lit-pigeon/core';
import '../src/components/preview/pigeon-preview.js';
import type { PigeonPreview } from '../src/components/preview/pigeon-preview.js';

const FONTS: FontDefinition[] = [{ name: 'Inter', family: 'Inter, sans-serif', url: 'https://x/inter.css' }];

describe('pigeon-preview font passing', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('passes the fonts option to documentToMjml and renderer.render', async () => {
    const documentToMjml = vi.fn((_doc, _opts?) => '<mjml></mjml>');
    const renderSpy = vi.fn(async (_doc, _opts?) => ({ html: '<html></html>', errors: [] }));
    const renderer: Renderer = { render: renderSpy };

    const container = document.createElement('div');
    document.body.appendChild(container);
    render(
      html`<pigeon-preview
        .doc=${createDefaultDocument()}
        .documentToMjml=${documentToMjml}
        .renderer=${renderer}
        .fonts=${FONTS}
        ?open=${false}
      ></pigeon-preview>`,
      container,
    );
    const el = container.querySelector('pigeon-preview') as PigeonPreview;
    await el.updateComplete;
    el.open = true;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));

    expect(documentToMjml).toHaveBeenCalledWith(expect.anything(), { fonts: FONTS });
    expect(renderSpy).toHaveBeenCalledWith(expect.anything(), { fonts: FONTS });
  });
});
```

```ts
// packages/editor/__tests__/editor-render-fonts.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import type { BrandKit, FontDefinition, EditorConfig, PigeonDocument } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

const KIT: BrandKit = {
  id: 'k', name: 'Kit', colors: [],
  fonts: [
    { id: 'lora', name: 'Lora', family: 'Lora, serif', url: 'https://x/lora.css' }, // has url → render-set
    { id: 'noweb', name: 'NoWeb', family: 'NoWeb, serif' },                          // no url → selection only
  ],
  logos: [], createdAt: '', updatedAt: '',
};
const FONT_CONFIG: FontDefinition[] = [{ name: 'Inter', family: 'Inter, sans-serif', url: 'https://x/inter.css' }];

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor render-set', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('exportMjml passes fontConfig + brand fonts with a URL (excludes URL-less brand fonts)', async () => {
    const documentToMjml = vi.fn((_doc: PigeonDocument, _opts?: unknown) => '<mjml></mjml>');
    const el = await mount({ brandKit: KIT, fontConfig: FONT_CONFIG });
    el.documentToMjml = documentToMjml as unknown as (doc: PigeonDocument) => string;
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));

    el.exportMjml();
    const passedFonts = (documentToMjml.mock.calls[0][1] as { fonts: FontDefinition[] }).fonts;
    const families = passedFonts.map((f) => f.family);
    expect(families).toContain('Inter, sans-serif'); // fontConfig
    expect(families).toContain('Lora, serif');        // brand font with url
    expect(families).not.toContain('NoWeb, serif');   // brand font without url excluded
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/editor && npx vitest run __tests__/preview-fonts.test.ts __tests__/editor-render-fonts.test.ts`
Expected: FAIL — preview doesn't pass `{ fonts }`; editor has no render-set / `exportMjml` passes no options.

- [ ] **Step 3: Implement**

`pigeon-preview.ts`:
- Add `FontDefinition` to the `@lit-pigeon/core` type import.
- Widen the `documentToMjml` property type and add a `fonts` property:
```ts
  @property({ attribute: false })
  documentToMjml?: (doc: PigeonDocument, options?: { fonts?: FontDefinition[] }) => string;

  @property({ attribute: false })
  fonts: FontDefinition[] = [];
```
- In `_loadPreview()`, pass the option to both calls:
```ts
    if (this.documentToMjml) {
      this._mjmlContent = this.documentToMjml(this.doc, { fonts: this.fonts });
    }
    if (this.renderer) {
      try {
        const result = await this.renderer.render(this.doc, { fonts: this.fonts });
        this._htmlContent = result.html;
      } catch {
        this._htmlContent = '<p>Failed to render preview</p>';
      }
    }
```

`editor.ts`:
- Add `FontDefinition` to the `@lit-pigeon/core` type import.
- Widen the editor's `documentToMjml` property type to accept the optional options arg:
```ts
  @property({ attribute: false })
  documentToMjml?: (doc: PigeonDocument, options?: { fonts?: FontDefinition[] }) => string;
```
(Find the existing `documentToMjml` `@property` declaration and update its type. Keep `attribute: false`/`type: Object` consistent with the current declaration — only the function signature changes.)
- Add a render-set helper near the other brand-kit private members:
```ts
  /** Fonts to load in preview/export: host fontConfig + brand fonts that carry a URL, deduped by family. */
  private _renderFonts(): FontDefinition[] {
    const brandWithUrl = (this._activeBrandKit?.fonts ?? []).filter((f) => f.url);
    const merged: FontDefinition[] = [...(this.config.fontConfig ?? []), ...brandWithUrl];
    const seen = new Set<string>();
    return merged.filter((f) => (seen.has(f.family) ? false : (seen.add(f.family), true)));
  }
```
- In `exportMjml()`, pass the render-set:
```ts
  exportMjml(): string | null {
    if (this.documentToMjml) {
      return this.documentToMjml(this._state.doc, { fonts: this._renderFonts() });
    }
    return null;
  }
```
- In `exportHtml()`, pass the render-set to the renderer:
```ts
  async exportHtml(): Promise<string | null> {
    if (this.renderer) {
      const result = await this.renderer.render(this._state.doc, { fonts: this._renderFonts() });
      return result.html;
    }
    return null;
  }
```
- In `_handleExportMjml()` (the toolbar handler), update its `documentToMjml` call the same way:
```ts
    const mjml = this.documentToMjml ? this.documentToMjml(this._state.doc, { fonts: this._renderFonts() }) : null;
```
- In `render()`, bind the render-set and fontConfig:
  - On `<pigeon-preview>`, add `.fonts=${this._renderFonts()}`.
  - On `<pigeon-properties>`, add `.fontConfig=${this.config.fontConfig ?? []}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run __tests__/preview-fonts.test.ts __tests__/editor-render-fonts.test.ts __tests__/preview-a11y.test.ts`
Expected: PASS. Then full editor suite: `cd packages/editor && npm test`.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/preview/pigeon-preview.ts packages/editor/src/editor.ts packages/editor/__tests__/preview-fonts.test.ts packages/editor/__tests__/editor-render-fonts.test.ts
git commit -m "feat(editor): load fontConfig + brand web-fonts in preview/export (#23)"
```

NO "Co-Authored-By: Claude" trailer.

---

## Task 6: Full verification

- [ ] **Step 1: Per-package suites**

Run:
- `cd packages/core && npm test` — expect all pass (incl. new font-definition test).
- `cd packages/renderer-mjml && npm test` — expect all pass (incl. mj-font + renderer-fonts).
- `cd packages/editor && npm test` — expect all pass (incl. fontConfig/preview/render-set tests + the #6 suite).

If anything fails, STOP and report (BLOCKED).

- [ ] **Step 2: Type-check + build each touched package**

Run: `cd packages/core && npm run build && cd ../renderer-mjml && npm run build && cd ../editor && npm run build`
Expected: all succeed, no TS errors.

- [ ] **Step 3: Bundle-size budget**

The editor changes here are small (a few props + a helper; no new always-loaded component). Run `cd packages/editor && npm run build` and check the `size-limit` chunk against the current budget in `.size-limit.json`.
- If WITHIN budget: report the number, change nothing.
- If it EXCEEDS: report by how much. Do NOT bump the budget blindly — the font work is additive plumbing; investigate what grew. If genuinely justified and unavoidable, note the delta in the PR and ask before bumping. (Headroom was ~0.1 kB after #6, so this may need attention.)

- [ ] **Step 4: Workspace-wide tests**

Run from repo root: `cd /Users/mayurrawte/snxstudio/lit-pigeon && pnpm -r test`
Expected: all packages pass.

- [ ] **Step 5: Commit (only if step 3 required a change)**

```bash
git add -A && git commit -m "chore: size budget for custom fonts (#23)"
```
(NO Co-Authored-By trailer.) If nothing changed, no commit.

---

## Self-Review (against spec)

- **Spec coverage:** FontDefinition + config/options (Task 1); `<mj-font>` emit rules — url-only, primary-family name, dedup-by-href, before mj-attributes, no-fonts-unchanged (Task 2); render() threading → HTML (Task 3); picker lists fontConfig + brand fonts (Task 4); render-set = fontConfig + brand-fonts-with-url, preview + export pass `{ fonts }`, properties gets `fontConfig` (Task 5); verification incl. size budget (Task 6). ✓
- **Type consistency:** `FontDefinition` shape identical across all tasks; `brandFonts` widened to `FontDefinition[]` in font-picker + body-panel + properties getter (Task 4); `documentToMjml` signature widened consistently in preview + editor (Task 5); `RenderOptions.fonts` (Task 1) consumed in renderer (Task 3) and editor export (Task 5). ✓
- **Placeholders:** none — every step has concrete code. ✓
- **Decisions honored:** all-registered-with-url, `<mj-font href>` only, render fontConfig + brand-fonts-with-url. ✓
