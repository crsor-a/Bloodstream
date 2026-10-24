import type { Band, Kind } from './pk';

export type Shape = 'capsule' | 'round' | 'oval';
export type ColorMode = 'whole' | 'halves';

export interface PillLook {
  shape: Shape;
  mode: ColorMode;
  /** Hex colors, or 'clear' for a see-through capsule with beads. */
  colors: { L: string; R: string };
}

export interface Dose extends PillLook {
  id: string;
  kind: Kind;
  mg: number;
  /** Epoch ms when taken (or planned, if in the future). */
  at: number;
  /** Epoch ms when the record was created. */
  created: number;
  /** Saved medication this dose came from, if any. */
  medId?: string;
  /** Schedule slot this dose fulfils, if any. */
  scheduleId?: string;
  /** XR taken with a high-fat meal (label: peak about 2.5 h later, same total). */
  meal?: 'highfat';
}

/** A saved medication ("Morning XR"): one tap to log it. */
export interface Med extends PillLook {
  id: string;
  name: string;
  kind: Kind;
  mg: number;
  created: number;
}

/** An intended time for a saved medication on chosen weekdays (0 = Sunday). */
export interface Schedule {
  id: string;
  medId: string;
  time: string;
  days: number[];
  reminder: boolean;
  created: number;
}

export type LogType = 'effect' | 'benefit' | 'question' | 'concern';
/** How urgently an entry should reach a prescriber. Mirrors the FDA Medication Guide's wording. */
export type Urgency = 'info' | 'mention' | 'soon' | 'stop' | 'emergency';

/** A doctor-logging entry: something to bring up at the next appointment. */
export interface LogEntry {
  id: string;
  type: LogType;
  category: string;
  /** Suggestion this entry was built from, or null for a custom entry. */
  templateId: string | null;
  title: string;
  details: string;
  priority: boolean;
  created: number;
}

export interface Appointment {
  id: string;
  at: number;
  doctor: string;
  visit: string;
  notes: string;
  reviewed: boolean;
  created: number;
}

export type EffectId = 'none' | 'sky' | 'aurora' | 'rain' | 'snow' | 'nebula' | 'gradient' | 'solid';
export interface Theme {
  effect: EffectId;
  /** Colors for the gradient / solid effects. */
  colors: string[];
  /** 0..1, how much the background is dimmed behind content. */
  dim: number;
  motion: boolean;
  location: { lat: number; lon: number; label: string } | null;
}

export type AdjustPhase = 'adjusting' | 'settled' | 'unsure';

/** Optional body and medicine details that change the model (see model/physio.ts). */
export interface Body {
  weightKg: number | null;
  units: 'kg' | 'lb';
  sex: 'female' | 'male' | 'other' | null;
  renal: 'unknown' | 'normal' | 'mild' | 'moderate' | 'severe' | 'failure';
  diet: 'mixed' | 'plant';
  /** Regular medicines that change urine acidity. */
  urine: 'none' | 'alkaline' | 'acidic';
  ppi: boolean;
  cyp2d6: boolean;
  serotonergic: boolean;
  maoi: boolean;
  liver: boolean;
  pregnant: boolean;
  cycle: { enabled: boolean; start: string | null; length: number; hormonal: boolean };
}

export interface Profile { band: Band; name: string; body: Body }

export interface Settings {
  /** Planned bedtime, "HH:MM". */
  sleep: string;
  /** Legacy (removed "Start over" button). Kept so older saved data still loads; no longer applied. */
  resetAt: number;
  seen: boolean;
  /** Newest changelog version the user has seen (null = never). */
  seenVersion: string | null;
  /** Last-used form values, so the next dose form starts where you left off. */
  last: (PillLook & { kind: Kind; mg: number; shapeTouched: boolean }) | null;
  logging: { enabled: boolean; phase: AdjustPhase | null };
  /** 0 = off, -1 = until turned off, otherwise epoch ms when it ends. */
  incognitoUntil: number;
  theme: Theme;
  reminders: { enabled: boolean; lead: number; discreet: boolean };
  /** Schedule slots the user skipped: "scheduleId|YYYY-MM-DD" → when skipped. */
  skips: Record<string, number>;
  /** One-time v4 setup tour for people who used Bloodstream before 4.0. */
  setupV4: 'pending' | 'done' | 'dismissed';
}

export const SHAPES: Shape[] = ['capsule', 'round', 'oval'];
export const isShape = (s: unknown): s is Shape => SHAPES.includes(s as Shape);
export const EFFECTS: EffectId[] = ['none', 'sky', 'aurora', 'rain', 'snow', 'nebula', 'gradient', 'solid'];

export const DEFAULT_THEME: Theme = { effect: 'none', colors: ['#1a2a6c', '#b21f1f', '#fdbb2d'], dim: 0.35, motion: true, location: null };
export const DEFAULT_SETTINGS: Settings = {
  sleep: '23:00', resetAt: 0, seen: false, seenVersion: null, last: null,
  logging: { enabled: false, phase: null }, incognitoUntil: 0, theme: DEFAULT_THEME,
  reminders: { enabled: false, lead: 10, discreet: true }, skips: {}, setupV4: 'pending'
};
export const DEFAULT_BODY: Body = {
  weightKg: null, units: 'kg', sex: null, renal: 'unknown', diet: 'mixed', urine: 'none',
  ppi: false, cyp2d6: false, serotonergic: false, maoi: false, liver: false, pregnant: false,
  cycle: { enabled: false, start: null, length: 28, hormonal: false }
};
export const DEFAULT_PROFILE: Profile = { band: 'adult', name: '', body: DEFAULT_BODY };
