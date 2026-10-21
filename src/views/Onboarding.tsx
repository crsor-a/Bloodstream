import { useEffect, useState } from 'preact/hooks';
import { pillSVG } from '../lib/pill';
import { greeting } from '../lib/time';
import { addDose, entering, flight, settings, view } from '../state';
import { prefersReducedMotion } from '../components/controls';
import { DoseForm, type FormResult } from './DoseForm';
import { Disclaimer } from './Dashboard';
import type { PillLook } from '../model/types';

const DEFAULT_LOOK: PillLook = { shape: 'capsule', mode: 'whole', colors: { L: '#ff8f3a', R: '#ff8f3a' } };

export function Onboarding() {
  const [page, setPage] = useState<1 | 2>(1);
  const [collapsed, setCollapsed] = useState<0 | 1 | 2>(2);   // which page is collapsed (height 0) after the slide
  const [leaving, setLeaving] = useState(false);
  const welcomeLook = settings.value.last ?? DEFAULT_LOOK;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const go = (n: 1 | 2) => {
    setCollapsed(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setPage(n)));
    setTimeout(() => { setCollapsed(n === 2 ? 1 : 2); window.scrollTo(0, 0); }, prefersReducedMotion() ? 20 : 580);
  };

  const submit = (r: FormResult) => {
    addDose(r.dose, { band: r.band, shapeTouched: r.shapeTouched });
    const rect = r.previewEl?.getBoundingClientRect();
    if (rect) flight.value = { rect, look: r.look };
    setLeaving(true);
    setTimeout(() => { entering.value = true; view.value = 'dash'; }, prefersReducedMotion() ? 0 : 280);
  };

  return (
    <section id="onboard" class={'arrive' + (leaving ? ' leaving' : '')} aria-label="Log your dose">
      <div class={'ob-track' + (page === 2 ? ' p2' : '')}>
        <div class={'ob-page' + (collapsed === 1 ? ' collapsed' : '')} id="ob1">
          <div class="ob1-art"><div id="welcomePill" class="float" dangerouslySetInnerHTML={{ __html: pillSVG(welcomeLook) }} /></div>
          <p class="eyebrow">{greeting()}</p>
          <h1 class="ob-title">{settings.value.seen ? 'Welcome back.' : 'Welcome to Bloodstream.'}</h1>
          <p class="ob-sub">Log today's dose and Bloodstream maps where it is right now, how strong it likely feels, and when it clears.</p>
          <ul class="ob-points">
            <li><span class="ic"><svg viewBox="0 0 24 24"><path d="M3 17c3 0 4-9 7-9s3 6 5 6 2-3 6-3" /></svg></span><div><strong>Live curve</strong><span>Blood level and felt effect, matched to your clock.</span></div></li>
            <li><span class="ic"><svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg></span><div><strong>Sleep check</strong><span>How much will still be active at bedtime.</span></div></li>
            <li><span class="ic"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h13" /></svg></span><div><strong>Function snapshot</strong><span>Focus, mood, appetite and more at any hour.</span></div></li>
          </ul>
          <div class="ob-foot">
            <div class="dots" aria-hidden="true"><i class="on" /><i /></div>
            <button class="btn primary" type="button" onClick={() => go(2)}>Continue</button>
          </div>
        </div>

        <div class={'ob-page' + (collapsed === 2 ? ' collapsed' : '')} id="ob2">
          <div class="ob2-head">
            <button class="back" type="button" onClick={() => go(1)}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>Back</button>
            <div class="dots" aria-hidden="true"><i /><i class="on" /></div>
          </div>
          <h1 class="large">Today's dose</h1>
          <DoseForm mode="onboard" onSubmit={submit} />
          <Disclaimer onboarding />
        </div>
      </div>
    </section>
  );
}
