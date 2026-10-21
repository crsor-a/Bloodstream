import { batch, computed, signal } from '@preact/signals';
import { Regimen } from './model/regimen';
import type { Band } from './model/pk';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, type Dose, type PillLook, type Profile, type Settings } from './model/types';
import { migrateLegacy, newId, openStore, type Snapshot, type Store } from './lib/storage';
import { DAY } from './lib/time';
import { APP_VERSION, CHANGELOG } from './changelog';

/* ---------------- signals ---------------- */
export const now = signal(Date.now());
export const doses = signal<Dose[]>([]);
export const profile = signal<Profile>(DEFAULT_PROFILE);
export const settings = signal<Settings>(DEFAULT_SETTINGS);
export const storeKind = signal<Store['kind']>('memory');
export const persisted = signal<boolean | null>(null);
export const view = signal<'loading' | 'onboard' | 'dash'>('loading');

export const regimen = computed(() => new Regimen(doses.value, profile.value.band, now.value, settings.value.resetAt));

/** UI coordination */
export const sweepToken = signal(0);           // bump to replay the pill fade sweep
export const flight = signal<{ rect: DOMRect; look: PillLook } | null>(null);
export const entering = signal(false);
export const sheetOpen = signal(false);
export const actionOpen = signal(false);
/** Full-screen calendar viewer: null = closed. */
export const calendarOpen = signal<{ scale: import('./lib/calendar').Scale; anchor: number; selected: number | null } | null>(null);
export const toast = signal<{ text: string; id: number } | null>(null);
/** True when this build has a changelog entry the user hasn't seen yet. */
export const whatsNew = signal(false);

let store: Store;
let toastTimer = 0;
export function showToast(text: string) {
  clearTimeout(toastTimer);
  toast.value = { text, id: Date.now() };
  toastTimer = window.setTimeout(() => { toast.value = null; }, 2400);
}

/* ---------------- boot + clock ---------------- */
const hasRecent = () => regimen.value.doses.some(d => d.at > Date.now() - DAY);

export async function boot() {
  store = await openStore();
  storeKind.value = store.kind;
  await migrateLegacy(store).catch(() => 0);
  const snap = await store.load();
  batch(() => {
    doses.value = snap.doses;
    profile.value = snap.profile;
    settings.value = snap.settings;
    now.value = Date.now();
  });
  view.value = hasRecent() ? 'dash' : 'onboard';
  if (settings.value.seenVersion !== APP_VERSION) {
    const returning = snap.doses.length > 0 || snap.settings.seen;
    if (returning) {
      whatsNew.value = true;
      setTimeout(() => showToast(`Updated to ${APP_VERSION}: ${CHANGELOG[0].title.toLowerCase()}`), 1200);
    } else saveSettings({ ...settings.value, seenVersion: APP_VERSION });
  }
  if (view.value === 'dash') sweepToken.value++;
  checkPersisted();

  const tick = () => {
    now.value = Date.now();
    if (view.value === 'dash' && regimen.value.empty) view.value = 'onboard';
  };
  setInterval(tick, 15_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}

async function checkPersisted() {
  try { persisted.value = navigator.storage?.persisted ? await navigator.storage.persisted() : null; } catch { persisted.value = null; }
}
export async function requestPersist() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) persisted.value = await navigator.storage.persist(); } catch { /* not supported */ }
}

/* ---------------- actions ---------------- */
function saveSettings(next: Settings) { settings.value = next; store.putSettings(next); }
function setDoses(next: Dose[]) { doses.value = [...next].sort((a, b) => a.at - b.at); }
/** Keep a dose visible if it is moved/added before the last "Start over". */
function keepVisible(at: number) { if (at <= settings.value.resetAt) saveSettings({ ...settings.value, resetAt: at - 1 }); }

export type NewDose = Omit<Dose, 'id' | 'created'>;
export function addDose(input: NewDose, opts: { band?: Band; shapeTouched?: boolean } = {}): Dose {
  const d: Dose = { ...input, id: newId(), created: Date.now(), colors: { L: input.colors.L, R: input.mode === 'whole' ? input.colors.L : input.colors.R } };
  batch(() => {
    keepVisible(d.at);
    setDoses([...doses.value, d]);
    saveSettings({ ...settings.value, seen: true, last: { kind: d.kind, mg: d.mg, shape: d.shape, mode: d.mode, colors: { ...input.colors }, shapeTouched: !!opts.shapeTouched } });
    if (opts.band && opts.band !== profile.value.band) { profile.value = { band: opts.band }; store.putProfile(profile.value); }
    now.value = Date.now();
  });
  store.putDose(d);
  requestPersist();
  return d;
}
export function setDoseTime(id: string, at: number) {
  const d = doses.value.find(x => x.id === id); if (!d) return;
  const next = { ...d, at };
  batch(() => { keepVisible(at); setDoses(doses.value.map(x => x.id === id ? next : x)); now.value = Date.now(); });
  store.putDose(next);
}
export function removeDose(id: string) {
  setDoses(doses.value.filter(x => x.id !== id));
  store.deleteDose(id);
  now.value = Date.now();
}
/** Stop tracking what's on screen. Past doses stay in history; planned ones are dropped. */
export function startOver() {
  const t = Date.now();
  const planned = doses.value.filter(d => d.at > t);
  planned.forEach(d => store.deleteDose(d.id));
  batch(() => {
    setDoses(doses.value.filter(d => d.at <= t));
    saveSettings({ ...settings.value, resetAt: t });
    view.value = 'onboard';
  });
}
export function markVersionSeen() {
  if (settings.value.seenVersion === APP_VERSION) return;
  saveSettings({ ...settings.value, seenVersion: APP_VERSION });
  whatsNew.value = false;
}
export function setSleep(v: string) { if (/^\d\d:\d\d$/.test(v)) saveSettings({ ...settings.value, sleep: v }); }

export function snapshot(): Snapshot { return { doses: doses.value, profile: profile.value, settings: settings.value }; }

export async function importSnapshot(snap: Snapshot): Promise<number> {
  const byId = new Map(doses.value.map(d => [d.id, d]));
  let added = 0;
  for (const d of snap.doses) { if (!byId.has(d.id)) added++; byId.set(d.id, d); }
  const merged = [...byId.values()];
  await store.putDoses(snap.doses);
  batch(() => {
    setDoses(merged);
    profile.value = snap.profile; store.putProfile(snap.profile);
    saveSettings({ ...snap.settings, seen: true, resetAt: Math.min(settings.value.resetAt || Infinity, snap.settings.resetAt || 0) });
    now.value = Date.now();
    if (hasRecent()) view.value = 'dash';
  });
  return added;
}
export async function deleteEverything() {
  await store.clear();
  batch(() => {
    doses.value = [];
    profile.value = DEFAULT_PROFILE;
    settings.value = { ...DEFAULT_SETTINGS, seen: true };
    view.value = 'onboard';
  });
  store.putSettings(settings.value);
}
