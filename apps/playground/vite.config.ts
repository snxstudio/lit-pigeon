import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@lit-pigeon/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@lit-pigeon/editor': resolve(__dirname, '../../packages/editor/src/index.ts'),
      '@lit-pigeon/renderer-mjml': resolve(__dirname, '../../packages/renderer-mjml/src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        playground: resolve(__dirname, 'playground/index.html'),
      },
    },
  },
  define: {
    'process.env': {},
    'process.platform': JSON.stringify(''),
    'process.version': JSON.stringify(''),
  },
});
