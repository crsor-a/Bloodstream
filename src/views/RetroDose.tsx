import { useEffect, useMemo, useState } from 'preact/hooks';
import { atOnDay, mostRecentTaken, startOfDay } from '../lib/calendar';
import { DOSE_PRESETS, fmtMg, pillSVG } from '../lib/pill';
import { fmtTime, HOUR, MIN, toHHMM } from '../lib/time';
import { fractionRemaining, type Kind } from '../model/pk';
import type { PillLook } from '../model/types';
import { addDose, doses, profile, retroDay, settings, showToast, sweepToken } from '../state';
import { Segmented, Sheet } from '../components/controls';

const DEFAULT_LOOK: Record<Kind, PillLook> = {
  XR: { shape: 'capsule', mode: 'whole', colors: { L: '#ff8f3a', R: '#ff8f3a' } },
  IR: { shape: 'round', mode: 'whole', colors: { L: '#f4f3ef', R: '#f4f3ef' } }
};
const longDay = (ts: number) => new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
const shortDay = (ts: number) => new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

/** The pill look from the latest dose of this kind, so a past dose looks like the real thing. */
function lookFor(kind: Kind): PillLook {
  const all = doses.value;
  for (let i = all.length - 1; i >= 0; i--) if (all[i].kind === kind) return all[i];
  const last = settings.value.last;
  return last && last.kind === kind ? last : DEFAULT_LOOK[kind];
}

function RetroForm({ day }: { day: number }) {
  const t0 = Date.now();
  const base = useMemo(() => mostRecentTaken(doses.value, t0), []);
  const isToday = startOfDay(t0) === day;
  const [kind, setKind] = useState<Kind>(base?.kind ?? settings.value.last?.kind ?? 'XR');
  const [mg, setMg] = useState<number>(base?.mg ?? settings.value.last?.mg ?? 20);
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(() => {
    const usual = base ? toHHMM(base.at) : '08:00';
    return isToday && atOnDay(day, usual) > t0 ? toHHMM(t0) : usual;
  });

  const look = lookFor(kind);
  const at = atOnDay(day, time);
  const now = Date.now();
  const future = at > now + MIN;
  const stillIn = !future && fractionRemaining(kind, (now - at) / HOUR, profile.value.band) >= 0.02;
  const nearby = doses.value.find(d => d.kind === kind && Math.abs(d.at - at) < 45 * MIN);
  const presets: number[] = [...DOSE_PRESETS[kind]];
  if (!presets.includes(mg)) presets.push(mg);

  const submit = () => {
    if (future) return;
    const d = addDose({ kind, mg, at, shape: look.shape, mode: look.mode, colors: look.colors }, { remember: false });
    retroDay.value = null;
    if (stillIn) sweepToken.value++;
    showToast(`Added ${d.kind} ${fmtMg(d.mg)} mg on ${shortDay(d.at)} at ${fmtTime(d.at)}`);
  };

  return (
    <div>
      <h2 class="sheet-intro">{isToday ? 'Earlier today' : longDay(day)}</h2>
      <p class="sheet-sub">{base ? 'Filled in from your most recent dose. Set the time you took it.' : 'Choose the dose and set the time you took it.'}</p>

      <div class="card retro-card">
        <div class="retro-dose">
          <div class="retro-pill" dangerouslySetInnerHTML={{ __html: pillSVG(look, { glow: false }) }} />
          <div class="dose-info">
            <b>{kind} · {fmtMg(mg)} mg</b>
            <span class="sub">{kind === 'XR' ? 'Extended release' : 'Immediate release'}{base && base.kind === kind && base.mg === mg ? ' · same as your last dose' : ''}</span>
          </div>
          <button type="button" class="pill-btn" aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Change'}</button>
        </div>
        {editing && (
          <div class="retro-edit">
            <Segmented label="Release type" value={kind} onChange={k => { setKind(k); if (!DOSE_PRESETS[k].includes(mg as never)) setMg(k === 'XR' ? 20 : 10); }}
              options={[{ v: 'IR', label: 'IR · Immediate' }, { v: 'XR', label: 'XR · Extended' }]} />
            <div class="chips">
              {presets.sort((a, b) => a - b).map(v => <button key={v} type="button" class={'chip' + (v === mg ? ' on' : '')} onClick={() => setMg(v)}>{fmtMg(v)} mg</button>)}
            </div>
          </div>
        )}
      </div>

      <div class="group-label">Time</div>
      <div class="card list">
        <div class="row">
          <label for="retroAt">Taken at</label>
          <input type="time" id="retroAt" value={time} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTime(v); }} />
        </div>
      </div>
      <p class={'foot pad' + (future ? ' warn' : '')}>
        {future
          ? 'That time hasn\'t happened yet. Pick an earlier time, or use the plus button to plan a dose.'
          : `Logged for ${shortDay(at)} at ${fmtTime(at)}. ` + (stillIn
            ? 'Some of it is still in your system, so your curve, sleep and effectivity will include it.'
            : 'It goes into your calendar and history.')}
        {!future && nearby && ` You already have a ${nearby.kind} ${fmtMg(nearby.mg)} mg dose at ${fmtTime(nearby.at)} that day.`}
      </p>

      <button class="btn primary block" type="button" disabled={future} style={future ? { opacity: 0.4 } : undefined} onClick={submit}>
        Add to {isToday ? 'today' : shortDay(day)}
      </button>
    </div>
  );
}

/** Bottom sheet for logging a dose on a past day from the full-screen calendar. */
export function RetroDoseSheet() {
  const day = retroDay.value;
  const [shownDay, setShownDay] = useState<number | null>(day);
  useEffect(() => { if (day !== null) setShownDay(day); }, [day]);
  return (
    <Sheet top open={day !== null} onClose={() => { retroDay.value = null; }} title="Past dose">
      {shownDay !== null && <RetroForm key={shownDay} day={shownDay} />}
    </Sheet>
  );
}
