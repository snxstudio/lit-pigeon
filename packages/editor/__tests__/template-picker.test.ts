import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from 'lit';
import {
  InMemoryTemplateStorage,
  getStarterTemplates,
  createDefaultDocument,
  type Template,
  type TemplateStorage,
} from '@lit-pigeon/core';
import '../src/components/templates/pigeon-template-picker.js';
import type { PigeonTemplatePicker } from '../src/components/templates/pigeon-template-picker.js';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mountPicker(
  storage: TemplateStorage,
  open = true,
): Promise<PigeonTemplatePicker> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-template-picker
      .storage=${storage}
      ?open=${open}
    ></pigeon-template-picker>`,
    container,
  );
  const el = container.querySelector(
    'pigeon-template-picker',
  ) as PigeonTemplatePicker;
  await el.updateComplete;
  // Wait for the async list() to resolve
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

async function mountEditor(
  storage?: TemplateStorage,
): Promise<PigeonEditor> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-editor .templateStorage=${storage}></pigeon-editor>`,
    container,
  );
  const editor = container.querySelector('pigeon-editor') as PigeonEditor;
  await editor.updateComplete;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => resolve()),
  );
  return editor;
}

describe('pigeon-template-picker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders one card per template from storage.list()', async () => {
    const storage = new InMemoryTemplateStorage();
    const el = await mountPicker(storage);

    const cards = el.shadowRoot!.querySelectorAll('.template-card');
    const starters = getStarterTemplates();
    expect(cards.length).toBe(starters.length);
    // Card displays template name
    const firstCardText = (cards[0] as HTMLElement).textContent ?? '';
    expect(firstCardText).toContain(starters[0].name);
  });

  it('fires template-load with the selected template when a card is clicked', async () => {
    const storage = new InMemoryTemplateStorage();
    const el = await mountPicker(storage);

    const events: CustomEvent<{ template: Template }>[] = [];
    el.addEventListener('template-load', (e) =>
      events.push(e as CustomEvent<{ template: Template }>),
    );

    const firstCard = el.shadowRoot!.querySelector(
      '.template-card',
    ) as HTMLElement;
    firstCard.click();
    await el.updateComplete;

    expect(events).toHaveLength(1);
    expect(events[0].detail.template).toBeDefined();
    expect(events[0].detail.template.id).toBe(getStarterTemplates()[0].id);
  });

  it('fires template-save with the form payload when the save form is submitted', async () => {
    const storage = new InMemoryTemplateStorage({ includeStarters: false });
    const el = await mountPicker(storage);

    const events: CustomEvent<{
      name: string;
      description?: string;
      category?: string;
    }>[] = [];
    el.addEventListener('template-save', (e) =>
      events.push(
        e as CustomEvent<{
          name: string;
          description?: string;
          category?: string;
        }>,
      ),
    );

    const nameInput = el.shadowRoot!.querySelector(
      'input[name="template-name"]',
    ) as HTMLInputElement;
    nameInput.value = 'My Template';
    nameInput.dispatchEvent(new Event('input'));

    const descInput = el.shadowRoot!.querySelector(
      'textarea[name="template-description"]',
    ) as HTMLTextAreaElement;
    descInput.value = 'A description';
    descInput.dispatchEvent(new Event('input'));

    const catSelect = el.shadowRoot!.querySelector(
      'select[name="template-category"]',
    ) as HTMLSelectElement;
    catSelect.value = 'newsletter';
    catSelect.dispatchEvent(new Event('change'));

    await el.updateComplete;

    const form = el.shadowRoot!.querySelector(
      'form.save-form',
    ) as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await el.updateComplete;

    expect(events).toHaveLength(1);
    expect(events[0].detail.name).toBe('My Template');
    expect(events[0].detail.description).toBe('A description');
    expect(events[0].detail.category).toBe('newsletter');
  });

  it('closes when the close button is clicked', async () => {
    const storage = new InMemoryTemplateStorage();
    const el = await mountPicker(storage);
    expect(el.open).toBe(true);
    const closeBtn = el.shadowRoot!.querySelector(
      '.close-btn',
    ) as HTMLButtonElement;
    closeBtn.click();
    await el.updateComplete;
    expect(el.open).toBe(false);
  });

  it('closes when the backdrop is clicked', async () => {
    const storage = new InMemoryTemplateStorage();
    const el = await mountPicker(storage);
    const overlay = el.shadowRoot!.querySelector(
      '.overlay',
    ) as HTMLElement;
    overlay.click();
    await el.updateComplete;
    expect(el.open).toBe(false);
  });
});

describe('pigeon-editor templates integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function openPickerVia(editor: PigeonEditor): Promise<PigeonTemplatePicker> {
    const toolbar = editor.shadowRoot!.querySelector(
      'pigeon-toolbar',
    ) as HTMLElement;
    const templatesBtn = toolbar.shadowRoot!.querySelector(
      'button[data-action="templates"]',
    ) as HTMLButtonElement;
    templatesBtn.click();
    // Picker is dynamically imported on first open — let microtasks settle.
    await new Promise((r) => setTimeout(r, 20));
    await editor.updateComplete;
    return editor.shadowRoot!.querySelector(
      'pigeon-template-picker',
    ) as PigeonTemplatePicker;
  }

  it('opens the picker when the toolbar Templates button is clicked', async () => {
    const editor = await mountEditor();

    const toolbar = editor.shadowRoot!.querySelector(
      'pigeon-toolbar',
    ) as HTMLElement;
    const templatesBtn = toolbar.shadowRoot!.querySelector(
      'button[data-action="templates"]',
    ) as HTMLButtonElement;
    expect(templatesBtn).not.toBeNull();

    const picker = await openPickerVia(editor);
    expect(picker).not.toBeNull();
    expect(picker.open).toBe(true);
  });

  it('loads a template document when template-load fires', async () => {
    const editor = await mountEditor();
    const starters = getStarterTemplates();
    const target = starters[1]; // newsletter

    const picker = await openPickerVia(editor);
    picker.dispatchEvent(
      new CustomEvent('template-load', {
        detail: { template: target },
        bubbles: true,
        composed: true,
      }),
    );
    await editor.updateComplete;

    const doc = editor.getDocument();
    expect(doc.metadata.name).toBe(target.document.metadata.name);
    expect(picker.open).toBe(false);
  });

  it('persists current document via template-save with a slugified id', async () => {
    const storage = new InMemoryTemplateStorage({ includeStarters: false });
    const editor = await mountEditor(storage);
    // Replace doc with a known one so we can verify it is what got saved.
    const ref = createDefaultDocument('Saved Doc');
    editor.loadDocument(ref);
    await editor.updateComplete;

    const picker = await openPickerVia(editor);
    picker.dispatchEvent(
      new CustomEvent('template-save', {
        detail: {
          name: 'My Saved Template!',
          description: 'Custom one',
          category: 'promo',
        },
        bubbles: true,
        composed: true,
      }),
    );

    // Wait for save() + list refresh to complete
    await new Promise((r) => setTimeout(r, 10));
    await editor.updateComplete;

    const list = await storage.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('My Saved Template!');
    expect(list[0].id).toBe('my-saved-template');
    expect(list[0].category).toBe('promo');
    expect(list[0].description).toBe('Custom one');
    expect(list[0].document.metadata.name).toBe('Saved Doc');
    expect(picker.open).toBe(false);
  });
});
