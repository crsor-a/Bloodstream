import { describe, expect, it } from 'vitest';
import { attentionSlots, daysLabel, nextSlot, pruneSkips, slotKey, slotsOnDay, slotTaken } from '../src/model/schedule';
import type { Dose, Med, Schedule } from '../src/model/types';

const med: Med = { id: 'm1', name: 'Morning XR', kind: 'XR', mg: 20, created: 1, shape: 'capsule', mode: 'whole', colors: { L: '#ff8f3a', R: '#ff8f3a' } };
const weekdays: Schedule = { id: 's1', medId: 'm1', time: '07:30', days: [1, 2, 3, 4, 5], reminder: true, created: 1 };
const wed = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();   // Wed Oct 21 2026
const dose = (at: number, extra: Partial<Dose> = {}): Dose => ({ id: 'd' + at, kind: 'XR', mg: 20, at, created: at, shape: 'capsule', mode: 'whole', colors: { L: '#fff', R: '#fff' }, ...extra });

describe('schedules', () => {
  it('lists slots only on scheduled weekdays', () => {
    expect(slotsOnDay(wed(12), [weekdays], [med]).length).toBe(1);
    expect(slotsOnDay(new Date(2026, 9, 24, 12).getTime(), [weekdays], [med]).length).toBe(0); // Saturday
  });
  it('labels day sets', () => {
    expect(daysLabel([1, 2, 3, 4, 5])).toBe('Weekdays');
    expect(daysLabel([0, 6])).toBe('Weekends');
    expect(daysLabel([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
    expect(daysLabel([1, 3, 5])).toBe('Mon, Wed, Fri');
  });
  it('moves from upcoming to due to missed, and clears once taken or skipped', () => {
    const at = (t: number) => attentionSlots(t, [weekdays], [med], [], {}, 10).map(x => x.state);
    expect(at(wed(7, 10))).toEqual([]);
    expect(at(wed(7, 25))).toEqual(['upcoming']);
    expect(at(wed(8, 0))).toEqual(['due']);
    expect(at(wed(11, 0))).toEqual(['missed']);
    expect(at(wed(17, 0))).toEqual([]);
    expect(attentionSlots(wed(8), [weekdays], [med], [dose(wed(7, 40))], {}, 10)).toEqual([]);
    expect(attentionSlots(wed(8), [weekdays], [med], [], { [slotKey('s1', wed(8))]: wed(8) }, 10)).toEqual([]);
  });
  it('counts a dose linked to the schedule even if logged late', () => {
    const slot = slotsOnDay(wed(12), [weekdays], [med])[0];
    expect(slotTaken(slot, [dose(wed(12), { scheduleId: 's1', kind: 'IR', mg: 5 })])).toBe(true);
    expect(slotTaken(slot, [dose(wed(12), { kind: 'IR', mg: 5 })])).toBe(false);
  });
  it('finds the next slot, skipping the weekend', () => {
    const fri = new Date(2026, 9, 23, 12).getTime();
    expect(new Date(nextSlot(fri, [weekdays], [med], [])!.at).getDay()).toBe(1);
  });
  it('prunes old skips', () => {
    const now = wed(12);
    expect(Object.keys(pruneSkips({ a: now - 1000, b: now - 30 * 86_400_000 }, now))).toEqual(['a']);
  });
});
