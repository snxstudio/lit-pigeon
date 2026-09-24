import type { PigeonEditor } from '@lit-pigeon/editor';

export function applyTheme(editor: PigeonEditor, mode: 'light' | 'dark' | 'auto', brandColour: string): void {
  editor.theme = mode;
  // Applied as inline custom properties on the element, over the active theme.
  editor.themeOverrides = {
    '--pigeon-primary': brandColour,
    '--pigeon-ring': brandColour,
  };
}

/** Removing a key from themeOverrides does not reset it; clear it explicitly. */
export function clearOverride(editor: PigeonEditor, token: string): void {
  editor.style.removeProperty(token);
  const { [token]: _removed, ...rest } = editor.themeOverrides;
  editor.themeOverrides = rest;
}
