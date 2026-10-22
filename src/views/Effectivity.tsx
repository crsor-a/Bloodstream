import { useState } from 'preact/hooks';
import { pct } from '../lib/pill';
import { fmtWhen, HOUR, occurrenceNear, toHHMM } from '../lib/time';
import { AREA_IDS, EFFECT_GROUPS, PHASES } from '../model/copy';
import { ctxAt, areaValue } from '../lib/area';
import { zoneFor, zoneColors, ZONE_EDGES, type ZoneKind } from '../lib/zones';
import { now, regimen } from '../state';
import { Segmented } from '../components/controls';
import { openArticle } from './Reader';

/** Smooth gradient through the zone colors, sized to the full track. */
function trackGradient(kind: ZoneKind) {
  const cs = zoneColors(kind);
  let a = 0;
  const stops = cs.map((c, i) => { const b = Math.min(1, ZONE_EDGES[i]); const mid = (a + b) / 2; a = b; return `${c} ${(mid * 100).toFixed(1)}%`; });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

function ZoneBar({ kind, v }: { kind: ZoneKind; v: number }) {
  const cs = zoneColors(kind);
  let a = 0;
  return (
    <div class="zbar" aria-hidden="true">
      <div class="zbar-segs">
        {cs.map((c, i) => { const b = Math.min(1, ZONE_EDGES[i]); const w = (b - a) * 100; a = b; return <span key={i} style={{ width: w + '%', background: c }} />; })}
      </div>
      <div class="zbar-fill" style={{ background: trackGradient(kind), clipPath: `inset(0 ${(100 - v * 100).toFixed(2)}% 0 0 round 4px)` }} />
      <i class="zbar-knob" style={{ left: (v * 100).toFixed(2) + '%', background: zoneFor(kind, v).color }} />
    </div>
  );
}

export function Effectivity() {
  const reg = regimen.value, t = now.value;
  const [mode, setMode] = useState<'now' | 'custom'>('now');
  const [custom, setCustom] = useState(() => toHHMM(new Date()));
  const [a, b] = reg.domain(t);
  const ts = mode === 'now' ? t : occurrenceNear(custom, a, b, t);
  const ph = reg.phaseAt(ts);
  const c = ctxAt(reg, ts);
  const pre = ph === 'pre';

  return (
    <section class="dsec reveal" style={{ '--d': 9 } as any} aria-labelledby="hEff">
      <div class="sec-head"><h2 id="hEff">Effectivity</h2></div>
      <div class="eff-ctrl">
        <Segmented label="When" value={mode} onChange={m => { setMode(m); if (m === 'custom') setCustom(toHHMM(new Date(t + HOUR))); }}
          options={[{ v: 'now', label: 'Right now' }, { v: 'custom', label: 'Custom time' }]} />
        {mode === 'custom' && <div class="row"><label for="effAt">Check at</label>
          <input type="time" id="effAt" value={custom} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setCustom(v); }} /></div>}
      </div>
      <div class="card eff-head">
        <div class="eff-top"><span class="badge">{PHASES[ph][0]}</span><span class="eff-at">{(mode === 'now' ? 'Now, ' : '') + fmtWhen(ts, false, t)}</span></div>
        <p class="eff-big">{pct(c.E)}<small>of full effect</small></p>
        <p class="eff-desc">{PHASES[ph][1]}{reg.takenMg(ts) ? ` About ${pct(reg.remainingFrac(ts))} of today's load is left.` : ''}</p>
      </div>
      {EFFECT_GROUPS.map(gr => (
        <div key={gr.group}>
          <div class="group-label">{gr.group}</div>
          <div class="card">
            {gr.items.map(it => {
              const kind = it.kind as ZoneKind;
              const v = areaValue(it, c);
              const z = zoneFor(kind, v);
              const id = AREA_IDS[it.name];
              return (
                <button type="button" class="eff-row" key={it.name} onClick={() => openArticle(id)} aria-label={`${it.name}: ${z.name}, ${Math.round(v * 100)}%. Open article`}>
                  <div class="eff-name">
                    <span class="eff-title">{it.name}<span class="eff-chev" aria-hidden="true" /></span>
                    <span class="eff-lvl" style={{ color: z.color }}>{z.name}<em>{Math.round(v * 100)}%</em></span>
                  </div>
                  <ZoneBar kind={kind} v={v} />
                  <p>{pre ? 'Nothing has been taken by this time, so this shows your baseline.' : it.text(c, ph)}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p class="foot pad">Seven zones run from red at your unmedicated baseline to green at full effect. Appetite suppression and physical stimulation run the other way, so green always means the settled side. Tap any area for an article that adapts to where you are right now.</p>
    </section>
  );
}
