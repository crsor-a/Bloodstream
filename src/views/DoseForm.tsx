import { useMemo, useRef, useState } from 'preact/hooks';
import type { Band, Kind } from '../model/pk';
import type { ColorMode, PillLook, Shape } from '../model/types';
import { COLORS, DOSE_PRESETS, fmtMg, pillSVG } from '../lib/pill';
import { dayDiff, fmtTime, fmtWhen, HOUR, MIN, resolveFormTime, toHHMM } from '../lib/time';
import { doses, now, profile, regimen, settings, type NewDose } from '../state';
import { Segmented, Switch } from '../components/controls';

export interface FormResult { dose: NewDose; band: Band; shapeTouched: boolean; previewEl: HTMLElement | null; look: PillLook }

const DROP = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c0 0-6 6.5-6 10.5a6 6 0 0 0 12 0C18 9.5 12 3 12 3z" /></svg>;

function initial() {
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

export function DoseForm(p: { mode: 'onboard' | 'sheet'; onSubmit: (r: FormResult) => void }) {
  const init = useMemo(initial, []);
  const [kind, setKind] = useState<Kind>(init.kind);
  const [mg, setMg] = useState(init.mg);
  const [shape, setShape] = useState<Shape>(init.shape);
  const [shapeTouched, setShapeTouched] = useState(init.shapeTouched);
  const [mode, setMode] = useState<ColorMode>(init.mode);
  const [half, setHalf] = useState<'L' | 'R'>('L');
  const [colors, setColors] = useState(init.colors);
  const [planned, setPlanned] = useState(false);
  const [time, setTime] = useState(() => toHHMM(new Date()));
  const [band, setBand] = useState<Band>(profile.value.band);
  const previewRef = useRef<HTMLDivElement>(null);

  const look: PillLook = { shape, mode, colors: mode === 'whole' ? { L: colors.L, R: colors.L } : colors };
  const at = resolveFormTime(time, planned, now.value);
  const current = mode === 'halves' ? colors[half] : colors.L;

  const carry = useMemo(() => regimen.value.remainingMg(Date.now()), [regimen.value]);

  const changeKind = (k: Kind) => {
    setKind(k);
    if (!shapeTouched) setShape(k === 'XR' ? 'capsule' : 'round');
  };
  const changeMode = (m: ColorMode) => {
    setMode(m);
    if (m === 'halves' && colors.R === colors.L) setColors({ L: colors.L, R: colors.L === '#f4f3ef' ? '#4a8cf0' : '#f4f3ef' });
    if (m === 'whole') setColors({ L: colors.L, R: colors.L });
  };
  const applyColor = (c: string) => setColors(mode === 'whole' ? { L: c, R: c } : { ...colors, [half]: c });
  const togglePlanned = (v: boolean) => {
    setPlanned(v);
    if (v) { const d = new Date(Date.now() + HOUR); d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0); setTime(toHHMM(d)); }
    else setTime(toHHMM(new Date()));
  };
  const step = (dir: 1 | -1) => setMg(m => Math.min(60, Math.max(2.5, Math.round((m + dir * 2.5) / 2.5) * 2.5)));

  let dayNote = '';
  if (planned) dayNote = at <= Date.now() + MIN ? 'That is right now, so tracking starts immediately.' : `You'll see the full curve right away, and tracking starts ${fmtWhen(at, true)}.`;
  else if (dayDiff(at) !== 0) dayNote = `That time hasn't happened yet today, so it's logged as yesterday at ${fmtTime(at)}. Turn on Not taken yet to plan ahead instead.`;

  const submit = () => p.onSubmit({
    dose: { kind, mg, at, shape, mode, colors: look.colors },
    band, shapeTouched, previewEl: previewRef.current, look
  });

  return (
    <div>
      {carry >= 0.5 && <p class="carry">{DROP}<span>About {fmtMg(carry)} mg from earlier doses is still in your system. Bloodstream stacks it with this one.</span></p>}

      <div class="pill-stage">
        <div id="previewPill" ref={previewRef} role="button" tabIndex={0}
          aria-label={mode === 'halves' ? `Pill preview. Coloring the ${half === 'L' ? 'left' : 'right'} half. Press to switch halves.` : 'Pill preview'}
          onClick={e => { if (mode !== 'halves') return; const h = (e.target as Element).closest('[data-half]') as HTMLElement | null; if (h) setHalf(h.dataset.half as 'L' | 'R'); }}
          onKeyDown={e => { if (mode === 'halves' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setHalf(half === 'L' ? 'R' : 'L'); } }}
          dangerouslySetInnerHTML={{ __html: pillSVG(look, { sel: mode === 'halves' ? half : null }) }} />
        <p class="hint">{mode === 'halves' ? 'Tap a half, then pick its color' : 'Pick a color below'}</p>
      </div>

      <div class="group-label">Medication</div>
      <div class="card list">
        <div class="row col">
          <Segmented big label="Release type" value={kind} onChange={changeKind}
            options={[{ v: 'IR', label: 'IR', sub: 'Immediate release' }, { v: 'XR', label: 'XR', sub: 'Extended release' }]} />
          <p class="foot">{kind === 'IR'
            ? 'Tablet. Peaks around 3 hours after the dose and is usually felt for 4 to 6 hours.'
            : 'Capsule with two bead releases. Peaks around 7 hours and is usually felt for 8 to 12 hours.'}</p>
        </div>
        <div class="row col">
          <div class="row-head">
            <span>Dose</span>
            <div class="stepper">
              <button type="button" aria-label="Lower dose by 2.5 mg" onClick={() => step(-1)}>&minus;</button>
              <output aria-live="polite">{fmtMg(mg)} mg</output>
              <button type="button" aria-label="Raise dose by 2.5 mg" onClick={() => step(1)}>+</button>
            </div>
          </div>
          <div class="chips">
            {DOSE_PRESETS[kind].map(d => <button key={d} type="button" class={'chip' + (d === mg ? ' on' : '')} onClick={() => setMg(d)}>{fmtMg(d)} mg</button>)}
          </div>
        </div>
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

      {p.mode === 'onboard' && <>
        <div class="group-label">About you</div>
        <div class="card list">
          <div class="row col">
            <span class="row-label">Age group</span>
            <Segmented label="Age group" value={band} onChange={setBand}
              options={[{ v: 'child', label: '6 to 12' }, { v: 'teen', label: '13 to 17' }, { v: 'adult', label: '18+' }]} />
          </div>
        </div>
        <p class="foot pad">Age changes how quickly your body clears amphetamine, and the FDA label lists separate half-lives for kids, teens and adults. Sex isn't asked because the label found no direct effect.</p>
      </>}

      <div class="group-label">Appearance</div>
      <div class="card list">
        <div class="row col">
          <span class="row-label">Form</span>
          <Segmented label="Form" value={shape} onChange={s => { setShape(s); setShapeTouched(true); }}
            options={[{ v: 'capsule', label: 'Capsule' }, { v: 'round', label: 'Round tablet' }, { v: 'oval', label: 'Oval tablet' }]} />
        </div>
        <div class="row col">
          <span class="row-label">Color</span>
          <Segmented label="Color mode" value={mode} onChange={changeMode}
            options={[{ v: 'whole', label: 'Whole pill' }, { v: 'halves', label: 'Two halves' }]} />
          {mode === 'halves' && <Segmented small label="Half" value={half} onChange={setHalf}
            options={[{ v: 'L', label: 'Left half' }, { v: 'R', label: 'Right half' }]} />}
          <div class="swatches">
            {COLORS.map(([n, c]) => (
              <button key={c} type="button" class={'sw' + (c === 'clear' ? ' clear' : '') + (current === c ? ' on' : '')} aria-label={n} title={n}
                style={c === 'clear' ? undefined : { background: c }} onClick={() => applyColor(c)} />
            ))}
            <span class={'sw custom' + (COLORS.some(c => c[1] === current) ? '' : ' on')} title="Custom color">
              <input type="color" aria-label="Custom color" value={current.startsWith('#') ? current : '#7d7aff'} onInput={e => applyColor((e.target as HTMLInputElement).value)} />
            </span>
          </div>
        </div>
      </div>

      <button class="btn primary block" type="button" onClick={submit}>{p.mode === 'sheet' ? 'Add dose' : 'Start tracking'}</button>
    </div>
  );
}
