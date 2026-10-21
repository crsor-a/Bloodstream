/**
 * Local-first persistence.
 *
 * Primary: IndexedDB (database "bloodstream", v1) with two object stores:
 *   - doses: keyPath "id", index "at"  (full history; nothing is auto-deleted)
 *   - kv:    profile, settings, meta flags
 * Fallback: one localStorage record, then memory, for browsers where IndexedDB is unavailable.
 *
 * Schema changes go in `upgrade()` as new `if (oldVersion < N)` blocks. Never edit old blocks.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { isBand, isKind } from '../model/pk';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, isShape, type Dose, type Profile, type Settings } from '../model/types';

export interface Snapshot { doses: Dose[]; profile: Profile; settings: Settings }

export interface Store {
  readonly kind: 'indexeddb' | 'localStorage' | 'memory';
  load(): Promise<Snapshot>;
  putDose(d: Dose): Promise<void>;
  putDoses(ds: Dose[]): Promise<void>;
  deleteDose(id: string): Promise<void>;
  putProfile(p: Profile): Promise<void>;
  putSettings(s: Settings): Promise<void>;
  getFlag(key: string): Promise<boolean>;
  setFlag(key: string): Promise<void>;
  clear(): Promise<void>;
}

/* ---------------- validation ---------------- */
const hex = /^#[0-9a-f]{6}$/i;
const okColor = (c: unknown): c is string => c === 'clear' || (typeof c === 'string' && hex.test(c));

/** Accepts current records, v2 records ({type,...}) and backups. Returns null if unusable. */
export function sanitizeDose(raw: any): Dose | null {
  if (!raw || typeof raw !== 'object') return null;
  const kind = isKind(raw.kind) ? raw.kind : isKind(raw.type) ? raw.type : null;
  const mg = Number(raw.mg ?? raw.dose), at = Number(raw.at ?? raw.taken);
  if (!kind || !(mg > 0) || !(at > 0)) return null;
  const L = okColor(raw.colors?.L) ? raw.colors.L : '#ff8f3a';
  const R = okColor(raw.colors?.R) ? raw.colors.R : L;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    kind, mg: Math.min(100, Math.max(1, mg)), at,
    created: Number(raw.created) > 0 ? Number(raw.created) : at,
    shape: isShape(raw.shape) ? raw.shape : kind === 'XR' ? 'capsule' : 'round',
    mode: raw.mode === 'halves' ? 'halves' : 'whole',
    colors: { L, R: raw.mode === 'halves' ? R : L }
  };
}
export function sanitizeProfile(raw: any): Profile {
  return { band: isBand(raw?.band) ? raw.band : DEFAULT_PROFILE.band };
}
export function sanitizeSettings(raw: any): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS };
  if (typeof raw?.sleep === 'string' && /^\d\d:\d\d$/.test(raw.sleep)) s.sleep = raw.sleep;
  if (Number(raw?.resetAt) > 0) s.resetAt = Number(raw.resetAt);
  s.seen = !!raw?.seen;
  if (typeof raw?.seenVersion === 'string' && /^\d+\.\d+\.\d+$/.test(raw.seenVersion)) s.seenVersion = raw.seenVersion;
  const l = raw?.last;
  if (l && isKind(l.kind) && isShape(l.shape) && okColor(l.colors?.L)) {
    s.last = { kind: l.kind, mg: Number(l.mg) > 0 ? Number(l.mg) : 20, shape: l.shape, mode: l.mode === 'halves' ? 'halves' : 'whole',
      colors: { L: l.colors.L, R: okColor(l.colors.R) ? l.colors.R : l.colors.L }, shapeTouched: !!l.shapeTouched };
  }
  return s;
}
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------------- IndexedDB ---------------- */
interface BSDB extends DBSchema {
  doses: { key: string; value: Dose; indexes: { at: number } };
  kv: { key: string; value: unknown };
}

class IDBStore implements Store {
  readonly kind = 'indexeddb' as const;
  constructor(private db: IDBPDatabase<BSDB>) {}
  async load(): Promise<Snapshot> {
    const tx = this.db.transaction(['doses', 'kv']);
    const [doses, profile, settings] = await Promise.all([
      tx.objectStore('doses').index('at').getAll(),
      tx.objectStore('kv').get('profile'),
      tx.objectStore('kv').get('settings')
    ]);
    return { doses: doses.map(sanitizeDose).filter((d): d is Dose => !!d), profile: sanitizeProfile(profile), settings: sanitizeSettings(settings) };
  }
  async putDose(d: Dose) { await this.db.put('doses', d); }
  async putDoses(ds: Dose[]) { const tx = this.db.transaction('doses', 'readwrite'); await Promise.all([...ds.map(d => tx.store.put(d)), tx.done]); }
  async deleteDose(id: string) { await this.db.delete('doses', id); }
  async putProfile(p: Profile) { await this.db.put('kv', p, 'profile'); }
  async putSettings(s: Settings) { await this.db.put('kv', s, 'settings'); }
  async getFlag(key: string) { return !!(await this.db.get('kv', 'flag:' + key)); }
  async setFlag(key: string) { await this.db.put('kv', true, 'flag:' + key); }
  async clear() { const tx = this.db.transaction(['doses', 'kv'], 'readwrite'); await Promise.all([tx.objectStore('doses').clear(), tx.objectStore('kv').clear(), tx.done]); }
}

/* ---------------- fallbacks ---------------- */
const LS_KEY = 'bloodstream.v3';
class RecordStore implements Store {
  private data: { doses: Record<string, Dose>; profile: Profile; settings: Settings; flags: Record<string, boolean> };
  constructor(readonly kind: 'localStorage' | 'memory') {
    this.data = { doses: {}, profile: { ...DEFAULT_PROFILE }, settings: { ...DEFAULT_SETTINGS }, flags: {} };
    if (kind === 'localStorage') {
      try {
        const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
        if (raw) this.data = { ...this.data, ...raw };
      } catch { /* start empty */ }
    }
  }
  private flush() { if (this.kind === 'localStorage') try { localStorage.setItem(LS_KEY, JSON.stringify(this.data)); } catch { /* quota or blocked */ } }
  async load() {
    return {
      doses: Object.values(this.data.doses).map(sanitizeDose).filter((d): d is Dose => !!d).sort((a, b) => a.at - b.at),
      profile: sanitizeProfile(this.data.profile), settings: sanitizeSettings(this.data.settings)
    };
  }
  async putDose(d: Dose) { this.data.doses[d.id] = d; this.flush(); }
  async putDoses(ds: Dose[]) { ds.forEach(d => { this.data.doses[d.id] = d; }); this.flush(); }
  async deleteDose(id: string) { delete this.data.doses[id]; this.flush(); }
  async putProfile(p: Profile) { this.data.profile = p; this.flush(); }
  async putSettings(s: Settings) { this.data.settings = s; this.flush(); }
  async getFlag(k: string) { return !!this.data.flags[k]; }
  async setFlag(k: string) { this.data.flags[k] = true; this.flush(); }
  async clear() { this.data = { doses: {}, profile: { ...DEFAULT_PROFILE }, settings: { ...DEFAULT_SETTINGS }, flags: this.data.flags }; this.flush(); }
}

export async function openStore(): Promise<Store> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('no idb');
    const db = await Promise.race([
      openDB<BSDB>('bloodstream', 1, {
        upgrade(db, oldVersion) {
          if (oldVersion < 1) {
            const doses = db.createObjectStore('doses', { keyPath: 'id' });
            doses.createIndex('at', 'at');
            db.createObjectStore('kv');
          }
        }
      }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('idb timeout')), 4000))
    ]);
    return new IDBStore(db);
  } catch {
    try { localStorage.setItem('bloodstream.probe', '1'); localStorage.removeItem('bloodstream.probe'); return new RecordStore('localStorage'); }
    catch { return new RecordStore('memory'); }
  }
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
export const BACKUP_FORMAT = 1;

export function makeBackup(s: Snapshot, now = Date.now()): string {
  return JSON.stringify({ app: 'bloodstream', format: BACKUP_FORMAT, exportedAt: new Date(now).toISOString(), profile: s.profile, settings: s.settings, doses: s.doses }, null, 2);
}

export function parseBackup(text: string): Snapshot {
  let raw: any;
  try { raw = JSON.parse(text); } catch { throw new Error('That file isn\'t a Bloodstream backup. Pick the .json file you exported.'); }
  if (!raw || raw.app !== 'bloodstream' || !Array.isArray(raw.doses)) throw new Error('That file isn\'t a Bloodstream backup. Pick the .json file you exported.');
  if (Number(raw.format) > BACKUP_FORMAT) throw new Error('This backup comes from a newer version of Bloodstream. Update the app, then import it again.');
  return {
    doses: raw.doses.map(sanitizeDose).filter((d: Dose | null): d is Dose => !!d),
    profile: sanitizeProfile(raw.profile),
    settings: sanitizeSettings(raw.settings)
  };
}

export const backupFileName = (now = Date.now()) => {
  const d = new Date(now);
  return `bloodstream-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
};
