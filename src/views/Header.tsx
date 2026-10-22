import { fmtTime } from '../lib/time';
import { DISCLAIMER, greetingLine, greetingTitle } from '../model/copy';
import { incognito, incognitoSheet, loggingOn, logSheet, now, profile, regimen, sheetOpen } from '../state';

export const ICONS = {
  plus: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
  log: <svg viewBox="0 0 24 24"><path d="M8 4h8a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a2 2 0 0 1 2-2z" /><path d="M9.5 3h5v3h-5zM9 11h6M9 15h4" /></svg>,
  incognito: <svg viewBox="0 0 24 24"><path d="M3 12s3.2-6 9-6c1.6 0 3 .4 4.2 1M21 12s-3.2 6-9 6c-1.6 0-3-.4-4.2-1" /><path d="M9.9 14.1a3 3 0 0 1 4.2-4.2M4 20 20 4" /></svg>,
  drop: <svg viewBox="0 0 14 18" aria-hidden="true"><path d="M7 0C7 0 0 7.6 0 11.3A7 7 0 0 0 14 11.3C14 7.6 7 0 7 0Z" /></svg>
};

export function Disclaimer(p: { onboarding?: boolean }) {
  return <p class={p.onboarding ? 'ob-disclaimer' : 'disclaimer'}>{DISCLAIMER}</p>;
}

export function TopBar() {
  const inc = incognito.value;
  return (
    <header class="topbar">
      {inc
        ? <span class="brand neutral"><i class="brand-dot" aria-hidden="true" />Today</span>
        : <span class="brand">{ICONS.drop}Bloodstream</span>}
      <div class="top-right">
        <span class="clock">{fmtTime(now.value)}</span>
        {!inc && <button class="icon-btn" type="button" aria-label="Add dose" title="Add dose" onClick={() => { sheetOpen.value = true; }}>{ICONS.plus}</button>}
        {!inc && loggingOn.value && <button class="icon-btn" type="button" aria-label="Log for your doctor" title="Log for your doctor" onClick={() => { logSheet.value = {}; }}>{ICONS.log}</button>}
        <button class={'icon-btn' + (inc ? ' active' : '')} type="button" aria-label={inc ? 'Incognito is on' : 'Incognito'} title="Incognito" aria-pressed={inc}
          onClick={() => { incognitoSheet.value = true; }}>{ICONS.incognito}</button>
      </div>
    </header>
  );
}

/** Large title that changes through the day: "Good evening, Rauf" plus a line that follows the curve. */
export function Greeting() {
  const t = now.value, reg = regimen.value, inc = incognito.value;
  const name = inc ? '' : profile.value.name;
  const date = new Date(t).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  let line = '';
  if (!inc) {
    const hd = reg.empty ? undefined : reg.heroDose(t);
    const phase = reg.empty ? 'idle' : reg.isPlanned(t) ? 'planned' : reg.phaseAt(t);
    line = greetingLine({ phase, plannedAt: hd ? fmtTime(hd.at) : '', hour: new Date(t).getHours() });
  }
  return (
    <div class="greet">
      <p class="greet-date">{date}</p>
      <h1 class="greet-title">{greetingTitle(name, t)}</h1>
      {line && <p class="greet-line">{line}</p>}
    </div>
  );
}
