import type { BrandKit, EditorConfig } from '@lit-pigeon/core';

const now = new Date().toISOString();

export const brandKit: BrandKit = {
  id: 'default',
  name: 'Default brand',
  colors: [
    { id: 'primary', name: 'Primary', value: '#0f766e' },
    { id: 'ink', name: 'Ink', value: '#0f172a' },
  ],
  fonts: [
    // Fonts with a url are loaded in the preview and emitted as <mj-font> on export.
    { id: 'inter', name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700' },
  ],
  logos: [{ id: 'logo', name: 'Logo', src: 'https://cdn.example.com/logo.png', width: 160 }],
  createdAt: now,
  updatedAt: now,
};

export const brandConfig: Partial<EditorConfig> = {
  brandKit,
  // Fonts offered in the font pickers, in addition to the brand kit's.
  fontConfig: [{ name: 'Georgia', family: 'Georgia, serif' }],
};
