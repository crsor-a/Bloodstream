import { useEffect, useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import { applyFade, fmtMg, pct, pillSVG, shapeName } from '../lib/pill';
import { dayWord, fmtTime, fmtWhen, rel } from '../lib/time';
import { DIRECTION, feelPhrase } from '../model/copy';
import {
  actionOpen, addDose, entering, flight, now, regimen, setDoseTime, sheetOpen, showToast, startOver, sweepToken
} from '../state';
import { ActionSheet, prefersReducedMotion, Sheet } from '../components/controls';
import { DoseForm } from './DoseForm';
import { DoseList } from './DoseList';
import { Curve } from './Curve';
import { Sleep } from './Sleep';
import { Effectivity } from './Effectivity';
import { DataCard } from './DataCard';

export function Disclaimer(p: { onboarding?: boolean }) {
  return <p class={p.onboarding ? 'ob-disclaimer' : 'disclaimer'}>Bloodstream is not a replacement for doctor advice and information shown may be inaccurate. Always double-check and never use this website to plan doses not approved by a healthcare professional.</p>;
}

function TopBar() {
  return (
    <header class="topbar">
      <span class="brand"><svg viewBox="0 0 14 18" aria-hidden="true"><path d="M7 0C7 0 0 7.6 0 11.3A7 7 0 0 0 14 11.3C14 7.6 7 0 7 0Z" /></svg>Bloodstream</span>
      <div class="top-right">
        <span class="clock">{fmtTime(now.value)}</span>
        <button class="icon-btn" type="button" aria-label="Add another dose" title="Add another dose" onClick={() => { sheetOpen.value = true; }}>
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button class="icon-btn" id="restartBtn" type="button" aria-label="Start over" title="Start over" onClick={() => { actionOpen.value = true; }}>
          <svg viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3 3.5v5h5" /></svg>
        </button>
      </div>
    </header>
  );
}

function Hero() {
  const reg = regimen.value, t = now.value;
  const hd = reg.heroDose(t)!;
  const planned = reg.isPlanned(t);
  const target = planned ? 1 : reg.remainingFrac(t);

  const pillRef = useRef<HTMLDivElement>(null);
  const cur = useRef(1), raf = useRef(0), sweeping = useRef(false), targetRef = useRef(target);
  targetRef.current = target;

  const markup = useMemo(() => pillSVG(hd, { fade: true }), [hd.id, hd.shape, hd.mode, hd.colors.L, hd.colors.R]);
  useLayoutEffect(() => { applyFade(pillRef.current, hd.shape, cur.current); }, [markup]);

  const tween = (to: number, dur: number) => {
    cancelAnimationFrame(raf.current);
    const from = cur.current, t0 = performance.now();
    if (prefersReducedMotion()) dur = 0;
    const step = (ts: number) => {
      const k = dur ? Math.min(1, (ts - t0) / dur) : 1;
      cur.current = from + (to - from) * (1 - Math.pow(1 - k, 3));
      applyFade(pillRef.current, hd.shape, cur.current);
      if (k < 1) raf.current = requestAnimationFrame(step); else sweeping.current = false;
    };
    raf.current = requestAnimationFrame(step);
  };
  const sweep = (delay: number) => {
    sweeping.current = true; cur.current = 1;
    applyFade(pillRef.current, hd.shape, 1);
    setTimeout(() => tween(targetRef.current, 1700), prefersReducedMotion() ? 0 : delay);
  };
  const pop = () => { const el = pillRef.current; if (!el) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };

  useEffect(() => { if (!sweeping.current) tween(target, 900); }, [target]);

  // Replay the sweep when asked, or when the hero dose / planned state changes.
  const firstRun = useRef(true);
  const hadFlight = useRef(!!flight.value);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; if (hadFlight.current) return; }
    pop(); sweep(450);
  }, [sweepToken.value, hd.id, planned]);

  // Pill flies from the onboarding form into the hero.
  useLayoutEffect(() => {
    const f = flight.value, dest = pillRef.current;
    flight.value = null;
    if (!f || !dest) { entering.value = false; return; }
    const clone = document.createElement('div');
    clone.className = 'fly';
    clone.innerHTML = pillSVG(f.look);
    Object.assign(clone.style, { left: f.rect.left + 'px', top: f.rect.top + 'px', width: f.rect.width + 'px' });
    document.body.appendChild(clone);
    const to = dest.getBoundingClientRect();
    const dx = to.left - f.rect.left, dy = to.top - f.rect.top, sc = to.width / f.rect.width;
    const done = () => { entering.value = false; clone.remove(); sweep(150); };
    try {
      clone.animate(
        [{ transform: 'translate(0,0) scale(1) rotate(0deg)' },
         { transform: `translate(${dx * .55}px,${dy * .55 - 30}px) scale(${1 + (sc - 1) * .6}) rotate(-6deg)`, offset: .55 },
         { transform: `translate(${dx}px,${dy}px) scale(${sc}) rotate(0deg)` }],
        { duration: prefersReducedMotion() ? 1 : 820, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' }
      ).finished.then(done, done);
    } catch { done(); }
  }, []);

  const takenToday = reg.session.filter(d => d.at <= t).length;
  const carry = reg.carriedMg(t);
  let headline, sub: string;
  if (planned) {
    headline = <>Planned for <span class="num">{fmtWhen(hd.at, true, t)}</span>.</>;
    sub = `You haven't taken it yet, but the curve below already shows how the day should play out. Drag through it to preview, and live tracking starts on its own at ${fmtTime(hd.at)}.`
      + (carry >= 0.5 ? ` About ${fmtMg(carry)} mg from earlier doses is still circulating, and it's already counted.` : '');
  } else {
    const e = reg.effectAt(t), ph = reg.phaseAt(t);
    headline = <>By {fmtTime(t)}, <span class="num">{pct(target)}</span> is still in your bloodstream.</>;
    sub = ph === 'onset' && e < 0.1 ? 'It was just taken and is still absorbing. Effects usually start to show within 30 to 60 minutes.'
      : ph === 'residual' ? `Felt effects have most likely worn off, at about ${pct(e)} of full effect. The rest is still being cleared.`
      : `It may feel like ${feelPhrase(e)}, at about ${pct(e)} of full effect ${DIRECTION[ph] ?? ''}.`;
    if (takenToday > 1 || carry >= 0.5) sub += ` That's about ${fmtMg(reg.remainingMg(t))} mg in total, ${carry >= 0.5 ? 'counting carry-over from earlier doses' : `across ${takenToday} doses`}.`;
    const nx = reg.nextPlanned(t);
    if (nx) sub += ` Your next dose is planned for ${fmtWhen(nx.at, true, t)}.`;
  }

  const took = () => { setDoseTime(hd.id, Date.now()); sweepToken.value++; showToast(`Tracking from ${fmtTime(Date.now())}`); };

  return (
    <section class="hero">
      <div ref={pillRef} class={'hero-pill' + (planned ? ' planned' : '') + (firstRun.current && !hadFlight.current ? ' pop' : '')} role="img"
        aria-label={planned ? 'Planned dose, not taken yet' : `Pill fading as the dose clears, ${pct(target)} left`}
        dangerouslySetInnerHTML={{ __html: markup }} />
      <div class="dose-chip reveal" style={{ '--d': 1 } as any}>
        {planned
          ? `Planned · ${hd.kind} ${shapeName(hd.shape)} · ${fmtMg(hd.mg)} mg · ${fmtWhen(hd.at, false, t)}`
          : `${hd.kind} ${shapeName(hd.shape)} · ${fmtMg(hd.mg)} mg · taken ${fmtWhen(hd.at, true, t)}${takenToday > 1 ? ` · ${takenToday} doses today` : ''}`}
      </div>
      <h1 class="headline reveal" style={{ '--d': 2 } as any}>{headline}</h1>
      <p class="subline reveal" style={{ '--d': 3 } as any}>{sub}</p>
      {planned && <button class="btn primary capsule reveal" style={{ '--d': 3 } as any} type="button" onClick={took}>I took it now</button>}
    </section>
  );
}

function Stats() {
  const reg = regimen.value, t = now.value;
  const kt = reg.keyTimes(t);
  const tile = (label: string, ts: number | null) => (
    <div class="stat" key={label}>
      <div class="k">{label}</div>
      <div class="v">{ts == null ? '--' : fmtTime(ts)}</div>
      <div class="s">{ts == null ? ' ' : `${dayWord(ts, t) ? dayWord(ts, t) + ' · ' : ''}${rel(ts, t)}`}</div>
    </div>
  );
  return <div class="stats reveal" style={{ '--d': 4 } as any}>{tile('Kicks in', kt.onset)}{tile('Peak level', kt.peakAt)}{tile('Effect fades', kt.fade)}{tile('Sleep-ready', kt.clear)}</div>;
}

function Method() {
  return (
    <details class="method reveal" style={{ '--d': 10 } as any}>
      <summary>How Bloodstream estimates this</summary>
      <ul>
        <li>Both forms are a 3:1 mix of d- and l-amphetamine. Each is modeled on its own, using the elimination half-lives on the FDA label for your age group. Adults: about 10 hours for d and 13 for l. Teens: 11 and 13 to 14. Kids 6 to 12: 9 and 11.</li>
        <li>IR is modeled as a single tablet that reaches peak blood level about 3 hours after the dose.</li>
        <li>XR is modeled as two bead populations: half releases right away and the delayed half starts a few hours later and absorbs gradually. That puts the peak around 7 hours, in line with the label's note that XR 20 mg tracks closely with IR 10 mg taken twice, 4 hours apart.</li>
        <li>Blood levels scale in proportion to dose (the label shows exposure roughly tripling from 10 mg to 30 mg), so overlapping doses are simply added together. A booster stacks on what is already there, and roughly a quarter of yesterday's dose is still in your body when the next morning's dose goes in. Doses count toward the curve for 72 hours, until about 1% remains, and stay in your history after that.</li>
        <li>"Left" is the share of today's load not yet eliminated, counting what you took today plus anything carried over from earlier doses.</li>
        <li>Felt effect ends well before the medication does. IR is commonly felt for about 4 to 6 hours and XR for about 8 to 12, partly because the body adapts during the day. The effect curve tapers to match those windows. Stacked effects are added too, which may overstate how strong a late booster feels.</li>
        <li>Sex has no direct effect on the label. Women showed 20 to 30% higher exposure, which the label puts down to body weight, and that changes absolute levels rather than the shape of these percentage curves.</li>
        <li>Other things that shift a real curve: a heavy meal can push XR's peak later; acidic foods, juice and vitamin C can lower levels and speed clearance, while antacids can raise and prolong them; kidney function and other medications matter too.</li>
        <li>Sleep interference blends estimated effect with remaining blood level. It is a rough index, not a clinical measurement.</li>
      </ul>
      <p class="src">Sources: <a href="https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/021303s038lbl.pdf" target="_blank" rel="noopener">FDA label, Adderall XR</a> · <a href="https://www.accessdata.fda.gov/drugsatfda_docs/label/2015/011522s042lbl.pdf" target="_blank" rel="noopener">FDA label, Adderall tablets</a> · <a href="https://medlibrary.org/lib/rx/meds/amphetamine/page/6/" target="_blank" rel="noopener">Amphetamine label, sex and weight</a></p>
    </details>
  );
}

export function Dashboard() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const addFromSheet = (r: Parameters<Parameters<typeof DoseForm>[0]['onSubmit']>[0]) => {
    const d = addDose(r.dose, { shapeTouched: r.shapeTouched });
    sheetOpen.value = false;
    sweepToken.value++;
    showToast(d.at > Date.now() + 60_000 ? `Planned ${d.kind} ${fmtMg(d.mg)} mg for ${fmtWhen(d.at, true)}` : `Added ${d.kind} ${fmtMg(d.mg)} mg at ${fmtTime(d.at)}`);
  };
  if (regimen.value.empty) return null;
  return (
    <main id="dash" class={entering.value ? 'entering' : ''}>
      <TopBar />
      <Hero />
      <Stats />
      <DoseList />
      <Curve />
      <Sleep />
      <Effectivity />
      <DataCard />
      <Method />
      <Disclaimer />

      <Sheet open={sheetOpen.value} onClose={() => { sheetOpen.value = false; }} title="New dose">
        <h2 class="sheet-intro">Add another dose</h2>
        <p class="sheet-sub">Log it just like your first one. Whatever is still in your system stacks with it, and the curve updates right away.</p>
        <DoseForm mode="sheet" onSubmit={addFromSheet} />
      </Sheet>
      <ActionSheet open={actionOpen.value} onClose={() => { actionOpen.value = false; }}
        title="Start over? Bloodstream stops tracking the doses on this screen. Past doses stay in your saved history and backups."
        actions={[{ label: 'Stop tracking and start over', danger: true, onClick: () => { actionOpen.value = false; setTimeout(startOver, 300); } }]} />
    </main>
  );
}
