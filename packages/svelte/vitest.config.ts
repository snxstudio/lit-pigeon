import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    environment: 'happy-dom',
    include: ['__tests__/**/*.test.ts'],
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
});
