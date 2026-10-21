/**
 * Single-dose pharmacokinetics for mixed amphetamine salts (Adderall IR / XR).
 *
 * Sources (see CLAUDE.md for the full rationale):
 *  - FDA labels: d:l amphetamine is 3:1; IR Tmax ≈ 3 h; XR Tmax ≈ 7 h (≈4 h later than IR);
 *    XR 20 mg ≈ IR 10 mg twice daily, 4 h apart.
 *  - Elimination half-lives by age group (d / l): adults 10 / 13 h, adolescents 11 / 13–14 h,
 *    children 6–12 9 / 11 h.
 *  - Pharmacokinetics are dose-proportional (linear), so concentrations scale with mg and
 *    overlapping doses superpose (see regimen.ts).
 *
 * All functions here are pure. Time `t` is hours since the dose.
 */

export type Kind = 'IR' | 'XR';
export type Band = 'child' | 'teen' | 'adult';

interface Enantiomer { w: number; hl: number }
interface Release { f: number; lag: number; ka: number }

/** First-order absorption rate (1/h) for the immediate component. Gives IR Tmax ≈ 3 h. */
export const KA = 0.95;
/** Felt effect trails plasma level by roughly 30 minutes. */
export const LAG_EFF = 0.5;

export const BANDS: Record<Band, Enantiomer[]> = {
  child: [{ w: 0.75, hl: 9 }, { w: 0.25, hl: 11 }],
  teen: [{ w: 0.75, hl: 11 }, { w: 0.25, hl: 13.5 }],
  adult: [{ w: 0.75, hl: 10 }, { w: 0.25, hl: 13 }]
};

/**
 * Release components. XR = two bead populations: half released immediately, the delayed half
 * starts ~3 h later and absorbs gradually, which lands Tmax around 7 h.
 */
export const RELEASE: Record<Kind, Release[]> = {
  IR: [{ f: 1, lag: 0, ka: KA }],
  XR: [{ f: 0.5, lag: 0, ka: KA }, { f: 0.5, lag: 3, ka: 0.4 }]
};

export const isKind = (k: unknown): k is Kind => k === 'IR' || k === 'XR';
export const isBand = (b: unknown): b is Band => b === 'child' || b === 'teen' || b === 'adult';

/** Unnormalised plasma concentration per unit dose (Bateman function, summed over components). */
export function conc(kind: Kind, t: number, band: Band = 'adult'): number {
  let c = 0;
  for (const r of RELEASE[kind]) {
    const tau = t - r.lag;
    if (tau <= 0) continue;
    for (const e of BANDS[band]) {
      const ke = Math.LN2 / e.hl;
      c += r.f * e.w * r.ka / (r.ka - ke) * (Math.exp(-ke * tau) - Math.exp(-r.ka * tau));
    }
  }
  return c;
}

/** Fraction of the dose not yet eliminated (still in the gut or in the body). 1 before the dose. */
export function fractionRemaining(kind: Kind, t: number, band: Band = 'adult'): number {
  if (t <= 0) return 1;
  let a = 0;
  for (const r of RELEASE[kind]) {
    const tau = t - r.lag;
    for (const e of BANDS[band]) {
      if (tau <= 0) { a += r.f * e.w; continue; }
      const ke = Math.LN2 / e.hl;
      const gut = Math.exp(-r.ka * tau);
      const body = r.ka / (r.ka - ke) * (Math.exp(-ke * tau) - Math.exp(-r.ka * tau));
      a += r.f * e.w * (gut + body);
    }
  }
  return Math.min(1, a);
}

const peakMemo = new Map<string, { c: number; t: number }>();
/** Peak concentration and time to peak (h) for one dose. */
export function peak(kind: Kind, band: Band = 'adult'): { c: number; t: number } {
  const key = kind + band;
  const hit = peakMemo.get(key);
  if (hit) return hit;
  let c = 0, t = 0;
  for (let x = 0; x <= 24; x += 0.01) { const v = conc(kind, x, band); if (v > c) { c = v; t = x; } }
  const out = { c, t };
  peakMemo.set(key, out);
  return out;
}

/** Plasma level as a fraction of this dose's own peak (0..1). */
export function level(kind: Kind, t: number, band: Band = 'adult'): number {
  return t <= 0 ? 0 : conc(kind, t, band) / peak(kind, band).c;
}

/**
 * Midpoint (h) of the felt-effect taper. Calibrated to common reports: IR felt ~4–6 h, XR ~8–12 h,
 * a little longer for larger doses. Models acute tolerance: effect ends before plasma clears.
 */
export function effectMidpoint(kind: Kind, mg: number): number {
  return kind === 'IR' ? 4.2 + 0.05 * mg : 7.6 + 0.09 * mg;
}

function rawEffect(kind: Kind, mg: number, t: number, band: Band): number {
  if (t <= 0) return 0;
  const s = kind === 'IR' ? 0.8 : 1.0;
  return level(kind, t - LAG_EFF, band) / (1 + Math.exp((t - effectMidpoint(kind, mg)) / s));
}

const effMemo = new Map<string, number>();
/** Estimated felt effect of one dose as a fraction of its own maximum (0..1). */
export function effect(kind: Kind, mg: number, t: number, band: Band = 'adult'): number {
  const key = kind + mg + band;
  let max = effMemo.get(key);
  if (max === undefined) {
    max = 0;
    for (let x = 0; x <= 24; x += 0.02) max = Math.max(max, rawEffect(kind, mg, x, band));
    effMemo.set(key, max);
  }
  return rawEffect(kind, mg, t, band) / max;
}

export function smoothstep(a: number, b: number, x: number): number {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}
