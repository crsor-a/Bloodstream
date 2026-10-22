import { useState } from 'preact/hooks';
import type { EffectId } from '../model/types';
import { now, setTheme, settings, showToast } from '../state';
import { approxLocation, sunPosition, sunTimes } from '../lib/sun';
import { fmtTime } from '../lib/time';
import { Switch } from '../components/controls';

const EFFECT_INFO: { id: EffectId; name: string; sub: string; preview: string }[] = [
  { id: 'none', name: 'Black', sub: 'Classic', preview: '#000' },
  { id: 'sky', name: 'Living sky', sub: 'Follows the sun', preview: 'linear-gradient(to top, #ffb070 0%, #6fa4e8 45%, #1d4fa8 100%)' },
  { id: 'aurora', name: 'Aurora', sub: 'Northern lights', preview: 'radial-gradient(90% 55% at 50% 72%, rgba(40,235,150,.75), transparent 62%), radial-gradient(60% 30% at 60% 40%, rgba(150,70,230,.5), transparent), #01040a' },
  { id: 'rain', name: 'Rain on glass', sub: 'City lights', preview: 'radial-gradient(22% 14% at 30% 35%, rgba(255,150,70,.7), transparent), radial-gradient(18% 12% at 70% 55%, rgba(90,150,255,.6), transparent), radial-gradient(14% 9% at 55% 25%, rgba(255,70,60,.55), transparent), linear-gradient(#141b2c, #070a12)' },
  { id: 'snow', name: 'Snowfall', sub: 'Moonlit', preview: 'radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(3px 3px at 60% 60%, #fff, transparent), radial-gradient(2px 2px at 80% 20%, #fff, transparent), radial-gradient(3px 3px at 35% 75%, #eef, transparent), radial-gradient(50% 30% at 80% 8%, rgba(190,200,220,.4), transparent), linear-gradient(#040710, #1a2030)' },
  { id: 'nebula', name: 'Nebula', sub: 'Deep space', preview: 'radial-gradient(50% 40% at 40% 40%, rgba(190,40,160,.75), transparent), radial-gradient(45% 40% at 65% 62%, rgba(40,90,230,.7), transparent), radial-gradient(1.5px 1.5px at 25% 70%, #fff, transparent), radial-gradient(1.5px 1.5px at 75% 25%, #fff, transparent), #030210' },
  { id: 'gradient', name: 'Gradient', sub: 'Your colors', preview: '' },
  { id: 'solid', name: 'Solid', sub: 'One color', preview: '' }
];

function SkyStatus() {
  const th = settings.value.theme, t = now.value;
  const loc = th.location ?? approxLocation(t);
  const sun = sunPosition(t, loc.lat, loc.lon);
  const { rise, set } = sunTimes(t, loc.lat, loc.lon);
  const e = sun.elevation;
  const state = e > 6 ? 'Daytime' : e > -0.8 ? (t < (rise ?? 0) + 6 * 3600_000 ? 'Sunrise' : 'Sunset') : e > -6 ? 'Twilight' : e > -12 ? 'Dusk' : 'Night';
  return <span>{state} · sun {Math.round(e)}° {e >= 0 ? 'up' : 'below the horizon'}{rise && set ? ` · rises ${fmtTime(rise)}, sets ${fmtTime(set)}` : ''}</span>;
}

export function Appearance() {
  const th = settings.value.theme;
  const [locating, setLocating] = useState(false);
  const pick = (id: EffectId) => setTheme({ effect: id });
  const locate = () => {
    if (!navigator.geolocation) { showToast('Location isn\'t available here'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p => {
      setLocating(false);
      // Rounded to about 10 km: enough for sunrise and sunset, without storing an exact location.
      setTheme({ location: { lat: Math.round(p.coords.latitude * 10) / 10, lon: Math.round(p.coords.longitude * 10) / 10, label: 'Your location' } });
      showToast('Sky now follows your local sun');
    }, () => { setLocating(false); showToast('Couldn\'t get your location'); }, { maximumAge: 3600_000, timeout: 10_000 });
  };
  const setColor = (i: number, v: string) => { const c = [...th.colors]; c[i] = v; setTheme({ colors: c }); };
  const grad = `linear-gradient(135deg, ${th.colors.join(', ')})`;

  return (
    <section class="dsec reveal" style={{ '--d': 11 } as any} aria-labelledby="hLook">
      <div class="sec-head"><h2 id="hLook">Appearance</h2></div>
      <div class="fx-grid" role="radiogroup" aria-label="Background">
        {EFFECT_INFO.map(e => (
          <button key={e.id} type="button" role="radio" aria-checked={th.effect === e.id} class={'fx' + (th.effect === e.id ? ' on' : '')} onClick={() => pick(e.id)}>
            <span class="fx-prev" style={{ background: e.id === 'gradient' ? grad : e.id === 'solid' ? th.colors[0] : e.preview }} />
            <b>{e.name}</b><small>{e.sub}</small>
          </button>
        ))}
      </div>
      {th.effect !== 'none' && (
        <div class="card list" style={{ marginTop: '12px' }}>
          {th.effect === 'sky' && <div class="row col">
            <div class="row-head"><span>Sky</span><button type="button" class="mini" onClick={th.location ? () => setTheme({ location: null }) : locate} disabled={locating}>
              {locating ? 'Locating...' : th.location ? 'Use time zone instead' : 'Use my location'}</button></div>
            <small class="fx-note"><SkyStatus /></small>
            <small class="fx-note">{th.location ? 'Using your approximate location, stored only on this device.' : 'Estimated from your time zone. Share your location for exact sunrise and sunset.'}</small>
          </div>}
          {th.effect === 'gradient' && <div class="row">
            <span>Colors</span>
            <div class="color-row">{[0, 1, 2].map(i => <label key={i} class="color-sw" style={{ background: th.colors[i] ?? '#333' }}><input type="color" aria-label={`Color ${i + 1}`} value={th.colors[i] ?? '#333333'} onInput={e => setColor(i, (e.target as HTMLInputElement).value)} /></label>)}</div>
          </div>}
          {th.effect === 'solid' && <div class="row">
            <span>Color</span>
            <label class="color-sw" style={{ background: th.colors[0] }}><input type="color" aria-label="Background color" value={th.colors[0]} onInput={e => setColor(0, (e.target as HTMLInputElement).value)} /></label>
          </div>}
          <div class="row col">
            <div class="row-head"><label for="dimR">Dim background</label><span class="fx-val">{Math.round(th.dim * 100)}%</span></div>
            <input id="dimR" class="range" type="range" min="0" max="0.75" step="0.05" value={th.dim} onInput={e => setTheme({ dim: Number((e.target as HTMLInputElement).value) })} />
          </div>
          {th.effect !== 'solid' && <div class="row">
            <div class="row-text"><label for="motionSw">Motion</label><small>Turn off to save battery. The sky still follows the clock.</small></div>
            <Switch id="motionSw" checked={th.motion} onChange={v => setTheme({ motion: v })} />
          </div>}
        </div>
      )}
      <p class="foot pad">Backgrounds are drawn live on your device and make cards translucent. They pause in the background, follow your device's reduced-motion setting, and switch off in incognito.</p>
    </section>
  );
}
