import type { PillLook, Shape } from '../model/types';

/** Vertical extents of each shape inside the 240×150 viewBox; used by the fade line. */
export const GEO: Record<Shape, { top: number; bot: number; x0: number; x1: number }> = {
  capsule: { top: 40, bot: 100, x0: 24, x1: 216 },
  round: { top: 16, bot: 124, x0: 66, x1: 174 },
  oval: { top: 24, bot: 116, x0: 34, x1: 206 }
};

let uid = 0;

function parts(lk: PillLook, id: string, sel?: 'L' | 'R' | null): string {
  const cL = lk.colors.L, cR = lk.mode === 'whole' ? lk.colors.L : lk.colors.R;
  const f = (c: string) => c === 'clear' ? `url(#${id}-beads)` : c;
  const edge = (c: string) => c === 'clear' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.2)';
  const shade = `url(#${id}-shade)`;
  const hl = (h: 'L' | 'R') => sel === h ? ' stroke="#ffffff" stroke-width="2.5"' : ' stroke="none"';
  if (lk.shape === 'capsule') {
    const body = 'M112,43 H189 A27,27 0 0 1 189,97 H112 Z';
    const cap = 'M54,40 H128 V100 H54 A30,30 0 0 1 54,40 Z';
    return `<g data-half="R"><path d="${body}" fill="${f(cR)}" stroke="${edge(cR)}" stroke-width="1"/><path d="${body}" fill="${shade}"/><path d="${body}" fill="none"${hl('R')}/></g>` +
      `<g data-half="L"><path d="${cap}" fill="${f(cL)}" stroke="${edge(cL)}" stroke-width="1"/><path d="${cap}" fill="${shade}"/>` +
      `<line x1="128" y1="41" x2="128" y2="99" stroke="rgba(0,0,0,.22)" stroke-width="1.5"/><line x1="126.5" y1="42" x2="126.5" y2="98" stroke="rgba(255,255,255,.18)" stroke-width="1"/>` +
      `<path d="${cap}" fill="none"${hl('L')}/></g>` +
      `<rect x="48" y="47" width="148" height="7" rx="3.5" fill="#fff" opacity=".22" pointer-events="none"/>`;
  }
  const round = lk.shape === 'round';
  const L = round ? 'M120,16 A54,54 0 0 0 120,124 Z' : 'M120,24 A86,46 0 0 0 120,116 Z';
  const R = round ? 'M120,16 A54,54 0 0 1 120,124 Z' : 'M120,24 A86,46 0 0 1 120,116 Z';
  const whole = round ? '<circle cx="120" cy="70" r="54"' : '<ellipse cx="120" cy="70" rx="86" ry="46"';
  const bevel = round ? '<circle cx="120" cy="70" r="47"' : '<ellipse cx="120" cy="70" rx="79" ry="39"';
  const y0 = round ? 22 : 30, y1 = round ? 118 : 110;
  return `<g data-half="L"><path d="${L}" fill="${f(cL)}" stroke="${edge(cL)}" stroke-width="1"/><path d="${L}" fill="none"${hl('L')}/></g>` +
    `<g data-half="R"><path d="${R}" fill="${f(cR)}" stroke="${edge(cR)}" stroke-width="1"/><path d="${R}" fill="none"${hl('R')}/></g>` +
    `${whole} fill="${shade}" pointer-events="none"/>` +
    `${bevel} fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.5" pointer-events="none"/>` +
    `<line x1="120" y1="${y0}" x2="120" y2="${y1}" stroke="rgba(0,0,0,.3)" stroke-width="2.4" pointer-events="none"/>` +
    `<line x1="121.6" y1="${y0}" x2="121.6" y2="${y1}" stroke="rgba(255,255,255,.14)" stroke-width="1" pointer-events="none"/>`;
}

export interface PillOpts { sel?: 'L' | 'R' | null; fade?: boolean; glow?: boolean }

/** Returns SVG markup for a pill. With `fade`, includes a clip rect + line that `applyFade` moves. */
export function pillSVG(lk: PillLook, o: PillOpts = {}): string {
  const id = 'pl' + (++uid);
  const g = GEO[lk.shape];
  const glowOn = o.glow !== false;
  const p = parts(lk, id, o.sel);
  const glowColor = lk.colors.L === 'clear' ? '#ffffff' : lk.colors.L;
  const defs = `<defs>
    <linearGradient id="${id}-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".3" stop-color="#fff" stop-opacity=".07"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
    <pattern id="${id}-beads" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="rgba(255,255,255,.08)"/><circle cx="3" cy="3" r="2.3" fill="rgba(255,255,255,.62)"/><circle cx="8" cy="7.5" r="1.9" fill="rgba(255,236,214,.5)"/></pattern>
    ${glowOn ? `<filter id="${id}-blur" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="7"/></filter>` : ''}
    ${o.fade ? `<clipPath id="${id}-clip"><rect class="fade-rect" x="0" y="${g.top}" width="240" height="160"/></clipPath>
    <linearGradient id="${id}-line" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".18" stop-color="#fff"/><stop offset=".82" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` : ''}
  </defs>`;
  const glow = glowOn ? `<ellipse cx="120" cy="${g.bot + 12}" rx="${(g.x1 - g.x0) / 2.6}" ry="6" fill="${glowColor}" opacity=".34" filter="url(#${id}-blur)"/>` : '';
  const body = o.fade
    ? `<g class="glow-g">${glow}</g><g opacity=".11">${p}</g><g clip-path="url(#${id}-clip)">${p}</g>` +
      `<g class="fade-line" transform="translate(0,${g.top})"><rect x="2" y="-.8" width="236" height="1.6" fill="url(#${id}-line)"/>` +
      `<text class="fade-label" x="236" y="-6" text-anchor="end" fill="#ffffff" font-size="11" font-weight="600" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif">100%</text></g>`
    : glow + p;
  return `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;overflow:visible" aria-hidden="true">${defs}${body}</svg>`;
}

/** Moves the fade line inside a pill rendered with `fade: true`. r = fraction remaining (0..1). */
export function applyFade(root: Element | null, shape: Shape, r: number) {
  if (!root) return;
  const g = GEO[shape];
  const y = g.top + (1 - r) * (g.bot - g.top);
  root.querySelector('.fade-rect')?.setAttribute('y', String(y));
  root.querySelector('.fade-line')?.setAttribute('transform', `translate(0,${y})`);
  const lab = root.querySelector('.fade-label'); if (lab) lab.textContent = Math.round(r * 100) + '%';
  const glow = root.querySelector<SVGGElement>('.glow-g'); if (glow) glow.style.opacity = String(0.2 + 0.8 * r);
}

export const COLORS: [string, string][] = [['White', '#f4f3ef'], ['Clear', 'clear'], ['Sky', '#9ccbff'], ['Blue', '#4a8cf0'], ['Peach', '#ffc196'], ['Orange', '#ff8f3a'],
  ['Yellow', '#ffd95e'], ['Pink', '#ff9fc6'], ['Mint', '#8fe3b3'], ['Lilac', '#bba9ff'], ['Gray', '#9b9ba3']];
export const DOSE_PRESETS = { IR: [5, 7.5, 10, 12.5, 15, 20, 30], XR: [5, 10, 15, 20, 25, 30] } as const;
/** 12.5 stays 12.5 (real dose strengths); other values over 10 round to whole mg. */
export const fmtMg = (v: number) => {
  if (v < 10) return String(Math.round(v * 10) / 10);
  const half = Math.round(v * 2) / 2;
  return Math.abs(v - half) < 0.05 && half % 1 !== 0 ? String(half) : String(Math.round(v));
};
export const pct = (v: number) => Math.round(Math.max(0, v) * 100) + '%';
export const shapeName = (s: Shape) => s === 'capsule' ? 'capsule' : 'tablet';
