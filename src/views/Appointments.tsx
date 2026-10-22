import { useEffect, useState } from 'preact/hooks';
import type { Appointment } from '../model/types';
import { DAY, fmtTime } from '../lib/time';
import { buildAppointmentICS } from '../lib/ics';
import { shareFile } from '../lib/share';
import { exportBackup } from '../lib/exportData';
import {
  addPage, appointments, apptSheet, deleteAppointment, incognito, libraryOpen, markAppointmentReviewed, now, saveAppointment,
  scrollTarget, sheetOpen, showToast
} from '../state';
import { Sheet } from '../components/controls';

export const VISIT_TYPES = ['Follow-up', 'Dose check', 'New prescriber', 'Telehealth', 'Other'];

/** Upcoming appointment within the next 30 days. */
export function upcomingAppt(list: Appointment[], t: number): Appointment | undefined {
  return list.find(a => a.at > t && a.at - t <= 30 * DAY);
}
/** Most recent appointment in the last 14 days that hasn't been reviewed. */
export function reviewAppt(list: Appointment[], t: number): Appointment | undefined {
  return [...list].reverse().find(a => a.at <= t && t - a.at <= 14 * DAY && !a.reviewed);
}

export function apptWhen(a: Appointment, withTime = true) {
  const d = new Date(a.at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return withTime ? `${d} at ${fmtTime(a.at)}` : d;
}
export function untilWords(at: number, t: number): string {
  const days = Math.round((startOf(at) - startOf(t)) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `in ${days} days`;
  const w = Math.round(days / 7);
  if (days < 28) return w === 1 ? 'in about a week' : `in about ${w} weeks`;
  return 'in about a month';
}
const startOf = (ts: number) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function CalIcon({ at }: { at: number }) {
  const d = new Date(at);
  return (
    <span class="cal-icon" aria-hidden="true">
      <small>{d.toLocaleDateString([], { month: 'short' }).toUpperCase()}</small>
      <b>{d.getDate()}</b>
    </span>
  );
}

const Link = ({ onClick, children }: { onClick: () => void; children: string }) => <button type="button" class="u-link" onClick={onClick}>{children}</button>;

/** Dashboard section under the hero: shows ahead of an appointment, then asks how it went. */
export function AppointmentBanner() {
  if (incognito.value) return null;
  const t = now.value, list = appointments.value;
  const up = upcomingAppt(list, t), past = reviewAppt(list, t);
  const a = past ?? up;
  if (!a) return null;
  const openLib = (section: 'entries' | 'appointments') => { libraryOpen.value = { section }; };
  if (a === past) return (
    <section class="appt-banner review reveal" style={{ '--d': 3 } as any} aria-label="After your appointment">
      <CalIcon at={a.at} />
      <div class="appt-copy">
        <b>How did the appointment go?</b>
        <p>You can clear the entries you covered from <Link onClick={() => openLib('entries')}>your logging library</Link>, so the next list starts fresh.</p>
        <p>If your dose or timing changed, update your <Link onClick={() => { addPage.value = 'plan'; sheetOpen.value = true; }}>saved medications and schedules</Link>.</p>
        <p class="appt-fine">Stopped taking Adderall after talking with your doctor? <Link onClick={exportBackup}>Export your data</Link> first, then delete it from <Link onClick={() => { scrollTarget.value = 'hData'; }}>Data & information controls</Link>.</p>
        <button type="button" class="pill-btn" onClick={() => { markAppointmentReviewed(a.id); showToast('Marked as done'); }}>Done</button>
      </div>
    </section>
  );
  return (
    <section class="appt-banner reveal" style={{ '--d': 3 } as any} aria-label="Upcoming appointment">
      <CalIcon at={a.at} />
      <div class="appt-copy">
        <b>An appointment is {untilWords(a.at, t)}</b>
        <span class="appt-meta">{apptWhen(a)}{a.doctor ? ` · ${a.doctor}` : ''}{a.visit ? ` · ${a.visit}` : ''}</span>
        <p>Keep an eye on how your medication is working, any side effects, behaviors and questions, and add them to <Link onClick={() => openLib('entries')}>your logging library</Link>.</p>
      </div>
    </section>
  );
}

const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const toHHMM = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function AppointmentForm({ id, onDone, compact }: { id: string | null; onDone: (a: Appointment | null) => void; compact?: boolean }) {
  const existing = id ? appointments.value.find(a => a.id === id) : undefined;
  const start = existing ? new Date(existing.at) : (() => { const d = new Date(Date.now() + 14 * DAY); d.setHours(10, 0, 0, 0); return d; })();
  const [date, setDate] = useState(toISODate(start));
  const [time, setTime] = useState(toHHMM(start));
  const [doctor, setDoctor] = useState(existing?.doctor ?? '');
  const [visit, setVisit] = useState(existing?.visit ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [armed, setArmed] = useState(false);
  const at = new Date(`${date}T${time || '09:00'}:00`).getTime();
  const valid = !Number.isNaN(at);
  const save = () => {
    if (!valid) return;
    const a = saveAppointment({ id: existing?.id, created: existing?.created, at, doctor: doctor.trim().slice(0, 60), visit, notes: notes.trim().slice(0, 500), reviewed: existing ? existing.reviewed && at < Date.now() : false });
    showToast(existing ? 'Appointment updated' : 'Appointment added');
    onDone(a);
  };
  return (
    <div>
      <div class="group-label">When</div>
      <div class="card list">
        <div class="row"><label for="apDate">Date</label><input type="date" id="apDate" value={date} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setDate(v); }} /></div>
        <div class="row"><label for="apTime">Time</label><input type="time" id="apTime" value={time} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTime(v); }} /></div>
      </div>
      <div class="group-label">Details (optional)</div>
      <div class="card list">
        <div class="row"><input class="text-input wide" type="text" maxLength={60} aria-label="Doctor or clinic" placeholder="Doctor or clinic" value={doctor} onInput={e => setDoctor((e.target as HTMLInputElement).value)} /></div>
        <div class="row col">
          <span class="row-label">Visit type</span>
          <div class="chips tight">{VISIT_TYPES.map(v => <button key={v} type="button" class={'chip' + (visit === v ? ' on' : '')} onClick={() => setVisit(visit === v ? '' : v)}>{v}</button>)}</div>
        </div>
        {!compact && <div class="row"><textarea class="text-area bare" rows={2} maxLength={500} aria-label="Notes" placeholder="Notes" value={notes} onInput={e => setNotes((e.target as HTMLTextAreaElement).value)} /></div>}
      </div>
      <button class="btn primary block" type="button" disabled={!valid} onClick={save}>{existing ? 'Save changes' : 'Add appointment'}</button>
      {existing && <>
        <button type="button" class="btn-text center" onClick={async () => {
          const r = await shareFile('appointment.ics', buildAppointmentICS(existing), 'text/calendar');
          if (r !== 'cancelled') showToast('Open the file to add it to Calendar');
        }}>Add to Calendar</button>
        <button type="button" class="btn-text danger center" onClick={() => { if (!armed) { setArmed(true); return; } deleteAppointment(existing.id); showToast('Appointment deleted'); onDone(null); }}>
          {armed ? 'Tap again to delete' : 'Delete appointment'}
        </button>
      </>}
    </div>
  );
}

export function AppointmentSheet() {
  const st = apptSheet.value;
  const [gen, setGen] = useState(0);
  useEffect(() => { if (st) setGen(g => g + 1); }, [!!st, st?.id]);
  return (
    <Sheet open={!!st} onClose={() => { apptSheet.value = null; }} title={st?.id ? 'Appointment' : 'New appointment'} top>
      <h2 class="sheet-intro">{st?.id ? 'Appointment' : 'Add an appointment'}</h2>
      <p class="sheet-sub">A few weeks before, Bloodstream reminds you to start noting effects and questions. Afterward, it helps you tidy up.</p>
      <AppointmentForm key={gen} id={st?.id ?? null} onDone={() => { apptSheet.value = null; }} />
    </Sheet>
  );
}
