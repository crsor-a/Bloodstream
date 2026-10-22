import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { fmtTime, fmtWhen, HOUR, rel } from '../lib/time';
import { rhythmWord } from '../model/copy';
import { incognito, incognitoSheet, now, regimen, setIncognito, settings, showToast } from '../state';
import { Sheet } from '../components/controls';

const DURATIONS: { h: number; label: string }[] = [
  { h: 1, label: '1 hour' }, { h: 2, label: '2 hours' }, { h: 4, label: '4 hours' }, { h: 8, label: '8 hours' },
  { h: 12, label: '12 hours' }, { h: 24, label: '1 day' }, { h: -1, label: 'Until I turn it off' }
];

export function incognitoEnds(): string {
  const u = settings.value.incognitoUntil;
  return u === -1 ? 'until you turn it off' : `until ${fmtWhen(u, true)}`;
}

export function IncognitoSheet() {
  const open = incognitoSheet.value, on = incognito.value;
  const [hours, setHours] = useState(4);
  const close = () => { incognitoSheet.value = false; };
  const start = () => {
    setIncognito(hours); close();
    showToast(hours === -1 ? 'Incognito on until you turn it off' : `Incognito on for ${DURATIONS.find(d => d.h === hours)?.label}`);
    window.scrollTo(0, 0);
  };
  return (
    <Sheet open={open} onClose={close} title="Incognito">
      <div class="inc-hero" aria-hidden="true"><span class="inc-glyph"><svg viewBox="0 0 24 24"><path d="M3 12s3.2-6 9-6c1.6 0 3 .4 4.2 1M21 12s-3.2 6-9 6c-1.6 0-3-.4-4.2-1" /><path d="M9.9 14.1a3 3 0 0 1 4.2-4.2M4 20 20 4" /></svg></span></div>
      <h2 class="sheet-intro center">{on ? 'Incognito is on' : 'Incognito'}</h2>
      <p class="sheet-sub center">{on ? `Your screen stays private ${incognitoEnds()}.` : 'For checking in around other people. Your screen shows a neutral daily rhythm with nothing that points to a condition or a medication.'}</p>
      {!on && <ul class="inc-points">
        <li><b>Hidden</b><span>Doses, the pill, medication names, health wording, the calendar and your logging library.</span></li>
        <li><b>Shown</b><span>A simple rhythm graph with a few plain words and one percentage.</span></li>
        <li><b>Paused</b><span>Your background, your name in the greeting, and reminder details.</span></li>
        <li><b>Stays on</b><span>Even if you close Bloodstream. It switches off by itself at the time you pick.</span></li>
      </ul>}
      <div class="group-label">{on ? 'Change how long' : 'How long'}</div>
      <div class="chips">{DURATIONS.map(d => <button key={d.h} type="button" class={'chip' + (hours === d.h ? ' on' : '')} onClick={() => setHours(d.h)}>{d.label}</button>)}</div>
      <button class="btn primary block" type="button" onClick={start}>{on ? 'Update' : 'Turn on incognito'}</button>
      {on && <button class="btn-text center" type="button" onClick={() => { setIncognito(0); close(); showToast('Incognito off'); }}>Turn off now</button>}
    </Sheet>
  );
}

/** The whole dashboard while incognito: a neutral rhythm, no medical words. */
export function IncognitoView() {
  const reg = regimen.value, t = now.value;
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(340);
  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const fit = () => setW(Math.max(260, Math.round(el.clientWidth)));
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);
  const H = 180, PL = 8, PR = 8, PT = 16, PB = 22;
  const g = useMemo(() => {
    if (reg.empty) return null;
    const [a, b] = reg.domain(t);
    const N = 200;
    const X = (ts: number) => PL + (ts - a) / (b - a) * (W - PL - PR), Y = (v: number) => PT + (1 - v) * (H - PT - PB);
    let d = '';
    for (let i = 0; i <= N; i++) { const ts = a + i * (b - a) / N; d += (i ? 'L' : 'M') + X(ts).toFixed(1) + ',' + Y(reg.effectAt(ts)).toFixed(1); }
    const area = d + `L${X(b)},${Y(0)}L${X(a)},${Y(0)}Z`;
    const ticks: { x: number; l: string }[] = [];
    const dt = new Date(a); dt.setMinutes(0, 0, 0); dt.setHours(dt.getHours() + 1);
    while (dt.getTime() < b) { if (dt.getHours() % 4 === 0) { const hr = dt.getHours(); ticks.push({ x: X(dt.getTime()), l: (hr % 12 || 12) + (hr < 12 ? 'a' : 'p') }); } dt.setHours(dt.getHours() + 1); }
    return { a, b, X, Y, d, area, ticks };
  }, [reg, W]);

  const e = reg.empty ? 0 : reg.effectAt(t);
  const word = reg.empty ? 'Resting' : rhythmWord(e, reg.risingAt(t));
  const kt = reg.empty ? null : reg.keyTimes(t);
  const u = settings.value.incognitoUntil;
  const tile = (k: string, ts: number | null | undefined) => (
    <div class="stat" key={k}><div class="k">{k}</div><div class="v">{ts == null ? '--' : fmtTime(ts)}</div><div class="s">{ts == null ? ' ' : rel(ts, t)}</div></div>
  );

  return (
    <div class="inc-view">
      <div class="inc-banner">
        <span>Private view {u === -1 ? 'is on' : `until ${fmtTime(u)}`}</span>
        <button type="button" class="pill-btn" onClick={() => { setIncognito(0); showToast('Incognito off'); }}>End</button>
      </div>
      <section class="card inc-card">
        <div class="inc-now">
          <div><span class="inc-label">Right now</span><b class="inc-word">{word}</b></div>
          <span class="inc-pct">{Math.round(e * 100)}%</span>
        </div>
        <div ref={boxRef} class="inc-graph">
          {g ? (
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Today's rhythm, currently ${word.toLowerCase()}`}>
              <defs><linearGradient id="incA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient></defs>
              <line x1={PL} x2={W - PR} y1={g.Y(0)} y2={g.Y(0)} class="g-base" />
              {g.ticks.map(k => <text key={k.x} class="g-lbl" x={k.x} y={H - 5} text-anchor="middle">{k.l}</text>)}
              <path d={g.area} fill="url(#incA)" />
              <path d={g.d} class="g-line" />
              {t >= g.a && t <= g.b && <><line class="g-now" x1={g.X(t)} x2={g.X(t)} y1={PT} y2={g.Y(0)} /><circle cx={g.X(t)} cy={g.Y(e)} r="6" fill="#fff" stroke="#000" stroke-width="2.5" /></>}
            </svg>
          ) : <p class="inc-empty">A quiet day so far.</p>}
        </div>
      </section>
      {kt && <div class="stats">{tile('Rises', kt.onset)}{tile('High point', kt.peakAt)}{tile('Eases', kt.fade)}{tile('Rest', kt.clear)}</div>}
      <p class="disclaimer">Private view hides details. End it to see everything. {u > 0 && `It ends on its own ${fmtWhen(u, true)}.`}</p>
    </div>
  );
}

export const INCOGNITO_MAX_HOURS = 24 * HOUR;
