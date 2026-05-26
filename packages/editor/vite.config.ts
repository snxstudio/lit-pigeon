import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js', 'lit/directives/style-map.js', 'lit/directives/unsafe-html.js', '@lit-pigeon/core'],
      output: {
        // Give the lazy-loaded rich-text bundle a stable name so size-limit
        // can target it predictably.
        manualChunks(id) {
          if (id.includes('/src/rich-text/') || id.includes('/@tiptap/')) {
            return 'rich-text';
          }
        },
        chunkFileNames: '[name].js',
      },
    },
  },
});
