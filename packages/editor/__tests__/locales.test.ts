import { describe, it, expect } from 'vitest';
import { EN_MESSAGES } from '../src/i18n/en.js';
import { BUILT_IN_LOCALES, loadLocale } from '../src/i18n/index.js';

const files = Object.keys(import.meta.glob('../src/i18n/locales/*.ts'));
const codeOf = (path: string) => path.split('/').pop()!.replace(/\.ts$/, '');
const enKeys = Object.keys(EN_MESSAGES).sort();

describe('built-in locales', () => {
  it('registers a loader for every locale file', () => {
    expect(files.map(codeOf).sort()).toEqual([...BUILT_IN_LOCALES].sort());
  });

  it.each(BUILT_IN_LOCALES)('%s covers every en key and no others', async (code) => {
    const catalog = (await loadLocale(code))!;
    expect(Object.keys(catalog).sort()).toEqual(enKeys);
    for (const [key, value] of Object.entries(catalog)) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('matches the full tag, then the language subtag, case-insensitively', async () => {
    expect(await loadLocale('pt-BR')).toBe(await loadLocale('pt_br'));
    expect(await loadLocale('pt')).toBe(await loadLocale('pt-BR'));
    expect(await loadLocale('fr-CA')).toBe(await loadLocale('fr'));
    expect(await loadLocale('en')).toBeUndefined();
    expect(await loadLocale('xx')).toBeUndefined();
  });
});
