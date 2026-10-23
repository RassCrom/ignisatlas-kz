import { describe, expect, it } from 'vitest';
import { formatLocalDate } from 'src/shared/utils/dateDefaults';

describe('formatLocalDate', () => {
  it('pads month and day', () => expect(formatLocalDate(new Date(2024, 6, 3))).toBe('2024-07-03'));
  it('handles year end', () => expect(formatLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31'));
});
