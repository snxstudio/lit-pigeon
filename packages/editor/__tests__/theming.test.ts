import { describe, it, expect, afterEach } from 'vitest';
import '../src/editor.js';
import type { PigeonEditor } from '../src/editor.js';

async function mountEditor(
  attrs: Partial<Pick<PigeonEditor, 'theme' | 'themeOverrides'>> = {},
): Promise<PigeonEditor> {
  const el = document.createElement('pigeon-editor') as PigeonEditor;
  if (attrs.theme) el.theme = attrs.theme;
  if (attrs.themeOverrides) el.themeOverrides = attrs.themeOverrides;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('editor theming', () => {
  it('defaults to the light theme with no dark classes', async () => {
    const el = await mountEditor();
    expect(el.theme).toBe('light');
    expect(el.classList.contains('pigeon-dark')).toBe(false);
    expect(el.classList.contains('pigeon-auto')).toBe(false);
  });

  it('applies the .pigeon-dark host class when theme="dark"', async () => {
    const el = await mountEditor({ theme: 'dark' });
    expect(el.classList.contains('pigeon-dark')).toBe(true);
    expect(el.classList.contains('pigeon-auto')).toBe(false);
  });

  it('applies the .pigeon-auto host class when theme="auto"', async () => {
    const el = await mountEditor({ theme: 'auto' });
    expect(el.classList.contains('pigeon-auto')).toBe(true);
    expect(el.classList.contains('pigeon-dark')).toBe(false);
  });

  it('switches classes reactively when theme changes', async () => {
    const el = await mountEditor({ theme: 'dark' });
    el.theme = 'light';
    await el.updateComplete;
    expect(el.classList.contains('pigeon-dark')).toBe(false);
  });

  it('applies themeOverrides as inline custom properties', async () => {
    const el = await mountEditor({
      themeOverrides: { '--pigeon-primary': '#db2777' },
    });
    expect(el.style.getPropertyValue('--pigeon-primary')).toBe('#db2777');
  });

  it('reflects the theme attribute', async () => {
    const el = await mountEditor({ theme: 'dark' });
    expect(el.getAttribute('theme')).toBe('dark');
  });
});
