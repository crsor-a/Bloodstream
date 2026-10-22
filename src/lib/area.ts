import type { Regimen } from '../model/regimen';
import type { EffCtx, EffItem } from '../model/copy';
import { zoneFor, type Zone, type ZoneKind } from './zones';
import { HOUR, MIN } from './time';

/** Effectivity context at a time. Safe on an empty regimen (everything at baseline). */
export function ctxAt(reg: Regimen, ts: number): EffCtx {
  if (reg.empty) return { E: 0, L: 0, I: 0, rising: false, afterPeak: true };
  const kt = reg.keyTimes(reg.now);
  return { E: reg.effectAt(ts), L: reg.levelAt(ts), I: reg.sleepAt(ts), rising: reg.risingAt(ts), afterPeak: ts >= kt.peakAt };
}

export function areaValue(item: EffItem, c: EffCtx): number {
  return Math.min(1, Math.max(0, item.value(c)));
}

export interface AreaNow { value: number; zone: Zone; c: EffCtx }
export function areaNow(reg: Regimen, item: EffItem, ts: number): AreaNow {
  const c = ctxAt(reg, ts);
  const value = areaValue(item, c);
  return { value, zone: zoneFor(item.kind as ZoneKind, value), c };
}

/** Samples an area's value across the dashboard's graph window. */
export function areaSeries(reg: Regimen, item: EffItem, now: number, n = 120): { a: number; b: number; pts: { ts: number; v: number }[] } {
  if (reg.empty) return { a: now - 6 * HOUR, b: now + 6 * HOUR, pts: [] };
  const [a, b] = reg.domain(now);
  const pts: { ts: number; v: number }[] = [];
  for (let i = 0; i <= n; i++) { const ts = a + i * (b - a) / n; pts.push({ ts, v: areaValue(item, ctxAt(reg, ts)) }); }
  return { a, b, pts };
}

/** Next time the area moves into a different zone (within the graph window), or null. */
export function nextZoneChange(reg: Regimen, item: EffItem, now: number): { at: number; zone: Zone } | null {
  if (reg.empty) return null;
  const [, b] = reg.domain(now);
  const start = areaNow(reg, item, now).zone.index;
  for (let ts = now + 5 * MIN; ts <= b; ts += 5 * MIN) {
    const z = areaNow(reg, item, ts).zone;
    if (z.index !== start) return { at: ts, zone: z };
  }
  return null;
}
