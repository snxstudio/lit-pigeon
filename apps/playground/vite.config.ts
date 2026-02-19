import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@lit-pigeon/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@lit-pigeon/editor': resolve(__dirname, '../../packages/editor/src/index.ts'),
      '@lit-pigeon/renderer-mjml': resolve(__dirname, '../../packages/renderer-mjml/src/index.ts'),
    },
  },
  define: {
    'process.env': {},
    'process.platform': JSON.stringify(''),
    'process.version': JSON.stringify(''),
  },
});
