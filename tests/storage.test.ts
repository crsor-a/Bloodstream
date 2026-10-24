import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { makeBackup, openStore, parseBackup, sanitizeDose, sanitizeProfile, sanitizeSettings } from '../src/lib/storage';
import { DEFAULT_BODY } from '../src/model/types';
import { resolveFormTime, resolvePast } from '../src/lib/time';
import { HOUR } from '../src/lib/time';

describe('storage', () => {
  it('round-trips doses, profile and settings through IndexedDB', async () => {
    const store = await openStore();
    expect(store.kind).toBe('indexeddb');
    const d = sanitizeDose({ kind: 'XR', mg: 20, at: 1_700_000_000_000 })!;
    await store.putDose(d);
    await store.putProfile({ band: 'teen', name: '', body: { ...DEFAULT_BODY, weightKg: 61, renal: 'severe', ppi: true } });
    await store.putSettings(sanitizeSettings({ sleep: '22:30', seen: true }));
    const snap = await store.load();
    expect(snap.doses.map(x => x.id)).toContain(d.id);
    expect(snap.profile.band).toBe('teen');
    expect(snap.profile.body).toMatchObject({ weightKg: 61, renal: 'severe', ppi: true, diet: 'mixed' });
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
    const text = makeBackup({ doses: [d], profile: { band: 'adult', name: '', body: DEFAULT_BODY }, settings: sanitizeSettings({ sleep: '23:00', seen: true }), meds: [], schedules: [], logs: [], appointments: [] });
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

describe('updating the app keeps saved data', () => {
  it('settings saved by 3.0 (no seenVersion) load with every field intact', () => {
    const v30 = { sleep: '22:15', resetAt: 123, seen: true, last: { kind: 'XR', mg: 20, shape: 'capsule', mode: 'halves', colors: { L: '#ffffff', R: '#4a8cf0' }, shapeTouched: true } };
    const s = sanitizeSettings(v30);
    expect(s).toMatchObject({ sleep: '22:15', resetAt: 123, seen: true, seenVersion: null });
    expect(s.last).toMatchObject({ kind: 'XR', mg: 20, mode: 'halves', colors: { R: '#4a8cf0' } });
  });
  it('doses and settings written by the old build survive reopening the database', async () => {
    // Simulate 3.0.x writing directly to the same database, then the new build opening it.
    const old = await openStore();
    const d = sanitizeDose({ kind: 'IR', mg: 10, at: 1_700_000_500_000 })!;
    await old.putDose(d);
    await old.putSettings(sanitizeSettings({ sleep: '21:45', seen: true }));
    const reopened = await openStore();
    const snap = await reopened.load();
    expect(snap.doses.some(x => x.id === d.id && x.mg === 10)).toBe(true);
    expect(snap.settings.sleep).toBe('21:45');
  });
  it('the database is on schema version 2 with every store present', async () => {
    await openStore();
    const db = await openDB('bloodstream');
    expect(db.version).toBe(2);
    expect([...db.objectStoreNames].sort()).toEqual(['appointments', 'doses', 'kv', 'logs', 'meds', 'schedules']);
    db.close();
  });
  it('reads 4.0 profiles without body details, and cleans bad values', () => {
    expect(sanitizeProfile({ band: 'teen', name: 'Sam' })).toEqual({ band: 'teen', name: 'Sam', body: DEFAULT_BODY });
    expect(sanitizeProfile({ band: 'senior' }).band).toBe('senior');
    const p = sanitizeProfile({ band: 'adult', body: { weightKg: 9999, renal: 'awful', diet: 'plant', urine: 'alkaline', ppi: 'yes', cycle: { enabled: true, start: '2026-10-01', length: 60 } } });
    expect(p.body.weightKg).toBeNull();
    expect(p.body.renal).toBe('unknown');
    expect(p.body.diet).toBe('plant');
    expect(p.body.urine).toBe('alkaline');
    expect(p.body.ppi).toBe(false);
    expect(p.body.cycle).toEqual({ enabled: true, start: '2026-10-01', length: 40, hormonal: false });
    expect(sanitizeProfile({ body: { weightKg: 72.364 } }).body.weightKg).toBe(72.36);
  });
  it('keeps the meal flag on doses and drops unknown values', () => {
    expect(sanitizeDose({ kind: 'XR', mg: 20, at: 5, meal: 'highfat' })!.meal).toBe('highfat');
    expect(sanitizeDose({ kind: 'XR', mg: 20, at: 5, meal: 'pizza' })!.meal).toBeUndefined();
    expect('meal' in sanitizeDose({ kind: 'IR', mg: 10, at: 5 })!).toBe(false);
  });
});
