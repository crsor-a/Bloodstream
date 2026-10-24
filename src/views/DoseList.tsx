import { useState } from 'preact/hooks';
import { pct, pillSVG } from '../lib/pill';
import { fmtWhen, MIN, resolvePast, toHHMM } from '../lib/time';
import { now, regimen, removeDose, setDoseMeal, setDoseTime, sheetOpen, showToast, sweepToken } from '../state';
import { MealRow } from './DoseForm';
import type { Dose } from '../model/types';
import { doseTitle } from '../lib/names';

function Row(p: { d: Dose; open: boolean; onToggle: () => void; carried: boolean }) {
  const { d } = p;
  const t = now.value, reg = regimen.value;
  const planned = d.at > t;
  const [value, setValue] = useState(() => toHHMM(planned ? Date.now() : d.at));
  const [armed, setArmed] = useState(false);
  const target = resolvePast(value, d.at);
  const changed = Math.abs(target - d.at) >= MIN;

  const save = () => {
    setDoseTime(d.id, target);
    sweepToken.value++;
    showToast(`Updated to ${fmtWhen(target, true)}`);
    p.onToggle();
  };
  const remove = () => {
    if (!armed) { setArmed(true); return; }
    removeDose(d.id);
    showToast('Dose removed');
  };

  return (
    <div class="dose-row">
      <div class="dose-main">
        <div class="mini-pill" dangerouslySetInnerHTML={{ __html: pillSVG(d, { glow: false }) }} />
        <div class="dose-info">
          <b>{doseTitle(d)}{p.carried ? <span class="tag">Carry-over</span> : planned ? <span class="tag">Planned</span> : d.scheduleId ? <span class="tag">Scheduled</span> : null}</b>
          <span class="sub">{planned ? `Planned · ${fmtWhen(d.at, false, t)}${d.meal ? ' · with a meal' : ''} · not taken yet` : `${fmtWhen(d.at, false, t)}${d.meal ? ' · with a meal' : ''} · ${pct(reg.doseRemaining(d, t))} left`}</span>
        </div>
        <button type="button" class="pill-btn" aria-expanded={p.open} onClick={() => { setArmed(false); setValue(toHHMM(planned ? Date.now() : d.at)); p.onToggle(); }}>{p.open ? 'Done' : 'Edit'}</button>
      </div>
      {p.open && (
        <div class="dose-edit">
          <div class="edit-row">
            <label for={'edit-' + d.id}>{planned ? 'Took it at' : 'Actually taken at'}</label>
            <div class="time-wrap">
              <button type="button" class="mini" onClick={() => setValue(toHHMM(new Date()))}>Just now</button>
              <input type="time" id={'edit-' + d.id} value={value} onInput={e => { const v = (e.target as HTMLInputElement).value; if (v) setValue(v); }} />
            </div>
          </div>
          <p class="foot" style={{ margin: 0 }}>{changed ? `Will be logged as ${fmtWhen(target, true)}. Only times that have already happened can be saved.` : 'No change yet.'}</p>
          {d.kind === 'XR' && <div class="card list edit-meal"><MealRow id={'meal-' + d.id} checked={d.meal === 'highfat'} onChange={v => {
            setDoseMeal(d.id, v); showToast(v ? 'Marked as taken with a high-fat meal' : 'Meal removed from this dose');
          }} /></div>}
          <div class="edit-actions">
            <button type="button" class="btn-text danger" onClick={remove}>{armed ? 'Tap again to remove' : 'Remove dose'}</button>
            <button type="button" class="btn primary sm" disabled={!changed} style={changed ? undefined : { opacity: 0.4 }} onClick={save}>Save time</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DoseList() {
  const reg = regimen.value;
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = [...reg.doses].reverse();
  return (
    <section class="dsec reveal" style={{ '--d': 5 } as any} aria-labelledby="hDoses">
      <div class="sec-head"><h2 id="hDoses">Doses</h2></div>
      <div class="card">
        {rows.map(d => <Row key={d.id} d={d} carried={reg.carried.has(d)} open={openId === d.id} onToggle={() => setOpenId(openId === d.id ? null : d.id)} />)}
        <button type="button" class="add-row" onClick={() => { sheetOpen.value = true; }}>
          <span class="plus"><span><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span></span>Add another dose
        </button>
      </div>
      <p class="foot pad">Took it at a different time? Tap Edit to set the real time. Anything left from earlier doses stacks with new ones.</p>
    </section>
  );
}
