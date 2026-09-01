import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/core',
  'packages/renderer-mjml',
  'packages/parser-mjml',
  'packages/import-unlayer',
  'packages/editor',
  'packages/ssr',
  'packages/rest',
  'packages/blocks',
  'packages/lint',
  'packages/figma-import',
  'packages/mcp-server',
  'packages/svelte',
  'packages/vue',
]);
