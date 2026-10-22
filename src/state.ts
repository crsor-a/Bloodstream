import { batch, computed, signal } from '@preact/signals';
import { Regimen } from './model/regimen';
import type { Band } from './model/pk';
import {
  DEFAULT_PROFILE, DEFAULT_SETTINGS,
  type AdjustPhase, type Appointment, type Dose, type LogEntry, type Med, type PillLook, type Profile, type Schedule, type Settings, type Theme
} from './model/types';
import { migrateLegacy, newId, openStore, type Coll, type CollItem, type Snapshot, type Store } from './lib/storage';
import { attentionSlots, pruneSkips, type Slot } from './model/schedule';
import { APP_VERSION } from './changelog';

/* ---------------- data signals ---------------- */
export const now = signal(Date.now());
export const doses = signal<Dose[]>([]);
export const meds = signal<Med[]>([]);
export const schedules = signal<Schedule[]>([]);
export const logs = signal<LogEntry[]>([]);
export const appointments = signal<Appointment[]>([]);
export const profile = signal<Profile>(DEFAULT_PROFILE);
export const settings = signal<Settings>(DEFAULT_SETTINGS);
export const storeKind = signal<Store['kind']>('memory');
export const persisted = signal<boolean | null>(null);
export const view = signal<'loading' | 'onboard' | 'dash'>('loading');
export const dbBlocked = signal(false);

export const regimen = computed(() => new Regimen(doses.value, profile.value.band, now.value));
/** Incognito hides anything that could reveal a condition or medication. */
export const incognito = computed(() => { const u = settings.value.incognitoUntil; return u === -1 || u > now.value; });
export const attention = computed(() => attentionSlots(now.value, schedules.value, meds.value, doses.value, settings.value.skips, settings.value.reminders.lead));
export const loggingOn = computed(() => settings.value.logging.enabled);

/* ---------------- UI coordination ---------------- */
export const sweepToken = signal(0);           // bump to replay the pill fade sweep
export const flight = signal<{ rect: DOMRect; look: PillLook } | null>(null);
export const entering = signal(false);
/** Add-dose sheet (plus button). `addPage` picks where it opens. */
export const sheetOpen = signal(false);
export const addPage = signal<'log' | 'plan'>('log');
/** Pre-selected slot when the sheet is opened from a schedule prompt. */
export const addSlot = signal<Slot | null>(null);
/** Past-dose sheet over the full-screen calendar: start of the chosen day, or null. */
export const retroDay = signal<number | null>(null);
/** Full-screen calendar viewer: null = closed. */
export const calendarOpen = signal<{ scale: import('./lib/calendar').Scale; anchor: number; selected: number | null } | null>(null);
/** Doctor-logging entry sheet; `editId` edits an existing entry. */
export const logSheet = signal<null | { editId?: string }>(null);
export type LibrarySection = 'entries' | 'articles' | 'appointments';
export const libraryOpen = signal<null | { section: LibrarySection }>(null);
/** Appointment editor sheet: null closed, id null = new. */
export const apptSheet = signal<null | { id: string | null }>(null);
/** Article reader. `entryId` shows the linked log entry; `back` is the reading history. */
export interface ReaderState { id: string; entryId?: string; back?: { id: string; entryId?: string }[] }
export const reader = signal<ReaderState | null>(null);
export const changelogOpen = signal(false);
export const incognitoSheet = signal(false);
/** Feature tours layered over the dashboard. */
export const tour = signal<null | 'upgrade' | 'logging'>(null);
/** Scroll target requested by a tour or banner (element id), consumed by the dashboard. */
export const scrollTarget = signal<string | null>(null);
export const toast = signal<{ text: string; id: number } | null>(null);
/** True when this build has a changelog entry the user hasn't seen yet. */
export const whatsNew = signal(false);

let store: Store;
let toastTimer = 0;
export function showToast(text: string) {
  clearTimeout(toastTimer);
  toast.value = { text, id: Date.now() };
  toastTimer = window.setTimeout(() => { toast.value = null; }, 2600);
}

/* ---------------- boot + clock ---------------- */
/** Onboarding is only for the first visit: once a dose has ever been logged, open the dashboard. */
const onboarded = () => doses.value.length > 0 || settings.value.seen;

function applySnapshot(snap: Snapshot) {
  doses.value = snap.doses;
  meds.value = snap.meds;
  schedules.value = snap.schedules;
  logs.value = [...snap.logs].sort((a, b) => b.created - a.created);
  appointments.value = [...snap.appointments].sort((a, b) => a.at - b.at);
  profile.value = snap.profile;
  settings.value = snap.settings;
}

export async function boot() {
  store = await openStore({ onBlocked: () => { dbBlocked.value = true; } });
  dbBlocked.value = false;
  storeKind.value = store.kind;
  await migrateLegacy(store).catch(() => 0);
  const snap = await store.load();
  batch(() => { applySnapshot(snap); now.value = Date.now(); });
  view.value = onboarded() ? 'dash' : 'onboard';
  if (settings.value.seenVersion !== APP_VERSION) {
    const returning = snap.doses.length > 0 || snap.settings.seen;
    if (returning) {
      whatsNew.value = true;
      setTimeout(() => showToast(`Updated to Bloodstream ${APP_VERSION}`), 1200);
    } else saveSettings({ ...settings.value, seenVersion: APP_VERSION });
  }
  const pruned = pruneSkips(settings.value.skips, Date.now());
  if (Object.keys(pruned).length !== Object.keys(settings.value.skips).length) saveSettings({ ...settings.value, skips: pruned });
  if (view.value === 'dash') sweepToken.value++;
  checkPersisted();

  const tick = () => { now.value = Date.now(); };
  setInterval(tick, 15_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}

async function checkPersisted() {
  try { persisted.value = navigator.storage?.persisted ? await navigator.storage.persisted() : null; } catch { persisted.value = null; }
}
export async function requestPersist() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) persisted.value = await navigator.storage.persist(); } catch { /* not supported */ }
}

/* ---------------- generic write helpers ---------------- */
function saveSettings(next: Settings) { settings.value = next; store.putSettings(next); }
export function patchSettings(patch: Partial<Settings>) { saveSettings({ ...settings.value, ...patch }); }
function setDoses(next: Dose[]) { doses.value = [...next].sort((a, b) => a.at - b.at); }
function upsert<C extends Exclude<Coll, 'doses'>>(c: C, item: CollItem[C]) {
  const sig = { meds, schedules, logs, appointments }[c] as unknown as { value: CollItem[C][] };
  const list = sig.value.filter(x => x.id !== item.id);
  list.push(item);
  if (c === 'logs') (list as LogEntry[]).sort((a, b) => b.created - a.created);
  if (c === 'appointments') (list as Appointment[]).sort((a, b) => a.at - b.at);
  sig.value = list;
  store.put(c, [item]);
}
function removeFrom(c: Exclude<Coll, 'doses'>, ids: string[]) {
  const sig = { meds, schedules, logs, appointments }[c] as unknown as { value: { id: string }[] };
  const drop = new Set(ids);
  sig.value = sig.value.filter(x => !drop.has(x.id));
  store.del(c, ids);
}

/* ---------------- doses ---------------- */
export type NewDose = Omit<Dose, 'id' | 'created'>;
/** `remember: false` (past doses) leaves the dose form's defaults alone. */
export function addDose(input: NewDose, opts: { band?: Band; shapeTouched?: boolean; remember?: boolean } = {}): Dose {
  const d: Dose = { ...input, id: newId(), created: Date.now(), colors: { L: input.colors.L, R: input.mode === 'whole' ? input.colors.L : input.colors.R } };
  if (!d.medId) delete d.medId;
  if (!d.scheduleId) delete d.scheduleId;
  batch(() => {
    setDoses([...doses.value, d]);
    saveSettings({ ...settings.value, seen: true, last: opts.remember === false ? settings.value.last : { kind: d.kind, mg: d.mg, shape: d.shape, mode: d.mode, colors: { ...input.colors }, shapeTouched: !!opts.shapeTouched } });
    if (opts.band && opts.band !== profile.value.band) { profile.value = { ...profile.value, band: opts.band }; store.putProfile(profile.value); }
    now.value = Date.now();
  });
  store.putDose(d);
  requestPersist();
  return d;
}
/** Logs a saved medication, optionally fulfilling a schedule slot. */
export function takeMed(med: Med, at = Date.now(), scheduleId?: string): Dose {
  return addDose({ kind: med.kind, mg: med.mg, at, shape: med.shape, mode: med.mode, colors: med.colors, medId: med.id, scheduleId }, { remember: false });
}
export function setDoseTime(id: string, at: number) {
  const d = doses.value.find(x => x.id === id); if (!d) return;
  const next = { ...d, at };
  batch(() => { setDoses(doses.value.map(x => x.id === id ? next : x)); now.value = Date.now(); });
  store.putDose(next);
}
export function removeDose(id: string) {
  setDoses(doses.value.filter(x => x.id !== id));
  store.deleteDose(id);
  now.value = Date.now();
}

/* ---------------- medications + schedules ---------------- */
export function saveMed(m: Omit<Med, 'id' | 'created'> & { id?: string; created?: number }): Med {
  const med: Med = { ...m, id: m.id || newId(), created: m.created || Date.now(), name: m.name.trim() || `${m.kind} ${m.mg} mg`,
    colors: { L: m.colors.L, R: m.mode === 'whole' ? m.colors.L : m.colors.R } };
  upsert('meds', med);
  return med;
}
/** Deleting a medication also deletes its schedules. Logged doses stay in history. */
export function deleteMed(id: string) {
  batch(() => {
    removeFrom('schedules', schedules.value.filter(s => s.medId === id).map(s => s.id));
    removeFrom('meds', [id]);
  });
}
export function saveSchedule(s: Omit<Schedule, 'id' | 'created'> & { id?: string; created?: number }): Schedule {
  const sch: Schedule = { ...s, id: s.id || newId(), created: s.created || Date.now(), days: [...new Set(s.days)].sort() };
  upsert('schedules', sch);
  return sch;
}
export function deleteSchedule(id: string) { removeFrom('schedules', [id]); }
export function skipSlot(slot: Slot) { saveSettings({ ...settings.value, skips: { ...settings.value.skips, [slot.key]: Date.now() } }); }
export function setReminders(patch: Partial<Settings['reminders']>) { saveSettings({ ...settings.value, reminders: { ...settings.value.reminders, ...patch } }); }

/* ---------------- logging library ---------------- */
export function setLogging(enabled: boolean, phase?: AdjustPhase | null) {
  saveSettings({ ...settings.value, logging: { enabled, phase: phase === undefined ? settings.value.logging.phase : phase } });
}
export function addLog(e: Omit<LogEntry, 'id' | 'created'>): LogEntry {
  const entry: LogEntry = { ...e, id: newId(), created: Date.now() };
  upsert('logs', entry);
  requestPersist();
  return entry;
}
export function updateLog(e: LogEntry) { upsert('logs', e); }
export function deleteLogs(ids: string[]) { removeFrom('logs', ids); }
export function saveAppointment(a: Omit<Appointment, 'id' | 'created'> & { id?: string; created?: number }): Appointment {
  const appt: Appointment = { ...a, id: a.id || newId(), created: a.created || Date.now() };
  upsert('appointments', appt);
  return appt;
}
export function deleteAppointment(id: string) { removeFrom('appointments', [id]); }
export function markAppointmentReviewed(id: string) {
  const a = appointments.value.find(x => x.id === id);
  if (a) upsert('appointments', { ...a, reviewed: true });
}

/* ---------------- profile, look, privacy ---------------- */
export function setBand(band: Band) {
  if (band === profile.value.band) return;
  profile.value = { ...profile.value, band };
  store.putProfile(profile.value);
}
export function setName(name: string) {
  const clean = name.replace(/\s+/g, ' ').trim().slice(0, 30);
  if (clean === profile.value.name) return;
  profile.value = { ...profile.value, name: clean };
  store.putProfile(profile.value);
}
export function setTheme(patch: Partial<Theme>) { saveSettings({ ...settings.value, theme: { ...settings.value.theme, ...patch } }); }
/** hours: number of hours, or -1 for "until I turn it off", or 0 to turn off. */
export function setIncognito(hours: number) {
  const until = hours === 0 ? 0 : hours === -1 ? -1 : Date.now() + hours * 3_600_000;
  batch(() => { saveSettings({ ...settings.value, incognitoUntil: until }); now.value = Date.now(); });
}
export function setSetupV4(v: Settings['setupV4']) { saveSettings({ ...settings.value, setupV4: v }); }
export function markVersionSeen() {
  if (settings.value.seenVersion === APP_VERSION) return;
  saveSettings({ ...settings.value, seenVersion: APP_VERSION });
  whatsNew.value = false;
}
export function setSleep(v: string) { if (/^\d\d:\d\d$/.test(v)) saveSettings({ ...settings.value, sleep: v }); }

/* ---------------- backup + reset ---------------- */
export function snapshot(): Snapshot {
  return { doses: doses.value, meds: meds.value, schedules: schedules.value, logs: logs.value, appointments: appointments.value, profile: profile.value, settings: settings.value };
}

/** Merges a backup into what's here (by id). Returns how many new doses it added. */
export async function importSnapshot(snap: Snapshot): Promise<number> {
  const merge = <T extends { id: string }>(cur: T[], inc: T[]) => { const m = new Map(cur.map(x => [x.id, x])); inc.forEach(x => m.set(x.id, x)); return [...m.values()]; };
  const added = snap.doses.filter(d => !doses.value.some(x => x.id === d.id)).length;
  await Promise.all([
    store.put('doses', snap.doses), store.put('meds', snap.meds), store.put('schedules', snap.schedules),
    store.put('logs', snap.logs), store.put('appointments', snap.appointments)
  ]);
  batch(() => {
    applySnapshot({
      doses: merge(doses.value, snap.doses).sort((a, b) => a.at - b.at),
      meds: merge(meds.value, snap.meds), schedules: merge(schedules.value, snap.schedules),
      logs: merge(logs.value, snap.logs), appointments: merge(appointments.value, snap.appointments),
      profile: { ...snap.profile, name: snap.profile.name || profile.value.name },
      settings: { ...snap.settings, seen: true, resetAt: 0, seenVersion: settings.value.seenVersion, incognitoUntil: 0 }
    });
    store.putProfile(profile.value);
    store.putSettings(settings.value);
    now.value = Date.now();
    view.value = 'dash';
  });
  return added;
}
export async function deleteEverything() {
  await store.clear();
  batch(() => {
    applySnapshot({ doses: [], meds: [], schedules: [], logs: [], appointments: [], profile: DEFAULT_PROFILE,
      // A full wipe is a fresh start, so the first-visit onboarding comes back.
      settings: { ...DEFAULT_SETTINGS, seenVersion: APP_VERSION, setupV4: 'done' } });
    view.value = 'onboard';
  });
  store.putSettings(settings.value);
}
