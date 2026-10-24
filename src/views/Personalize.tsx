import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { conc, peak } from '../model/pk';
import type { Body } from '../model/types';
import { carryOver24, cyclePhase, doseParams, type Confidence, type Physio } from '../model/physio';
import { now, personalizeOpen, physio, profile, setBand, setBody, showToast } from '../state';
import { Segmented, Switch, useOverlay } from '../components/controls';
import { SRC } from '../content/sources';
import { BAND_OPTIONS } from '../model/copy';
import { parseWeight, weightText } from '../lib/units';
import { openArticle } from './Reader';

const TAG: Record<Confidence, string> = { label: 'FDA label', study: 'Published study', estimate: 'Estimate', note: 'No curve change' };
const RENAL: { v: Body['renal']; label: string }[] = [
  { v: 'unknown', label: 'Don\'t know' }, { v: 'normal', label: 'Normal' }, { v: 'mild', label: 'Mild' },
  { v: 'moderate', label: 'Moderate' }, { v: 'severe', label: 'Severe' }, { v: 'failure', label: 'Kidney failure' }
];
const fmtH = (h: number) => (Math.round(h * 10) / 10).toFixed(1) + ' h';

/** Typical vs personalized XR 20 mg curve, with the personal range shaded. */
function CompareCurve({ ph }: { ph: Physio }) {
  const W = 320, H = 120, PL = 6, PR = 6, PT = 10, PB = 18, HRS = 36, N = 144;
  const d = useMemo(() => {
    const pT = { band: ph.band, hl: 1, abs: 'std' as const };
    const pY = doseParams(ph, 'XR');
    const pLo = doseParams(ph, 'XR', false, ph.hlRange[0]), pHi = doseParams(ph, 'XR', false, ph.hlRange[1]);
    const ref = peak('XR', pT).c;
    const pts = Array.from({ length: N + 1 }, (_, i) => {
      const t = i / N * HRS;
      return { t, a: conc('XR', t, pT) / ref, y: conc('XR', t, pY) / ref, lo: conc('XR', t, pLo) / ref, hi: conc('XR', t, pHi) / ref };
    });
    const top = Math.max(1.1, ...pts.map(p => p.hi)) * 1.05;
    const X = (t: number) => PL + t / HRS * (W - PL - PR);
    const Y = (v: number) => PT + (1 - v / top) * (H - PT - PB);
    const line = (k: 'a' | 'y') => pts.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ',' + Y(p[k]).toFixed(1)).join('');
    const band = pts.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ',' + Y(p.hi).toFixed(1)).join('')
      + pts.slice().reverse().map(p => 'L' + X(p.t).toFixed(1) + ',' + Y(p.lo).toFixed(1)).join('') + 'Z';
    const ticks = [0, 6, 12, 18, 24, 30, 36].map(h => ({ x: X(h), h }));
    return { dT: line('a'), dY: line('y'), band, ticks, Y };
  }, [ph]);
  return (
    <svg class="viz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Typical curve compared with your personalized curve">
      <path d={d.band} fill="rgba(255,255,255,.12)" />
      <line x1={PL} x2={W - PR} y1={d.Y(0)} y2={d.Y(0)} class="viz-axis" />
      {d.ticks.map(t => <text key={t.h} class="viz-t dim" x={t.x} y={H - 4} text-anchor={t.h === 0 ? 'start' : t.h === 36 ? 'end' : 'middle'}>{t.h} h</text>)}
      <path d={d.dT} class="viz-dash" />
      <path d={d.dY} class="viz-line" />
    </svg>
  );
}

function Summary({ ph }: { ph: Physio }) {
  const c = carryOver24(ph), cLo = carryOver24(ph, 'XR', ph.hlRange[0]), cHi = carryOver24(ph, 'XR', ph.hlRange[1]);
  const changed = ph.factors.length > 0;
  const baseD = ph.halfLives.d / ph.hl;
  return (
    <div class="card pz-summary">
      <div class="pz-hl">
        <div><span class="pz-k">d-amphetamine</span><b>{fmtH(ph.halfLives.d)}</b><small>half-life</small></div>
        <div><span class="pz-k">l-amphetamine</span><b>{fmtH(ph.halfLives.l)}</b><small>half-life</small></div>
      </div>
      <p class="pz-range">Typical range for d: {fmtH(baseD * ph.hlRange[0])} to {fmtH(baseD * ph.hlRange[1])}. About {Math.round(c * 100)}% of an XR dose is still in the body after 24 hours ({Math.round(cLo * 100)}–{Math.round(cHi * 100)}%).</p>
      <CompareCurve ph={ph} />
      <div class="viz-legend under"><span><i class="lg-dash" />Label average{ph.band === 'senior' ? ' (adult)' : ''}</span><span><i class="lg-solid" />You</span><span><i class="pz-band" />Your typical range</span></div>
      <p class="pz-note">{changed ? 'XR 20 mg shown for comparison. Your own doses use the same settings.' : 'Nothing personalized yet, so you match the label averages. The shaded range is how much people normally differ, mostly from day-to-day urine acidity.'}</p>
    </div>
  );
}

function Factors({ ph }: { ph: Physio }) {
  if (!ph.factors.length) return null;
  return (
    <>
      <div class="group-label">What's shaping your curve</div>
      <div class="card pz-factors">
        {ph.factors.map(f => (
          <div class="pz-factor" key={f.id}>
            <div class="pz-factor-head"><b>{f.title}</b><span class={'pz-tag ' + f.confidence}>{TAG[f.confidence]}</span></div>
            <p>{f.effect}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function WeightRow() {
  const b = profile.value.body;
  const shown = weightText(b.weightKg, b.units);
  const [v, setV] = useState(shown);
  useEffect(() => { setV(shown); }, [b.weightKg, b.units]);
  const commit = () => {
    const kg = parseWeight(v, b.units);
    if (kg === null) { if (b.weightKg != null) { setBody({ weightKg: null }); showToast('Weight removed'); } return; }
    if (Number.isNaN(kg)) { showToast(b.units === 'lb' ? 'Enter a weight between 33 and 550 lb' : 'Enter a weight between 15 and 250 kg'); setV(shown); return; }
    if (kg !== b.weightKg) { setBody({ weightKg: kg }); showToast('Weight saved'); }
  };
  return (
    <div class="row">
      <label for="pzW">Weight</label>
      <div class="pz-weight">
        <input id="pzW" class="text-input num" type="text" inputMode="decimal" placeholder="Optional" value={v}
          onInput={e => setV((e.target as HTMLInputElement).value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        <div class="pz-units"><Segmented label="Weight units" value={b.units} onChange={u => setBody({ units: u })} options={[{ v: 'kg', label: 'kg' }, { v: 'lb', label: 'lb' }]} /></div>
      </div>
    </div>
  );
}

function Toggle({ id, title, sub, checked, onChange }: { id: string; title: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div class="row">
      <div class="row-text"><label for={id}>{title}</label><small>{sub}</small></div>
      <Switch id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

function Cycle() {
  const b = profile.value.body, c = b.cycle;
  const info = cyclePhase(b, now.value);
  const today = new Date(now.value);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return (
    <>
      <div class="group-label">Menstrual cycle</div>
      <div class="card list">
        <Toggle id="pzCycle" title="Show my cycle phase" sub="Information only. It doesn't change your curve." checked={c.enabled} onChange={v => setBody({ cycle: { ...c, enabled: v, start: c.start ?? (v ? iso(today) : null) } })} />
        {c.enabled && <>
          <div class="row"><label for="pzStart">Last period started</label>
            <input type="date" id="pzStart" max={iso(today)} value={c.start ?? ''} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setBody({ cycle: { ...c, start: v } }); }} /></div>
          <div class="row">
            <span>Cycle length</span>
            <div class="stepper">
              <button type="button" aria-label="Shorter cycle" onClick={() => setBody({ cycle: { ...c, length: Math.max(21, c.length - 1) } })}>&minus;</button>
              <output aria-live="polite">{c.length} days</output>
              <button type="button" aria-label="Longer cycle" onClick={() => setBody({ cycle: { ...c, length: Math.min(40, c.length + 1) } })}>+</button>
            </div>
          </div>
          <Toggle id="pzHormonal" title="Hormonal birth control" sub="Pill, patch, ring, implant or hormonal IUD" checked={c.hormonal} onChange={v => setBody({ cycle: { ...c, hormonal: v } })} />
        </>}
      </div>
      {c.enabled && <p class="foot pad">{c.hormonal
        ? 'With hormonal birth control there is no natural cycle phase to show.'
        : info
          ? `Day ${info.day} of ${info.length}: ${info.phase === 'luteal' ? 'luteal phase' : info.phase === 'menstrual' ? 'period (early follicular phase)' : 'follicular phase'}. `
            + 'In small lab studies of healthy women, some effects of d-amphetamine were stronger in the follicular phase than the luteal phase, while a study comparing early and late follicular days found most effects unchanged. Because the evidence is limited and wasn\'t measured in ADHD treatment, Bloodstream only notes the phase.'
          : 'Set the date your last period started.'}</p>}
    </>
  );
}

export function PersonalizeViewer() {
  const open = personalizeOpen.value;
  const { mounted, shown } = useOverlay(open);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open && ref.current) ref.current.scrollTop = 0; }, [open]);
  if (!mounted) return null;
  const b = profile.value.body, ph = physio.value;
  const showFemale = b.sex === 'female' || b.sex === 'other';
  const sources = [SRC.XR_PK, SRC.XR_PPI, SRC.HC_MONO, SRC.VYVANSE, SRC.ANGGARD, SRC.GUNNE, SRC.PENCZYNSKI, SRC.ALLOMETRY, SRC.FDA_XR, SRC.FDA_IR, SRC.WHITE_2002, SRC.JUSTICE_2000];
  return (
    <div ref={ref} class={'viewer personalize' + (shown ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Body and medicines">
      <div class="viewer-bar">
        <button class="back" type="button" onClick={() => { personalizeOpen.value = false; }}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>Done</button>
        <span class="viewer-title">Body & medicines</span>
        <span />
      </div>
      <div class="viewer-body">
        <div class="pz-intro">
          <h1 class="large">Personalize your curve</h1>
          <p class="sheet-sub">Optional details that change how Bloodstream estimates absorption and clearance. Only effects with published numbers move the curve; the rest widen the range or add a note. Everything stays on this device.</p>
        </div>
        <Summary ph={ph} />
        <Factors ph={ph} />

        <div class="group-label">Body</div>
        <div class="card list">
          <WeightRow />
          <div class="row col">
            <span class="row-label">Age group</span>
            <Segmented label="Age group" value={profile.value.band} onChange={v => setBand(v)} options={BAND_OPTIONS} />
          </div>
          <div class="row col">
            <span class="row-label">Sex</span>
            <Segmented label="Sex" value={b.sex ?? 'skip'} onChange={v => setBody({ sex: v === 'skip' ? null : v, ...(v === 'male' ? { pregnant: false } : {}) })}
              options={[{ v: 'female', label: 'Female' }, { v: 'male', label: 'Male' }, { v: 'other', label: 'Other' }, { v: 'skip', label: 'Skip' }]} />
          </div>
        </div>
        <p class="foot pad">Weight is the main reason people's levels differ: in the label's study women had 20–30% higher levels than men, a gap that shrank once doses were compared per kilogram, and it found no direct effect of sex or age. Older adults weren't studied, so 65+ uses adult values with a wider range.</p>

        <div class="group-label">Kidney function</div>
        <div class="card list"><div class="row col">
          <div class="chips tight">{RENAL.map(r => <button key={r.v} type="button" class={'chip' + (b.renal === r.v ? ' on' : '')} onClick={() => setBody({ renal: r.v })}>{r.label}</button>)}</div>
        </div></div>
        <p class="foot pad">Kidneys clear about a third of each dose unchanged. Severe impairment (GFR 15–29) and kidney failure (under 15 or dialysis) come from a measured clearance study. Mild (60–89) and moderate (30–59) have no published numbers, so they only widen the range.</p>

        <div class="group-label">Diet</div>
        <div class="card list"><div class="row col">
          <Segmented label="Usual diet" value={b.diet} onChange={v => setBody({ diet: v })} options={[{ v: 'mixed', label: 'Mixed or meat-eating' }, { v: 'plant', label: 'Mostly plant-based' }]} />
        </div></div>
        <p class="foot pad">Urine acidity is the biggest everyday influence on how fast amphetamine leaves: each unit of urine pH changed the half-life by about 7 hours in clinical studies. A 24-hour urine study found pH 6.7 in vegans vs 6.2 in omnivores, so plant-based diets tend to make doses linger. Meals matter for XR timing too: with a high-fat meal it peaks about 2.5 hours later, with the same total amount. Mark those doses when you log, or later from the dose's Edit button.</p>

        <div class="group-label">Medicines you take regularly</div>
        <div class="card list">
          <div class="row col">
            <span class="row-label">Medicines that change urine acidity</span>
            <div class="chips tight">
              {([['none', 'None'], ['alkaline', 'Make it less acidic'], ['acidic', 'Make it more acidic']] as const).map(([v, l]) =>
                <button key={v} type="button" class={'chip' + (b.urine === v ? ' on' : '')} onClick={() => setBody({ urine: v })}>{l}</button>)}
            </div>
            <p class="foot">Examples from the label. Less acidic: acetazolamide, some thiazide diuretics, sodium bicarbonate taken regularly. More acidic: ammonium chloride, sodium acid phosphate, methenamine. The label advises against combining Adderall with alkalinizing agents, so ask your prescriber before starting one.</p>
          </div>
          <Toggle id="pzPpi" title="Daily acid reducer (PPI)" sub="Omeprazole, esomeprazole, lansoprazole, pantoprazole" checked={b.ppi} onChange={v => setBody({ ppi: v })} />
          <Toggle id="pzCyp" title="Strong CYP2D6 inhibitor" sub="Fluoxetine, paroxetine, quinidine, ritonavir" checked={b.cyp2d6} onChange={v => setBody({ cyp2d6: v })} />
          <Toggle id="pzSero" title="Serotonergic medicine" sub="SSRIs, SNRIs, triptans, tricyclics, tramadol, fentanyl, lithium, buspirone, St. John's wort" checked={b.serotonergic} onChange={v => setBody({ serotonergic: v })} />
          <Toggle id="pzMaoi" title="MAOI in the last 14 days" sub="Phenelzine, tranylcypromine, isocarboxazid, selegiline, linezolid, methylene blue" checked={b.maoi} onChange={v => setBody({ maoi: v })} />
        </div>
        {b.maoi && <div class="callout urgent pz-callout"><b>Don't combine these</b><p>Amphetamine must not be taken with an MAOI or within 14 days of stopping one, because blood pressure can spike dangerously. Contact your prescriber before your next dose.</p></div>}
        {b.serotonergic && !b.maoi && <div class="callout warn pz-callout"><b>Know the warning signs</b><p>The label warns about serotonin syndrome with these combinations: agitation, sweating, a fast heartbeat, muscle twitching or stiffness, and fever. Get emergency care if they appear. <button type="button" class="u-link" onClick={() => openArticle('interactions')}>Read more</button></p></div>}

        <div class="group-label">Health</div>
        <div class="card list">
          <Toggle id="pzLiver" title="Liver disease" sub="Not studied with amphetamine; widens the range" checked={b.liver} onChange={v => setBody({ liver: v })} />
          {showFemale && <Toggle id="pzPreg" title="Pregnant or breastfeeding" sub="Can't be modeled; widens the range and adds a note" checked={b.pregnant} onChange={v => setBody({ pregnant: v })} />}
        </div>

        {showFemale && <Cycle />}

        <details class="method pz-not">
          <summary>What Bloodstream doesn't model, and why</summary>
          <ul>
            <li><b>Caffeine, nicotine, alcohol, cannabis.</b> No reliable evidence that they change amphetamine levels. Caffeine and nicotine add to heart rate and jitteriness; the FDA advises against mixing stimulants with alcohol.</li>
            <li><b>Vitamin C, juice, antacids taken occasionally.</b> The labels say acidifying agents lower levels and alkalinizing agents raise them, but there are no numbers for everyday amounts.</li>
            <li><b>Food with IR tablets.</b> The tablet label says the food effect hasn't been studied.</li>
            <li><b>Sleep loss, stress, illness, hydration, exercise.</b> They change how a dose feels, but there are no measured effects on amphetamine levels to model.</li>
            <li><b>Genetics.</b> CYP2D6 handles only a minor pathway, and response genes like COMT and DAT1 have inconsistent results. CES1 matters for methylphenidate, not amphetamine.</li>
            <li><b>Switching generic brands.</b> Generics must fall within the FDA's 80–125% bioequivalence range, so averages match, but you may notice a difference.</li>
          </ul>
        </details>
        <div class="callout info pz-callout"><b>Describe, don't adjust</b><p>These settings describe your situation so the estimate fits better. Don't start or stop medicines, change your diet, or take supplements or antacids to change how strong or how long Adderall feels. If timing or strength isn't working, talk to your prescriber. <button type="button" class="u-link" onClick={() => openArticle('curve-factors')}>What shapes your curve</button></p></div>
        <section class="art-sources pz-sources" aria-label="Sources">
          <h3>Sources</h3>
          <ol>{sources.map(s => <li key={s.u}><a href={s.u} target="_blank" rel="noopener">{s.t}</a></li>)}</ol>
        </section>
      </div>
    </div>
  );
}
