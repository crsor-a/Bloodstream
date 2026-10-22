import { useEffect, useState } from 'preact/hooks';
import type { AdjustPhase } from '../model/types';
import { fmtMg, pillSVG } from '../lib/pill';
import {
  doses, meds, profile, saveMed, setLogging, setName, setSetupV4, setTheme, settings, showToast, tour
} from '../state';
import { Switch, useOverlay } from '../components/controls';
import { PhaseChoice } from './LoggingTour';
import { ICONS } from './Header';

/** A card at the top of the dashboard for people who used Bloodstream before 4.0. */
export function UpgradeCard() {
  if (settings.value.setupV4 !== 'pending') return null;
  return (
    <section class="card upgrade-card" aria-label="What's new in Bloodstream 4">
      <p class="eyebrow">New in version 4</p>
      <b>Saved medications, doctor logging, incognito and living backgrounds</b>
      <p>Everything you've logged is still here. A short tour sets up the new parts in about a minute.</p>
      <div class="upgrade-actions">
        <button type="button" class="pill-btn solid" onClick={() => { tour.value = 'upgrade'; }}>Take the tour</button>
        <button type="button" class="pill-btn ghost" onClick={() => { setSetupV4('dismissed'); showToast('You can find everything in Data & information controls'); }}>Not now</button>
      </div>
    </section>
  );
}

export function UpgradeTour() {
  const open = tour.value === 'upgrade';
  const { mounted, shown } = useOverlay(open);
  const [page, setPage] = useState(0);
  const [name, setNameV] = useState(profile.value.name);
  const [logOn, setLogOn] = useState(settings.value.logging.enabled);
  const [phase, setPhase] = useState<AdjustPhase | null>(settings.value.logging.phase);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (open) { setPage(0); setNameV(profile.value.name); setSaved(false); } }, [open]);
  if (!mounted) return null;
  const last = [...doses.value].reverse().find(d => d.at <= Date.now()) ?? doses.value[doses.value.length - 1];
  const hasMed = meds.value.length > 0;
  const finish = () => {
    setName(name);
    if (logOn) setLogging(true, phase ?? 'unsure'); else if (settings.value.logging.enabled) setLogging(false);
    setSetupV4('done');
    tour.value = null;
    showToast('You\'re all set');
  };
  const N = 4;
  return (
    <div class={'tour-screen' + (shown ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Bloodstream 4 tour">
      <div class="tour-bar">
        {page > 0 ? <button type="button" class="back" onClick={() => setPage(page - 1)}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>Back</button>
          : <button type="button" class="back" onClick={() => { tour.value = null; }}>Later</button>}
        <div class="dots" aria-hidden="true">{Array.from({ length: N }, (_, i) => <i key={i} class={i === page ? 'on' : ''} />)}</div>
        <span />
      </div>
      <div class="tour-body">
        {page === 0 && <>
          <p class="eyebrow">Bloodstream 4</p>
          <h1 class="ob-title sm">A lot more, and nothing lost</h1>
          <p class="ob-sub">All {doses.value.length} dose{doses.value.length === 1 ? '' : 's'} in your history came along, along with your settings.</p>
          <ul class="ob-points">
            <li><span class="ic">{ICONS.plus}</span><div><strong>Saved medications and schedules</strong><span>One-tap logging, reminders, and planned doses on your calendar.</span></div></li>
            <li><span class="ic">{ICONS.log}</span><div><strong>Doctor logging</strong><span>Note side effects, benefits and questions, with guidance and over 30 articles.</span></div></li>
            <li><span class="ic">{ICONS.incognito}</span><div><strong>Incognito</strong><span>A neutral screen for checking in around other people.</span></div></li>
            <li><span class="ic"><svg viewBox="0 0 24 24"><path d="M4 17l5-5 4 4 7-7" /></svg></span><div><strong>Zones and living backgrounds</strong><span>Color-coded effectivity with articles, and skies that follow the sun.</span></div></li>
          </ul>
          <button class="btn primary block" type="button" onClick={() => setPage(1)}>Set it up</button>
        </>}
        {page === 1 && <>
          <p class="eyebrow">Saved medication</p>
          <h1 class="ob-title sm">{hasMed ? 'Your medications' : 'Save your usual dose'}</h1>
          {last && !hasMed ? <>
            <div class="pill-stage"><div class="pill-preview" dangerouslySetInnerHTML={{ __html: pillSVG(last) }} /></div>
            <p class="ob-sub center">Your last dose was {last.kind} {fmtMg(last.mg)} mg. Save it to log it with one tap. You can add schedules and reminders from the plus button.</p>
            <button class="btn primary block" type="button" disabled={saved} onClick={() => {
              saveMed({ name: `${last.kind} ${fmtMg(last.mg)} mg`, kind: last.kind, mg: last.mg, shape: last.shape, mode: last.mode, colors: last.colors });
              setSaved(true); showToast('Medication saved');
            }}>{saved ? 'Saved' : `Save ${last.kind} ${fmtMg(last.mg)} mg`}</button>
          </> : <p class="ob-sub">{hasMed ? `You have ${meds.value.length} saved. Manage them, and schedules, from the plus button.` : 'Use the plus button to save a medication whenever you\'re ready.'}</p>}
          <button class={'btn block' + (last && !hasMed && !saved ? ' ghost-btn' : ' primary')} type="button" onClick={() => setPage(2)}>{last && !hasMed && !saved ? 'Skip' : 'Continue'}</button>
        </>}
        {page === 2 && <>
          <p class="eyebrow">Personal touch</p>
          <h1 class="ob-title sm">What should we call you?</h1>
          <div class="card" style={{ marginTop: '18px' }}><input class="text-input wide field" type="text" maxLength={30} autoComplete="given-name" placeholder="Name (optional)" value={name} onInput={e => setNameV((e.target as HTMLInputElement).value)} aria-label="Name" /></div>
          <p class="foot pad">Used for the greeting at the top of your dashboard. Hidden in incognito.</p>
          <div class="group-label">Doctor logging</div>
          <div class="card list"><div class="row"><div class="row-text"><label for="upLog">Turn on doctor logging</label><small>Notes and questions for your prescriber</small></div><Switch id="upLog" checked={logOn} onChange={setLogOn} /></div></div>
          {logOn && <><div class="group-label">Are you still adjusting?</div><PhaseChoice value={phase} onChange={setPhase} /></>}
          <button class="btn primary block" type="button" disabled={logOn && !phase} style={logOn && !phase ? { opacity: 0.4 } : undefined} onClick={() => setPage(3)}>Continue</button>
        </>}
        {page === 3 && <>
          <p class="eyebrow">Make it yours</p>
          <h1 class="ob-title sm">Try a living background</h1>
          <p class="ob-sub">Backgrounds are drawn live and make the interface translucent. Change or turn them off anytime under Appearance.</p>
          <div class="fx-grid small">
            {([['sky', 'Living sky', 'linear-gradient(to top,#ffb070,#6fa4e8 50%,#1d4fa8)'], ['aurora', 'Aurora', 'radial-gradient(90% 55% at 50% 72%,rgba(40,235,150,.75),transparent 62%),#01040a'], ['rain', 'Rain', 'radial-gradient(22% 14% at 30% 35%,rgba(255,150,70,.7),transparent),linear-gradient(#141b2c,#070a12)'], ['none', 'Black', '#000']] as const).map(([id, n, bg]) => (
              <button key={id} type="button" class={'fx' + (settings.value.theme.effect === id ? ' on' : '')} onClick={() => setTheme({ effect: id })}>
                <span class="fx-prev" style={{ background: bg }} /><b>{n}</b>
              </button>
            ))}
          </div>
          <button class="btn primary block" type="button" onClick={finish}>Done</button>
        </>}
      </div>
    </div>
  );
}
