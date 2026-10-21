import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { makeBackup, openStore, parseBackup, sanitizeDose } from '../src/lib/storage';
import { resolveFormTime, resolvePast } from '../src/lib/time';
import { HOUR } from '../src/lib/time';

describe('storage', () => {
  it('round-trips doses, profile and settings through IndexedDB', async () => {
    const store = await openStore();
    expect(store.kind).toBe('indexeddb');
    const d = sanitizeDose({ kind: 'XR', mg: 20, at: 1_700_000_000_000 })!;
    await store.putDose(d);
    await store.putProfile({ band: 'teen' });
    await store.putSettings({ sleep: '22:30', resetAt: 0, seen: true, last: null });
    const snap = await store.load();
    expect(snap.doses.map(x => x.id)).toContain(d.id);
    expect(snap.profile.band).toBe('teen');
    expect(snap.settings.sleep).toBe('22:30');
    await store.deleteDose(d.id);
    expect((await store.load()).doses.find(x => x.id === d.id)).toBeUndefined();
  });
  it('reads v2 single-file records (type instead of kind)', () => {
    const d = sanitizeDose({ id: 'a', type: 'IR', mg: 10, at: 5, shape: 'round', mode: 'halves', colors: { L: '#ffffff', R: '#4a8cf0' } });
    expect(d).toMatchObject({ kind: 'IR', mg: 10, shape: 'round', mode: 'halves', colors: { R: '#4a8cf0' } });
    expect(sanitizeDose({ type: 'XL', mg: 10, at: 5 })).toBeNull();
  });
  it('exports and re-imports a backup', () => {
    const d = sanitizeDose({ kind: 'XR', mg: 25, at: 123 })!;
    const text = makeBackup({ doses: [d], profile: { band: 'adult' }, settings: { sleep: '23:00', resetAt: 0, seen: true, last: null } });
    const back = parseBackup(text);
    expect(back.doses[0]).toMatchObject({ kind: 'XR', mg: 25, at: 123 });
    expect(() => parseBackup('{"hello":1}')).toThrow(/isn't a Bloodstream backup/);
  });
});

describe('time resolution', () => {
  const now = new Date(2026, 9, 21, 2, 15).getTime();
  it('a taken time later than now means yesterday', () => {
    expect(new Date(resolveFormTime('23:30', false, now)).getDate()).toBe(20);
  });
  it('a planned time earlier than now means tomorrow', () => {
    expect(new Date(resolveFormTime('08:00', true, now)).getDate()).toBe(21);
    expect(new Date(resolveFormTime('01:00', true, now)).getDate()).toBe(22);
  });
  it('time correction never lands in the future and stays near the original', () => {
    const planned = new Date(2026, 9, 21, 8, 0).getTime();
    const fixed = resolvePast('02:10', planned, now);
    expect(fixed).toBeLessThanOrEqual(now);
    expect(now - fixed).toBeLessThan(HOUR);
    const yesterday = new Date(2026, 9, 20, 8, 0).getTime();
    expect(new Date(resolvePast('07:30', yesterday, now)).getDate()).toBe(20);
  });
});
