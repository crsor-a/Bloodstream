/**
 * The 4.0 upgrade must keep everything people saved with 3.x.
 * Builds a real v1 database exactly as 3.x wrote it, then opens it with the new code.
 */
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { makeBackup, openStore, parseBackup, sanitizeAppointment, sanitizeLog, sanitizeMed, sanitizeSchedule } from '../src/lib/storage';
import { DEFAULT_BODY } from '../src/model/types';

const V3_DOSE = { id: 'd1', kind: 'XR', mg: 20, at: 1_760_000_000_000, created: 1_760_000_000_000, shape: 'capsule', mode: 'halves', colors: { L: '#ffffff', R: '#4a8cf0' } };
const V3_SETTINGS = { sleep: '22:15', resetAt: 0, seen: true, seenVersion: '3.3.0', last: { kind: 'XR', mg: 20, shape: 'capsule', mode: 'halves', colors: { L: '#ffffff', R: '#4a8cf0' }, shapeTouched: true } };

async function buildV1() {
  const db = await openDB('bloodstream', 1, {
    upgrade(db) { const s = db.createObjectStore('doses', { keyPath: 'id' }); s.createIndex('at', 'at'); db.createObjectStore('kv'); }
  });
  await db.put('doses', V3_DOSE);
  await db.put('doses', { ...V3_DOSE, id: 'd2', kind: 'IR', mg: 10, at: V3_DOSE.at + 3_600_000 });
  await db.put('kv', { band: 'teen' }, 'profile');
  await db.put('kv', V3_SETTINGS, 'settings');
  await db.put('kv', true, 'flag:legacyImported');
  db.close();
}

describe('3.x → 4.0 database upgrade', () => {
  it('keeps every dose, the profile and the settings, and adds the new stores', async () => {
    await buildV1();
    const store = await openStore();
    expect(store.kind).toBe('indexeddb');
    const snap = await store.load();
    expect(snap.doses.map(d => d.id)).toEqual(['d1', 'd2']);
    expect(snap.doses[0]).toMatchObject({ kind: 'XR', mg: 20, mode: 'halves', colors: { R: '#4a8cf0' } });
    expect(snap.profile).toEqual({ band: 'teen', name: '', body: DEFAULT_BODY });
    expect(snap.settings).toMatchObject({ sleep: '22:15', seen: true, seenVersion: '3.3.0', setupV4: 'pending' });
    expect(snap.settings.last?.colors.R).toBe('#4a8cf0');
    expect(snap.settings.logging.enabled).toBe(false);
    expect(snap.settings.theme.effect).toBe('none');
    expect(snap.meds).toEqual([]);
    expect(await store.getFlag('legacyImported')).toBe(true);

    const raw = await openDB('bloodstream');
    expect(raw.version).toBe(2);
    expect([...raw.objectStoreNames].sort()).toEqual(['appointments', 'doses', 'kv', 'logs', 'meds', 'schedules']);
    raw.close();
  });

  it('stores and reloads the new 4.0 records', async () => {
    const store = await openStore();
    const med = sanitizeMed({ name: 'Morning XR', kind: 'XR', mg: 20, shape: 'capsule' })!;
    const sch = sanitizeSchedule({ medId: med.id, time: '07:30', days: [1, 2, 3, 4, 5] })!;
    const log = sanitizeLog({ type: 'effect', category: 'sleep', templateId: 'sleep-onset', title: 'Hard to fall asleep', details: 'Most school nights', priority: true })!;
    const appt = sanitizeAppointment({ at: Date.now() + 86_400_000 * 10, doctor: 'Dr. Lee', visit: 'Follow-up' })!;
    await store.put('meds', [med]); await store.put('schedules', [sch]); await store.put('logs', [log]); await store.put('appointments', [appt]);
    const reopened = await openStore();
    const snap = await reopened.load();
    expect(snap.meds[0]).toMatchObject({ name: 'Morning XR', kind: 'XR', mg: 20 });
    expect(snap.schedules[0]).toMatchObject({ time: '07:30', days: [1, 2, 3, 4, 5], reminder: true });
    expect(snap.logs[0]).toMatchObject({ title: 'Hard to fall asleep', priority: true });
    expect(snap.appointments[0].doctor).toBe('Dr. Lee');
    expect(snap.doses.length).toBe(2);   // 3.x doses still there
    await reopened.del('logs', [log.id]);
    expect((await reopened.load()).logs).toEqual([]);
  });

  it('reads 3.x backups (format 1) and round-trips format 2', () => {
    const v1 = JSON.stringify({ app: 'bloodstream', format: 1, profile: { band: 'adult' }, settings: V3_SETTINGS, doses: [V3_DOSE] });
    const a = parseBackup(v1);
    expect(a.doses.length).toBe(1);
    expect(a.meds).toEqual([]);
    const med = sanitizeMed({ kind: 'IR', mg: 12.5 })!;
    const b = parseBackup(makeBackup({ ...a, meds: [med] }));
    expect(b.meds[0]).toMatchObject({ kind: 'IR', mg: 12.5, name: 'IR 12.5 mg' });
  });

  it('rejects malformed new records instead of crashing', () => {
    expect(sanitizeSchedule({ medId: 'x', time: '7:30', days: [1] })).toBeNull();
    expect(sanitizeSchedule({ medId: 'x', time: '07:30', days: [] })).toBeNull();
    expect(sanitizeLog({ type: 'rant', title: 'x' })).toBeNull();
    expect(sanitizeMed({ kind: 'XL', mg: 20 })).toBeNull();
  });
});
