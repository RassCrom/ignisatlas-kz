import { expect, it } from 'vitest';
import { findUnusedPublic } from './unused-public.mjs';

it('keeps files referenced by name or by their folder prefix', () => {
  const files = ['hero.webp', 'hero-2.webp', 'icons/a.svg', 'layers/x.geojson'];
  const sources = ['<img src="/hero.webp">', 'fetch(`/icons/${name}.svg`)'];
  expect(findUnusedPublic(files, sources)).toEqual(['hero-2.webp', 'layers/x.geojson']);
});

it('handles dynamic name suffixes without treating a folder substring as a wildcard', () => {
  const files = ['layers/regions.geojson', 'layers/water_bodies.geojson', 'layers/KAZ_OSM_BORDER_LVL1.geojson', 'layers/KAZ_OSM_BORDER_LVL3.geojson'];
  const sources = ["fetch('/layers/regions.geojson')", 'addGeoJsonUrl(map, id, `/layers/KAZ_OSM_BORDER_LVL${level}.geojson`)'];
  expect(findUnusedPublic(files, sources)).toEqual(['layers/water_bodies.geojson']);
});

it('does not treat a bare "/" before a substitution as a wildcard', () => {
  const files = ['hero.webp', 'hero-2.webp'];
  const sources = ['fetch(`${base}/${id}`)', '<img src="/hero.webp">'];
  expect(findUnusedPublic(files, sources)).toEqual(['hero-2.webp']);
});
