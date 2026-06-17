import { describe, it, expect, afterEach } from 'vitest';
import { configureI18n, t, getLocale, resolveDir } from '../src/i18n/index.js';

describe('i18n', () => {
  afterEach(() => configureI18n('en')); // reset singleton between tests

  it('returns the en string by default and the key when unknown', () => {
    expect(t('toolbar.preview')).toBe('Preview');
    expect(t('does.not.exist')).toBe('does.not.exist');
    expect(getLocale()).toBe('en');
  });

  it('uses a host-supplied locale catalog with en fallback', () => {
    configureI18n('fr', { fr: { 'toolbar.preview': 'Aperçu' } });
    expect(t('toolbar.preview')).toBe('Aperçu');
    expect(t('toolbar.undo')).toBe('Undo'); // not in fr → en fallback
    expect(getLocale()).toBe('fr');
  });

  it('resolveDir derives rtl from the locale language subtag; override wins', () => {
    expect(resolveDir('ar')).toBe('rtl');
    expect(resolveDir('ar-EG')).toBe('rtl');
    expect(resolveDir('en')).toBe('ltr');
    expect(resolveDir('he', 'ltr')).toBe('ltr'); // override wins
    expect(resolveDir(undefined)).toBe('ltr');
  });
});
