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
}

export interface Profile { band: Band }

export interface Settings {
  /** Planned bedtime, "HH:MM". */
  sleep: string;
  /** Doses before this time are kept in history but no longer tracked ("Start over"). */
  resetAt: number;
  seen: boolean;
  /** Last-used form values, so the next dose form starts where you left off. */
  last: (PillLook & { kind: Kind; mg: number; shapeTouched: boolean }) | null;
}

export const SHAPES: Shape[] = ['capsule', 'round', 'oval'];
export const isShape = (s: unknown): s is Shape => SHAPES.includes(s as Shape);

export const DEFAULT_SETTINGS: Settings = { sleep: '23:00', resetAt: 0, seen: false, last: null };
export const DEFAULT_PROFILE: Profile = { band: 'adult' };
