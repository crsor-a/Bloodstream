import { useState } from 'preact/hooks';
import { pct } from '../lib/pill';
import { fmtWhen, HOUR, occurrenceNear, toHHMM } from '../lib/time';
import { EFFECT_GROUPS, levelWord, PHASES, type EffCtx } from '../model/copy';
import { now, regimen } from '../state';
import { Segmented } from '../components/controls';

export function Effectivity() {
  const reg = regimen.value, t = now.value;
  const [mode, setMode] = useState<'now' | 'custom'>('now');
  const [custom, setCustom] = useState(() => toHHMM(new Date()));
  const [a, b] = reg.domain(t);
  const ts = mode === 'now' ? t : occurrenceNear(custom, a, b, t);
  const ph = reg.phaseAt(ts);
  const kt = reg.keyTimes(t);
  const c: EffCtx = { E: reg.effectAt(ts), L: reg.levelAt(ts), I: reg.sleepAt(ts), rising: reg.risingAt(ts), afterPeak: ts >= kt.peakAt };

  return (
    <section class="dsec reveal" style={{ '--d': 8 } as any} aria-labelledby="hEff">
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
              const v = ph === 'pre' ? 0 : Math.min(1, Math.max(0, it.value(c)));
              return (
                <div class="eff-row" key={it.name}>
                  <div class="eff-name"><span>{it.name}</span><span class="eff-lvl">{ph === 'pre' ? 'Not yet' : levelWord(it.kind, v, c.I)}</span></div>
                  <div class={'bar' + (it.kind === 'focus' ? '' : ' soft')}><i style={{ width: Math.round(v * 100) + '%' }} /></div>
                  <p>{ph === 'pre' ? 'Nothing has been taken by this time.' : it.text(c, ph)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
