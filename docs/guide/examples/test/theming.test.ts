import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import '@lit-pigeon/editor';
import type { PigeonEditor } from '@lit-pigeon/editor';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';
import { applyTheme, clearOverride } from '../src/theming/theme-overrides.js';
import { arabicConfig, germanConfig } from '../src/theming/i18n.js';
import { brandConfig } from '../src/theming/brand-kit.js';
import { starter } from './helpers.js';

type Updatable = HTMLElement & { updateComplete: Promise<unknown> };

async function mount(setup: (el: PigeonEditor) => void = () => {}): Promise<PigeonEditor> {
  const el = document.createElement('pigeon-editor') as PigeonEditor;
  setup(el);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('theming', () => {
  it('theme.css parses', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/theming/theme.css'), 'utf8');
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    // happy-dom drops ::part() rules; the file is also checked in Chromium by angular-e2e.
    expect(sheet.cssRules.length).toBeGreaterThanOrEqual(3);
  });

  it('theme and themeOverrides', async () => {
    const el = await mount();
    applyTheme(el, 'dark', '#db2777');
    await el.updateComplete;
    expect(el.getAttribute('theme')).toBe('dark');
    expect(el.classList.contains('pigeon-dark')).toBe(true);
    expect(el.style.getPropertyValue('--pigeon-primary')).toBe('#db2777');
    el.themeOverrides = {};
    await el.updateComplete;
    expect(el.style.getPropertyValue('--pigeon-primary')).toBe('#db2777');
    clearOverride(el, '--pigeon-ring');
    await el.updateComplete;
    expect(el.style.getPropertyValue('--pigeon-ring')).toBe('');
  });

  it('locale, messages and direction', async () => {
    const de = await mount((e) => (e.config = germanConfig));
    const toolbar = de.shadowRoot!.querySelector('pigeon-toolbar') as Updatable;
    await toolbar.updateComplete;
    expect(toolbar.shadowRoot!.textContent).toContain('Vorschau');
    expect(de.getAttribute('dir')).toBe('ltr');
    de.remove();
    const ar = await mount((e) => (e.config = arabicConfig));
    expect(ar.getAttribute('dir')).toBe('rtl');
  });

  it('brand kit adds the Brand tab and its fonts reach the export', async () => {
    const el = await mount((e) => {
      e.config = brandConfig;
      e.document = starter();
      e.renderer = new MjmlRenderer();
      e.documentToMjml = documentToMjml;
    });
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    const palette = el.shadowRoot!.querySelector('pigeon-palette') as Updatable;
    await palette.updateComplete;
    expect(palette.shadowRoot!.querySelector('#pigeon-tab-brand')).not.toBeNull();
    expect(el.exportMjml()).toContain('<mj-font name="Inter"');
    expect(await el.exportHtml()).toContain('fonts.googleapis.com/css2?family=Inter');
  });
});
