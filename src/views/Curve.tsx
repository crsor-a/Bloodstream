import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { fmtMg, pct } from '../lib/pill';
import { dayWord, fmtTime, fmtWhen, HOUR, MIN, rel } from '../lib/time';
import { now, regimen } from '../state';

const H = 230, PL = 40, PR = 14, PT = 22, PB = 26, N = 480;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function Curve() {
  const reg = regimen.value, t = now.value;
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(340);
  const [dot, setDot] = useState<number | null>(null);   // null = follow the clock
  const dragging = useRef(false);

  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    setW(Math.max(260, Math.round(el.clientWidth)));
    const ro = new ResizeObserver(() => setW(Math.max(260, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const g = useMemo(() => {
    const [a, b] = reg.domain(t);
    const kt = reg.keyTimes(t);
    const Ls: number[] = [], Es: number[] = [];
    let maxL = 0;
    for (let i = 0; i <= N; i++) { const ts = a + i * (b - a) / N, l = reg.levelAt(ts); Ls.push(l); Es.push(reg.effectAt(ts)); if (l > maxL) maxL = l; }
    const yMax = Math.max(1.1, maxL * 1.1);
    const X = (ts: number) => PL + (ts - a) / (b - a) * (W - PL - PR);
    const Y = (v: number) => PT + (1 - v / yMax) * (H - PT - PB);
    let dL = '', dE = '';
    for (let i = 0; i <= N; i++) {
      const x = X(a + i * (b - a) / N).toFixed(1);
      dL += (i ? 'L' : 'M') + x + ',' + Y(Ls[i]).toFixed(1);
      dE += (i ? 'L' : 'M') + x + ',' + Y(Es[i]).toFixed(1);
    }
    const area = dL + `L${X(b).toFixed(1)},${Y(0).toFixed(1)}L${X(a).toFixed(1)},${Y(0).toFixed(1)}Z`;

    const gstep = yMax > 1.7 ? 0.5 : 0.25;
    const grid: number[] = []; for (let v = gstep; v < yMax - 0.04; v += gstep) grid.push(v);

    const narrow = W < 480, span = (b - a) / HOUR;
    const step = span > 26 ? (narrow ? 8 : 4) : span > 16 ? (narrow ? 6 : 3) : (narrow ? 4 : 2);
    const ticks: { x: number; label: string }[] = [];
    const d = new Date(a); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1);
    while (d.getTime() <= b) {
      const hr = d.getHours();
      if (hr % step === 0) {
        const x = X(d.getTime());
        if (x > PL + 10 && x < W - PR - 10) { const h12 = hr % 12 || 12; ticks.push({ x, label: narrow ? h12 + (hr < 12 ? 'a' : 'p') : h12 + (hr < 12 ? ' AM' : ' PM') }); }
      }
      d.setHours(d.getHours() + 1);
    }

    const marks: { x: number; row: number; label: string; end: boolean }[] = [];
    let lastX = -999, row = 0;
    for (const ds of reg.doses) {
      if (ds.at < a || ds.at > b) continue;
      const x = X(ds.at);
      row = x - lastX < 54 ? row + 1 : 0; lastX = x;
      marks.push({ x, row, end: x > W - 60, label: `${ds.kind} ${fmtMg(ds.mg)}${ds.at > t ? ' · planned' : ''}` });
    }
    const peak = kt.peakAt >= a && kt.peakAt <= b ? { x: X(kt.peakAt), y: Y(reg.levelAt(kt.peakAt)) } : null;
    return { a, b, X, Y, dL, dE, area, grid, ticks, marks, peak };
  }, [reg, W]);

  const ts = clamp(dot ?? t, g.a, g.b);
  const taken = reg.takenMg(ts) > 0;
  const dx = g.X(ts), dy = g.Y(reg.levelAt(ts));
  const nowIn = t >= g.a && t <= g.b, nx = g.X(t);

  const fromPointer = (e: PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    setDot(clamp(g.a + (e.clientX - r.left - PL) / (W - PL - PR) * (g.b - g.a), g.a, g.b));
  };
  const r = rel(ts, t), w = dayWord(ts, t);

  return (
    <section class="dsec reveal" style={{ '--d': 6 } as any} aria-labelledby="hCurve">
      <div class="sec-head"><h2 id="hCurve">Your curve</h2>{dot !== null && <button class="link" type="button" onClick={() => setDot(null)}>Jump to now</button>}</div>
      <div class="card graph-card">
        <div class="readout">
          <div class="ro-time"><small>{(r === 'now' ? 'NOW' : (w ? w + ' · ' : '') + r).toUpperCase()}</small><span>{fmtTime(ts)}</span></div>
          <div class="ro-vals">
            <span><b>{taken ? pct(reg.remainingFrac(ts)) : '--'}</b>{taken ? `${fmtMg(reg.remainingMg(ts))} mg left` : 'not taken'}</span>
            <span><b>{pct(reg.levelAt(ts))}</b>blood level</span>
            <span><b>{pct(reg.effectAt(ts))}</b>effect</span>
          </div>
        </div>
        <div ref={boxRef} class="graph" tabIndex={0} role="slider" aria-label="Time on the dose curve"
          aria-valuemin={g.a} aria-valuemax={g.b} aria-valuenow={ts}
          aria-valuetext={`${fmtWhen(ts)}, ${taken ? pct(reg.remainingFrac(ts)) + ' left' : 'before the dose'}`}
          onPointerDown={e => { dragging.current = true; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ } fromPointer(e); }}
          onPointerMove={e => { if (dragging.current) fromPointer(e); }}
          onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}
          onKeyDown={e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); setDot(clamp(ts + (e.key === 'ArrowRight' ? 10 : -10) * MIN, g.a, g.b)); }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <defs>
              <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".26" /><stop offset="1" stop-color="#ffffff" stop-opacity="0" /></linearGradient>
              <filter id="gGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="transparent" />
            {g.grid.map(v => <g key={v}><line class="g-grid" x1={PL} x2={W - PR} y1={g.Y(v)} y2={g.Y(v)} /><text class="g-lbl" x={PL - 7} y={g.Y(v) + 4} text-anchor="end">{Math.round(v * 100)}%</text></g>)}
            <line class="g-base" x1={PL} x2={W - PR} y1={g.Y(0)} y2={g.Y(0)} />
            {g.ticks.map(k => <g key={k.x}><line class="g-tick" x1={k.x} x2={k.x} y1={g.Y(0)} y2={g.Y(0) + 4} /><text class="g-lbl" x={k.x} y={H - 6} text-anchor="middle">{k.label}</text></g>)}
            <path d={g.area} fill="url(#gArea)" />
            <path class="g-eff" d={g.dE} />
            <path class="g-line" d={g.dL} />
            {g.marks.map(m => <g key={m.x + m.label}>
              <line class="g-dose" x1={m.x} x2={m.x} y1={PT - 8 + m.row * 12} y2={g.Y(0)} />
              <text class="g-lbl strong" x={m.x + (m.end ? -5 : 5)} y={PT - 6 + m.row * 12} text-anchor={m.end ? 'end' : 'start'}>{m.label}</text>
            </g>)}
            {g.peak && <><circle cx={g.peak.x} cy={g.peak.y} r="3" fill="#ffffff" /><text class="g-lbl strong" x={g.peak.x} y={g.peak.y - 9} text-anchor="middle">Peak</text></>}
            {nowIn && <><line class="g-now" x1={nx} x2={nx} y1={PT + 8} y2={g.Y(0)} /><text class="g-now-t" x={nx + (nx > W - 60 ? -5 : 5)} y={g.Y(0) - 7} text-anchor={nx > W - 60 ? 'end' : 'start'}>Now</text></>}
            <line class="g-guide" x1={dx} x2={dx} y1={dy} y2={g.Y(0)} />
            <circle cx={dx} cy={dy} r="12" fill="#ffffff" opacity=".35" filter="url(#gGlow)" />
            <circle cx={dx} cy={dy} r="7.5" fill="#ffffff" stroke="#000000" stroke-width="2.5" />
          </svg>
        </div>
        <div class="legend"><span><i class="lg-solid" />Blood level, % of one dose's peak</span><span><i class="lg-dash" />Estimated felt effect</span></div>
      </div>
      <p class="foot pad">Drag the dot to scrub through the day. Arrow keys move it 10 minutes.</p>
    </section>
  );
}
