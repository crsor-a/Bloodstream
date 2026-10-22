import { useEffect, useState } from 'preact/hooks';
import type { AdjustPhase } from '../model/types';
import { libraryOpen, setLogging, showToast, tour } from '../state';
import { useOverlay } from '../components/controls';
import { TypeIcon } from './LogSheet';
import { AppointmentForm } from './Appointments';

const PHASES: { v: AdjustPhase; title: string; sub: string }[] = [
  { v: 'adjusting', title: 'Still adjusting', sub: 'My prescriber and I are still finding the right dose, timing or medicine.' },
  { v: 'settled', title: 'Settled', sub: 'I\'m on a steady dose that mostly works.' },
  { v: 'unsure', title: 'Not sure', sub: 'I don\'t know yet, or it\'s complicated.' }
];

export function PhaseChoice({ value, onChange }: { value: AdjustPhase | null; onChange: (v: AdjustPhase) => void }) {
  return (
    <div class="choice-list" role="radiogroup" aria-label="Adjustment phase">
      {PHASES.map(p => (
        <button key={p.v} type="button" role="radio" aria-checked={value === p.v} class={'choice' + (value === p.v ? ' on' : '')} onClick={() => onChange(p.v)}>
          <span class="choice-radio" aria-hidden="true" />
          <span><b>{p.title}</b><small>{p.sub}</small></span>
        </button>
      ))}
    </div>
  );
}

const PHASE_COPY: Record<AdjustPhase, string> = {
  adjusting: 'While your dose is being adjusted, a week of notes tells your prescriber far more than "it\'s fine, I think". It helps them decide whether to change the dose, keep it, or try something else.',
  settled: 'Even on a steady dose, slow changes in sleep, appetite, mood or how long it lasts are easy to miss. Notes help you catch them before they become problems.',
  unsure: 'Either way, notes taken in the moment are more accurate than what you remember in the waiting room. They help you and your prescriber decide together.'
};

/** The visual explainer: log, gather, decide together. */
export function HowLoggingWorks({ phase }: { phase: AdjustPhase | null }) {
  return (
    <div class="how">
      <div class="how-step">
        <span class="how-n">1</span>
        <div class="how-copy"><b>Log it when you notice it</b><small>Pick a type and category, choose a suggestion or write your own.</small></div>
        <div class="how-art mock-entry" aria-hidden="true">
          <span class="entry-ic effect"><TypeIcon type="effect" /></span>
          <span><b>Focus fades too early</b><small>Side effect · Focus</small></span>
        </div>
      </div>
      <div class="how-step">
        <span class="how-n">2</span>
        <div class="how-copy"><b>Get guidance right away</b><small>Every suggestion links to an article. Serious ones say clearly when to call or get help.</small></div>
        <div class="how-art mock-guide" aria-hidden="true">
          <i class="g-info" /><span>Bloodstream has guidance for this</span>
          <i class="g-soon" /><span>Contact your prescriber soon</span>
          <i class="g-stop" /><span>Stop and call today</span>
        </div>
      </div>
      <div class="how-step">
        <span class="how-n">3</span>
        <div class="how-copy"><b>Bring your library to the appointment</b><small>Share the list, decide together, then clear what you covered.</small></div>
        <div class="how-art mock-appt" aria-hidden="true">
          <span class="cal-icon"><small>NOV</small><b>12</b></span>
          <span><b>An appointment is in 2 weeks</b><small>Review your logging library</small></span>
        </div>
      </div>
      <p class="how-note">{PHASE_COPY[phase ?? 'unsure']}</p>
      <p class="how-fine">Bloodstream never suggests or changes doses. It helps you describe what's happening, and your prescriber makes the call.</p>
    </div>
  );
}

/** Separate onboarding for doctor logging, launched from Data & information controls or the v4 tour. */
export function LoggingTour() {
  const open = tour.value === 'logging';
  const { mounted, shown } = useOverlay(open);
  const [page, setPage] = useState(0);
  const [phase, setPhase] = useState<AdjustPhase | null>(null);
  useEffect(() => { if (open) { setPage(0); setPhase(null); } }, [open]);
  if (!mounted) return null;
  const finish = (openLib: boolean) => {
    setLogging(true, phase ?? 'unsure');
    tour.value = null;
    showToast('Doctor logging is on');
    if (openLib) setTimeout(() => { libraryOpen.value = { section: 'entries' }; }, 450);
  };
  return (
    <div class={'tour-screen' + (shown ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Set up doctor logging">
      <div class="tour-bar">
        {page > 0 ? <button type="button" class="back" onClick={() => setPage(page - 1)}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>Back</button>
          : <button type="button" class="back" onClick={() => { tour.value = null; }}>Cancel</button>}
        <div class="dots" aria-hidden="true">{[0, 1, 2].map(i => <i key={i} class={i === page ? 'on' : ''} />)}</div>
        <span />
      </div>
      <div class="tour-body">
        {page === 0 && <>
          <p class="eyebrow">Doctor logging</p>
          <h1 class="ob-title sm">Are you still adjusting?</h1>
          <p class="ob-sub">Doctor logging keeps track of side effects, benefits, questions and concerns between appointments. First, where are you with your treatment?</p>
          <PhaseChoice value={phase} onChange={setPhase} />
          <button class="btn primary block" type="button" disabled={!phase} style={phase ? undefined : { opacity: 0.4 }} onClick={() => setPage(1)}>Continue</button>
        </>}
        {page === 1 && <>
          <p class="eyebrow">How it works</p>
          <h1 class="ob-title sm">Notes that help steer decisions</h1>
          <HowLoggingWorks phase={phase} />
          <button class="btn primary block" type="button" onClick={() => setPage(2)}>Continue</button>
        </>}
        {page === 2 && <>
          <p class="eyebrow">Optional</p>
          <h1 class="ob-title sm">When is your next appointment?</h1>
          <p class="ob-sub">Bloodstream will remind you to start noting things a few weeks ahead, and show it on your calendar.</p>
          <AppointmentForm id={null} compact onDone={() => finish(false)} />
          <button class="btn-text center" type="button" onClick={() => finish(true)}>Skip for now</button>
        </>}
      </div>
    </div>
  );
}
