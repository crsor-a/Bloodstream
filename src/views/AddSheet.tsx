import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Med, Schedule } from '../model/types';
import { daysLabel, nextSlot, slotsOnDay, WEEKDAY_SHORT, type Slot } from '../model/schedule';
import { fmtMg, pillSVG } from '../lib/pill';
import { fmtTime, fmtWhen, HOUR, MIN, toHHMM } from '../lib/time';
import { buildICS } from '../lib/ics';
import { shareFile } from '../lib/share';
import { notifyState, requestNotify, type NotifyState } from '../lib/notify';
import {
  addDose, addPage, addSlot, deleteMed, deleteSchedule, doses, meds, now, saveMed, saveSchedule, schedules, setReminders,
  settings, sheetOpen, showToast, sweepToken, takeMed
} from '../state';
import { Segmented, Sheet, Switch } from '../components/controls';
import { AppearanceRows, KindDoseRows, PillPreview, useMedDraft } from '../components/PillEditor';
import { DoseForm, initialDraft, type FormResult } from './DoseForm';
import { Disclaimer } from './Header';

type Page =
  | { name: 'home' }
  | { name: 'other'; medId: string }
  | { name: 'custom' }
  | { name: 'med'; id: string | null; then?: 'schedule' }
  | { name: 'schedule'; id: string | null; medId?: string };

const TITLES: Record<Page['name'], string> = { home: 'Add dose', other: 'Other time', custom: 'One-off dose', med: 'Medication', schedule: 'Schedule' };

function close() { sheetOpen.value = false; addSlot.value = null; }
function logged(med: { kind: string; mg: number }, at: number) {
  close();
  sweepToken.value++;
  showToast(at > Date.now() + MIN ? `Planned ${med.kind} ${fmtMg(med.mg)} mg for ${fmtWhen(at, true)}` : `Logged ${med.kind} ${fmtMg(med.mg)} mg at ${fmtTime(at)}`);
}
/** Links a dose to a schedule slot of the same medication within 3 h on that day. */
function slotFor(med: Med, at: number): Slot | undefined {
  return slotsOnDay(at, schedules.value, meds.value).find(s => s.med.id === med.id && Math.abs(s.at - at) <= 3 * HOUR);
}

const Back = ({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) => (
  <button type="button" class="back sheet-back" onClick={onClick}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>{label}</button>
);
const Chevron = () => <span class="chev" aria-hidden="true" />;

/* ---------------- Log tab ---------------- */
function MedQuickRow({ med, onOther }: { med: Med; onOther: () => void }) {
  const t = now.value;
  const next = nextSlot(t, schedules.value.filter(s => s.medId === med.id), meds.value, doses.value, settings.value.skips);
  const due = next && Math.abs(next.at - t) <= 2 * HOUR;
  const take = () => { const at = Date.now(); const slot = slotFor(med, at); takeMed(med, at, slot?.schedule.id); logged(med, at); };
  return (
    <div class={'quick-row' + (due ? ' due' : '')}>
      <div class="mini-pill" dangerouslySetInnerHTML={{ __html: pillSVG(med, { glow: false }) }} />
      <div class="dose-info">
        <b>{med.name}</b>
        <span class="sub">{med.kind} · {fmtMg(med.mg)} mg{next ? ` · ${due ? 'due' : 'next'} ${fmtWhen(next.at, true, t)}` : ''}</span>
      </div>
      <div class="quick-actions">
        <button type="button" class="pill-btn solid" onClick={take}>Take now</button>
        <button type="button" class="pill-btn" onClick={onOther} aria-label={`Log ${med.name} at another time`}>Other time</button>
      </div>
    </div>
  );
}

function LogTab({ go }: { go: (p: Page) => void }) {
  const list = meds.value;
  const slot = addSlot.value;
  return (
    <div>
      {slot && (
        <div class="card slot-banner">
          <div class="mini-pill" dangerouslySetInnerHTML={{ __html: pillSVG(slot.med, { glow: false }) }} />
          <div class="dose-info"><b>{slot.med.name}</b><span class="sub">Scheduled for {fmtTime(slot.at)}</span></div>
          <div class="quick-actions">
            <button type="button" class="pill-btn solid" onClick={() => { takeMed(slot.med, slot.at, slot.schedule.id); logged(slot.med, slot.at); }}>At {fmtTime(slot.at)}</button>
            <button type="button" class="pill-btn" onClick={() => { const at = Date.now(); takeMed(slot.med, at, slot.schedule.id); logged(slot.med, at); }}>Just now</button>
          </div>
        </div>
      )}
      {list.length > 0 ? (
        <>
          <div class="group-label">Your medications</div>
          <div class="card">{list.map(m => <MedQuickRow key={m.id} med={m} onOther={() => go({ name: 'other', medId: m.id })} />)}</div>
        </>
      ) : (
        <div class="card empty-card">
          <b>Log your usual dose in one tap</b>
          <p>Save the medication you take, and add the times you take it if you'd like reminders. Then logging is a single tap.</p>
          <button type="button" class="pill-btn solid" onClick={() => { addPage.value = 'plan'; go({ name: 'med', id: null }); }}>Save a medication</button>
        </div>
      )}
      <div class="card list" style={{ marginTop: '12px' }}>
        <button type="button" class="list-btn first" onClick={() => go({ name: 'custom' })}><span>{list.length ? 'A different dose' : 'Log a dose'}<small class="block">Any release type, strength and time</small></span><Chevron /></button>
      </div>
    </div>
  );
}

function OtherTime({ med, go }: { med: Med; go: (p: Page) => void }) {
  const [dayOffset, setDayOffset] = useState(0);
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [time, setTime] = useState(() => toHHMM(new Date()));
  const base = dayOffset === 99 ? new Date(date + 'T12:00:00') : (() => { const d = new Date(); d.setDate(d.getDate() - dayOffset); return d; })();
  const [h, m] = time.split(':').map(Number);
  const at = new Date(base); at.setHours(h, m, 0, 0);
  const ts = at.getTime();
  const future = ts > Date.now() + MIN;
  const slot = slotFor(med, ts);
  const submit = () => { takeMed(med, ts, slot?.schedule.id); logged(med, ts); };
  return (
    <div>
      <Back onClick={() => go({ name: 'home' })} />
      <div class="card retro-card">
        <div class="retro-dose">
          <div class="retro-pill" dangerouslySetInnerHTML={{ __html: pillSVG(med, { glow: false }) }} />
          <div class="dose-info"><b>{med.name}</b><span class="sub">{med.kind} · {fmtMg(med.mg)} mg</span></div>
        </div>
      </div>
      <div class="group-label">Day</div>
      <div class="chips day-chips">
        {[['Today', 0], ['Yesterday', 1], ['2 days ago', 2]].map(([l, v]) => (
          <button key={v} type="button" class={'chip' + (dayOffset === v ? ' on' : '')} onClick={() => setDayOffset(v as number)}>{l}</button>
        ))}
        <button type="button" class={'chip' + (dayOffset === 99 ? ' on' : '')} onClick={() => setDayOffset(99)}>Pick a date</button>
      </div>
      {dayOffset === 99 && <div class="card list" style={{ marginTop: '10px' }}><div class="row"><label for="otherDate">Date</label>
        <input type="date" id="otherDate" value={date} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setDate(v); }} /></div></div>}
      <div class="group-label">Time</div>
      <div class="card list"><div class="row"><label for="otherAt">{future ? 'Planned for' : 'Taken at'}</label>
        <input type="time" id="otherAt" value={time} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTime(v); }} /></div></div>
      <p class="foot pad">{future
        ? `That's in the future, so it's saved as a planned dose for ${fmtWhen(ts, true)}. Tracking starts then.`
        : `Logged for ${fmtWhen(ts, true)}.`}{slot ? ` Counts as your ${fmtTime(slot.at)} scheduled dose.` : ''}</p>
      <button class="btn primary block" type="button" onClick={submit}>{future ? 'Plan this dose' : 'Log this dose'}</button>
    </div>
  );
}
const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* ---------------- Medications tab ---------------- */
function Reminders() {
  const r = settings.value.reminders;
  const [state, setState] = useState<NotifyState>(() => notifyState());
  const hasSchedules = schedules.value.some(s => s.reminder);
  const toggle = async (on: boolean) => {
    if (!on) { setReminders({ enabled: false }); return; }
    const s = await requestNotify();
    setState(s);
    setReminders({ enabled: true });
    if (s === 'denied') showToast('Notifications are off for Bloodstream in Settings');
  };
  const toCalendar = async () => {
    const text = buildICS(schedules.value, meds.value, { lead: r.lead, discreet: r.discreet });
    const res = await shareFile('bloodstream-schedule.ics', text, 'text/calendar');
    if (res !== 'cancelled') showToast('Open the file to add your schedule to Calendar');
  };
  const note = state === 'needs-install' ? 'On iPhone, notifications only work once Bloodstream is added to your Home Screen.'
    : state === 'denied' ? 'Notifications are blocked. Turn them on for Bloodstream in your device settings.'
    : state === 'unsupported' ? 'This browser can\'t show notifications.' : '';
  return (
    <>
      <div class="group-label">Reminders</div>
      <div class="card list">
        <div class="row">
          <div class="row-text"><label for="remSw">Remind me</label><small>A heads-up before each scheduled time, and a check-in if it isn't logged</small></div>
          <Switch id="remSw" checked={r.enabled} onChange={toggle} />
        </div>
        {r.enabled && <>
          <div class="row col">
            <span class="row-label">How early</span>
            <Segmented label="Reminder lead time" value={String(r.lead)} onChange={v => setReminders({ lead: Number(v) })}
              options={[{ v: '0', label: 'On time' }, { v: '5', label: '5 min' }, { v: '10', label: '10 min' }, { v: '15', label: '15 min' }, { v: '30', label: '30 min' }]} />
          </div>
          <div class="row">
            <div class="row-text"><label for="discSw">Discreet wording</label><small>Says "Reminder" without naming the medication</small></div>
            <Switch id="discSw" checked={r.discreet} onChange={v => setReminders({ discreet: v })} />
          </div>
        </>}
        <button type="button" class="list-btn" disabled={!hasSchedules} onClick={toCalendar}>
          <span>Add schedule to Calendar<small class="block">{hasSchedules ? 'Reliable alerts, even when Bloodstream is closed' : 'Add a schedule first'}</small></span><Chevron />
        </button>
      </div>
      <p class="foot pad">{note ? note + ' ' : ''}Websites can only send alerts while they're open or recently used, so Bloodstream also reminds you inside the app. For alerts you can count on when it's closed, add your schedule to the Calendar app.</p>
    </>
  );
}

function PlanTab({ go }: { go: (p: Page) => void }) {
  const list = meds.value, sch = schedules.value;
  const medName = (id: string) => list.find(m => m.id === id)?.name ?? 'Medication';
  return (
    <div>
      <div class="group-label">Saved medications</div>
      <div class="card list">
        {list.map((m, i) => (
          <button key={m.id} type="button" class={'list-btn med-btn' + (i === 0 ? ' first' : '')} onClick={() => go({ name: 'med', id: m.id })}>
            <span class="mini-pill" dangerouslySetInnerHTML={{ __html: pillSVG(m, { glow: false }) }} />
            <span class="grow"><b>{m.name}</b><small class="block">{m.kind} · {fmtMg(m.mg)} mg · {sch.filter(s => s.medId === m.id).length || 'no'} schedule{sch.filter(s => s.medId === m.id).length === 1 ? '' : 's'}</small></span>
            <Chevron />
          </button>
        ))}
        <button type="button" class={'add-row' + (list.length ? '' : ' first')} onClick={() => go({ name: 'med', id: null })}>
          <span class="plus"><span><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span></span>Add a medication
        </button>
      </div>

      <div class="group-label">Schedules</div>
      <div class="card list">
        {sch.sort((a, b) => a.time.localeCompare(b.time)).map((s, i) => (
          <button key={s.id} type="button" class={'list-btn' + (i === 0 ? ' first' : '')} onClick={() => go({ name: 'schedule', id: s.id })}>
            <span class="grow"><b>{fmtTime(new Date(`2000-01-01T${s.time}:00`).getTime())} · {daysLabel(s.days)}</b><small class="block">{medName(s.medId)}{s.reminder ? '' : ' · no reminder'}</small></span>
            <Chevron />
          </button>
        ))}
        <button type="button" class={'add-row' + (sch.length ? '' : ' first')} onClick={() => list.length ? go({ name: 'schedule', id: null }) : go({ name: 'med', id: null, then: 'schedule' })}>
          <span class="plus"><span><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span></span>Add a schedule
        </button>
      </div>
      <p class="foot pad">Schedules are the times you intend to take a medication. Bloodstream checks in when one comes due, and future days in the calendar show what's planned.</p>
      <Reminders />
    </div>
  );
}

function MedEditor({ id, then, go }: { id: string | null; then?: 'schedule'; go: (p: Page) => void }) {
  const existing = id ? meds.value.find(m => m.id === id) : undefined;
  const init = useMemo(() => existing ?? initialDraft(), []);
  const draft = useMedDraft({ ...init, shapeTouched: !!existing });
  const [name, setName] = useState(existing?.name ?? '');
  const [armed, setArmed] = useState(false);
  const own = schedules.value.filter(s => s.medId === id);
  const save = () => {
    const m = saveMed({ id: existing?.id, created: existing?.created, name, kind: draft.kind, mg: draft.mg, ...draft.look });
    showToast(existing ? 'Medication updated' : `Saved ${m.name}`);
    go(then === 'schedule' ? { name: 'schedule', id: null, medId: m.id } : { name: 'home' });
  };
  return (
    <div>
      <Back onClick={() => go({ name: 'home' })} />
      <PillPreview draft={draft} />
      <div class="group-label">Name</div>
      <div class="card list"><div class="row">
        <input class="text-input wide" id="medName" type="text" maxLength={40} aria-label="Medication name"
          placeholder={`e.g. Morning ${draft.kind}`} value={name} onInput={e => setName((e.target as HTMLInputElement).value)} />
      </div></div>
      <div class="group-label">Medication</div>
      <div class="card list"><KindDoseRows draft={draft} /></div>
      <div class="group-label">Appearance</div>
      <div class="card list"><AppearanceRows draft={draft} /></div>
      {existing && <>
        <div class="group-label">Schedules</div>
        <div class="card list">
          {own.map((s, i) => (
            <button key={s.id} type="button" class={'list-btn' + (i === 0 ? ' first' : '')} onClick={() => go({ name: 'schedule', id: s.id })}>
              <span class="grow"><b>{fmtTime(new Date(`2000-01-01T${s.time}:00`).getTime())}</b><small class="block">{daysLabel(s.days)}</small></span><Chevron />
            </button>
          ))}
          <button type="button" class={'add-row' + (own.length ? '' : ' first')} onClick={() => go({ name: 'schedule', id: null, medId: existing.id })}>
            <span class="plus"><span><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span></span>Add a time
          </button>
        </div>
      </>}
      <button class="btn primary block" type="button" onClick={save}>{existing ? 'Save changes' : then === 'schedule' ? 'Save and choose times' : 'Save medication'}</button>
      {existing && <button type="button" class="btn-text danger center" onClick={() => {
        if (!armed) { setArmed(true); return; }
        deleteMed(existing.id); showToast('Medication deleted'); go({ name: 'home' });
      }}>{armed ? 'Tap again to delete it and its schedules' : 'Delete medication'}</button>}
      <p class="foot pad">Editing a saved medication doesn't change doses you've already logged.</p>
    </div>
  );
}

function ScheduleEditor({ id, medId, go }: { id: string | null; medId?: string; go: (p: Page) => void }) {
  const existing = id ? schedules.value.find(s => s.id === id) : undefined;
  const [med, setMed] = useState<string>(existing?.medId ?? medId ?? meds.value[0]?.id ?? '');
  const [time, setTime] = useState(existing?.time ?? '08:00');
  const [days, setDays] = useState<number[]>(existing?.days ?? [1, 2, 3, 4, 5]);
  const [reminder, setReminder] = useState(existing?.reminder ?? true);
  const [armed, setArmed] = useState(false);
  const toggleDay = (d: number) => setDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort());
  const preset = (p: number[]) => setDays(p);
  const can = !!med && days.length > 0;
  const save = () => {
    if (!can) return;
    saveSchedule({ id: existing?.id, created: existing?.created, medId: med, time, days, reminder } as Schedule);
    showToast(existing ? 'Schedule updated' : 'Schedule added');
    go({ name: 'home' });
  };
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  return (
    <div>
      <Back onClick={() => go({ name: 'home' })} />
      <div class="group-label">Medication</div>
      <div class="chips">
        {meds.value.map(m => <button key={m.id} type="button" class={'chip' + (m.id === med ? ' on' : '')} onClick={() => setMed(m.id)}>{m.name}</button>)}
        <button type="button" class="chip" onClick={() => go({ name: 'med', id: null, then: 'schedule' })}>+ New medication</button>
      </div>
      <div class="group-label">Time</div>
      <div class="card list"><div class="row"><label for="schAt">Intended time</label>
        <input type="time" id="schAt" value={time} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTime(v); }} /></div></div>
      <div class="group-label">Days</div>
      <div class="card list">
        <div class="row col">
          <div class="chips tight">
            <button type="button" class={'chip' + (same(days, [1, 2, 3, 4, 5]) ? ' on' : '')} onClick={() => preset([1, 2, 3, 4, 5])}>Weekdays</button>
            <button type="button" class={'chip' + (same(days, [0, 6]) ? ' on' : '')} onClick={() => preset([0, 6])}>Weekends</button>
            <button type="button" class={'chip' + (days.length === 7 ? ' on' : '')} onClick={() => preset([0, 1, 2, 3, 4, 5, 6])}>Every day</button>
          </div>
          <div class="weekdays" role="group" aria-label="Days of the week">
            {WEEKDAY_SHORT.map((l, d) => <button key={d} type="button" aria-pressed={days.includes(d)} aria-label={l} class={'wd' + (days.includes(d) ? ' on' : '')} onClick={() => toggleDay(d)}>{l[0]}</button>)}
          </div>
        </div>
        <div class="row">
          <div class="row-text"><label for="schRem">Reminder</label><small>Uses your reminder settings</small></div>
          <Switch id="schRem" checked={reminder} onChange={setReminder} />
        </div>
      </div>
      {!days.length && <p class="foot pad warn">Pick at least one day.</p>}
      <button class="btn primary block" type="button" disabled={!can} style={can ? undefined : { opacity: 0.4 }} onClick={save}>{existing ? 'Save changes' : 'Add schedule'}</button>
      {existing && <button type="button" class="btn-text danger center" onClick={() => {
        if (!armed) { setArmed(true); return; }
        deleteSchedule(existing.id); showToast('Schedule deleted'); go({ name: 'home' });
      }}>{armed ? 'Tap again to delete' : 'Delete schedule'}</button>}
    </div>
  );
}

/* ---------------- sheet ---------------- */
export function AddSheet() {
  const open = sheetOpen.value;
  const [page, setPage] = useState<Page>({ name: 'home' });
  const [gen, setGen] = useState(0);
  useEffect(() => { if (open) { setPage({ name: 'home' }); setGen(g => g + 1); } }, [open]);
  const go = (p: Page) => { setPage(p); const el = document.querySelector('.overlay.add .sheet'); if (el) el.scrollTop = 0; };

  const onCustom = (r: FormResult) => {
    let medId: string | undefined;
    if (r.saveAs) medId = saveMed({ name: r.saveAs, kind: r.dose.kind, mg: r.dose.mg, ...r.look }).id;
    const d = addDose({ ...r.dose, medId }, { shapeTouched: r.shapeTouched });
    logged(d, d.at);
  };

  return (
    <Sheet open={open} onClose={close} title={page.name === 'home' ? TITLES.home : TITLES[page.name]} cls="add">
      <div key={gen}>
        {page.name === 'home' && <>
          <Segmented label="Add dose sections" value={addPage.value} onChange={v => { addPage.value = v; }}
            options={[{ v: 'log', label: 'Log a dose' }, { v: 'plan', label: 'Medications' }]} />
          {addPage.value === 'log' ? <LogTab go={go} /> : <PlanTab go={go} />}
          <Disclaimer onboarding />
        </>}
        {page.name === 'other' && (() => { const m = meds.value.find(x => x.id === page.medId); return m ? <OtherTime med={m} go={go} /> : null; })()}
        {page.name === 'custom' && <><Back onClick={() => go({ name: 'home' })} /><DoseForm onSubmit={onCustom} offerSave /><Disclaimer onboarding /></>}
        {page.name === 'med' && <MedEditor key={page.id ?? 'new'} id={page.id} then={page.then} go={go} />}
        {page.name === 'schedule' && <ScheduleEditor key={(page.id ?? 'new') + (page.medId ?? '')} id={page.id} medId={page.medId} go={go} />}
      </div>
    </Sheet>
  );
}
