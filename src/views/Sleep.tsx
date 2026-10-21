import { fmtMg, pct } from '../lib/pill';
import { fmtWhen, HOUR, nextOccurrence } from '../lib/time';
import { sleepBand } from '../model/copy';
import { now, regimen, setSleep, settings } from '../state';

const C = 2 * Math.PI * 40;

export function Sleep() {
  const reg = regimen.value, t = now.value;
  const bed = nextOccurrence(settings.value.sleep, Math.max(reg.session[0].at, t - 2 * HOUR));
  const i = reg.sleepAt(bed);
  const band = sleepBand(i);
  const kt = reg.keyTimes(t);
  let foot = `At ${fmtWhen(bed, true, t)}, about ${pct(reg.remainingFrac(bed))} (${fmtMg(reg.remainingMg(bed))} mg) will still be in your system.`;
  if (kt.clear != null) foot += bed >= kt.clear
    ? ` Interference drops under 10% around ${fmtWhen(kt.clear, true, t)}, so your planned time is already past that point.`
    : ` Interference drops under 10% around ${fmtWhen(kt.clear, true, t)}.`;

  return (
    <section class="dsec reveal" style={{ '--d': 7 } as any} aria-labelledby="hSleep">
      <div class="sec-head"><h2 id="hSleep">Sleep interference</h2></div>
      <div class="card list">
        <div class="row"><label for="sleepAt">Planned sleep</label>
          <input type="time" id="sleepAt" value={settings.value.sleep} onInput={e => setSleep((e.target as HTMLInputElement).value)} />
        </div>
      </div>
      <div class="card" style={{ marginTop: '10px' }}>
        <div class="sleep-body">
          <div class="gauge">
            <svg viewBox="0 0 100 100" role="img" aria-label={`${i}% sleep interference`}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(118,118,128,.24)" stroke-width="10" />
              <circle class="ring" cx="50" cy="50" r="40" fill="none" stroke={band.color} stroke-width="10" stroke-linecap="round"
                stroke-dasharray={C.toFixed(1)} stroke-dashoffset={(C * (1 - i / 100)).toFixed(1)} transform="rotate(-90 50 50)" />
              <text x="50" y="53" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="700" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif">{i}%</text>
              <text x="50" y="67" text-anchor="middle" fill="rgba(235,235,245,.62)" font-size="8.5" font-weight="600" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif">INTERFERENCE</text>
            </svg>
          </div>
          <div class="sleep-copy"><p class="band" style={{ color: band.color }}>{band.name}</p><p>{band.text}</p></div>
        </div>
        <p class="sleep-foot">{foot}</p>
      </div>
    </section>
  );
}
