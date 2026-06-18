import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // The site is served at the root of the `lit-pigeon.wearesnx.studio` custom
  // domain (see apps/playground/public/CNAME), so assets must resolve from `/`.
  // A `/lit-pigeon/` base only suits the bare github.io project URL and 404s
  // every asset on the custom domain — leaving the JS-mounted editor blank.
  base: '/',
  resolve: {
    alias: {
      '@lit-pigeon/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@lit-pigeon/editor': resolve(__dirname, '../../packages/editor/src/index.ts'),
      '@lit-pigeon/renderer-mjml': resolve(__dirname, '../../packages/renderer-mjml/src/index.ts'),
      '@lit-pigeon/parser-mjml': resolve(__dirname, '../../packages/parser-mjml/src/index.ts'),
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
