import { describe, expect, it } from 'vitest';
import { Regimen } from '../src/model/regimen';
import type { Dose } from '../src/model/types';
import { HOUR } from '../src/lib/time';
import { level, fractionRemaining } from '../src/model/pk';

const T0 = Date.UTC(2026, 9, 21, 14, 0);
const dose = (kind: 'IR' | 'XR', mg: number, at: number, id = Math.random().toString(36)): Dose =>
  ({ id, kind, mg, at, created: at, shape: 'capsule', mode: 'whole', colors: { L: '#ff8f3a', R: '#ff8f3a' } });

describe('Regimen (superposition of doses)', () => {
  it('matches the single-dose curve when there is one dose', () => {
    const r = new Regimen([dose('XR', 20, T0)], 'adult', T0 + 5 * HOUR);
    expect(r.levelAt(T0 + 5 * HOUR)).toBeCloseTo(level('XR', 5), 6);
    expect(r.remainingFrac(T0 + 5 * HOUR)).toBeCloseTo(fractionRemaining('XR', 5), 6);
  });
  it('stacks a booster on top of what is already there', () => {
    const base = new Regimen([dose('XR', 20, T0)], 'adult', T0);
    const both = new Regimen([dose('XR', 20, T0), dose('IR', 10, T0 + 6 * HOUR)], 'adult', T0);
    const ts = T0 + 9 * HOUR;
    expect(both.levelAt(ts)).toBeCloseTo(base.levelAt(ts) + 0.5 * level('IR', 3), 6);
    expect(both.levelAt(ts)).toBeGreaterThan(1);
  });
  it('carries roughly a quarter of yesterday\'s dose into this morning', () => {
    const r = new Regimen([dose('XR', 20, T0 - 24 * HOUR, 'y'), dose('XR', 20, T0, 't')], 'adult', T0);
    expect(r.carried.size).toBe(1);
    const carried = r.carriedMg(T0) / 20;
    expect(carried).toBeGreaterThan(0.2);
    expect(carried).toBeLessThan(0.32);
  });
  it('ignores doses outside the 72 h window and before a reset', () => {
    expect(new Regimen([dose('XR', 20, T0 - 80 * HOUR)], 'adult', T0).empty).toBe(true);
    expect(new Regimen([dose('XR', 20, T0 - HOUR)], 'adult', T0, T0 - 0.5 * HOUR).empty).toBe(true);
  });
  it('treats a future dose as planned until its time', () => {
    const r = new Regimen([dose('IR', 10, T0 + 2 * HOUR)], 'adult', T0);
    expect(r.isPlanned()).toBe(true);
    expect(r.phaseAt(T0)).toBe('pre');
    expect(r.isPlanned(T0 + 3 * HOUR)).toBe(false);
  });
  it('calls a dose taken a minute ago "onset", not "worn off"', () => {
    const r = new Regimen([dose('XR', 20, T0)], 'adult', T0 + 60_000);
    expect(r.phaseAt(T0 + 60_000)).toBe('onset');
  });
  it('finds sensible key times for XR 20 mg', () => {
    const r = new Regimen([dose('XR', 20, T0)], 'adult', T0);
    const kt = r.keyTimes();
    expect((kt.peakAt - T0) / HOUR).toBeGreaterThan(6);
    expect((kt.peakAt - T0) / HOUR).toBeLessThan(7.6);
    expect(kt.onset! - T0).toBeLessThan(2 * HOUR);
    expect(kt.clear! - T0).toBeGreaterThan(12 * HOUR);
  });
  it('sleep interference falls over the evening', () => {
    const r = new Regimen([dose('XR', 20, T0)], 'adult', T0);
    expect(r.sleepAt(T0 + 6 * HOUR)).toBeGreaterThan(r.sleepAt(T0 + 12 * HOUR));
    expect(r.sleepAt(T0 + 12 * HOUR)).toBeGreaterThan(r.sleepAt(T0 + 18 * HOUR));
  });
});
