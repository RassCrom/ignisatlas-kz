import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectLocale } from './detectLocale.js';
import { LOCALE_STORAGE_KEY } from './locales.js';

const fakeStorage = (value) => ({
  getItem: (key) => (key === LOCALE_STORAGE_KEY ? value : null),
});

describe('detectLocale', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('prefers a saved locale', () => expect(detectLocale({ storage: fakeStorage('ru'), languages: ['en-US'] })).toBe('ru'));
  it('uses the browser language next', () => expect(detectLocale({ storage: fakeStorage(null), languages: ['en-US', 'ru'] })).toBe('en'));
  it('defaults to kk', () => expect(detectLocale({ storage: fakeStorage(null), languages: ['de-DE'] })).toBe('kk'));

  it('survives a throwing storage', () => {
    const storage = { getItem: () => { throw new Error('SecurityError'); } };
    expect(detectLocale({ storage, languages: ['ru-RU'] })).toBe('ru');
  });

  it('ignores a saved value that is not a locale', () => {
    expect(detectLocale({ storage: fakeStorage('de'), languages: ['en-GB'] })).toBe('en');
  });

  it('skips unsupported browser languages and reads the first supported one', () => {
    expect(detectLocale({ storage: fakeStorage(null), languages: ['de-DE', 'RU-ru', 'en'] })).toBe('ru');
  });

  it('works with no argument, reading localStorage and navigator.languages', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US', 'ru']);
    expect(detectLocale()).toBe('en');

    localStorage.setItem(LOCALE_STORAGE_KEY, 'ru');
    expect(detectLocale()).toBe('ru');
  });

  it('works with no argument when reading globalThis.localStorage throws', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ru-RU']);
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('SecurityError'); },
    });
    try {
      expect(detectLocale()).toBe('ru');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', original);
    }
  });
});
