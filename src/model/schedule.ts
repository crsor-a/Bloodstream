/** Pure helpers for saved medications and their schedules. Local time throughout. */
import type { Dose, Med, Schedule } from './types';
import { HOUR, MIN } from '../lib/time';

export interface Slot { schedule: Schedule; med: Med; at: number; key: string }
export type SlotState = 'upcoming' | 'due' | 'missed';

const pad = (n: number) => String(n).padStart(2, '0');
export const dayStamp = (ts: number) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const slotKey = (scheduleId: string, ts: number) => `${scheduleId}|${dayStamp(ts)}`;

export function atTime(day: number, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(day); d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}

/** Every scheduled slot on the local day containing `day`. */
export function slotsOnDay(day: number, schedules: Schedule[], meds: Med[]): Slot[] {
  const wd = new Date(day).getDay();
  const byId = new Map(meds.map(m => [m.id, m]));
  const out: Slot[] = [];
  for (const s of schedules) {
    const med = byId.get(s.medId);
    if (!med || !s.days.includes(wd)) continue;
    const at = atTime(day, s.time);
    out.push({ schedule: s, med, at, key: slotKey(s.id, at) });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** A slot counts as done if a dose was linked to it, or the same medication was logged within 3 h. */
export function slotTaken(slot: Slot, doses: Dose[]): boolean {
  const day = dayStamp(slot.at);
  return doses.some(d =>
    (d.scheduleId === slot.schedule.id && dayStamp(d.at) === day) ||
    ((d.medId === slot.med.id || (d.kind === slot.med.kind && d.mg === slot.med.mg)) && Math.abs(d.at - slot.at) <= 3 * HOUR));
}

/**
 * Slots that need attention right now:
 *   upcoming  within `leadMin` before the time
 *   due       from the time until 2 h after
 *   missed    2–8 h after, still the same day ("Did you forget?")
 */
export function attentionSlots(now: number, schedules: Schedule[], meds: Med[], doses: Dose[], skips: Record<string, number>, leadMin: number):
  { slot: Slot; state: SlotState }[] {
  const out: { slot: Slot; state: SlotState }[] = [];
  for (const slot of slotsOnDay(now, schedules, meds)) {
    if (skips[slot.key] || slotTaken(slot, doses)) continue;
    const dt = now - slot.at;
    if (dt < -Math.max(leadMin, 0) * MIN) continue;
    if (dt < 0) out.push({ slot, state: 'upcoming' });
    else if (dt < 2 * HOUR) out.push({ slot, state: 'due' });
    else if (dt < 8 * HOUR) out.push({ slot, state: 'missed' });
  }
  return out;
}

/** The next untaken slot within a week, for "Next: Morning XR at 7:30 AM". */
export function nextSlot(now: number, schedules: Schedule[], meds: Med[], doses: Dose[], skips: Record<string, number> = {}): Slot | null {
  for (let i = 0; i < 8; i++) {
    const day = new Date(now); day.setDate(day.getDate() + i);
    for (const s of slotsOnDay(day.getTime(), schedules, meds)) {
      if (s.at <= now - 2 * HOUR || skips[s.key] || slotTaken(s, doses)) continue;
      return s;
    }
  }
  return null;
}

const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function daysLabel(days: number[]): string {
  const set = [...new Set(days)].sort();
  if (set.length === 7) return 'Every day';
  if (set.join() === '1,2,3,4,5') return 'Weekdays';
  if (set.join() === '0,6') return 'Weekends';
  return set.map(d => SHORT[d]).join(', ');
}
export const WEEKDAY_SHORT = SHORT;

/** Removes skip records older than two weeks so settings don't grow forever. */
export function pruneSkips(skips: Record<string, number>, now: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(skips)) if (now - v < 14 * 24 * HOUR) out[k] = v;
  return out;
}
