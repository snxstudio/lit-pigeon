import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      // The gallery is its own entry so its lazily imported chunk keeps a
      // stable name that size-limit can exclude from the core budget.
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        gallery: resolve(__dirname, 'src/templates/gallery.ts'),
      },
      name: 'PigeonCore',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['immer', 'nanoid'],
    },
  },
});
