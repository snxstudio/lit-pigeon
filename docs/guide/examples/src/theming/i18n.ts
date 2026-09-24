import type { EditorConfig } from '@lit-pigeon/core';

// Keys come from packages/editor/src/i18n/en.ts. Missing keys fall back to English.
export const germanConfig: Partial<EditorConfig> = {
  locale: 'de',
  messages: {
    de: {
      'toolbar.undo': 'Rückgängig',
      'toolbar.redo': 'Wiederholen',
      'toolbar.preview': 'Vorschau',
      'toolbar.export': 'Exportieren',
      'toolbar.templates': 'Vorlagen',
    },
  },
};

// Arabic, Hebrew, Persian and Urdu (and a few others) switch the layout to right-to-left.
export const arabicConfig: Partial<EditorConfig> = {
  locale: 'ar',
  messages: { ar: { 'toolbar.preview': 'معاينة' } },
};
