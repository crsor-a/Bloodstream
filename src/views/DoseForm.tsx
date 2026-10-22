import { useMemo, useRef, useState } from 'preact/hooks';
import type { Kind } from '../model/pk';
import type { ColorMode, PillLook, Shape } from '../model/types';
import { fmtMg } from '../lib/pill';
import { dayDiff, fmtTime, fmtWhen, HOUR, MIN, resolveFormTime, toHHMM } from '../lib/time';
import { doses, now, regimen, settings, type NewDose } from '../state';
import { Switch } from '../components/controls';
import { AppearanceRows, KindDoseRows, PillPreview, useMedDraft, type DraftInit } from '../components/PillEditor';

export interface FormResult { dose: NewDose; shapeTouched: boolean; previewEl: HTMLElement | null; look: PillLook; saveAs: string | null }

export const DROP = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c0 0-6 6.5-6 10.5a6 6 0 0 0 12 0C18 9.5 12 3 12 3z" /></svg>;

/** Starting values for a new dose: the last dose, else the last form values, else XR 20. */
export function initialDraft(): DraftInit {
  const last = settings.value.last;
  const prev = doses.value[doses.value.length - 1];
  const kind: Kind = prev?.kind ?? last?.kind ?? 'XR';
  const look = prev ?? last;
  return {
    kind, mg: prev?.mg ?? last?.mg ?? 20,
    shape: (look?.shape ?? (kind === 'XR' ? 'capsule' : 'round')) as Shape,
    mode: (look?.mode ?? 'whole') as ColorMode,
    colors: look ? { L: look.colors.L, R: look.colors.R } : { L: '#ff8f3a', R: '#ff8f3a' },
    shapeTouched: !!last?.shapeTouched
  };
}

/** One-off dose: any strength, any time, optionally saved as a medication for one-tap logging. */
export function DoseForm(p: { onSubmit: (r: FormResult) => void; submitLabel?: string; offerSave?: boolean }) {
  const init = useMemo(initialDraft, []);
  const draft = useMedDraft(init);
  const [planned, setPlanned] = useState(false);
  const [time, setTime] = useState(() => toHHMM(new Date()));
  const [save, setSave] = useState(false);
  const [name, setName] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const at = resolveFormTime(time, planned, now.value);
  const carry = useMemo(() => regimen.value.remainingMg(Date.now()), [regimen.value]);

  const togglePlanned = (v: boolean) => {
    setPlanned(v);
    if (v) { const d = new Date(Date.now() + HOUR); d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0); setTime(toHHMM(d)); }
    else setTime(toHHMM(new Date()));
  };

  let dayNote = '';
  if (planned) dayNote = at <= Date.now() + MIN ? 'That is right now, so tracking starts immediately.' : `You'll see the full curve right away, and tracking starts ${fmtWhen(at, true)}.`;
  else if (dayDiff(at) !== 0) dayNote = `That time hasn't happened yet today, so it's logged as yesterday at ${fmtTime(at)}. Turn on Not taken yet to plan ahead instead.`;

  const submit = () => p.onSubmit({
    dose: { kind: draft.kind, mg: draft.mg, at, ...draft.look },
    shapeTouched: draft.shapeTouched, previewEl: previewRef.current, look: draft.look,
    saveAs: save ? (name.trim() || `${draft.kind} ${fmtMg(draft.mg)} mg`) : null
  });

  return (
    <div>
      {carry >= 0.5 && <p class="carry">{DROP}<span>About {fmtMg(carry)} mg from earlier doses is still in your system. Bloodstream stacks it with this one.</span></p>}
      <PillPreview draft={draft} previewRef={previewRef} id="previewPill" />

      <div class="group-label">Medication</div>
      <div class="card list">
        <KindDoseRows draft={draft} />
        <div class="row">
          <div class="row-text"><label for="plannedSw">Not taken yet</label><small>Plan it for later and preview the curve</small></div>
          <Switch id="plannedSw" checked={planned} onChange={togglePlanned} />
        </div>
        <div class="row">
          <label for="takenAt">{planned ? 'Planned for' : 'Taken at'}</label>
          <div class="time-wrap">
            {!planned && <button type="button" class="mini" onClick={() => setTime(toHHMM(new Date()))}>Now</button>}
            <input type="time" id="takenAt" value={time} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTime(v); }} />
          </div>
        </div>
      </div>
      {dayNote && <p class="foot pad">{dayNote}</p>}

      <div class="group-label">Appearance</div>
      <div class="card list"><AppearanceRows draft={draft} /></div>

      {p.offerSave && <>
        <div class="group-label">Save for next time</div>
        <div class="card list">
          <div class="row">
            <div class="row-text"><label for="saveMedSw">Save as a medication</label><small>Log it with one tap from now on</small></div>
            <Switch id="saveMedSw" checked={save} onChange={setSave} />
          </div>
          {save && <div class="row"><label for="saveMedName">Name</label>
            <input class="text-input" id="saveMedName" type="text" maxLength={40} placeholder={`${draft.kind} ${fmtMg(draft.mg)} mg`} value={name}
              onInput={e => setName((e.target as HTMLInputElement).value)} /></div>}
        </div>
      </>}

      <button class="btn primary block" type="button" onClick={submit}>{p.submitLabel ?? 'Add dose'}</button>
    </div>
  );
}
