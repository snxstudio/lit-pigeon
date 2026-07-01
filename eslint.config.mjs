// ESLint 9 flat config (migrated from .eslintrc.json).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // node_modules is ignored by default in flat config.
  {
    ignores: ['**/dist/**', '**/*.config.ts', '**/*.config.js', '**/__tests__/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
