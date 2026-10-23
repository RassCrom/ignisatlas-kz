import { describe, expect, it } from 'vitest';
import { contrastRatio } from 'src/design/contrast';

describe('contrastRatio', () => {
  it('matches WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#6B6E72', '#ECEDE7')).toBeCloseTo(4.35, 1);
  });

  it('is symmetric and 1 for identical colours', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#3FA9FF', '#3FA9FF')).toBe(1);
  });

  it('accepts lower case and short hex', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#6b6e72', '#ecede7')).toBeCloseTo(4.35, 1);
  });

  it('rejects malformed colours', () => {
    expect(() => contrastRatio('red', '#000000')).toThrow();
    expect(() => contrastRatio('#12345', '#000000')).toThrow();
  });
});
