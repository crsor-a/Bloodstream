export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
export const toHHMM = (d: Date | number) => {
  const x = typeof d === 'number' ? new Date(d) : d;
  return String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0');
};
const parseHHMM = (v: string): [number, number] => { const [h, m] = v.split(':').map(Number); return [h || 0, m || 0]; };

/** Whole calendar days between `ts` and `now` (negative = past). */
export function dayDiff(ts: number, now = Date.now()): number {
  const a = new Date(ts); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / DAY);
}
export function dayWord(ts: number, now = Date.now()): string {
  const dd = dayDiff(ts, now);
  if (dd === 0) return '';
  if (dd === -1) return 'Yesterday';
  if (dd === 1) return 'Tomorrow';
  return new Date(ts).toLocaleDateString([], { weekday: 'long' });
}
/** "3:30 PM", "yesterday at 9:00 PM", "Tomorrow at 8:00 AM". */
export function fmtWhen(ts: number, lower = false, now = Date.now()): string {
  const w = dayWord(ts, now);
  return w ? (lower ? w.toLowerCase() : w) + ' at ' + fmtTime(ts) : fmtTime(ts);
}
export function fmtDur(hours: number): string {
  const m = Math.round(Math.abs(hours) * 60);
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
export function rel(ts: number, now = Date.now()): string {
  const h = (ts - now) / HOUR;
  if (Math.abs(h) < 1 / 60) return 'now';
  return h > 0 ? 'in ' + fmtDur(h) : fmtDur(h) + ' ago';
}
export function greeting(now = Date.now()): string {
  const h = new Date(now).getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Up late';
}

/** Dose form: a clock time becomes the most recent past occurrence (taken) or the next one (planned). */
export function resolveFormTime(hhmm: string, planned: boolean, now = Date.now()): number {
  const [h, m] = parseHHMM(hhmm);
  const d = new Date(now); d.setHours(h, m, 0, 0);
  if (planned) { if (d.getTime() < now - 5 * MIN) d.setDate(d.getDate() + 1); }
  else if (d.getTime() > now + 10 * MIN) d.setDate(d.getDate() - 1);
  return d.getTime();
}

/**
 * Time correction: the occurrence of `hhmm` closest to the dose's current time that has
 * already happened. Never returns a future time.
 */
export function resolvePast(hhmm: string, refTs: number, now = Date.now()): number {
  const [h, m] = parseHHMM(hhmm);
  let best: number | null = null;
  for (const off of [-2, -1, 0, 1]) {
    const d = new Date(refTs); d.setDate(d.getDate() + off); d.setHours(h, m, 0, 0);
    const t = d.getTime();
    if (t <= now + MIN && (best === null || Math.abs(t - refTs) < Math.abs(best - refTs))) best = t;
  }
  if (best === null) {
    const d = new Date(now); d.setHours(h, m, 0, 0);
    if (d.getTime() > now) d.setDate(d.getDate() - 1);
    best = d.getTime();
  }
  return Math.min(best, now);
}

/** First occurrence of `hhmm` after `after`. */
export function nextOccurrence(hhmm: string, after: number): number {
  const [h, m] = parseHHMM(hhmm);
  const d = new Date(after); d.setHours(h, m, 0, 0);
  if (d.getTime() <= after) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** Occurrence of `hhmm` (yesterday/today/tomorrow) inside [a,b] closest to now, else closest to now. */
export function occurrenceNear(hhmm: string, a: number, b: number, now = Date.now()): number {
  const [h, m] = parseHHMM(hhmm);
  let best: number | null = null, bestIn: number | null = null;
  for (const off of [-1, 0, 1]) {
    const d = new Date(now); d.setDate(d.getDate() + off); d.setHours(h, m, 0, 0);
    const t = d.getTime();
    if (t >= a && t <= b && (bestIn === null || Math.abs(t - now) < Math.abs(bestIn - now))) bestIn = t;
    if (best === null || Math.abs(t - now) < Math.abs(best - now)) best = t;
  }
  return bestIn ?? best!;
}
