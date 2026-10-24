import { describe, expect, it } from 'vitest';
import { parseWeight, weightText } from '../src/lib/units';
import { BAND_OPTIONS } from '../src/model/copy';

describe('weight input', () => {
  it('parses kg and lb, and round-trips without drift', () => {
    expect(parseWeight('72', 'kg')).toBe(72);
    expect(parseWeight('72,5', 'kg')).toBe(72.5);
    const kg = parseWeight('165', 'lb')!;
    expect(kg).toBeCloseTo(74.84, 2);
    expect(weightText(kg, 'lb')).toBe('165');
  });
  it('treats empty as unset and rejects impossible values', () => {
    expect(parseWeight('  ', 'kg')).toBeNull();
    expect(parseWeight('9', 'kg')).toBeNaN();
    expect(parseWeight('600', 'lb')).toBeNaN();
    expect(parseWeight('abc', 'kg')).toBeNaN();
  });
});

describe('age groups', () => {
  it('offers four groups including 65+', () => {
    expect(BAND_OPTIONS.map(o => o.v)).toEqual(['child', 'teen', 'adult', 'senior']);
  });
});
