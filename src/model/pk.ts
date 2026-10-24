/**
 * Single-dose pharmacokinetics for mixed amphetamine salts (Adderall IR / XR).
 *
 * Sources (see CLAUDE.md for the full rationale):
 *  - FDA labels: d:l amphetamine is 3:1; IR Tmax ≈ 3 h; XR Tmax ≈ 7 h (≈4 h later than IR);
 *    XR 20 mg ≈ IR 10 mg twice daily, 4 h apart.
 *  - Elimination half-lives by age group (d / l): adults 10 / 13 h, adolescents 11 / 13–14 h,
 *    children 6–12 9 / 11 h. Older adults were not studied (label 8.5), so they use adult values.
 *  - Pharmacokinetics are dose-proportional (linear), so concentrations scale with mg and
 *    overlapping doses superpose (see regimen.ts).
 *  - Adderall XR label: a high-fat meal leaves the extent of absorption unchanged but delays
 *    Tmax by 2.5 h (d) and 2.7 h (l). Omeprazole shortens median Tmax by 1.25 h (d) and 2.5 h (l)
 *    with AUC and Cmax unaffected.
 *
 * Every function takes either an age band (the original API) or a full PkParams, which adds a
 * half-life multiplier (from model/physio.ts) and an absorption variant for XR.
 * All functions here are pure. Time `t` is hours since the dose.
 */

export type Kind = 'IR' | 'XR';
export type Band = 'child' | 'teen' | 'adult' | 'senior';
/** XR absorption variants. IR has no food or acid-reducer data, so it is always 'std'. */
export type Absorb = 'std' | 'fed' | 'ppi' | 'fedppi';

export interface PkParams { band: Band; /** half-life multiplier */ hl: number; abs: Absorb }
export type P = Band | PkParams;

interface Enantiomer { w: number; hl: number }
interface Release { f: number; lag: number; ka: number }

/** First-order absorption rate (1/h) for the immediate component. Gives IR Tmax ≈ 3 h. */
export const KA = 0.95;
/** Felt effect trails plasma level by roughly 30 minutes. */
export const LAG_EFF = 0.5;
/** High-fat meal: XR Tmax +2.5 h (d) / +2.7 h (l), extent unchanged. Weighted 3:1 → 2.55 h. */
export const FED_DELAY = 2.55;
/** On a PPI the delayed beads start 1.5 h after the dose instead of 3 h: Tmax −1.5 h, Cmax +5%. */
export const PPI_DELAYED_LAG = 1.5;

export const BANDS: Record<Band, Enantiomer[]> = {
  child: [{ w: 0.75, hl: 9 }, { w: 0.25, hl: 11 }],
  teen: [{ w: 0.75, hl: 11 }, { w: 0.25, hl: 13.5 }],
  adult: [{ w: 0.75, hl: 10 }, { w: 0.25, hl: 13 }],
  senior: [{ w: 0.75, hl: 10 }, { w: 0.25, hl: 13 }]
};

/**
 * Release components. XR = two bead populations: half released immediately, the delayed half
 * starts ~3 h later and absorbs gradually, which lands Tmax around 7 h.
 */
export const RELEASE: Record<Kind, Release[]> = {
  IR: [{ f: 1, lag: 0, ka: KA }],
  XR: [{ f: 0.5, lag: 0, ka: KA }, { f: 0.5, lag: 3, ka: 0.4 }]
};

const XR_VARIANTS: Record<Absorb, Release[]> = {
  std: RELEASE.XR,
  fed: RELEASE.XR.map(r => ({ ...r, lag: r.lag + FED_DELAY })),
  ppi: [RELEASE.XR[0], { ...RELEASE.XR[1], lag: PPI_DELAYED_LAG }],
  fedppi: [{ ...RELEASE.XR[0], lag: FED_DELAY }, { ...RELEASE.XR[1], lag: PPI_DELAYED_LAG + FED_DELAY }]
};

export const isKind = (k: unknown): k is Kind => k === 'IR' || k === 'XR';
export const isBand = (b: unknown): b is Band => b === 'child' || b === 'teen' || b === 'adult' || b === 'senior';

export const DEFAULT_PARAMS: PkParams = { band: 'adult', hl: 1, abs: 'std' };
export function params(p: P = 'adult'): PkParams { return typeof p === 'string' ? { band: p, hl: 1, abs: 'std' } : p; }
const releaseOf = (kind: Kind, p: PkParams) => (kind === 'IR' ? RELEASE.IR : XR_VARIANTS[p.abs]);
/** How far a variant shifts the whole profile (a meal delays everything, including onset). */
export const absorbShift = (kind: Kind, abs: Absorb) => (kind === 'XR' && (abs === 'fed' || abs === 'fedppi') ? FED_DELAY : 0);
const keyOf = (kind: Kind, p: PkParams) => `${kind}|${p.band}|${p.hl.toFixed(4)}|${kind === 'XR' ? p.abs : 'std'}`;

/** Unnormalised plasma concentration per unit dose (Bateman function, summed over components). */
export function conc(kind: Kind, t: number, band: P = 'adult'): number {
  const p = params(band);
  let c = 0;
  for (const r of releaseOf(kind, p)) {
    const tau = t - r.lag;
    if (tau <= 0) continue;
    for (const e of BANDS[p.band]) {
      const ke = Math.LN2 / (e.hl * p.hl);
      c += r.f * e.w * r.ka / (r.ka - ke) * (Math.exp(-ke * tau) - Math.exp(-r.ka * tau));
    }
  }
  return c;
}

/** Fraction of the dose not yet eliminated (still in the gut or in the body). 1 before the dose. */
export function fractionRemaining(kind: Kind, t: number, band: P = 'adult'): number {
  if (t <= 0) return 1;
  const p = params(band);
  let a = 0;
  for (const r of releaseOf(kind, p)) {
    const tau = t - r.lag;
    for (const e of BANDS[p.band]) {
      if (tau <= 0) { a += r.f * e.w; continue; }
      const ke = Math.LN2 / (e.hl * p.hl);
      const gut = Math.exp(-r.ka * tau);
      const body = r.ka / (r.ka - ke) * (Math.exp(-ke * tau) - Math.exp(-r.ka * tau));
      a += r.f * e.w * (gut + body);
    }
  }
  return Math.min(1, a);
}

const peakMemo = new Map<string, { c: number; t: number }>();
/** Peak concentration and time to peak (h) for one dose. */
export function peak(kind: Kind, band: P = 'adult'): { c: number; t: number } {
  const p = params(band);
  const key = keyOf(kind, p);
  const hit = peakMemo.get(key);
  if (hit) return hit;
  let c = 0, t = 0;
  for (let x = 0; x <= 30; x += 0.01) { const v = conc(kind, x, p); if (v > c) { c = v; t = x; } }
  const out = { c, t };
  if (peakMemo.size > 400) peakMemo.clear();
  peakMemo.set(key, out);
  return out;
}

/** Plasma level as a fraction of this dose's own peak (0..1). */
export function level(kind: Kind, t: number, band: P = 'adult'): number {
  return t <= 0 ? 0 : conc(kind, t, band) / peak(kind, band).c;
}

/**
 * Midpoint (h) of the felt-effect taper. Calibrated to common reports: IR felt ~4–6 h, XR ~8–12 h,
 * a little longer for larger doses. Models acute tolerance: effect ends before plasma clears.
 */
export function effectMidpoint(kind: Kind, mg: number): number {
  return kind === 'IR' ? 4.2 + 0.05 * mg : 7.6 + 0.09 * mg;
}

function rawEffect(kind: Kind, mg: number, t: number, p: PkParams): number {
  if (t <= 0) return 0;
  const s = kind === 'IR' ? 0.8 : 1.0;
  // A meal delays the whole release, so the taper (acute tolerance) starts later too.
  const mid = effectMidpoint(kind, mg) + absorbShift(kind, p.abs);
  return level(kind, t - LAG_EFF, p) / (1 + Math.exp((t - mid) / s));
}

const effMemo = new Map<string, number>();
/** Estimated felt effect of one dose as a fraction of its own maximum (0..1). */
export function effect(kind: Kind, mg: number, t: number, band: P = 'adult'): number {
  const p = params(band);
  const key = keyOf(kind, p) + '|' + mg;
  let max = effMemo.get(key);
  if (max === undefined) {
    max = 0;
    for (let x = 0; x <= 30; x += 0.02) max = Math.max(max, rawEffect(kind, mg, x, p));
    if (effMemo.size > 400) effMemo.clear();
    effMemo.set(key, max);
  }
  return max > 0 ? rawEffect(kind, mg, t, p) / max : 0;
}

export function smoothstep(a: number, b: number, x: number): number {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}
