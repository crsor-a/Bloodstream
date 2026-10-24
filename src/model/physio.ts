/**
 * Personal physiology → model parameters. Pure functions, unit-tested against the sources.
 *
 * Only effects with published numbers move the curve. Everything else is either a wider
 * uncertainty band or an explanatory note (see `factors`). Sources, by constant:
 *
 *  URINE pH  Amphetamine is a weak base; acidic urine traps and clears it, alkaline urine lets
 *            it be reabsorbed. Änggård et al. 1970 (Eur J Clin Pharmacol 3:3–11) and Gunne &
 *            Änggård 1973 (J Pharmacokinet Biopharm 1:481–495): plasma half-life rose by about
 *            7 h per unit of urine pH. Labels: 1–75% excreted unchanged depending on pH.
 *  DIET      Penczynski et al. 2022 (Nutrients 14:4468): 24-h urine pH median 6.7 in vegans vs
 *            6.2 in omnivores; omnivore IQR 5.9–6.4.
 *  KIDNEYS   Adderall XR label 12.3/8.6 (lisdexamfetamine study): d-amphetamine clearance 0.7 L/h/kg
 *            normal → 0.4 severe (GFR 15–<30) → 0.3 in ESRD. No data for mild or moderate.
 *  WEIGHT    Adderall XR label: exposure falls and CL/F, V/F and t½ rise with body weight.
 *            Allometry (Anderson, McKee & Holford 1997, Clin Pharmacokinet 33:313): clearance
 *            ∝ W^0.75, volume ∝ W, so t½ ∝ W^0.25.
 *  ng/mL     Adderall XR 20 mg in healthy adults: Cmax 28.1 (d) + 8.7 (l) ng/mL at ~7 h. Children:
 *            30% less exposure on a mg/kg basis. Cmax/AUC CV 22–29% (Canadian monograph).
 *  PPI/MEAL  see pk.ts.
 */
import { BANDS, fractionRemaining, peak, type Absorb, type Band, type Kind, type PkParams } from './pk';
import type { Body, Profile } from './types';

/** Half-life change per unit of urine pH, relative to a 10 h baseline (≈7 h per unit). */
export const PH_SLOPE = 0.7;
/** Vegan / mostly plant-based diet vs omnivore: +0.5 urine pH (medians 6.7 vs 6.2). */
export const DIET_PLANT_DPH = 0.5;
/** Typical spread of urine pH in people on a mixed diet: IQR 5.9–6.4, so ±0.25 around the median. */
export const PH_IQR_HALF = 0.25;
/** Regular urine-alkalinizing medicine: assumed to raise urine pH by about 1 unit (range 0.5–1.8). */
export const ALKALINIZER_DPH: [number, number, number] = [0.5, 1.0, 1.8];
/** Regular urine-acidifying medicine: assumed to lower urine pH by about 0.5 unit (range 0.25–0.75). */
export const ACIDIFIER_DPH: [number, number, number] = [-0.75, -0.5, -0.25];
/** d-amphetamine clearance 0.7 → 0.4 (severe) → 0.3 (kidney failure) L/h/kg. */
export const RENAL_MULT: Record<Body['renal'], number> = { unknown: 1, normal: 1, mild: 1, moderate: 1, severe: 0.7 / 0.4, failure: 0.7 / 0.3 };
/** Reference body weights the label half-lives correspond to (typical for each group). */
export const REF_WEIGHT: Record<Band, number> = { child: 30, teen: 55, adult: 70, senior: 70 };
/** Total (d + l) amphetamine Cmax after XR 20 mg in a healthy adult (28.1 + 8.7 ng/mL). */
export const XR20_ADULT_CMAX = 36.8;
/** Children: 30% less systemic exposure than adults on a mg/kg basis. */
export const CHILD_EXPOSURE = 0.7;
/** Inter-individual CV of Cmax/AUC (22–29% in the monograph's bioavailability table). */
export const CONC_CV = 0.25;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const phMult = (dpH: number) => clamp(1 + PH_SLOPE * dpH, 0.7, 2.5);

export type Confidence = 'label' | 'study' | 'estimate' | 'note';
export interface Factor {
  id: string;
  title: string;
  /** What it does to the model, in plain words. */
  effect: string;
  confidence: Confidence;
  /** true when it moves the curve; false when it only widens the range or adds a note. */
  modeled: boolean;
}

export interface Physio {
  band: Band;
  /** Central half-life multiplier applied to both enantiomers. */
  hl: number;
  /** Typical range of the multiplier (low, high). */
  hlRange: [number, number];
  ppi: boolean;
  weightKg: number;
  weightKnown: boolean;
  /** ng/mL per (mg × conc unit). */
  ngScale: number;
  factors: Factor[];
  /** Effective half-lives in hours (central). */
  halfLives: { d: number; l: number };
  safety: { maoi: boolean; serotonergic: boolean };
}

/** Absorption variant for one dose. */
export function absorbFor(kind: Kind, ppi: boolean, meal: boolean): Absorb {
  if (kind !== 'XR') return 'std';
  return meal ? (ppi ? 'fedppi' : 'fed') : (ppi ? 'ppi' : 'std');
}
export function doseParams(ph: Physio, kind: Kind, meal = false, hl = ph.hl): PkParams {
  return { band: ph.band, hl, abs: absorbFor(kind, ph.ppi, meal) };
}

let ngK = 0;
/** Calibration so a 20 mg XR dose in a 70 kg adult peaks at 36.8 ng/mL total amphetamine. */
function baseK(): number {
  if (!ngK) ngK = XR20_ADULT_CMAX / (20 * peak('XR', 'adult').c);
  return ngK;
}
export function ngScaleFor(band: Band, weightKg: number): number {
  return baseK() * (REF_WEIGHT.adult / weightKg) * (band === 'child' ? CHILD_EXPOSURE : 1);
}

const fmtX = (m: number) => `${m >= 1 ? '+' : '−'}${Math.round(Math.abs(m - 1) * 100)}%`;

export function physioFor(profile: Profile): Physio {
  const b = profile.body;
  const band = profile.band;
  const factors: Factor[] = [];
  const weightKnown = b.weightKg != null;
  const weightKg = weightKnown ? b.weightKg! : REF_WEIGHT[band];

  // Weight (allometric): t½ ∝ W^0.25.
  const wMult = clamp(Math.pow(weightKg / REF_WEIGHT[band], 0.25), 0.8, 1.25);
  if (weightKnown) factors.push({
    id: 'weight', title: 'Body weight', modeled: true, confidence: 'study',
    effect: Math.abs(wMult - 1) < 0.01
      ? 'About the reference weight for your age group, so timing matches the label.'
      : `Half-life ${fmtX(wMult)} and concentrations scaled to ${Math.round(weightKg)} kg. Larger bodies spread the dose more widely, so concentrations are lower and the half-life a little longer.`
  });

  // Urine pH from diet and medicines.
  let dpH = 0, dLow = -PH_IQR_HALF, dHigh = PH_IQR_HALF;
  if (b.diet === 'plant') {
    dpH += DIET_PLANT_DPH;
    factors.push({ id: 'diet', title: 'Mostly plant-based diet', modeled: true, confidence: 'study',
      effect: `Plant-heavy diets make urine less acidic (about pH 6.7 vs 6.2), so amphetamine is cleared more slowly: half-life ${fmtX(phMult(DIET_PLANT_DPH))}.` });
  }
  if (b.urine === 'alkaline') {
    dpH += ALKALINIZER_DPH[1]; dLow += ALKALINIZER_DPH[0] - ALKALINIZER_DPH[1]; dHigh += ALKALINIZER_DPH[2] - ALKALINIZER_DPH[1];
    factors.push({ id: 'alkaline', title: 'Urine-alkalinizing medicine', modeled: true, confidence: 'estimate',
      effect: `The label says these raise amphetamine levels. Assuming urine pH rises about 1 unit, half-life ${fmtX(phMult(ALKALINIZER_DPH[1]))}, and the range is wide.` });
  } else if (b.urine === 'acidic') {
    dpH += ACIDIFIER_DPH[1]; dLow += ACIDIFIER_DPH[0] - ACIDIFIER_DPH[1]; dHigh += ACIDIFIER_DPH[2] - ACIDIFIER_DPH[1];
    factors.push({ id: 'acidic', title: 'Urine-acidifying medicine', modeled: true, confidence: 'estimate',
      effect: `The label says these lower amphetamine levels. Assuming urine pH falls about half a unit, half-life ${fmtX(phMult(ACIDIFIER_DPH[1]))}.` });
  }
  const pMult = phMult(dpH);

  // Kidneys.
  const rMult = RENAL_MULT[b.renal];
  if (b.renal === 'severe' || b.renal === 'failure') factors.push({
    id: 'renal', title: b.renal === 'severe' ? 'Severe kidney impairment' : 'Kidney failure', modeled: true, confidence: 'label',
    effect: `Clearance falls from 0.7 to ${b.renal === 'severe' ? '0.4' : '0.3'} L/h/kg in the label's study, so half-life ${fmtX(rMult)}. ${b.renal === 'failure' ? 'The label does not recommend Adderall XR in kidney failure.' : 'The label asks prescribers to use a lower dose.'}`
  });
  else if (b.renal === 'mild' || b.renal === 'moderate') factors.push({
    id: 'renal', title: `${b.renal === 'mild' ? 'Mild' : 'Moderate'} kidney impairment`, modeled: false, confidence: 'note',
    effect: 'There are no published numbers for mild or moderate impairment, so the curve is unchanged but the range is wider on the slow side.'
  });

  // Range multipliers for things without numbers.
  let lowX = phMult(dpH + dLow) / pMult, highX = phMult(dpH + dHigh) / pMult;
  if (!weightKnown) { lowX *= 0.92; highX *= 1.09; }
  const widen = (by: number) => { highX *= 1 + by; };
  if (b.renal === 'mild' || b.renal === 'moderate') widen(0.15);
  if (band === 'senior') {
    widen(0.15);
    factors.push({ id: 'senior', title: '65 or older', modeled: false, confidence: 'note',
      effect: 'Not studied in older adults. Kidney and liver function are often lower, so the range is wider on the slow side. Set your kidney function if you know it.' });
  }
  if (b.cyp2d6) {
    widen(0.2);
    factors.push({ id: 'cyp2d6', title: 'Strong CYP2D6 inhibitor', modeled: false, confidence: 'label',
      effect: 'The label says these may increase amphetamine exposure but gives no size. CYP2D6 handles only a minor pathway, so the curve is unchanged and the range is wider on the slow side.' });
  }
  if (b.liver) {
    widen(0.2);
    factors.push({ id: 'liver', title: 'Liver disease', modeled: false, confidence: 'note',
      effect: 'Not studied. About half of each dose is broken down by the liver, so clearance could be slower: wider range, no curve change.' });
  }
  if (b.pregnant) {
    lowX *= 0.85; widen(0.15);
    factors.push({ id: 'pregnant', title: 'Pregnant or breastfeeding', modeled: false, confidence: 'note',
      effect: 'Pregnancy changes how drugs are handled, but there are no numbers for amphetamine. Talk to your prescriber; the range is wider.' });
  }
  if (b.ppi) factors.push({ id: 'ppi', title: 'Daily acid reducer (PPI)', modeled: true, confidence: 'label',
    effect: 'XR peaks sooner: in the label\'s omeprazole study, median time to peak fell by 1.25 h (d) and 2.5 h (l), with the same total amount. IR is unchanged.' });
  if (b.serotonergic) factors.push({ id: 'serotonergic', title: 'Serotonergic medicine', modeled: false, confidence: 'label',
    effect: 'No change to the curve. The label warns about serotonin syndrome with SSRIs, SNRIs, triptans and similar medicines. Know the warning signs.' });
  if (b.maoi) factors.push({ id: 'maoi', title: 'MAOI in the last 14 days', modeled: false, confidence: 'label',
    effect: 'Amphetamine must not be taken with an MAOI or within 14 days of stopping one. Contact your prescriber.' });

  const hl = clamp(wMult * pMult * rMult, 0.7, 3.0);
  const range: [number, number] = [clamp(hl * lowX, 0.6, 3.2), clamp(hl * highX, 0.6, 3.6)];
  const [d, l] = BANDS[band];
  return {
    band, hl, hlRange: range, ppi: b.ppi, weightKg, weightKnown,
    ngScale: ngScaleFor(band, weightKg), factors,
    halfLives: { d: d.hl * hl, l: l.hl * hl },
    safety: { maoi: b.maoi, serotonergic: b.serotonergic }
  };
}

/** Share of a dose still in the body a day later, for the given physiology (XR, no meal). */
export function carryOver24(ph: Physio, kind: Kind = 'XR', hl = ph.hl): number {
  return fractionRemaining(kind, 24, doseParams(ph, kind, false, hl));
}

/* ---------------- menstrual cycle (information only) ---------------- */
export interface CycleInfo { day: number; phase: 'menstrual' | 'follicular' | 'luteal'; length: number }
/** Day of the cycle and phase, counting from the last period's start. Ovulation ≈ length − 14. */
export function cyclePhase(body: Body, now: number): CycleInfo | null {
  const c = body.cycle;
  if (!c.enabled || c.hormonal || !c.start) return null;
  const start = new Date(c.start + 'T00:00:00').getTime();
  if (!Number.isFinite(start) || start > now) return null;
  const length = clamp(Math.round(c.length), 21, 40);
  const day = Math.floor((now - start) / 86_400_000) % length + 1;
  const phase = day <= 5 ? 'menstrual' : day <= length - 14 ? 'follicular' : 'luteal';
  return { day, phase, length };
}
