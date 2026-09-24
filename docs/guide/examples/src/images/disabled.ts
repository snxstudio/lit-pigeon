import type { EditorConfig } from '@lit-pigeon/core';

// Hide the Upload button; users can still paste an image URL.
export const urlOnly: Partial<EditorConfig> = { assetManager: { enabled: false } };
