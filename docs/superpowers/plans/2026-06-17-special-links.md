# Special Link Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First-class system links (unsubscribe, view-in-browser, email, phone) + host-registered custom link types, surfaced in the rich-text link editor and the button panel, with href sanitizers widened to allow `tel:` and `{{…}}` template hrefs.

**Architecture:** A core `LinkType` + `SYSTEM_LINK_TYPES` registry (+ `EditorConfig.linkTypes`). A shared `<pigeon-link-type-picker>` emits `link-type-select { href }`, consumed by the rich-text bubble and the button panel. The three href gates (TipTap link extension, bubble apply-regex, output sanitizer) all widen to permit `tel:` and `{{…}}`.

**Tech Stack:** TypeScript, Lit 3, TipTap (`@tiptap/extension-link`), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-17-special-links-design.md`
**Branch:** `feat/24-special-links` (stacked on `feat/22-saved-rows`).

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/core/src/types/link-type.ts` (create) | `LinkType` type |
| `packages/core/src/link-types/system-link-types.ts` (create) | `SYSTEM_LINK_TYPES` |
| `packages/core/src/index.ts` (modify) | Re-export both |
| `packages/core/src/types/editor.ts` (modify) | `EditorConfig.linkTypes?` |
| `packages/editor/src/rich-text/extensions/link.ts` (modify) | Allow `tel` (+ `{{…}}`) |
| `packages/editor/src/rich-text/serialization.ts` (modify) | Allow `tel:` + `{{…}}` in `isSafeHref` |
| `packages/editor/src/components/properties/controls/pigeon-link-type-picker.ts` (create) | The picker control |
| `packages/editor/src/rich-text/ui/bubble.ts` (modify) | `linkTypes` + picker in link popover + widen `_applyLink` |
| `packages/editor/src/components/properties/panels/button-panel.ts` (modify) | `linkTypes` + picker |
| `packages/editor/src/components/properties/pigeon-properties.ts` (modify) | forward `linkTypes` to button panel |
| `packages/editor/src/editor.ts` (modify) | `_linkTypes()`; bind on bubble + properties |

---

## Task 1: Core — LinkType + SYSTEM_LINK_TYPES + config

**Files:**
- Create: `packages/core/src/types/link-type.ts`, `packages/core/src/link-types/system-link-types.ts`
- Modify: `packages/core/src/index.ts`, `packages/core/src/types/editor.ts`
- Test: `packages/core/__tests__/link-types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/__tests__/link-types.test.ts
import { describe, it, expect } from 'vitest';
import { SYSTEM_LINK_TYPES } from '../src/index.js';
import type { LinkType, EditorConfig } from '../src/index.js';

describe('SYSTEM_LINK_TYPES', () => {
  it('includes unsubscribe and view-in-browser with fixed {{…}} templates', () => {
    const byId = Object.fromEntries(SYSTEM_LINK_TYPES.map((t) => [t.id, t]));
    expect(byId['unsubscribe'].href).toBe('{{unsubscribe_url}}');
    expect(byId['view-in-browser'].href).toBe('{{view_in_browser_url}}');
  });

  it('includes guided email and phone types', () => {
    const byId = Object.fromEntries(SYSTEM_LINK_TYPES.map((t) => [t.id, t]));
    expect(byId['email'].prompt).toBe('email');
    expect(byId['phone'].prompt).toBe('tel');
  });

  it('LinkType + EditorConfig.linkTypes are usable', () => {
    const custom: LinkType = { id: 'survey', label: 'Survey', href: '{{survey_url}}' };
    const cfg: EditorConfig = { linkTypes: [custom] };
    expect(cfg.linkTypes?.[0].id).toBe('survey');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run __tests__/link-types.test.ts`
Expected: FAIL — exports not found.

- [ ] **Step 3: Implement**

Create `packages/core/src/types/link-type.ts`:

```ts
/** A selectable "special link" surfaced in the link editor and button panel. */
export interface LinkType {
  /** Stable id (also the picker option value). */
  id: string;
  /** Label shown in the picker. */
  label: string;
  /** Href inserted on select (e.g. "{{unsubscribe_url}}"). Omitted for guided types. */
  href?: string;
  /** When set, the picker prompts for a value and builds `mailto:`/`tel:`. */
  prompt?: 'email' | 'tel';
}
```

Create `packages/core/src/link-types/system-link-types.ts`:

```ts
import type { LinkType } from '../types/link-type.js';

/**
 * Built-in system link types. `unsubscribe`/`view-in-browser` emit fixed
 * `{{…}}` placeholder hrefs (conventional ESP tokens, resolved by the host at
 * send time); `email`/`phone` prompt for a value and build `mailto:`/`tel:`.
 */
export const SYSTEM_LINK_TYPES: LinkType[] = [
  { id: 'unsubscribe', label: 'Unsubscribe', href: '{{unsubscribe_url}}' },
  { id: 'view-in-browser', label: 'View in browser', href: '{{view_in_browser_url}}' },
  { id: 'email', label: 'Email address', prompt: 'email' },
  { id: 'phone', label: 'Phone number', prompt: 'tel' },
];
```

In `packages/core/src/index.ts`, add:
```ts
export type { LinkType } from './types/link-type.js';
export { SYSTEM_LINK_TYPES } from './link-types/system-link-types.js';
```

In `packages/core/src/types/editor.ts`:
- Add import: `import type { LinkType } from './link-type.js';`
- In `EditorConfig` (after `rowLibrary`), add:
```ts
  /**
   * Optional host-registered link types (label + href template) shown in the
   * link editor and button panel alongside the built-in system links
   * (`SYSTEM_LINK_TYPES`). The host/SSR resolves any `{{…}}` templates at send.
   */
  linkTypes?: LinkType[];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run __tests__/link-types.test.ts` then `cd packages/core && npm run build`.
Expected: PASS; build clean.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types/link-type.ts packages/core/src/link-types packages/core/src/index.ts packages/core/src/types/editor.ts packages/core/__tests__/link-types.test.ts
git commit -m "feat(core): LinkType + SYSTEM_LINK_TYPES + EditorConfig.linkTypes (#24)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 2: Widen the href sanitizers (extension + output)

**Files:**
- Modify: `packages/editor/src/rich-text/extensions/link.ts`
- Modify: `packages/editor/src/rich-text/serialization.ts`
- Test: `packages/editor/__tests__/rich-text-sanitizer.test.ts` (extend)

- [ ] **Step 1: Add failing tests**

Append to `packages/editor/__tests__/rich-text-sanitizer.test.ts` inside the `describe('sanitizeHTML', …)` block:

```ts
  it('keeps tel: hrefs', () => {
    const out = sanitizeHTML('<p><a href="tel:+15551234567">call</a></p>');
    expect(out).toContain('href="tel:+15551234567"');
  });

  it('keeps {{…}} template hrefs (system/custom links)', () => {
    const out = sanitizeHTML('<p><a href="{{unsubscribe_url}}">unsub</a></p>');
    expect(out).toContain('href="{{unsubscribe_url}}"');
  });

  it('still drops javascript: hrefs', () => {
    const out = sanitizeHTML('<p><a href="javascript:alert(1)">x</a></p>');
    expect(out).not.toContain('javascript');
    expect(out).not.toContain('<a');
  });
```

- [ ] **Step 2: Run to verify the new ones fail**

Run: `cd packages/editor && npx vitest run __tests__/rich-text-sanitizer.test.ts`
Expected: the `tel:` and `{{…}}` tests FAIL (those hrefs currently stripped); the `javascript:` one passes.

- [ ] **Step 3: Implement**

In `packages/editor/src/rich-text/serialization.ts`:
- Change `SAFE_HREF_PROTOCOLS`:
```ts
const SAFE_HREF_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
```
- In `isSafeHref`, add a template-href allowance BEFORE the `new URL(...)` block (after the `#`/`/` check):
```ts
  // Merge-tag-style template hrefs (e.g. "{{unsubscribe_url}}") are emitted by
  // special/custom link types and resolved by the host at send time.
  if (/^\{\{[\w.]+\}\}$/.test(trimmed)) return true;
```

In `packages/editor/src/rich-text/extensions/link.ts`:
- Add `'tel'` to `protocols`: `protocols: ['http', 'https', 'mailto', 'tel'],`
- Ensure a `{{…}}` href survives `setLink`. The TipTap Link extension validates URIs; a `{{…}}` href may be dropped. Add a `validate` (or `isAllowedUri`/`shouldAutoLink`, per the installed `@tiptap/extension-link` API) that returns `true` for a `{{…}}` template and otherwise keeps the default behavior. Determine the exact option name from the installed version (check `node_modules/@tiptap/extension-link`); the goal is: `setLink({ href: '{{unsubscribe_url}}' })` keeps the href. This is verified by the Task 4 bubble-integration test — if that test shows the template href is dropped, add the validate option here.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run __tests__/rich-text-sanitizer.test.ts`
Expected: all PASS (incl. the 3 new). The full sanitizer suite stays green.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/rich-text/serialization.ts packages/editor/src/rich-text/extensions/link.ts packages/editor/__tests__/rich-text-sanitizer.test.ts
git commit -m "feat(editor): allow tel: and {{…}} template hrefs in sanitizers (#24)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 3: pigeon-link-type-picker control

**Files:**
- Create: `packages/editor/src/components/properties/controls/pigeon-link-type-picker.ts`
- Test: `packages/editor/__tests__/link-type-picker.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/link-type-picker.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import { SYSTEM_LINK_TYPES } from '@lit-pigeon/core';
import '../src/components/properties/controls/pigeon-link-type-picker.js';
import type { PigeonLinkTypePicker } from '../src/components/properties/controls/pigeon-link-type-picker.js';

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-link-type-picker .linkTypes=${SYSTEM_LINK_TYPES}></pigeon-link-type-picker>`, container);
  const el = container.querySelector('pigeon-link-type-picker') as PigeonLinkTypePicker;
  await el.updateComplete;
  return el;
}
function select(el: PigeonLinkTypePicker, id: string) {
  const sel = el.shadowRoot!.querySelector('select') as HTMLSelectElement;
  sel.value = id;
  sel.dispatchEvent(new Event('change'));
}

describe('pigeon-link-type-picker', () => {
  afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

  it('emits link-type-select with the template href for a system link', async () => {
    const el = await mount();
    const events: CustomEvent[] = [];
    el.addEventListener('link-type-select', (e) => events.push(e as CustomEvent));
    select(el, 'unsubscribe');
    expect(events[0].detail).toEqual({ href: '{{unsubscribe_url}}' });
  });

  it('builds mailto: from an email prompt', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('a@b.com');
    const el = await mount();
    const events: CustomEvent[] = [];
    el.addEventListener('link-type-select', (e) => events.push(e as CustomEvent));
    select(el, 'email');
    expect(events[0].detail).toEqual({ href: 'mailto:a@b.com' });
  });

  it('builds tel: from a phone prompt', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('+15551234');
    const el = await mount();
    const events: CustomEvent[] = [];
    el.addEventListener('link-type-select', (e) => events.push(e as CustomEvent));
    select(el, 'phone');
    expect(events[0].detail).toEqual({ href: 'tel:+15551234' });
  });

  it('does not emit when the prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const el = await mount();
    const events: CustomEvent[] = [];
    el.addEventListener('link-type-select', (e) => events.push(e as CustomEvent));
    select(el, 'email');
    expect(events).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/link-type-picker.test.ts`
Expected: FAIL — element not defined.

- [ ] **Step 3: Implement**

```ts
// packages/editor/src/components/properties/controls/pigeon-link-type-picker.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { LinkType } from '@lit-pigeon/core';

/**
 * `<pigeon-link-type-picker>` — a compact dropdown of "special link" types
 * (built-in system links + host customs). On select it resolves an href —
 * prompting for email/phone values — and emits `link-type-select { href }`.
 * Shared by the rich-text link popover and the button panel.
 */
@customElement('pigeon-link-type-picker')
export class PigeonLinkTypePicker extends LitElement {
  @property({ attribute: false })
  linkTypes: LinkType[] = [];

  static styles = css`
    :host { display: inline-block; }
    select {
      height: 32px;
      border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 6px;
      font-family: var(--pigeon-font);
      font-size: 12px;
      color: var(--pigeon-text-secondary, #64748b);
      background: var(--pigeon-bg, #ffffff);
      cursor: pointer;
      max-width: 160px;
    }
  `;

  render() {
    if (this.linkTypes.length === 0) return html``;
    return html`
      <select aria-label="Insert a special link" @change=${this._onChange}>
        <option value="">+ Special link</option>
        ${this.linkTypes.map((t) => html`<option value=${t.id}>${t.label}</option>`)}
      </select>
    `;
  }

  private _onChange(e: Event) {
    const sel = e.target as HTMLSelectElement;
    const id = sel.value;
    sel.value = ''; // reset so the same type can be picked again
    if (!id) return;
    const type = this.linkTypes.find((t) => t.id === id);
    if (!type) return;

    let href: string | undefined;
    if (type.prompt) {
      const value = window.prompt(type.prompt === 'email' ? 'Email address' : 'Phone number');
      if (!value || !value.trim()) return;
      href = (type.prompt === 'email' ? 'mailto:' : 'tel:') + value.trim();
    } else if (type.href) {
      href = type.href;
    }
    if (!href) return;

    this.dispatchEvent(new CustomEvent('link-type-select', {
      detail: { href },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-link-type-picker': PigeonLinkTypePicker;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/link-type-picker.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/properties/controls/pigeon-link-type-picker.ts packages/editor/__tests__/link-type-picker.test.ts
git commit -m "feat(editor): pigeon-link-type-picker control (#24)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 4: Rich-text bubble integration

**Files:**
- Modify: `packages/editor/src/rich-text/ui/bubble.ts`
- Test: `packages/editor/__tests__/bubble-link-types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/bubble-link-types.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { SYSTEM_LINK_TYPES } from '@lit-pigeon/core';
import '../src/rich-text/ui/bubble.js';
import type { PigeonRichTextBubble } from '../src/rich-text/ui/bubble.js';

// Minimal fake TipTap editor capturing setLink calls.
function fakeEditor() {
  const calls: Array<{ href: string }> = [];
  const chain: any = {};
  chain.focus = () => chain;
  chain.extendMarkRange = () => chain;
  chain.setLink = (attrs: { href: string }) => { calls.push(attrs); return chain; };
  chain.unsetLink = () => chain;
  chain.run = () => true;
  return { editor: { chain: () => chain, isDestroyed: false } as any, calls };
}

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-rich-text-bubble .linkTypes=${SYSTEM_LINK_TYPES}></pigeon-rich-text-bubble>`, container);
  const el = container.querySelector('pigeon-rich-text-bubble') as PigeonRichTextBubble;
  await el.updateComplete;
  return el;
}

describe('bubble special links', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('renders the link-type picker inside the open link popover', async () => {
    const el = await mount();
    (el as any)._linkPopoverOpen = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('pigeon-link-type-picker')).toBeTruthy();
  });

  it('applies a {{…}} template href via setLink on link-type-select', async () => {
    const el = await mount();
    const { editor, calls } = fakeEditor();
    el.editor = editor;
    (el as any)._linkPopoverOpen = true;
    await el.updateComplete;
    const picker = el.shadowRoot!.querySelector('pigeon-link-type-picker')!;
    picker.dispatchEvent(new CustomEvent('link-type-select', { detail: { href: '{{unsubscribe_url}}' }, bubbles: true, composed: true }));
    expect(calls).toContainEqual({ href: '{{unsubscribe_url}}' });
  });

  it('applies a tel: href via setLink', async () => {
    const el = await mount();
    const { editor, calls } = fakeEditor();
    el.editor = editor;
    (el as any)._linkPopoverOpen = true;
    await el.updateComplete;
    el.shadowRoot!.querySelector('pigeon-link-type-picker')!
      .dispatchEvent(new CustomEvent('link-type-select', { detail: { href: 'tel:+15551234' }, bubbles: true, composed: true }));
    expect(calls).toContainEqual({ href: 'tel:+15551234' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run __tests__/bubble-link-types.test.ts`
Expected: FAIL — no `linkTypes` property / no picker / setLink not called.

- [ ] **Step 3: Implement**

In `bubble.ts`:
- Add the import: `import '../../components/properties/controls/pigeon-link-type-picker.js';` and `import type { LinkType } from '@lit-pigeon/core';`
- Add a property (after `editor`):
```ts
  @property({ attribute: false })
  linkTypes: LinkType[] = [];
```
- Widen the `_applyLink` guard regex:
```ts
    if (!/^(https?:|mailto:|tel:|#|\/|\{\{)/i.test(href)) return;
```
- In `_renderLinkPopover`, add the picker after the Apply/Remove buttons (inside the `.link-popover` div):
```ts
        <pigeon-link-type-picker
          .linkTypes=${this.linkTypes}
          @link-type-select=${this._onLinkTypeSelect}
        ></pigeon-link-type-picker>
```
- Add the handler:
```ts
  private _onLinkTypeSelect(e: CustomEvent<{ href: string }>) {
    this._linkValue = e.detail.href;
    this._applyLink();
  }
```

> Verify the Task 2 `{{…}}`-via-`setLink` path: the `applies a {{…}} template href`
> test must pass. If it fails because the TipTap Link extension drops the
> template href, add the `validate` option in `link.ts` (Task 2) per the installed
> `@tiptap/extension-link` API, then re-run.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/editor && npx vitest run __tests__/bubble-link-types.test.ts __tests__/rich-text-bubble.test.ts`
Expected: PASS (new + existing bubble tests).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/rich-text/ui/bubble.ts packages/editor/__tests__/bubble-link-types.test.ts
git commit -m "feat(editor): special-link picker in the rich-text link editor (#24)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 5: Button panel + properties forwarding + editor wiring

**Files:**
- Modify: `packages/editor/src/components/properties/panels/button-panel.ts`
- Modify: `packages/editor/src/components/properties/pigeon-properties.ts`
- Modify: `packages/editor/src/editor.ts`
- Test: `packages/editor/__tests__/button-panel-link-types.test.ts`, `packages/editor/__tests__/editor-link-types.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// packages/editor/__tests__/button-panel-link-types.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { createBlock, SYSTEM_LINK_TYPES } from '@lit-pigeon/core';
import type { ButtonBlock } from '@lit-pigeon/core';
import '../src/components/properties/panels/button-panel.js';
import type { PigeonButtonPanel } from '../src/components/properties/panels/button-panel.js';

describe('pigeon-button-panel link types', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('emits property-change with the href from a link-type-select', async () => {
    const block = createBlock('button') as ButtonBlock;
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(html`<pigeon-button-panel .block=${block} .linkTypes=${SYSTEM_LINK_TYPES}></pigeon-button-panel>`, container);
    const panel = container.querySelector('pigeon-button-panel') as PigeonButtonPanel;
    await panel.updateComplete;

    const events: CustomEvent[] = [];
    panel.addEventListener('property-change', (e) => events.push(e as CustomEvent));
    const picker = panel.shadowRoot!.querySelector('pigeon-link-type-picker')!;
    picker.dispatchEvent(new CustomEvent('link-type-select', { detail: { href: '{{unsubscribe_url}}' }, bubbles: true, composed: true }));

    expect(events[0].detail.values).toEqual({ href: '{{unsubscribe_url}}' });
  });
});
```

```ts
// packages/editor/__tests__/editor-link-types.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import { SYSTEM_LINK_TYPES } from '@lit-pigeon/core';
import type { EditorConfig, LinkType } from '@lit-pigeon/core';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mount(config: Partial<EditorConfig>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-editor .config=${config}></pigeon-editor>`, container);
  const el = container.querySelector('pigeon-editor') as PigeonEditor;
  await el.updateComplete;
  return el;
}

describe('pigeon-editor link types', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('passes system + custom link types to the rich-text bubble', async () => {
    const custom: LinkType = { id: 'survey', label: 'Survey', href: '{{survey_url}}' };
    const el = await mount({ linkTypes: [custom] });
    await el.updateComplete;
    const bubble = el.shadowRoot!.querySelector('pigeon-rich-text-bubble') as HTMLElement & { linkTypes: LinkType[] };
    const ids = bubble.linkTypes.map((t) => t.id);
    expect(ids).toEqual([...SYSTEM_LINK_TYPES.map((t) => t.id), 'survey']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/editor && npx vitest run __tests__/button-panel-link-types.test.ts __tests__/editor-link-types.test.ts`
Expected: FAIL — no picker in button panel; bubble `linkTypes` empty.

- [ ] **Step 3: Implement**

`button-panel.ts`:
- Add imports: `import '../controls/pigeon-link-type-picker.js';` and add `LinkType` to the `@lit-pigeon/core` type import.
- Add a property (after `swatches` or `columnId`):
```ts
  @property({ attribute: false })
  linkTypes: LinkType[] = [];
```
- In `render()`, add the picker right after the Link URL `<div class="field">…</div>` block:
```ts
      <pigeon-link-type-picker
        .linkTypes=${this.linkTypes}
        @link-type-select=${this._onLinkTypeSelect}
      ></pigeon-link-type-picker>
```
- Add the handler near `_onHrefChange`:
```ts
  private _onLinkTypeSelect(e: CustomEvent<{ href: string }>) {
    this._emit({ href: e.detail.href });
  }
```

`pigeon-properties.ts`:
- Add `LinkType` to the `@lit-pigeon/core` type import.
- Add a property (after `fontConfig`):
```ts
  @property({ attribute: false })
  linkTypes: LinkType[] = [];
```
- In `_renderBlockPanel`, the `button` case forwards `.linkTypes`:
```ts
      case 'button':
        return html`<pigeon-button-panel .block=${block} .rowId=${rowId} .columnId=${columnId} .swatches=${this._swatches} .linkTypes=${this.linkTypes}></pigeon-button-panel>`;
```

`editor.ts`:
- Add `LinkType` to the `@lit-pigeon/core` type import and `SYSTEM_LINK_TYPES` to the value imports.
- Add a helper near the other config resolvers:
```ts
  private _linkTypes(): LinkType[] {
    return [...SYSTEM_LINK_TYPES, ...(this.config.linkTypes ?? [])];
  }
```
- In `render()`, bind `.linkTypes=${this._linkTypes()}` on `<pigeon-properties>` and on `<pigeon-rich-text-bubble>`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/editor && npx vitest run __tests__/button-panel-link-types.test.ts __tests__/editor-link-types.test.ts __tests__/button-schema.test.ts __tests__/properties-switch.test.ts`
Expected: PASS (new + existing button/properties tests). Then full suite: `cd packages/editor && npm test`.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/properties/panels/button-panel.ts packages/editor/src/components/properties/pigeon-properties.ts packages/editor/src/editor.ts packages/editor/__tests__/button-panel-link-types.test.ts packages/editor/__tests__/editor-link-types.test.ts
git commit -m "feat(editor): special-link picker in button panel + editor wiring (#24)"
```
NO "Co-Authored-By: Claude" trailer.

---

## Task 6: Full verification

- [ ] **Step 1: Per-package suites**
Run: `cd packages/core && npm test`, `cd packages/editor && npm test`. All pass; STOP and report BLOCKED on failure.

- [ ] **Step 2: Builds**
Run: `cd packages/core && npm run build && cd ../editor && npm run build`. No TS errors.

- [ ] **Step 3: Bundle size**
The picker + bubble/button-panel additions are small and always-loaded (the picker is used by the bubble and button panel). Run `cd packages/editor && npm run build` then from repo root `npx size-limit`; check the `@lit-pigeon/editor (ESM, excluding lit)` entry vs `.size-limit.json` (currently 45.3 kB, lazy chunks ignored). If WITHIN, report the number. If EXCEEDS, report DONE_WITH_CONCERNS with the delta — do NOT bump the budget yourself. (Note: `pigeon-link-type-picker` is imported by `button-panel`/`bubble`, both in the base bundle, so it counts toward the base.)

- [ ] **Step 4: Workspace tests**
Run: `cd /Users/mayurrawte/snxstudio/lit-pigeon && pnpm -r test`. All pass.

- [ ] **Step 5: Commit (only if step 3 required a change).**

---

## Self-Review (against spec)

- **Spec coverage:** `LinkType` + `SYSTEM_LINK_TYPES` + `EditorConfig.linkTypes` (Task 1); sanitizer widening — extension protocols, output `isSafeHref` tel:/`{{…}}`, bubble apply-regex (Tasks 2 + 4) (`javascript:` still blocked); picker control (Task 3); bubble integration (Task 4); button panel + properties forwarding + editor merge (Task 5); verification incl. size (Task 6). ✓
- **Type consistency:** `LinkType` identical across core/editor; `link-type-select { href }` emitted by the picker (Task 3) and handled in bubble (Task 4) + button panel (Task 5); `SYSTEM_LINK_TYPES` from Task 1 consumed in Task 5's `_linkTypes()`. ✓
- **Decisions honored:** built-ins + customs; picker in both surfaces; fixed `{{…}}`; window.prompt for email/phone. ✓
- **Placeholders:** none — every step has concrete code, except the TipTap `validate` option whose exact API the implementer confirms against the installed version (with a clear acceptance test in Task 4). 
