import { describe, expect, it } from 'vitest';
import { BANDS, effect, fractionRemaining, level, peak } from '../src/model/pk';

describe('single-dose kinetics (FDA label anchors)', () => {
  it('IR peaks about 3 hours after the dose', () => {
    expect(peak('IR', 'adult').t).toBeGreaterThan(2.7);
    expect(peak('IR', 'adult').t).toBeLessThan(3.3);
  });
  it('XR peaks about 7 hours after the dose, roughly 4 hours after IR', () => {
    const xr = peak('XR', 'adult').t;
    expect(xr).toBeGreaterThan(6.2);
    expect(xr).toBeLessThan(7.6);
    expect(xr - peak('IR', 'adult').t).toBeGreaterThan(3);
  });
  it('uses the label half-lives for each age group', () => {
    expect(BANDS.adult.map(e => e.hl)).toEqual([10, 13]);
    expect(BANDS.teen[0].hl).toBe(11);
    expect(BANDS.child.map(e => e.hl)).toEqual([9, 11]);
  });
  it('level is 0 before the dose and 1 at its own peak', () => {
    expect(level('XR', -1)).toBe(0);
    expect(level('IR', peak('IR').t)).toBeCloseTo(1, 5);
  });
  it('remaining fraction starts at 1 and only goes down', () => {
    let prev = 1;
    for (let t = 0; t <= 72; t += 0.5) {
      const r = fractionRemaining('XR', t);
      expect(r).toBeLessThanOrEqual(prev + 1e-9);
      prev = r;
    }
    expect(fractionRemaining('IR', 0)).toBe(1);
  });
  it('about half is gone after ~12 h (IR, adult) and ~1% remains at 72 h', () => {
    expect(fractionRemaining('IR', 12)).toBeGreaterThan(0.42);
    expect(fractionRemaining('IR', 12)).toBeLessThan(0.55);
    expect(fractionRemaining('XR', 72)).toBeLessThan(0.02);
  });
  it('kids clear faster than adults', () => {
    expect(fractionRemaining('IR', 24, 'child')).toBeLessThan(fractionRemaining('IR', 24, 'adult'));
  });
  it('felt effect ends long before the drug clears', () => {
    expect(effect('IR', 20, 10)).toBeLessThan(0.05);
    expect(level('IR', 10)).toBeGreaterThan(0.5);
    expect(effect('XR', 20, 12)).toBeLessThan(0.15);
    expect(effect('XR', 20, 6.5)).toBeGreaterThan(0.85);
  });
});
