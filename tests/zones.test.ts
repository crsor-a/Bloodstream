import { describe, expect, it } from 'vitest';
import { zoneFor, zoneIndex, ZONE_COLORS } from '../src/lib/zones';
import { sunPosition, sunTimes } from '../src/lib/sun';

describe('effectivity zones', () => {
  it('maps values to seven ordered zones', () => {
    expect(zoneIndex(0)).toBe(0);
    expect(zoneIndex(0.05)).toBe(0);
    expect(zoneIndex(0.5)).toBe(3);
    expect(zoneIndex(1)).toBe(6);
    expect(zoneIndex(1.4)).toBe(6);
    expect(zoneIndex(-1)).toBe(0);
  });
  it('runs red to green, inverted for side-effect bars', () => {
    expect(zoneFor('focus', 0).color).toBe(ZONE_COLORS[0]);
    expect(zoneFor('focus', 1).color).toBe(ZONE_COLORS[6]);
    expect(zoneFor('appetite', 0).color).toBe(ZONE_COLORS[6]);
    expect(zoneFor('appetite', 1).name).toBe('Minimal');
    expect(zoneFor('sleep', 1).name).toBe('Ready');
    expect(zoneFor('focus', 0.9).tier).toBe('high');
    expect(zoneFor('focus', 0.4).tier).toBe('mid');
  });
});

describe('sun position', () => {
  it('puts the sun high and south at noon in New York in June', () => {
    // 2026-06-21 16:00 UTC is about solar noon in New York (lon -74).
    const p = sunPosition(Date.UTC(2026, 5, 21, 17, 0), 40.7, -74);
    expect(p.elevation).toBeGreaterThan(68);
    expect(p.elevation).toBeLessThan(74);
    expect(p.azimuth).toBeGreaterThan(150);
    expect(p.azimuth).toBeLessThan(215);
  });
  it('is below the horizon at local midnight', () => {
    expect(sunPosition(Date.UTC(2026, 11, 21, 5, 0), 40.7, -74).elevation).toBeLessThan(-40);
  });
  it('finds a sunrise before a sunset', () => {
    const { rise, set } = sunTimes(Date.UTC(2026, 2, 20, 12), 0, 0);
    expect(rise).not.toBeNull();
    expect(set).not.toBeNull();
    expect(set! - rise!).toBeGreaterThan(11 * 3600_000);
    expect(set! - rise!).toBeLessThan(13 * 3600_000);
  });
});
