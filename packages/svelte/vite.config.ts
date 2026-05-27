import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte({
      emitCss: false,
    }),
    dts({
      // Emit `index.d.ts` + the sibling `PigeonEditor.svelte.d.ts` (which
      // describes the component's typed props/events) into `dist/`. We do
      // not use `rollupTypes` because api-extractor can't traverse the
      // `.svelte` source — it relies on the hand-written sibling .d.ts.
      include: ['src/**/*.ts', 'src/**/*.svelte.d.ts'],
      copyDtsFiles: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Externalise every `svelte` and `svelte/*` import (including the
      // private `svelte/internal/*` runtime that compiled components pull
      // from in Svelte 5). Consumers always bring their own Svelte.
      external: (id) =>
        id === 'svelte' ||
        id.startsWith('svelte/') ||
        id === '@lit-pigeon/editor' ||
        id === '@lit-pigeon/core',
    },
  },
});
