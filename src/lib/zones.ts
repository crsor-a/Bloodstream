/**
 * Effectivity zones: seven bands from baseline (red) to full effect (green).
 * Colors are semantic (information), like the sleep gauge. Side-effect bars (appetite
 * suppression, physical stimulation) run the other way, so green always means "settled".
 */
export type ZoneKind = 'focus' | 'appetite' | 'body' | 'sleep';
export type Tier = 'low' | 'mid' | 'high';

/** Upper bounds of each zone on a 0..1 scale. */
export const ZONE_EDGES = [0.06, 0.18, 0.34, 0.52, 0.7, 0.86, 1.0001];
/** Red → green, Apple system colors with in-betweens. */
export const ZONE_COLORS = ['#ff453a', '#ff6b3d', '#ff9f0a', '#ffd60a', '#c9e265', '#7fd858', '#30d158'];

const NAMES: Record<ZoneKind, string[]> = {
  focus: ['Baseline', 'Trace', 'Light', 'Partial', 'Working', 'Solid', 'Full'],
  appetite: ['Normal', 'Barely reduced', 'Slightly reduced', 'Reduced', 'Low', 'Very low', 'Minimal'],
  body: ['Settled', 'Faint', 'Mild', 'Noticeable', 'Moderate', 'Elevated', 'High'],
  sleep: ['Blocked', 'Very unlikely', 'Unlikely', 'Delayed', 'Slow', 'Mostly ready', 'Ready']
};

export interface Zone { index: number; name: string; color: string; from: number; to: number; tier: Tier; inverted: boolean }

export const isInverted = (k: ZoneKind) => k === 'appetite' || k === 'body';

export function zoneIndex(v: number): number {
  const x = Math.min(1, Math.max(0, v));
  return ZONE_EDGES.findIndex(e => x < e);
}

/** Zone for a bar value. Inverted kinds keep the name order but flip the colors. */
export function zoneFor(kind: ZoneKind, v: number): Zone {
  const i = zoneIndex(v);
  const inverted = isInverted(kind);
  return {
    index: i, name: NAMES[kind][i], color: ZONE_COLORS[inverted ? 6 - i : i],
    from: i ? ZONE_EDGES[i - 1] : 0, to: Math.min(1, ZONE_EDGES[i]),
    tier: i <= 2 ? 'low' : i <= 4 ? 'mid' : 'high', inverted
  };
}
export const zoneNames = (kind: ZoneKind) => NAMES[kind];
export function zoneColors(kind: ZoneKind): string[] { return isInverted(kind) ? [...ZONE_COLORS].reverse() : ZONE_COLORS; }
/** CSS gradient across the whole bar (hard-ish stops at zone edges, softened). */
export function zoneGradient(kind: ZoneKind): string {
  const cs = zoneColors(kind);
  const stops: string[] = [];
  let a = 0;
  cs.forEach((c, i) => { const b = Math.min(1, ZONE_EDGES[i]); stops.push(`${c} ${(a * 100).toFixed(1)}%`, `${c} ${(b * 100).toFixed(1)}%`); a = b; });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}
