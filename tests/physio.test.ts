/**
 * Personalization checks, each anchored to a published number (see model/physio.ts for sources).
 */
import { describe, expect, it } from 'vitest';
import { conc, effect, peak, type PkParams } from '../src/model/pk';
import { carryOver24, cyclePhase, physioFor, PH_SLOPE } from '../src/model/physio';
import { Regimen } from '../src/model/regimen';
import { DEFAULT_BODY, type Body, type Dose, type Profile } from '../src/model/types';

const prof = (body: Partial<Body> = {}, band: Profile['band'] = 'adult'): Profile => ({ band, name: '', body: { ...DEFAULT_BODY, ...body } });
const P = (abs: PkParams['abs'], hl = 1, band: PkParams['band'] = 'adult'): PkParams => ({ band, hl, abs });
const auc = (k: 'IR' | 'XR', p: PkParams) => { let s = 0; for (let t = 0; t < 120; t += 0.05) s += conc(k, t, p) * 0.05; return s; };
const dose = (over: Partial<Dose>): Dose => ({ id: 'd', kind: 'XR', mg: 20, at: 1, created: 0, shape: 'capsule', mode: 'whole', colors: { L: '#fff', R: '#fff' }, ...over });

describe('absorption (Adderall XR label)', () => {
  it('a high-fat meal delays XR peak by about 2.5 h with the same total exposure', () => {
    const shift = peak('XR', P('fed')).t - peak('XR', P('std')).t;
    expect(shift).toBeGreaterThan(2.4);
    expect(shift).toBeLessThan(2.8);
    expect(auc('XR', P('fed')) / auc('XR', P('std'))).toBeCloseTo(1, 2);
    expect(peak('XR', P('fed')).c / peak('XR', P('std')).c).toBeCloseTo(1, 3);
  });
  it('a PPI brings XR peak forward 1.25–2.5 h, with total and peak essentially unchanged', () => {
    const shift = peak('XR', P('ppi')).t - peak('XR', P('std')).t;
    expect(shift).toBeLessThan(-1.25);
    expect(shift).toBeGreaterThan(-2.5);
    expect(auc('XR', P('ppi')) / auc('XR', P('std'))).toBeCloseTo(1, 2);
    expect(peak('XR', P('ppi')).c / peak('XR', P('std')).c).toBeLessThan(1.06);
  });
  it('IR ignores meal and PPI settings (no data in the label)', () => {
    expect(peak('IR', P('fed')).t).toBeCloseTo(peak('IR', P('std')).t, 5);
    expect(physioFor(prof({ ppi: true })).ppi).toBe(true);
  });
  it('a meal also delays when the felt effect fades, rather than cutting it short', () => {
    const std = effect('XR', 20, 12, P('std')), fed = effect('XR', 20, 12 + 2.55, P('fed'));
    expect(fed).toBeCloseTo(std, 2);
  });
});

describe('half-life personalization', () => {
  it('defaults to the label half-lives', () => {
    const ph = physioFor(prof());
    expect(ph.hl).toBe(1);
    expect(ph.halfLives).toEqual({ d: 10, l: 13 });
    expect(physioFor(prof({}, 'senior')).halfLives).toEqual({ d: 10, l: 13 });
  });
  it('kidney impairment follows the clearance study (0.7 → 0.4 → 0.3 L/h/kg)', () => {
    expect(physioFor(prof({ renal: 'severe' })).hl).toBeCloseTo(1.75, 3);
    expect(physioFor(prof({ renal: 'failure' })).hl).toBeCloseTo(2.333, 3);
    expect(physioFor(prof({ renal: 'moderate' })).hl).toBe(1);
  });
  it('urine pH: about 7 h per pH unit on a 10 h half-life', () => {
    expect(PH_SLOPE * 10).toBeCloseTo(7, 5);
    expect(physioFor(prof({ diet: 'plant' })).hl).toBeCloseTo(1.35, 3);
    expect(physioFor(prof({ urine: 'alkaline' })).hl).toBeCloseTo(1.7, 3);
    expect(physioFor(prof({ urine: 'acidic' })).hl).toBeCloseTo(0.7, 3);
  });
  it('weight scales half-life by (W/70)^0.25 for adults, within bounds', () => {
    expect(physioFor(prof({ weightKg: 70 })).hl).toBeCloseTo(1, 5);
    expect(physioFor(prof({ weightKg: 112 })).hl).toBeCloseTo(Math.pow(112 / 70, 0.25), 4);
    expect(physioFor(prof({ weightKg: 250 })).hl).toBe(1.25);
  });
  it('combined effects are capped', () => {
    expect(physioFor(prof({ renal: 'failure', urine: 'alkaline', diet: 'plant', weightKg: 140 })).hl).toBe(3);
  });
  it('things without numbers widen the range but not the curve', () => {
    const base = physioFor(prof({ weightKg: 70 }));
    const cyp = physioFor(prof({ weightKg: 70, cyp2d6: true }));
    expect(cyp.hl).toBe(base.hl);
    expect(cyp.hlRange[1]).toBeGreaterThan(base.hlRange[1]);
    expect(base.hlRange[0]).toBeLessThan(1);
    expect(base.hlRange[1]).toBeGreaterThan(1);
    // Middle half of urine pH on a mixed diet (5.9–6.4) → about ±17.5%.
    expect(base.hlRange[0]).toBeCloseTo(0.825, 3);
    expect(base.hlRange[1]).toBeCloseTo(1.175, 3);
  });
  it('a longer half-life leaves more in the body the next morning', () => {
    expect(carryOver24(physioFor(prof({ urine: 'alkaline' })))).toBeGreaterThan(carryOver24(physioFor(prof())));
  });
});

describe('estimated concentration (ng/mL)', () => {
  it('XR 20 mg in a 70 kg adult peaks at the label value (28.1 + 8.7 ng/mL)', () => {
    const reg = new Regimen([dose({})], physioFor(prof({ weightKg: 70 })), 30 * 3600e3);
    let max = 0;
    for (let t = 0; t < 24; t += 0.05) max = Math.max(max, reg.ngAt(t * 3600e3));
    expect(max).toBeGreaterThan(36.3);
    expect(max).toBeLessThan(37.3);
  });
  it('children at steady state match the label within 10% (10/20/30 mg XR, ~30 kg)', () => {
    const ph = physioFor(prof({}, 'child'));
    const label = { 10: 28.8 + 8.8, 20: 54.6 + 17.2, 30: 89.0 + 28.1 } as const;
    for (const mg of [10, 20, 30] as const) {
      const ds = Array.from({ length: 6 }, (_, i) => dose({ id: 'd' + i, mg, at: 1 + i * 24 * 3600e3 }));
      const reg = new Regimen(ds, ph, 6 * 24 * 3600e3);
      let max = 0;
      for (let t = 5 * 24; t < 6 * 24; t += 0.05) max = Math.max(max, reg.ngAt(t * 3600e3));
      expect(Math.abs(max / label[mg] - 1)).toBeLessThan(0.1);
    }
  });
  it('a heavier person has lower concentrations from the same dose', () => {
    const a = new Regimen([dose({})], physioFor(prof({ weightKg: 60 })), 0).ngAt(7 * 3600e3);
    const b = new Regimen([dose({})], physioFor(prof({ weightKg: 100 })), 0).ngAt(7 * 3600e3);
    expect(b).toBeLessThan(a);
  });
});

describe('regimen uses personal parameters', () => {
  it('a meal on an XR dose moves the curve later', () => {
    const ph = physioFor(prof());
    const plain = new Regimen([dose({})], ph, 0), fed = new Regimen([dose({ meal: 'highfat' })], ph, 0);
    expect(fed.levelAt(4 * 3600e3)).toBeLessThan(plain.levelAt(4 * 3600e3));
    expect(fed.levelAt(12 * 3600e3)).toBeGreaterThan(plain.levelAt(12 * 3600e3));
  });
  it('the range band brackets the central curve on the falling side', () => {
    const ph = physioFor(prof());
    const reg = new Regimen([dose({})], ph, 0);
    const ts = 18 * 3600e3;
    expect(reg.levelAt(ts, ph.hlRange[0])).toBeLessThan(reg.levelAt(ts));
    expect(reg.levelAt(ts, ph.hlRange[1])).toBeGreaterThan(reg.levelAt(ts));
  });
  it('kidney failure keeps far more on board the next day', () => {
    const d = dose({});
    const normal = new Regimen([d], physioFor(prof()), 0).remainingMg(24 * 3600e3);
    const failure = new Regimen([d], physioFor(prof({ renal: 'failure' })), 0).remainingMg(24 * 3600e3);
    expect(failure / normal).toBeGreaterThan(1.8);
  });
});

describe('cycle phase (information only)', () => {
  const at = (iso: string) => new Date(iso + 'T12:00:00').getTime();
  it('counts days and phases from the last period', () => {
    const body = { ...DEFAULT_BODY, cycle: { enabled: true, start: '2026-10-01', length: 28, hormonal: false } };
    expect(cyclePhase(body, at('2026-10-03'))).toMatchObject({ day: 3, phase: 'menstrual' });
    expect(cyclePhase(body, at('2026-10-10'))).toMatchObject({ day: 10, phase: 'follicular' });
    expect(cyclePhase(body, at('2026-10-20'))).toMatchObject({ day: 20, phase: 'luteal' });
    expect(cyclePhase(body, at('2026-10-30'))).toMatchObject({ day: 2, phase: 'menstrual' });
  });
  it('is off with hormonal birth control or no start date', () => {
    expect(cyclePhase({ ...DEFAULT_BODY, cycle: { enabled: true, start: '2026-10-01', length: 28, hormonal: true } }, at('2026-10-10'))).toBeNull();
    expect(cyclePhase({ ...DEFAULT_BODY, cycle: { enabled: true, start: null, length: 28, hormonal: false } }, at('2026-10-10'))).toBeNull();
  });
});
