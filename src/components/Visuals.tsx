import type { ComponentChildren } from 'preact';
import { useMemo } from 'preact/hooks';
import type { Visual } from '../content/types';
import { effect, level } from '../model/pk';
import { ZONE_COLORS, ZONE_EDGES, zoneNames } from '../lib/zones';

/** Inline text: **bold** and {tokens}. */
export function Rich({ t, tokens }: { t: string; tokens?: Record<string, string> }) {
  const filled = tokens ? t.replace(/\{(\w+)\}/g, (m, k) => tokens[k] ?? m) : t;
  const parts = filled.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((s, i) => s.startsWith('**') && s.endsWith('**') ? <strong key={i}>{s.slice(2, -2)}</strong> : s)}</>;
}

const LADDER = { emergency: '#ff453a', stop: '#ff6b3d', soon: '#ff9f0a', mention: 'rgba(235,235,245,.6)' } as const;
const TONE = { ok: '#30d158', mid: '#ffd60a', warn: '#ff9f0a', bad: '#ff453a' } as const;

function Frame({ title, children, cls }: { title?: string; children: ComponentChildren; cls?: string }) {
  return <div class={'viz' + (cls ? ' ' + cls : '')}>{title && <div class="viz-title">{title}</div>}{children}</div>;
}

function Bars({ v }: { v: Extract<Visual, { type: 'bars' }> }) {
  const max = Math.max(...v.rows.flatMap(r => [r.a, r.b ?? 0]));
  const top = max <= 10 ? 10 : max <= 40 ? Math.ceil(max / 10) * 10 : Math.ceil(max / 50) * 50;
  const unit = v.unit === '%' ? '%' : v.unit ? ' ' + v.unit : '';
  return (
    <Frame title={v.title}>
      {v.legend && <div class="viz-legend"><span><i class="sw-a" />{v.legend[0]}</span><span><i class="sw-b" />{v.legend[1]}</span></div>}
      <div class="bars">
        {v.rows.map(r => (
          <div class="bars-row" key={r.label}>
            <div class="bars-label">{r.label}</div>
            <div class="bars-track">
              <div class="bars-bar a" style={{ width: (r.a / top * 100) + '%' }}><span>{r.a}{unit}</span></div>
              {r.b !== undefined && <div class="bars-bar b" style={{ width: Math.max(0.6, r.b / top * 100) + '%' }}><span>{r.b}{unit}</span></div>}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Curve({ v }: { v: Extract<Visual, { type: 'curve' }> }) {
  const W = 340, H = 170, PL = 10, PR = 10, PT = 26, PB = 22;
  const hours = v.hours ?? (v.kind === 'IR' ? 14 : 20);
  const mg = v.kind === 'IR' ? 10 : 20;
  const show = v.show ?? 'both';
  const d = useMemo(() => {
    const N = 160, X = (t: number) => PL + t / hours * (W - PL - PR), Y = (y: number) => PT + (1 - y / 1.08) * (H - PT - PB);
    let dl = '', de = '';
    for (let i = 0; i <= N; i++) {
      const t = i / N * hours;
      dl += (i ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(level(v.kind, t)).toFixed(1);
      de += (i ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(effect(v.kind, mg, t)).toFixed(1);
    }
    const area = dl + `L${X(hours)},${Y(0)}L${X(0)},${Y(0)}Z`;
    const ticks: number[] = []; const step = hours > 16 ? 4 : 2;
    for (let t = step; t < hours; t += step) ticks.push(t);
    return { X, Y, dl, de, area, ticks };
  }, [v.kind, hours]);
  const { X, Y } = d;
  return (
    <Frame title={v.title}>
      <svg class="viz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Typical ${v.kind} curve`}>
        <defs><linearGradient id={'vg' + v.kind} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient></defs>
        {v.band && <g>
          <rect x={X(v.band.from)} y={PT - 4} width={X(v.band.to) - X(v.band.from)} height={Y(0) - PT + 4} fill="rgba(255,159,10,.14)" rx="4" />
          <text class="viz-t" x={(X(v.band.from) + X(v.band.to)) / 2} y={PT - 9} text-anchor="middle" fill="#ff9f0a">{v.band.label}</text>
        </g>}
        <line x1={PL} x2={W - PR} y1={Y(0)} y2={Y(0)} class="viz-axis" />
        {d.ticks.map(t => <g key={t}><line x1={X(t)} x2={X(t)} y1={Y(0)} y2={Y(0) + 4} class="viz-axis" /><text class="viz-t dim" x={X(t)} y={H - 6} text-anchor="middle">{t} h</text></g>)}
        {show !== 'effect' && <><path d={d.area} fill={`url(#vg${v.kind})`} /><path d={d.dl} class="viz-line" /></>}
        {show !== 'level' && <path d={d.de} class={show === 'effect' ? 'viz-line' : 'viz-dash'} />}
        {v.threshold && <g><line x1={PL} x2={W - PR} y1={Y(v.threshold.y)} y2={Y(v.threshold.y)} class="viz-thr" /><text class="viz-t" x={W - PR} y={Y(v.threshold.y) - 5} text-anchor="end">{v.threshold.label}</text></g>}
        {(v.marks ?? []).map((m, i) => {
          const x = X(m.h), end = x > W - 70;
          return <g key={i}><line x1={x} x2={x} y1={PT + 2} y2={Y(0)} class="viz-mark" /><text class="viz-t strong" x={x + (end ? -4 : 4)} y={PT + 10 + (i % 2) * 12} text-anchor={end ? 'end' : 'start'}>{m.label}</text></g>;
        })}
      </svg>
      <div class="viz-legend under">
        {show !== 'effect' && <span><i class="lg-solid" />Blood level</span>}
        {show !== 'level' && <span><i class={show === 'effect' ? 'lg-solid' : 'lg-dash'} />Felt effect</span>}
        <span class="dim">Typical adult, {v.kind} {mg} mg</span>
      </div>
    </Frame>
  );
}

function Ladder({ v }: { v: Extract<Visual, { type: 'ladder' }> }) {
  return (
    <Frame cls="ladder">
      {v.steps.map(s => (
        <div class="ladder-step" key={s.title} style={{ '--c': LADDER[s.level] } as any}>
          <span class="ladder-dot" aria-hidden="true" />
          <div><b>{s.title}</b><p>{s.t}</p></div>
        </div>
      ))}
    </Frame>
  );
}

const fmtH = (h: number) => { const hr = Math.floor(h) % 24, m = Math.round((h % 1) * 60); const h12 = hr % 12 || 12; return h12 + (m ? ':' + String(m).padStart(2, '0') : '') + (hr < 12 ? 'a' : 'p'); };
function Day({ v }: { v: Extract<Visual, { type: 'day' }> }) {
  const W = 340, H = 120, PL = 12, PR = 12, AX = 70;
  const X = (h: number) => PL + (h - v.from) / (v.to - v.from) * (W - PL - PR);
  const ticks: number[] = []; for (let h = Math.ceil(v.from / 3) * 3; h <= v.to; h += 3) ticks.push(h);
  const color = (t?: string) => t === 'warn' ? '#ff9f0a' : t === 'sleep' ? 'rgba(235,235,245,.6)' : t === 'meal' ? 'rgba(235,235,245,.85)' : '#fff';
  return (
    <Frame title={v.title}>
      <svg class="viz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={v.title ?? 'Daily timeline'}>
        {v.band && <g><rect x={X(v.band.from)} y={AX - 9} width={X(v.band.to) - X(v.band.from)} height="18" rx="9" fill="rgba(255,255,255,.12)" />
          <text class="viz-t dim" x={(X(v.band.from) + X(v.band.to)) / 2} y={AX + 26} text-anchor="middle">{v.band.label}</text></g>}
        <line x1={PL} x2={W - PR} y1={AX} y2={AX} class="viz-axis" />
        {ticks.map(h => <g key={h}><line x1={X(h)} x2={X(h)} y1={AX - 3} y2={AX + 3} class="viz-axis" /><text class="viz-t dim" x={X(h)} y={H - 4} text-anchor="middle">{fmtH(h)}</text></g>)}
        {v.items.map((it, i) => {
          const x = X(it.h), up = i % 2 === 0, y = up ? AX - 24 : AX - 44;
          const anchor = x < 40 ? 'start' : x > W - 40 ? 'end' : 'middle';
          return <g key={i}>
            <line x1={x} x2={x} y1={y + 4} y2={AX} stroke="rgba(255,255,255,.25)" stroke-dasharray="2 3" />
            <circle cx={x} cy={AX} r={it.tone === 'meal' ? 4.5 : 5} fill={it.tone === 'meal' ? '#000' : color(it.tone)} stroke={color(it.tone)} stroke-width="2" />
            <text class="viz-t strong" x={x} y={y} text-anchor={anchor} fill={color(it.tone)}>{it.label}</text>
          </g>;
        })}
      </svg>
    </Frame>
  );
}

function Cycle({ v }: { v: Extract<Visual, { type: 'cycle' }> }) {
  return (
    <Frame title={v.title} cls="cycle">
      <ol class="cycle-list">
        {v.steps.map((s, i) => <li key={i}><span class="cycle-n">{i + 1}</span><span>{s}</span></li>)}
      </ol>
      <div class="cycle-return" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4" /></svg>Repeats</div>
    </Frame>
  );
}

function Scale({ v }: { v: Extract<Visual, { type: 'scale' }> }) {
  const span = v.max - v.min;
  let from = v.min;
  return (
    <Frame title={v.title}>
      <div class="scale">
        {v.segs.map(s => {
          const w = (s.to - from) / span * 100;
          const left = from; from = s.to;
          return <div class="scale-seg" key={s.label} style={{ width: w + '%', '--c': TONE[s.tone] } as any}>
            <i /><span class="scale-lbl">{s.label}</span><span class="scale-num">{left === v.min ? '' : left}</span>
          </div>;
        })}
      </div>
      {v.unit && <div class="viz-legend under"><span class="dim">{v.unit}</span></div>}
    </Frame>
  );
}

export function ZoneScale({ kind = 'focus', marker, compact }: { kind?: 'focus' | 'appetite' | 'body' | 'sleep'; marker?: number; compact?: boolean }) {
  const names = zoneNames(kind);
  const inv = kind === 'appetite' || kind === 'body';
  let a = 0;
  return (
    <div class={'zone-scale' + (compact ? ' compact' : '')}>
      <div class="zone-segs">
        {names.map((n, i) => {
          const b = Math.min(1, ZONE_EDGES[i]); const w = (b - a) * 100; a = b;
          return <span key={n} style={{ width: w + '%', '--c': ZONE_COLORS[inv ? 6 - i : i] } as any} title={n} />;
        })}
        {marker !== undefined && <b class="zone-marker" style={{ left: (Math.min(1, Math.max(0, marker)) * 100) + '%' }} />}
      </div>
      {!compact && <div class="zone-names"><span>{names[0]}</span><span>{names[3]}</span><span>{names[6]}</span></div>}
    </div>
  );
}

export function VisualView({ v }: { v: Visual }) {
  switch (v.type) {
    case 'bars': return <Bars v={v} />;
    case 'curve': return <Curve v={v} />;
    case 'ladder': return <Ladder v={v} />;
    case 'day': return <Day v={v} />;
    case 'stats': return <div class="viz-stats">{v.items.map(s => <div class="stat" key={s.label}><div class="v">{s.value}</div><div class="s">{s.label}</div></div>)}</div>;
    case 'check': return <Frame title={v.title} cls="check"><ul class="checks">{v.items.map(s => <li key={s}><Rich t={s} /></li>)}</ul></Frame>;
    case 'compare': return (
      <div class="compare">
        <div class="cmp a"><b>{v.a.title}</b><ul>{v.a.items.map(s => <li key={s}>{s}</li>)}</ul></div>
        <div class="cmp b"><b>{v.b.title}</b><ul>{v.b.items.map(s => <li key={s}>{s}</li>)}</ul></div>
      </div>
    );
    case 'cycle': return <Cycle v={v} />;
    case 'scale': return <Scale v={v} />;
    case 'zones': return <Frame title={v.title}><ZoneScale /></Frame>;
  }
}
