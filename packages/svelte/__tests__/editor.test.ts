import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Stub the real `<pigeon-editor>` registration with a no-op custom element
// before importing the wrapper. The real element pulls in lit-html
// directives that don't fully run under happy-dom and would spam unhandled
// rejections through the test run.
vi.mock('@lit-pigeon/editor', () => ({}));

import { cleanup, render } from '@testing-library/svelte';
import type { PigeonDocument } from '@lit-pigeon/core';
import PigeonEditor from '../src/PigeonEditor.svelte';

beforeAll(() => {
  if (!customElements.get('pigeon-editor')) {
    class StubPigeonEditor extends HTMLElement {
      document?: unknown;
      config?: unknown;
      renderer?: unknown;
      documentToMjml?: unknown;
    }
    customElements.define('pigeon-editor', StubPigeonEditor);
  }
});

afterEach(() => cleanup());

const SAMPLE_DOC: PigeonDocument = {
  version: 1,
  metadata: { name: 'Test', createdAt: 0, updatedAt: 0 },
  body: {
    attributes: { width: 600, backgroundColor: '#fff', fontFamily: 'Arial' },
    rows: [],
  },
} as unknown as PigeonDocument;

function getEditorEl(container: HTMLElement): HTMLElement & {
  document?: unknown;
  config?: unknown;
} {
  const el = container.querySelector('pigeon-editor');
  if (!el) throw new Error('pigeon-editor element not found');
  return el as HTMLElement & { document?: unknown; config?: unknown };
}

describe('PigeonEditor Svelte wrapper', () => {
  it('renders the underlying <pigeon-editor> custom element', () => {
    const { container } = render(PigeonEditor);
    expect(container.querySelector('pigeon-editor')).not.toBeNull();
  });

  it('sets `document` as a DOM property, not an attribute', () => {
    const { container } = render(PigeonEditor, { props: { document: SAMPLE_DOC } });
    const el = getEditorEl(container);
    // Property is set to the object reference.
    expect(el.document).toBe(SAMPLE_DOC);
    // Attribute is *not* a JSON-stringified clone — same object identity rule.
    expect(el.getAttribute('document')).toBeNull();
  });

  it('sets `config` as a DOM property', () => {
    const cfg = { mergeTags: { tags: [] } } as Record<string, unknown>;
    const { container } = render(PigeonEditor, { props: { config: cfg } });
    const el = getEditorEl(container);
    expect(el.config).toBe(cfg);
  });

  it('forwards `pigeon:change` as a Svelte `change` event with the detail payload', () => {
    const onChange = vi.fn();
    // In Svelte 5 the legacy `createEventDispatcher` is bridged via the
    // `events` option to `mount` (and to `@testing-library/svelte`'s render).
    // `$on` on the component instance was removed.
    const { container } = render(PigeonEditor, {
      events: { change: (e: CustomEvent) => onChange(e.detail) },
    });

    const el = getEditorEl(container);
    const detail = { document: SAMPLE_DOC };
    el.dispatchEvent(new CustomEvent('pigeon:change', { detail }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(detail);
  });

  it('forwards export events with their typed detail payloads', () => {
    const onExportHtml = vi.fn();
    const onExportMjml = vi.fn();
    const onExportJson = vi.fn();
    const { container } = render(PigeonEditor, {
      events: {
        exportHtml: (e: CustomEvent) => onExportHtml(e.detail),
        exportMjml: (e: CustomEvent) => onExportMjml(e.detail),
        exportJson: (e: CustomEvent) => onExportJson(e.detail),
      },
    });

    const el = getEditorEl(container);
    el.dispatchEvent(
      new CustomEvent('pigeon:export-html', { detail: { html: '<p/>' } }),
    );
    el.dispatchEvent(
      new CustomEvent('pigeon:export-mjml', { detail: { mjml: '<mjml/>' } }),
    );
    el.dispatchEvent(
      new CustomEvent('pigeon:export-json', { detail: { document: SAMPLE_DOC } }),
    );

    expect(onExportHtml).toHaveBeenCalledWith({ html: '<p/>' });
    expect(onExportMjml).toHaveBeenCalledWith({ mjml: '<mjml/>' });
    expect(onExportJson).toHaveBeenCalledWith({ document: SAMPLE_DOC });
  });
});
