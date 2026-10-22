/**
 * Local-first persistence.
 *
 * Primary: IndexedDB database "bloodstream".
 *   v1  doses (keyPath "id", index "at"), kv (profile, settings, flag:*)
 *   v2  + meds, schedules, logs, appointments (keyPath "id")       ← Bloodstream 4.0
 * Fallback: one localStorage record, then memory, for browsers where IndexedDB is unavailable.
 *
 * Rules: schema changes go in `upgrade()` as new `if (oldVersion < N)` blocks that only ADD.
 * Never edit or delete earlier blocks. Every sanitizer accepts every older record shape.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { isBand, isKind } from '../model/pk';
import {
  DEFAULT_PROFILE, DEFAULT_SETTINGS, DEFAULT_THEME, EFFECTS, isShape,
  type Appointment, type Dose, type LogEntry, type LogType, type Med, type Profile, type Schedule, type Settings, type Theme
} from '../model/types';

export const DB_VERSION = 2;

export interface Snapshot {
  doses: Dose[];
  meds: Med[];
  schedules: Schedule[];
  logs: LogEntry[];
  appointments: Appointment[];
  profile: Profile;
  settings: Settings;
}
export type Coll = 'doses' | 'meds' | 'schedules' | 'logs' | 'appointments';
export interface CollItem { doses: Dose; meds: Med; schedules: Schedule; logs: LogEntry; appointments: Appointment }
export const COLLS: Coll[] = ['doses', 'meds', 'schedules', 'logs', 'appointments'];

export interface Store {
  readonly kind: 'indexeddb' | 'localStorage' | 'memory';
  load(): Promise<Snapshot>;
  put<C extends Coll>(c: C, items: CollItem[C][]): Promise<void>;
  del(c: Coll, ids: string[]): Promise<void>;
  putProfile(p: Profile): Promise<void>;
  putSettings(s: Settings): Promise<void>;
  getFlag(key: string): Promise<boolean>;
  setFlag(key: string): Promise<void>;
  clear(): Promise<void>;
  /* conveniences kept from 3.x */
  putDose(d: Dose): Promise<void>;
  putDoses(ds: Dose[]): Promise<void>;
  deleteDose(id: string): Promise<void>;
}

/* ---------------- validation ---------------- */
const hex = /^#[0-9a-f]{6}$/i;
const okColor = (c: unknown): c is string => c === 'clear' || (typeof c === 'string' && hex.test(c));
const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v : '').slice(0, max);
const hhmm = (v: unknown) => typeof v === 'string' && /^\d\d:\d\d$/.test(v);
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function look(raw: any, kind: 'IR' | 'XR') {
  const L = okColor(raw?.colors?.L) ? raw.colors.L : '#ff8f3a';
  const R = okColor(raw?.colors?.R) ? raw.colors.R : L;
  const mode = raw?.mode === 'halves' ? 'halves' as const : 'whole' as const;
  return { shape: isShape(raw?.shape) ? raw.shape : kind === 'XR' ? 'capsule' as const : 'round' as const, mode, colors: { L, R: mode === 'halves' ? R : L } };
}

/** Accepts current records, single-file v2 records ({type,...}) and backups. Returns null if unusable. */
export function sanitizeDose(raw: any): Dose | null {
  if (!raw || typeof raw !== 'object') return null;
  const kind = isKind(raw.kind) ? raw.kind : isKind(raw.type) ? raw.type : null;
  const mg = Number(raw.mg ?? raw.dose), at = Number(raw.at ?? raw.taken);
  if (!kind || !(mg > 0) || !(at > 0)) return null;
  const d: Dose = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    kind, mg: Math.min(100, Math.max(1, mg)), at,
    created: Number(raw.created) > 0 ? Number(raw.created) : at,
    ...look(raw, kind)
  };
  if (typeof raw.medId === 'string' && raw.medId) d.medId = raw.medId;
  if (typeof raw.scheduleId === 'string' && raw.scheduleId) d.scheduleId = raw.scheduleId;
  return d;
}
export function sanitizeMed(raw: any): Med | null {
  if (!raw || typeof raw !== 'object' || !isKind(raw.kind) || !(Number(raw.mg) > 0)) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    name: str(raw.name, 40).trim() || `${raw.kind} ${raw.mg} mg`,
    kind: raw.kind, mg: Math.min(100, Math.max(1, Number(raw.mg))),
    created: Number(raw.created) > 0 ? Number(raw.created) : Date.now(),
    ...look(raw, raw.kind)
  };
}
export function sanitizeSchedule(raw: any): Schedule | null {
  if (!raw || typeof raw !== 'object' || typeof raw.medId !== 'string' || !hhmm(raw.time)) return null;
  const days = Array.isArray(raw.days) ? [...new Set(raw.days.map(Number).filter((d: number) => d >= 0 && d <= 6))].sort() as number[] : [];
  if (!days.length) return null;
  return { id: typeof raw.id === 'string' && raw.id ? raw.id : newId(), medId: raw.medId, time: raw.time, days, reminder: raw.reminder !== false, created: Number(raw.created) > 0 ? Number(raw.created) : Date.now() };
}
const LOG_TYPES: LogType[] = ['effect', 'benefit', 'question', 'concern'];
export function sanitizeLog(raw: any): LogEntry | null {
  if (!raw || typeof raw !== 'object' || !LOG_TYPES.includes(raw.type)) return null;
  const title = str(raw.title, 300).trim();
  if (!title) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(), type: raw.type, category: str(raw.category, 40) || 'other',
    templateId: typeof raw.templateId === 'string' && raw.templateId ? raw.templateId : null,
    title, details: str(raw.details, 4000), priority: !!raw.priority,
    created: Number(raw.created) > 0 ? Number(raw.created) : Date.now()
  };
}
export function sanitizeAppointment(raw: any): Appointment | null {
  if (!raw || typeof raw !== 'object' || !(Number(raw.at) > 0)) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(), at: Number(raw.at),
    doctor: str(raw.doctor, 80), visit: str(raw.visit, 40), notes: str(raw.notes, 2000), reviewed: !!raw.reviewed,
    created: Number(raw.created) > 0 ? Number(raw.created) : Date.now()
  };
}
export function sanitizeProfile(raw: any): Profile {
  return { band: isBand(raw?.band) ? raw.band : DEFAULT_PROFILE.band, name: str(raw?.name, 30).trim() };
}
function sanitizeTheme(raw: any): Theme {
  const t: Theme = { ...DEFAULT_THEME, colors: [...DEFAULT_THEME.colors] };
  if (!raw || typeof raw !== 'object') return t;
  if (EFFECTS.includes(raw.effect)) t.effect = raw.effect;
  if (Array.isArray(raw.colors)) { const c = raw.colors.filter((x: unknown) => typeof x === 'string' && hex.test(x)).slice(0, 4); if (c.length) t.colors = c; }
  if (Number.isFinite(Number(raw.dim))) t.dim = Math.min(0.85, Math.max(0, Number(raw.dim)));
  t.motion = raw.motion !== false;
  const l = raw.location;
  if (l && Number.isFinite(Number(l.lat)) && Number.isFinite(Number(l.lon))) t.location = { lat: Number(l.lat), lon: Number(l.lon), label: str(l.label, 60) };
  return t;
}
export function sanitizeSettings(raw: any): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS, theme: sanitizeTheme(raw?.theme), skips: {} };
  if (hhmm(raw?.sleep)) s.sleep = raw.sleep;
  if (Number(raw?.resetAt) > 0) s.resetAt = Number(raw.resetAt);
  s.seen = !!raw?.seen;
  if (typeof raw?.seenVersion === 'string' && /^\d+\.\d+\.\d+$/.test(raw.seenVersion)) s.seenVersion = raw.seenVersion;
  const l = raw?.last;
  if (l && isKind(l.kind) && isShape(l.shape) && okColor(l.colors?.L)) {
    s.last = { kind: l.kind, mg: Number(l.mg) > 0 ? Number(l.mg) : 20, shape: l.shape, mode: l.mode === 'halves' ? 'halves' : 'whole',
      colors: { L: l.colors.L, R: okColor(l.colors.R) ? l.colors.R : l.colors.L }, shapeTouched: !!l.shapeTouched };
  }
  const lg = raw?.logging;
  s.logging = { enabled: !!lg?.enabled, phase: ['adjusting', 'settled', 'unsure'].includes(lg?.phase) ? lg.phase : null };
  const inc = Number(raw?.incognitoUntil);
  s.incognitoUntil = inc === -1 || inc > 0 ? inc : 0;
  const r = raw?.reminders;
  s.reminders = { enabled: !!r?.enabled, lead: [0, 5, 10, 15, 30, 60].includes(Number(r?.lead)) ? Number(r.lead) : 10, discreet: r?.discreet !== false };
  if (raw?.skips && typeof raw.skips === 'object') for (const [k, v] of Object.entries(raw.skips)) if (Number(v) > 0) s.skips[k] = Number(v);
  s.setupV4 = ['pending', 'done', 'dismissed'].includes(raw?.setupV4) ? raw.setupV4 : 'pending';
  return s;
}
const SANITIZE: { [C in Coll]: (raw: any) => CollItem[C] | null } = {
  doses: sanitizeDose, meds: sanitizeMed, schedules: sanitizeSchedule, logs: sanitizeLog, appointments: sanitizeAppointment
};
const clean = <C extends Coll>(c: C, list: unknown[]): CollItem[C][] => list.map(SANITIZE[c]).filter(Boolean) as CollItem[C][];

/* ---------------- IndexedDB ---------------- */
interface BSDB extends DBSchema {
  doses: { key: string; value: Dose; indexes: { at: number } };
  kv: { key: string; value: unknown };
  meds: { key: string; value: Med };
  schedules: { key: string; value: Schedule };
  logs: { key: string; value: LogEntry };
  appointments: { key: string; value: Appointment };
}

class IDBStore implements Store {
  readonly kind = 'indexeddb' as const;
  constructor(private db: IDBPDatabase<BSDB>) {}
  async load(): Promise<Snapshot> {
    const tx = this.db.transaction(['doses', 'kv', 'meds', 'schedules', 'logs', 'appointments']);
    const [doses, meds, schedules, logs, appointments, profile, settings] = await Promise.all([
      tx.objectStore('doses').index('at').getAll(),
      tx.objectStore('meds').getAll(), tx.objectStore('schedules').getAll(),
      tx.objectStore('logs').getAll(), tx.objectStore('appointments').getAll(),
      tx.objectStore('kv').get('profile'), tx.objectStore('kv').get('settings')
    ]);
    return {
      doses: clean('doses', doses), meds: clean('meds', meds), schedules: clean('schedules', schedules),
      logs: clean('logs', logs), appointments: clean('appointments', appointments),
      profile: sanitizeProfile(profile), settings: sanitizeSettings(settings)
    };
  }
  async put<C extends Coll>(c: C, items: CollItem[C][]) {
    if (!items.length) return;
    const tx = this.db.transaction(c, 'readwrite');
    await Promise.all([...items.map(i => (tx.store as any).put(i)), tx.done]);
  }
  async del(c: Coll, ids: string[]) {
    if (!ids.length) return;
    const tx = this.db.transaction(c, 'readwrite');
    await Promise.all([...ids.map(id => tx.store.delete(id)), tx.done]);
  }
  async putProfile(p: Profile) { await this.db.put('kv', p, 'profile'); }
  async putSettings(s: Settings) { await this.db.put('kv', s, 'settings'); }
  async getFlag(key: string) { return !!(await this.db.get('kv', 'flag:' + key)); }
  async setFlag(key: string) { await this.db.put('kv', true, 'flag:' + key); }
  async clear() {
    const names = ['doses', 'kv', 'meds', 'schedules', 'logs', 'appointments'] as const;
    const tx = this.db.transaction([...names], 'readwrite');
    await Promise.all([...names.map(n => tx.objectStore(n).clear()), tx.done]);
  }
  putDose(d: Dose) { return this.put('doses', [d]); }
  putDoses(ds: Dose[]) { return this.put('doses', ds); }
  deleteDose(id: string) { return this.del('doses', [id]); }
}

/* ---------------- fallbacks ---------------- */
const LS_KEY = 'bloodstream.v3';
type Rec = { [C in Coll]: Record<string, CollItem[C]> } & { profile: Profile; settings: Settings; flags: Record<string, boolean> };
const emptyRec = (flags: Record<string, boolean> = {}): Rec => ({
  doses: {}, meds: {}, schedules: {}, logs: {}, appointments: {},
  profile: { ...DEFAULT_PROFILE }, settings: { ...DEFAULT_SETTINGS }, flags
});
class RecordStore implements Store {
  private data: Rec;
  constructor(readonly kind: 'localStorage' | 'memory') {
    this.data = emptyRec();
    if (kind === 'localStorage') {
      try { const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (raw) this.data = { ...this.data, ...raw }; } catch { /* start empty */ }
    }
  }
  private flush() { if (this.kind === 'localStorage') try { localStorage.setItem(LS_KEY, JSON.stringify(this.data)); } catch { /* quota or blocked */ } }
  async load(): Promise<Snapshot> {
    const v = <C extends Coll>(c: C) => clean(c, Object.values(this.data[c] || {}));
    return {
      doses: v('doses').sort((a, b) => a.at - b.at), meds: v('meds'), schedules: v('schedules'), logs: v('logs'), appointments: v('appointments'),
      profile: sanitizeProfile(this.data.profile), settings: sanitizeSettings(this.data.settings)
    };
  }
  async put<C extends Coll>(c: C, items: CollItem[C][]) {
    const bucket = (this.data[c] ||= {} as any) as Record<string, CollItem[C]>;
    items.forEach(i => { bucket[i.id] = i; });
    this.flush();
  }
  async del(c: Coll, ids: string[]) { const b = this.data[c] as Record<string, unknown>; ids.forEach(id => { delete b[id]; }); this.flush(); }
  async putProfile(p: Profile) { this.data.profile = p; this.flush(); }
  async putSettings(s: Settings) { this.data.settings = s; this.flush(); }
  async getFlag(k: string) { return !!this.data.flags[k]; }
  async setFlag(k: string) { this.data.flags[k] = true; this.flush(); }
  async clear() { this.data = emptyRec(this.data.flags); this.flush(); }
  putDose(d: Dose) { return this.put('doses', [d]); }
  putDoses(ds: Dose[]) { return this.put('doses', ds); }
  deleteDose(id: string) { return this.del('doses', [id]); }
}

/**
 * Opens IndexedDB, upgrading v1 → v2 by adding stores (existing data is never touched).
 * If another open tab holds the old version, the upgrade waits for it instead of silently
 * falling back to an empty store; `onBlocked` lets the UI ask the user to close it.
 */
export async function openStore(opts: { onBlocked?: () => void } = {}): Promise<Store> {
  if (typeof indexedDB === 'undefined') return fallbackStore();
  let blocked = false;
  try {
    const opening = openDB<BSDB>('bloodstream', DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const doses = db.createObjectStore('doses', { keyPath: 'id' });
          doses.createIndex('at', 'at');
          db.createObjectStore('kv');
        }
        if (oldVersion < 2) {
          db.createObjectStore('meds', { keyPath: 'id' });
          db.createObjectStore('schedules', { keyPath: 'id' });
          db.createObjectStore('logs', { keyPath: 'id' });
          db.createObjectStore('appointments', { keyPath: 'id' });
        }
      },
      blocked() { blocked = true; opts.onBlocked?.(); },
      // A newer version (another tab, after an update) needs this connection closed.
      blocking() { try { location.reload(); } catch { /* not in a browser */ } }
    });
    const timeout = new Promise<'timeout'>(res => setTimeout(() => res('timeout'), 8000));
    let result = await Promise.race([opening, timeout]);
    if (result === 'timeout') {
      if (!blocked) throw new Error('idb timeout');
      result = await opening;                       // wait for the other tab to let go
    }
    return new IDBStore(result as IDBPDatabase<BSDB>);
  } catch {
    return fallbackStore();
  }
}
function fallbackStore(): Store {
  try { localStorage.setItem('bloodstream.probe', '1'); localStorage.removeItem('bloodstream.probe'); return new RecordStore('localStorage'); }
  catch { return new RecordStore('memory'); }
}

/* ---------------- legacy import (single-file versions 1 and 2) ---------------- */
function readCookie(name: string): any {
  try { const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')); return m ? JSON.parse(decodeURIComponent(m[1])) : null; } catch { return null; }
}
function readLS(key: string): any { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }

/** One-time import of data saved by the single-file builds on this same site. */
export async function migrateLegacy(store: Store): Promise<number> {
  if (typeof window === 'undefined' || await store.getFlag('legacyImported')) return 0;
  const doses: Dose[] = [];
  let settings: Partial<Settings> = {}, profile: Profile | null = null;

  const v2 = readLS('bloodstream');
  const v2c = readCookie('bs2');
  if (v2 && v2.v === 2) {
    (v2.doses || []).forEach((d: any) => { const s = sanitizeDose(d); if (s) doses.push(s); });
    settings = { sleep: v2.sleep, seen: v2.seen };
    profile = sanitizeProfile(v2.profile);
  } else if (v2c && v2c.v === 2) {
    (v2c.d || []).forEach((x: any[]) => { const s = sanitizeDose({ id: x[0], type: x[1], mg: x[2], at: x[3], shape: x[4], mode: x[5], colors: { L: x[6], R: x[7] } }); if (s) doses.push(s); });
    settings = { sleep: v2c.s, seen: !!v2c.n };
    profile = sanitizeProfile({ band: v2c.p });
  } else {
    const v1 = readCookie('bs_dose') ?? readLS('bs_dose')?.v;
    if (v1) { const s = sanitizeDose({ ...v1, id: 'v1-' + v1.taken }); if (s) doses.push(s); settings = { seen: true }; }
  }

  if (doses.length) await store.putDoses(doses);
  if (profile) await store.putProfile(profile);
  if (Object.keys(settings).length) {
    const cur = (await store.load()).settings;
    await store.putSettings(sanitizeSettings({ ...cur, ...Object.fromEntries(Object.entries(settings).filter(([, v]) => v !== undefined)) }));
  }
  await store.setFlag('legacyImported');
  return doses.length;
}

/* ---------------- backups ---------------- */
/** 1 = doses/profile/settings (3.x). 2 = + meds, schedules, logs, appointments (4.0). */
export const BACKUP_FORMAT = 2;

export function makeBackup(s: Snapshot, now = Date.now()): string {
  return JSON.stringify({
    app: 'bloodstream', format: BACKUP_FORMAT, exportedAt: new Date(now).toISOString(),
    profile: s.profile, settings: s.settings, doses: s.doses,
    meds: s.meds, schedules: s.schedules, logs: s.logs, appointments: s.appointments
  }, null, 2);
}

export function parseBackup(text: string): Snapshot {
  let raw: any;
  const notOurs = 'That file isn\'t a Bloodstream backup. Pick the .json file you exported.';
  try { raw = JSON.parse(text); } catch { throw new Error(notOurs); }
  if (!raw || raw.app !== 'bloodstream' || !Array.isArray(raw.doses)) throw new Error(notOurs);
  if (Number(raw.format) > BACKUP_FORMAT) throw new Error('This backup comes from a newer version of Bloodstream. Update the app, then import it again.');
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    doses: clean('doses', raw.doses), meds: clean('meds', arr(raw.meds)), schedules: clean('schedules', arr(raw.schedules)),
    logs: clean('logs', arr(raw.logs)), appointments: clean('appointments', arr(raw.appointments)),
    profile: sanitizeProfile(raw.profile), settings: sanitizeSettings(raw.settings)
  };
}

export const backupFileName = (now = Date.now()) => {
  const d = new Date(now);
  return `bloodstream-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
};
