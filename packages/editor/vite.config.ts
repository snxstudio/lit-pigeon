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
          // loader/controller/types are shared between the main entry and
          // the lazy rich-text graph (they only touch TipTap via type-only
          // imports). Pin them to a tiny bridge chunk: if Rollup places
          // them inside the rich-text chunk, index.js ends up statically
          // importing that chunk — eagerly loading TipTap (~150 kB gz) for
          // every consumer and defeating the lazy-load design.
          if (/\/src\/rich-text\/(loader|controller|types)\.ts/.test(id)) {
            return 'rich-text-bridge';
          }
          if (id.includes('/src/rich-text/') || id.includes('/@tiptap/')) {
            return 'rich-text';
          }
          if (id.includes('/src/components/templates/')) {
            return 'templates';
          }
        },
        chunkFileNames: '[name].js',
      },
    },
  },
});
