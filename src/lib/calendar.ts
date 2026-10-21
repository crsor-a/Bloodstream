/** Pure date helpers for the dose calendar. All dates are local time; arithmetic uses
 *  Date setters (not fixed 24 h steps) so daylight-saving changes don't shift days. */
import type { Dose } from '../model/types';
import type { Kind } from '../model/pk';

export type Scale = 'week' | 'month' | 'year';

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (ts: number) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const startOfDay = (ts: number) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const addDays = (ts: number, n: number) => { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); };
/** Weeks start on Sunday (US calendar). */
export const startOfWeek = (ts: number) => { const d = new Date(startOfDay(ts)); d.setDate(d.getDate() - d.getDay()); return d.getTime(); };

export function weekDays(anchor: number): number[] {
  const s = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

export interface MonthCell { ts: number; inMonth: boolean }
/** 6 rows × 7 days covering the month containing `anchor`. */
export function monthMatrix(anchor: number): MonthCell[][] {
  const a = new Date(anchor);
  const first = new Date(a.getFullYear(), a.getMonth(), 1).getTime();
  let cur = startOfWeek(first);
  const rows: MonthCell[][] = [];
  for (let r = 0; r < 6; r++) {
    const row: MonthCell[] = [];
    for (let c = 0; c < 7; c++) { row.push({ ts: cur, inMonth: new Date(cur).getMonth() === a.getMonth() }); cur = addDays(cur, 1); }
    rows.push(row);
  }
  return rows;
}

export function shift(anchor: number, scale: Scale, dir: 1 | -1): number {
  const d = new Date(anchor);
  if (scale === 'week') d.setDate(d.getDate() + 7 * dir);
  else if (scale === 'month') { d.setDate(1); d.setMonth(d.getMonth() + dir); }
  else { d.setDate(1); d.setFullYear(d.getFullYear() + dir); }
  return d.getTime();
}

/** [start, end) of the visible range. */
export function rangeOf(anchor: number, scale: Scale): [number, number] {
  const a = new Date(anchor);
  if (scale === 'week') { const s = startOfWeek(anchor); return [s, addDays(s, 7)]; }
  if (scale === 'month') return [new Date(a.getFullYear(), a.getMonth(), 1).getTime(), new Date(a.getFullYear(), a.getMonth() + 1, 1).getTime()];
  return [new Date(a.getFullYear(), 0, 1).getTime(), new Date(a.getFullYear() + 1, 0, 1).getTime()];
}

export function rangeTitle(anchor: number, scale: Scale): string {
  const a = new Date(anchor);
  if (scale === 'year') return String(a.getFullYear());
  if (scale === 'month') return a.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const [s, e] = rangeOf(anchor, 'week');
  const last = addDays(e, -1);
  const sd = new Date(s), ld = new Date(last);
  const left = sd.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const right = sd.getMonth() === ld.getMonth() ? String(ld.getDate()) : ld.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${left} – ${right}, ${ld.getFullYear()}`;
}

export function groupByDay(doses: Dose[]): Map<string, Dose[]> {
  const m = new Map<string, Dose[]>();
  for (const d of [...doses].sort((a, b) => a.at - b.at)) {
    const k = dayKey(d.at);
    const list = m.get(k);
    if (list) list.push(d); else m.set(k, [d]);
  }
  return m;
}

export interface DoseType { key: string; kind: Kind; mg: number; color: string; count: number }
export const typeKey = (d: Pick<Dose, 'kind' | 'mg'>) => `${d.kind}-${d.mg}`;

/** Distinct, high-contrast on black. Used only when more than one dose type exists. */
export const TYPE_PALETTE = ['#64d2ff', '#ffd60a', '#bf5af2', '#30d158', '#ff9f0a', '#ff6482', '#7d7aff', '#ac8e68'];

/** One entry per kind+mg, IR before XR, then by mg. All white when there is only one type. */
export function doseTypes(doses: Dose[]): DoseType[] {
  const m = new Map<string, DoseType>();
  for (const d of doses) {
    const k = typeKey(d);
    const t = m.get(k);
    if (t) t.count++; else m.set(k, { key: k, kind: d.kind, mg: d.mg, color: '#ffffff', count: 1 });
  }
  const list = [...m.values()].sort((a, b) => a.kind === b.kind ? a.mg - b.mg : a.kind === 'IR' ? -1 : 1);
  if (list.length > 1) list.forEach((t, i) => { t.color = TYPE_PALETTE[i % TYPE_PALETTE.length]; });
  return list;
}

/** "8a", "1:30p" */
export function shortTime(ts: number): string {
  const d = new Date(ts), h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}${m ? ':' + pad(m) : ''}${h < 12 ? 'a' : 'p'}`;
}
