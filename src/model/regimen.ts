import { conc, effect, fractionRemaining, peak, smoothstep, type Band, type PkParams } from './pk';
import { DEFAULT_BODY, type Dose } from './types';
import { doseParams, physioFor, type Physio } from './physio';
import { HOUR, MIN } from '../lib/time';

/** Doses older than this are ~1% remaining and drop out of the model (they stay in history). */
export const TRACK_WINDOW = 72 * HOUR;
/** Doses within this span of the latest dose count as "today's" session. */
export const SESSION_SPAN = 18 * HOUR;

export type Phase = 'pre' | 'onset' | 'build' | 'peak' | 'plateau' | 'taper' | 'comedown' | 'residual';

export interface KeyTimes {
  onset: number | null;
  peakAt: number;
  peakLevel: number;
  fade: number | null;
  clear: number | null;
}

/**
 * A set of overlapping doses. Amphetamine kinetics are linear, so every quantity is a
 * superposition of single-dose curves scaled by mg.
 */
export class Regimen {
  readonly doses: Dose[];
  readonly session: Dose[];
  readonly carried: Set<Dose>;
  /** Reference mg: blood level 100% = the peak of the largest dose in today's session. */
  readonly ref: number;
  private ktCache: { key: number; kt: KeyTimes } | null = null;

  readonly phys: Physio;
  readonly band: Band;
  private pMemo = new Map<string, PkParams>();

  /** `phys` is the personal physiology (model/physio.ts); a bare age band means "typical person". */
  constructor(all: Dose[], phys: Physio | Band, readonly now: number, resetAt = 0) {
    this.phys = typeof phys === 'string' ? physioFor({ band: phys, name: '', body: DEFAULT_BODY }) : phys;
    this.band = this.phys.band;
    this.doses = all
      .filter(d => d.at > now - TRACK_WINDOW && d.at > resetAt)
      .sort((a, b) => a.at - b.at);
    const latest = this.doses.length ? this.doses[this.doses.length - 1].at : 0;
    this.session = this.doses.filter(d => d.at >= latest - SESSION_SPAN);
    const inSession = new Set(this.session);
    this.carried = new Set(this.doses.filter(d => !inSession.has(d)));
    this.ref = Math.max(1, ...this.session.map(d => d.mg));
  }

  /** Model parameters for one dose: personal half-life, plus PPI / meal absorption for XR. */
  paramsFor(d: Dose, hl?: number): PkParams {
    const key = d.kind + (d.meal ? 'm' : '') + (hl ?? '');
    let p = this.pMemo.get(key);
    if (!p) { p = doseParams(this.phys, d.kind, d.meal === 'highfat', hl ?? this.phys.hl); this.pMemo.set(key, p); }
    return p;
  }

  get empty() { return this.session.length === 0; }

  private th(d: Dose, ts: number) { return (ts - d.at) / HOUR; }

  /**
   * Blood level relative to one reference dose's peak. Can exceed 1 when doses stack.
   * `hl` evaluates the same doses with a different half-life multiplier (for the range band),
   * still relative to the central peak.
   */
  levelAt(ts: number, hl?: number): number {
    let s = 0;
    for (const d of this.doses) {
      const t = this.th(d, ts);
      if (t <= 0) continue;
      const p = this.paramsFor(d);
      s += d.mg / this.ref * conc(d.kind, t, hl === undefined ? p : this.paramsFor(d, hl)) / peak(d.kind, p).c;
    }
    return s;
  }
  /** Estimated total (d + l) amphetamine plasma concentration in ng/mL. */
  ngAt(ts: number, hl?: number): number {
    let s = 0;
    for (const d of this.doses) { const t = this.th(d, ts); if (t > 0) s += d.mg * conc(d.kind, t, this.paramsFor(d, hl)); }
    return s * this.phys.ngScale;
  }
  /** Estimated felt effect, 0..1. `cutoff` ignores doses taken after that time. */
  effectAt(ts: number, cutoff = Infinity): number {
    let s = 0;
    for (const d of this.doses) {
      if (d.at > cutoff) continue;
      const t = this.th(d, ts);
      if (t > 0) s += d.mg / this.ref * effect(d.kind, d.mg, t, this.paramsFor(d));
    }
    return Math.min(1, s);
  }
  takenMg(ts: number): number { let s = 0; for (const d of this.doses) if (d.at <= ts) s += d.mg; return s; }
  remainingMg(ts: number): number {
    let s = 0;
    for (const d of this.doses) if (d.at <= ts) s += d.mg * fractionRemaining(d.kind, this.th(d, ts), this.paramsFor(d));
    return s;
  }
  carriedMg(ts: number): number {
    let s = 0;
    for (const d of this.carried) if (d.at <= ts) s += d.mg * fractionRemaining(d.kind, this.th(d, ts), this.paramsFor(d));
    return s;
  }
  /** Today's load: what you took today plus what was carried over at the start of today. */
  private baseMg(ts: number): number {
    const s0 = this.session.length ? this.session[0].at : ts;
    let b = this.carriedMg(Math.min(s0, ts));
    for (const d of this.session) if (d.at <= ts) b += d.mg;
    return b;
  }
  /** Share of today's load not yet eliminated, 0..1. */
  remainingFrac(ts: number): number { const b = this.baseMg(ts); return b > 0 ? Math.min(1, this.remainingMg(ts) / b) : 0; }
  doseRemaining(d: Dose, ts: number): number { return fractionRemaining(d.kind, this.th(d, ts), this.paramsFor(d)); }

  /** Rough sleep interference index, 0..100: blends felt effect with remaining blood level. */
  sleepAt(ts: number): number {
    if (!this.takenMg(ts)) return 0;
    return Math.round(100 * Math.min(1, 0.55 * this.effectAt(ts) + 0.45 * smoothstep(0.45, 1.0, this.levelAt(ts))));
  }
  /** Climbing now, or still climbing over the next hour from doses already taken (covers absorption lag). */
  risingAt(ts: number): boolean {
    const e = this.effectAt(ts);
    return this.effectAt(ts + 0.15 * HOUR, ts) - this.effectAt(ts - 0.15 * HOUR) > 0.004 || this.effectAt(ts + HOUR, ts) - e > 0.03;
  }
  phaseAt(ts: number): Phase {
    if (!this.takenMg(ts)) return 'pre';
    const e = this.effectAt(ts);
    if (e >= 0.88) return 'peak';
    if (this.risingAt(ts)) return e < 0.4 ? 'onset' : 'build';
    if (e >= 0.6) return 'plateau';
    if (e >= 0.3) return 'taper';
    if (e >= 0.08) return 'comedown';
    return 'residual';
  }

  /** True when nothing in today's session has been taken yet. */
  isPlanned(now = this.now): boolean { return !this.empty && this.session.every(d => d.at > now); }
  /** The dose the hero pill represents: latest taken, or the first planned one. */
  heroDose(now = this.now): Dose | undefined {
    const taken = this.session.filter(d => d.at <= now);
    return taken.length ? taken[taken.length - 1] : this.session[0];
  }
  nextPlanned(now = this.now): Dose | undefined { return this.session.find(d => d.at > now); }

  /** Graph window [a, b] in epoch ms. */
  domain(now = this.now): [number, number] {
    const first = this.session[0].at, last = this.session[this.session.length - 1];
    let a = first - 0.5 * HOUR;
    if (now < first && first - now < 12 * HOUR) a = now - 0.5 * HOUR;
    let b = Math.max(last.at + (last.kind === 'IR' ? 16 : 24) * HOUR, a + 16 * HOUR);
    if (now > b - HOUR && now < a + 40 * HOUR) b = Math.max(b, now + 2 * HOUR);
    return [a, Math.min(b, a + 40 * HOUR)];
  }

  keyTimes(now = this.now): KeyTimes {
    const key = Math.floor(now / MIN);
    if (this.ktCache && this.ktCache.key === key) return this.ktCache.kt;
    const [, b] = this.domain(now);
    const first = this.session[0].at, lastAt = this.session[this.session.length - 1].at;
    let onset: number | null = null, fade: number | null = null, peakLevel = -1, peakAt = first;
    for (let ts = first; ts <= b; ts += 2 * MIN) {
      const e = this.effectAt(ts);
      if (onset === null && e >= 0.3) onset = ts;
      if (e >= 0.25) fade = ts;
      const l = this.levelAt(ts);
      if (l > peakLevel) { peakLevel = l; peakAt = ts; }
    }
    let clear: number | null = null;
    for (let ts = Math.max(peakAt, lastAt + HOUR); ts <= lastAt + 60 * HOUR; ts += 5 * MIN) {
      if (this.sleepAt(ts) < 10) { clear = ts; break; }
    }
    const kt = { onset, peakAt, peakLevel, fade, clear };
    this.ktCache = { key, kt };
    return kt;
  }
}
