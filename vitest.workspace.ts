import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/core',
  'packages/renderer-mjml',
  'packages/parser-mjml',
  'packages/editor',
  'packages/ssr',
  'packages/rest',
  'packages/blocks',
  'packages/lint',
]);
