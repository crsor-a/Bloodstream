import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Band } from '../model/pk';
import type { AdjustPhase, PillLook } from '../model/types';
import { fmtMg, pillSVG } from '../lib/pill';
import { fmtWhen, greeting, HOUR, resolveFormTime, toHHMM } from '../lib/time';
import { WEEKDAY_SHORT } from '../model/schedule';
import { effect, level } from '../model/pk';
import {
  entering, flight, patchSettings, saveMed, saveSchedule, setBand, setBody, setLogging, setName, setReminders, settings, takeMed, view
} from '../state';
import { BAND_OPTIONS } from '../model/copy';
import { defaultUnits, parseWeight, type WeightUnits } from '../lib/units';
import { prefersReducedMotion, Segmented, Switch } from '../components/controls';
import { AppearanceRows, KindDoseRows, PillPreview, useMedDraft } from '../components/PillEditor';
import { ZoneScale } from '../components/Visuals';
import { requestNotify } from '../lib/notify';
import { initialDraft } from './DoseForm';
import { Disclaimer, ICONS } from './Header';
import { HowLoggingWorks, PhaseChoice } from './LoggingTour';

const DEFAULT_LOOK: PillLook = { shape: 'capsule', mode: 'whole', colors: { L: '#ff8f3a', R: '#ff8f3a' } };
const PAGES = 8;

const Ic = ({ d }: { d: string }) => <span class="ic"><svg viewBox="0 0 24 24"><path d={d} /></svg></span>;

/** Animated sample curve for the "how it works" page. */
function SampleCurve() {
  const W = 320, H = 130, N = 120;
  const X = (t: number) => 8 + t / 18 * (W - 16), Y = (v: number) => 12 + (1 - v / 1.05) * (H - 30);
  let dl = '', de = '';
  for (let i = 0; i <= N; i++) { const t = i / N * 18; dl += (i ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(level('XR', t)).toFixed(1); de += (i ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(effect('XR', 20, t)).toFixed(1); }
  return (
    <svg class="ob-curve" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <line x1="8" x2={W - 8} y1={Y(0)} y2={Y(0)} class="g-base" />
      <path d={dl + `L${X(18)},${Y(0)}L${X(0)},${Y(0)}Z`} fill="rgba(255,255,255,.1)" class="ob-area" />
      <path d={dl} class="g-line ob-draw" />
      <path d={de} class="g-eff ob-draw d2" />
      <circle cx={X(5)} cy={Y(level('XR', 5))} r="6" fill="#fff" stroke="#000" stroke-width="2.5" class="ob-dot" />
    </svg>
  );
}

export function Onboarding() {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [leaving, setLeaving] = useState(false);
  // Everything is held here and only saved at the end, so backing out leaves no half-finished setup.
  const [name, setNameV] = useState('');
  const [band, setBandV] = useState<Band>('adult');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState<WeightUnits>(defaultUnits);
  const kg = parseWeight(weight, units);
  const badWeight = Number.isNaN(kg);
  const init = useMemo(initialDraft, []);
  const draft = useMedDraft(init);
  const [medName, setMedName] = useState('');
  const [wantSchedule, setWantSchedule] = useState(true);
  const [time, setTime] = useState('08:00');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [remind, setRemind] = useState(false);
  const [logOn, setLogOn] = useState(false);
  const [phase, setPhase] = useState<AdjustPhase | null>(null);
  const [today, setToday] = useState<'taken' | 'plan' | 'skip'>('taken');
  const [takenAt, setTakenAt] = useState(() => toHHMM(new Date()));
  const [planAt, setPlanAt] = useState(() => { const d = new Date(Date.now() + HOUR); d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0); return toHHMM(d); });
  const pillRef = useRef<HTMLDivElement>(null);
  const welcomeLook = settings.value.last ?? DEFAULT_LOOK;

  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  const go = (n: number) => { setDir(n > page ? 1 : -1); setPage(n); };
  const next = () => go(page + 1);
  const label = medName.trim() || `${draft.kind} ${fmtMg(draft.mg)} mg`;
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  const toggleDay = (d: number) => setDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort());

  const finish = () => {
    setName(name); setBand(band);
    setBody({ units, ...(kg != null && !badWeight ? { weightKg: kg } : {}) });
    const med = saveMed({ name: label, kind: draft.kind, mg: draft.mg, ...draft.look });
    if (wantSchedule && days.length) {
      saveSchedule({ medId: med.id, time, days, reminder: true });
      if (remind) setReminders({ enabled: true });
    }
    if (logOn) setLogging(true, phase ?? 'unsure');
    patchSettings({ seen: true, setupV4: 'done', last: { kind: draft.kind, mg: draft.mg, ...draft.look, shapeTouched: draft.shapeTouched } });
    if (today !== 'skip') {
      const at = today === 'taken' ? resolveFormTime(takenAt, false) : resolveFormTime(planAt, true);
      takeMed(med, at);
      const rect = pillRef.current?.getBoundingClientRect();
      if (rect) flight.value = { rect, look: draft.look };
    }
    setLeaving(true);
    setTimeout(() => { entering.value = today !== 'skip'; view.value = 'dash'; }, prefersReducedMotion() ? 0 : 280);
  };

  const Foot = ({ cta = 'Continue', onClick = next, disabled = false, alt }: { cta?: string; onClick?: () => void; disabled?: boolean; alt?: { label: string; onClick: () => void } }) => (
    <div class="ob-foot">
      <button class="btn primary block" type="button" disabled={disabled} style={disabled ? { opacity: 0.4 } : undefined} onClick={onClick}>{cta}</button>
      {alt && <button class="btn-text center" type="button" onClick={alt.onClick}>{alt.label}</button>}
    </div>
  );

  return (
    <section id="onboard" class={'arrive' + (leaving ? ' leaving' : '')} aria-label="Welcome to Bloodstream">
      <div class="ob-head">
        {page > 0 ? <button class="back" type="button" onClick={() => go(page - 1)}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>Back</button> : <span />}
        <div class="dots" aria-label={`Step ${page + 1} of ${PAGES}`}>{Array.from({ length: PAGES }, (_, i) => <i key={i} class={i === page ? 'on' : i < page ? 'done' : ''} />)}</div>
        <span />
      </div>

      <div key={page} class={'ob-page ' + (dir > 0 ? 'from-right' : 'from-left')}>
        {page === 0 && <>
          <div class="ob1-art"><div id="welcomePill" class="float" dangerouslySetInnerHTML={{ __html: pillSVG(welcomeLook) }} /></div>
          <p class="eyebrow">{greeting()}</p>
          <h1 class="ob-title">Welcome to Bloodstream.</h1>
          <p class="ob-sub">A private tracker for <b>Adderall and its generic versions</b> (mixed amphetamine salts, IR and XR), made for people keeping track of their ADHD treatment.</p>
          <div class="ob-scope">
            <div><b>What it does</b><ul>
              <li>Shows where your dose is in your bloodstream, hour by hour</li>
              <li>Estimates how strong it feels across twelve areas, from focus to sleep</li>
              <li>Keeps saved medications, schedules and reminders</li>
              <li>Helps you log side effects and questions for your doctor</li>
            </ul></div>
            <div><b>What it isn't</b><ul>
              <li>For any other medication, including other stimulants</li>
              <li>A measurement: everything is estimated from published averages</li>
              <li>Medical advice, and it never suggests or adjusts doses</li>
            </ul></div>
          </div>
          <Disclaimer onboarding />
          <Foot cta="I understand" />
        </>}

        {page === 1 && <>
          <p class="eyebrow">How it works</p>
          <h1 class="ob-title sm">Your dose, mapped to your clock</h1>
          <div class="ob-art-card"><SampleCurve /><div class="legend"><span><i class="lg-solid" />Blood level</span><span><i class="lg-dash" />Felt effect</span></div></div>
          <ul class="ob-points">
            <li><Ic d="M3 17c3 0 4-9 7-9s3 6 5 6 2-3 6-3" /><div><strong>Live curve</strong><span>Log a dose and the curve starts moving. Drag through it to see any hour. Doses stack, and leftovers from yesterday count.</span></div></li>
            <li><Ic d="M4 6h16M4 12h10M4 18h13" /><div><strong>Effectivity zones</strong><span>Twelve areas, each in one of seven zones from red baseline to green full effect. Tap one for an article that adapts to where you are.</span></div></li>
            <li><Ic d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /><div><strong>Sleep check</strong><span>How much is still active at your planned bedtime.</span></div></li>
          </ul>
          <div class="ob-zone-demo"><ZoneScale kind="focus" marker={0.62} /></div>
          <Foot />
        </>}

        {page === 2 && <>
          <p class="eyebrow">About you</p>
          <h1 class="ob-title sm">A couple of basics</h1>
          <div class="group-label">Name <span class="opt">optional</span></div>
          <div class="card"><input class="text-input wide field" type="text" maxLength={30} autoComplete="given-name" placeholder="What should Bloodstream call you?" value={name} onInput={e => setNameV((e.target as HTMLInputElement).value)} aria-label="Name" /></div>
          <p class="foot pad">Used for the greeting at the top of your dashboard, which changes through the day{name.trim() ? `, like "Good evening, ${name.trim()}."` : '.'}</p>
          <div class="group-label">Age group</div>
          <Segmented label="Age group" value={band} onChange={setBandV} options={BAND_OPTIONS} />
          <p class="foot pad">Sets how quickly your body clears each dose, from the half-lives on the FDA label.{band === 'senior' ? ' Older adults weren\'t studied, so 65+ uses adult values with a wider range.' : ''}</p>
          <div class="group-label">Weight <span class="opt">optional</span></div>
          <div class="card list"><div class="row">
            <input class="text-input wide field ob-weight" type="text" inputMode="decimal" placeholder={units === 'lb' ? 'e.g. 160' : 'e.g. 72'} value={weight}
              onInput={e => setWeight((e.target as HTMLInputElement).value)} aria-label={`Weight in ${units}`} />
            <div class="pz-units"><Segmented label="Weight units" value={units} onChange={setUnits} options={[{ v: 'kg', label: 'kg' }, { v: 'lb', label: 'lb' }]} /></div>
          </div></div>
          <p class={'foot pad' + (badWeight ? ' warn' : '')}>{badWeight
            ? (units === 'lb' ? 'Enter a weight between 33 and 550 lb, or leave it empty.' : 'Enter a weight between 15 and 250 kg, or leave it empty.')
            : 'Weight is the main reason levels differ between people. It fine-tunes clearance and the ng/mL estimate. Kidney function, diet and other medicines can be added later under Body & medicines.'}</p>
          <Foot disabled={badWeight} />
        </>}

        {page === 3 && <>
          <p class="eyebrow">Your medication</p>
          <h1 class="ob-title sm">Save the dose you take</h1>
          <p class="ob-sub">It becomes a saved medication, so logging is one tap. You can add more later from the plus button.</p>
          <PillPreview draft={draft} id="previewPill" />
          <div class="group-label">Name</div>
          <div class="card"><input class="text-input wide field" type="text" maxLength={40} placeholder={`e.g. Morning ${draft.kind}`} value={medName} onInput={e => setMedName((e.target as HTMLInputElement).value)} aria-label="Medication name" /></div>
          <div class="group-label">Medication</div>
          <div class="card list"><KindDoseRows draft={draft} /></div>
          <div class="group-label">Make it look like yours</div>
          <div class="card list"><AppearanceRows draft={draft} /></div>
          <Foot />
        </>}

        {page === 4 && <>
          <p class="eyebrow">Schedule</p>
          <h1 class="ob-title sm">When do you usually take it?</h1>
          <p class="ob-sub">Bloodstream checks in when a dose is due and shows planned doses on future days. Skip this if your timing varies.</p>
          <div class="card list" style={{ marginTop: '18px' }}>
            <div class="row"><div class="row-text"><label for="obSch">I take it on a schedule</label></div><Switch id="obSch" checked={wantSchedule} onChange={setWantSchedule} /></div>
            {wantSchedule && <>
              <div class="row"><label for="obTime">Usual time</label><input type="time" id="obTime" value={time} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTime(v); }} /></div>
              <div class="row col">
                <div class="chips tight">
                  <button type="button" class={'chip' + (days.length === 7 ? ' on' : '')} onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>Every day</button>
                  <button type="button" class={'chip' + (same(days, [1, 2, 3, 4, 5]) ? ' on' : '')} onClick={() => setDays([1, 2, 3, 4, 5])}>Weekdays</button>
                  <button type="button" class={'chip' + (same(days, [0, 6]) ? ' on' : '')} onClick={() => setDays([0, 6])}>Weekends</button>
                </div>
                <div class="weekdays" role="group" aria-label="Days">{WEEKDAY_SHORT.map((l, d) => <button key={d} type="button" aria-pressed={days.includes(d)} aria-label={l} class={'wd' + (days.includes(d) ? ' on' : '')} onClick={() => toggleDay(d)}>{l[0]}</button>)}</div>
              </div>
              <div class="row"><div class="row-text"><label for="obRem">Reminders</label><small>A heads-up before, and a check-in if it isn't logged</small></div>
                <Switch id="obRem" checked={remind} onChange={async v => { setRemind(v); if (v) await requestNotify(); }} /></div>
            </>}
          </div>
          <p class="foot pad">Websites can only alert you while they're open or recently used. For alerts you can rely on, add your schedule to the Calendar app later from the plus button.</p>
          <Foot disabled={wantSchedule && !days.length} />
        </>}

        {page === 5 && <>
          <p class="eyebrow">Doctor logging · optional</p>
          <h1 class="ob-title sm">Keep notes for your prescriber</h1>
          <div class="card list" style={{ marginTop: '14px' }}>
            <div class="row"><div class="row-text"><label for="obLog">Turn on doctor logging</label><small>Adds a log button and a library of articles</small></div><Switch id="obLog" checked={logOn} onChange={setLogOn} /></div>
          </div>
          {logOn && <><div class="group-label">Are you still adjusting?</div><PhaseChoice value={phase} onChange={setPhase} /></>}
          <HowLoggingWorks phase={phase} />
          <Foot disabled={logOn && !phase} />
        </>}

        {page === 6 && <>
          <p class="eyebrow">Privacy and personal touches</p>
          <h1 class="ob-title sm">Yours, and only yours</h1>
          <ul class="ob-points">
            <li><Ic d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><div><strong>Stays on this device</strong><span>No account, no uploads, no analytics. Export a backup from Data & information controls before switching phones.</span></div></li>
            <li><span class="ic">{ICONS.incognito}</span><div><strong>Incognito</strong><span>The rightmost button in the top bar swaps your dashboard for a neutral rhythm with no medical words, for as long as you choose.</span></div></li>
            <li><Ic d="M4 17l5-5 4 4 7-7M14 9h6v6" /><div><strong>Appearance</strong><span>Living sky that follows the sun, aurora, rain on glass, snowfall, nebula or your own gradient, all drawn live.</span></div></li>
            <li><Ic d="M12 8v4l3 2M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z" /><div><strong>Calendar and history</strong><span>Every dose is kept. Add doses to past days, and see appointments and schedules ahead.</span></div></li>
          </ul>
          <div class="ob-fx">{['linear-gradient(to top,#ffb070,#6fa4e8 50%,#1d4fa8)', 'radial-gradient(90% 55% at 50% 72%,rgba(40,235,150,.75),transparent 62%),#01040a', 'radial-gradient(40% 30% at 35% 40%,rgba(190,40,160,.75),transparent),radial-gradient(40% 35% at 65% 60%,rgba(40,90,230,.7),transparent),#030210', 'linear-gradient(#141b2c,#070a12)'].map((b, i) => <span key={i} style={{ background: b }} />)}</div>
          <Foot />
        </>}

        {page === 7 && <>
          <p class="eyebrow">Today</p>
          <h1 class="ob-title sm">Have you taken {label} today?</h1>
          <div class="pill-stage"><div class="pill-preview" ref={pillRef} dangerouslySetInnerHTML={{ __html: pillSVG(draft.look) }} /></div>
          <div class="choice-list" role="radiogroup" aria-label="Today's dose">
            <button type="button" role="radio" aria-checked={today === 'taken'} class={'choice' + (today === 'taken' ? ' on' : '')} onClick={() => setToday('taken')}>
              <span class="choice-radio" /><span><b>Yes, I took it</b><small>Tracking starts from the time you took it</small></span>
            </button>
            {today === 'taken' && <div class="card list choice-extra"><div class="row"><label for="obTaken">Taken at</label>
              <div class="time-wrap"><button type="button" class="mini" onClick={() => setTakenAt(toHHMM(new Date()))}>Now</button>
                <input type="time" id="obTaken" value={takenAt} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setTakenAt(v); }} /></div></div></div>}
            <button type="button" role="radio" aria-checked={today === 'plan'} class={'choice' + (today === 'plan' ? ' on' : '')} onClick={() => setToday('plan')}>
              <span class="choice-radio" /><span><b>Not yet</b><small>Plan it and preview the whole day</small></span>
            </button>
            {today === 'plan' && <div class="card list choice-extra"><div class="row"><label for="obPlan">Planned for</label>
              <input type="time" id="obPlan" value={planAt} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setPlanAt(v); }} /></div>
              <p class="foot pad">{fmtWhen(resolveFormTime(planAt, true), false)}</p></div>}
            <button type="button" role="radio" aria-checked={today === 'skip'} class={'choice' + (today === 'skip' ? ' on' : '')} onClick={() => setToday('skip')}>
              <span class="choice-radio" /><span><b>Not today</b><small>Go to the dashboard and log it later</small></span>
            </button>
          </div>
          <Foot cta={today === 'skip' ? 'Go to my dashboard' : 'Start tracking'} onClick={finish} />
          <Disclaimer onboarding />
        </>}
      </div>
    </section>
  );
}
