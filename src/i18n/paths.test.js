import { describe, expect, it } from 'vitest';
import { splitLocalePath, swapLocaleInPath, withLocale } from './paths.js';

describe('locale paths', () => {
  it('splits a prefixed path', () => expect(splitLocalePath('/ru/map/legacy')).toEqual({ locale: 'ru', rest: '/map/legacy' }));
  it('treats an unknown first segment as path', () => expect(splitLocalePath('/map')).toEqual({ locale: null, rest: '/map' }));
  it('normalises case', () => expect(splitLocalePath('/KK/report')).toEqual({ locale: 'kk', rest: '/report' }));
  it('keeps query and hash on swap', () =>
    expect(swapLocaleInPath('/ru/map/legacy', '?x=1', '#y', 'en')).toBe('/en/map/legacy?x=1#y'));
  it('handles a bare locale', () => expect(swapLocaleInPath('/kk', '', '', 'ru')).toBe('/ru/'));

  it('always returns a rest that starts with a slash', () => {
    expect(splitLocalePath('/')).toEqual({ locale: null, rest: '/' });
    expect(splitLocalePath('')).toEqual({ locale: null, rest: '/' });
    expect(splitLocalePath('/en')).toEqual({ locale: 'en', rest: '/' });
    expect(splitLocalePath('/en/')).toEqual({ locale: 'en', rest: '/' });
  });

  it('only treats the first segment as a locale', () => {
    expect(splitLocalePath('/map/ru')).toEqual({ locale: null, rest: '/map/ru' });
    expect(splitLocalePath('/ru/kk')).toEqual({ locale: 'ru', rest: '/kk' });
  });

  it('keeps a trailing slash in rest', () => {
    expect(splitLocalePath('/ru/map/')).toEqual({ locale: 'ru', rest: '/map/' });
  });

  it('prefixes a path with a locale', () => {
    expect(withLocale('kk', '/')).toBe('/kk/');
    expect(withLocale('en', '/map/legacy')).toBe('/en/map/legacy');
    expect(withLocale('ru', 'map')).toBe('/ru/map');
    expect(withLocale('ru', '')).toBe('/ru/');
  });

  it('adds a locale to an unprefixed path on swap', () => {
    expect(swapLocaleInPath('/map', '', '', 'kk')).toBe('/kk/map');
  });
});
