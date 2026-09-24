import { defineConfig, type Plugin } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The editor's dist bundles a production copy of lit's ref directive, so lit
// itself must load its production build too (see troubleshooting.md).
function litProduction(): Plugin {
  return {
    name: 'lit-production',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (resolved && /\/(lit-html|lit-element|lit|@lit\/reactive-element)\/development\//.test(resolved.id)) {
        return { ...resolved, id: resolved.id.replace('/development/', '/') };
      }
      return resolved;
    },
  };
}

export default defineConfig({
  plugins: [litProduction(), vue(), svelte({ hot: false })],
  test: {
    name: 'docs',
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    server: { deps: { inline: [/lit/] } },
  },
  resolve: {
    conditions: ['browser'],
  },
});
