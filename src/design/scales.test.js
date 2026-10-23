import { describe, expect, it } from 'vitest';
import scales from 'src/design/scales.json';

describe('data scales', () => {
  it('scales match the spec', () => {
    expect(scales.ember).toEqual(['#1D1C42', '#6E2D40', '#D2401E', '#E8A33D', '#FFE6B0']);
    expect(scales.ink).toEqual(['#DEDBD0', '#E7B79E', '#DE7F5C', '#C7432A', '#8E1F12']);
    expect(Object.keys(scales.landcover)).toEqual(['cropland', 'crop_mosaic', 'grassland', 'shrubland', 'forest', 'wetland', 'sparse_bare', 'other']);
  });

  it('diverging scale is sky, neutral, fire', () => {
    expect(scales.diverging).toEqual(['#3FA9FF', '#1C1F2A', '#FF6A1A']);
  });

  it('landcover colours match the pipeline palette', () => {
    expect(scales.landcover).toEqual({
      cropland: '#E8C547',
      crop_mosaic: '#B8963A',
      grassland: '#9CC45A',
      shrubland: '#5F8F5B',
      forest: '#2E7D4F',
      wetland: '#3FA9F5',
      sparse_bare: '#B08968',
      other: '#6B7075',
    });
  });

  it('every colour is an upper-case #RRGGBB hex', () => {
    const all = [...scales.ember, ...scales.ink, ...scales.diverging, ...Object.values(scales.landcover)];
    for (const c of all) expect(c).toMatch(/^#[0-9A-F]{6}$/);
  });
});
