import { describe, expect, it } from 'vitest';
import { dayKey, doseTypes, groupByDay, monthMatrix, rangeOf, rangeTitle, shift, shortTime, startOfWeek, weekDays } from '../src/lib/calendar';
import type { Dose } from '../src/model/types';

const dose = (kind: 'IR' | 'XR', mg: number, at: number): Dose =>
  ({ id: kind + mg + at, kind, mg, at, created: at, shape: 'capsule', mode: 'whole', colors: { L: '#fff', R: '#fff' } });
const day = (y: number, m: number, d: number, h = 8) => new Date(y, m, d, h).getTime();

describe('calendar helpers', () => {
  it('keys doses by local day', () => {
    expect(dayKey(day(2026, 9, 21, 23))).toBe('2026-10-21');
    const g = groupByDay([dose('XR', 20, day(2026, 9, 21, 8)), dose('IR', 10, day(2026, 9, 21, 14)), dose('XR', 20, day(2026, 9, 22))]);
    expect(g.get('2026-10-21')?.length).toBe(2);
    expect(g.get('2026-10-22')?.length).toBe(1);
  });
  it('builds a 6×7 month grid starting on Sunday', () => {
    const rows = monthMatrix(day(2026, 9, 15));
    expect(rows.length).toBe(6);
    expect(rows.every(r => r.length === 7)).toBe(true);
    expect(new Date(rows[0][0].ts).getDay()).toBe(0);
    expect(rows.flat().filter(c => c.inMonth).length).toBe(31);
  });
  it('weeks are Sunday to Saturday', () => {
    const w = weekDays(day(2026, 9, 21));
    expect(w.length).toBe(7);
    expect(new Date(w[0]).getDay()).toBe(0);
    expect(startOfWeek(day(2026, 9, 21))).toBe(w[0]);
  });
  it('shifts across year boundaries', () => {
    expect(new Date(shift(day(2026, 11, 31), 'month', 1)).getMonth()).toBe(0);
    expect(new Date(shift(day(2026, 0, 31), 'month', 1)).getMonth()).toBe(1);   // no Jan 31 → Mar overflow
    expect(new Date(shift(day(2026, 5, 1), 'year', -1)).getFullYear()).toBe(2025);
  });
  it('ranges and titles', () => {
    const [s, e] = rangeOf(day(2026, 9, 21), 'month');
    expect(new Date(s).getDate()).toBe(1);
    expect(new Date(e).getMonth()).toBe(10);
    expect(rangeTitle(day(2026, 9, 21), 'year')).toBe('2026');
  });
  it('colors dots only when more than one dose type exists', () => {
    expect(doseTypes([dose('XR', 20, 1), dose('XR', 20, 2)]).map(t => t.color)).toEqual(['#ffffff']);
    const many = doseTypes([dose('XR', 20, 1), dose('IR', 10, 2), dose('XR', 30, 3)]);
    expect(many.map(t => t.key)).toEqual(['IR-10', 'XR-20', 'XR-30']);
    expect(new Set(many.map(t => t.color)).size).toBe(3);
    expect(many.some(t => t.color === '#ffffff')).toBe(false);
  });
  it('formats short times', () => {
    expect(shortTime(day(2026, 9, 21, 8))).toBe('8a');
    expect(shortTime(new Date(2026, 9, 21, 13, 30).getTime())).toBe('1:30p');
  });
});

describe('past doses', () => {
  it('places a clock time on the chosen day', async () => {
    const { atOnDay } = await import('../src/lib/calendar');
    const t = atOnDay(new Date(2026, 9, 14).getTime(), '07:45');
    expect(new Date(t).getDate()).toBe(14);
    expect(new Date(t).getHours()).toBe(7);
    expect(new Date(t).getMinutes()).toBe(45);
  });
  it('pre-fills from the most recent dose that was actually taken', async () => {
    const { mostRecentTaken } = await import('../src/lib/calendar');
    const now = day(2026, 9, 21, 12);
    const list = [dose('XR', 20, day(2026, 9, 20)), dose('IR', 10, day(2026, 9, 21, 9)), dose('XR', 25, day(2026, 9, 22))];
    expect(mostRecentTaken(list, now)?.mg).toBe(10);
    expect(mostRecentTaken([], now)).toBeUndefined();
  });
});

describe('mg formatting', () => {
  it('keeps half-milligram strengths and rounds the rest', async () => {
    const { fmtMg } = await import('../src/lib/pill');
    expect(fmtMg(12.5)).toBe('12.5');
    expect(fmtMg(7.5)).toBe('7.5');
    expect(fmtMg(20)).toBe('20');
    expect(fmtMg(16.3)).toBe('16');
    expect(fmtMg(4.26)).toBe('4.3');
  });
});
