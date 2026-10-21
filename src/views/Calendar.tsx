import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  dayKey, doseTypes, groupByDay, monthMatrix, rangeOf, rangeTitle, shift, shortTime, startOfDay, typeKey, weekDays,
  type DoseType, type Scale
} from '../lib/calendar';
import { fmtMg, pillSVG } from '../lib/pill';
import { fmtTime } from '../lib/time';
import { calendarOpen, doses, now } from '../state';
import { Segmented, useOverlay } from '../components/controls';
import type { Dose } from '../model/types';

const SCALES: { v: Scale; label: string }[] = [{ v: 'week', label: 'Week' }, { v: 'month', label: 'Month' }, { v: 'year', label: 'Year' }];
const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Ctx { byDay: Map<string, Dose[]>; color: (d: Dose) => string; today: string; now: number }

function useCalendarData(): { ctx: Ctx; types: DoseType[] } {
  const all = doses.value, t = now.value;
  return useMemo(() => {
    const types = doseTypes(all);
    const colors = new Map(types.map(x => [x.key, x.color]));
    return { types, ctx: { byDay: groupByDay(all), color: (d: Dose) => colors.get(typeKey(d)) ?? '#ffffff', today: dayKey(t), now: t } };
  }, [all, dayKey(t)]);
}

function Dot({ d, ctx, size }: { d: Dose; ctx: Ctx; size?: number }) {
  const c = ctx.color(d), planned = d.at > ctx.now;
  return <i class={'cal-dot' + (planned ? ' planned' : '')} style={{ background: planned ? 'transparent' : c, borderColor: c, ...(size ? { width: size + 'px', height: size + 'px' } : {}) }} />;
}

const dayLabel = (ts: number, list: Dose[] | undefined) =>
  new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + (list?.length ? `, ${list.length} dose${list.length > 1 ? 's' : ''}` : ', no doses');

function MonthGrid(p: { anchor: number; ctx: Ctx; selected: string | null; onPick: (ts: number) => void; big?: boolean }) {
  const rows = monthMatrix(p.anchor);
  return (
    <div class={'cal-month' + (p.big ? ' big' : '')}>
      {WEEKDAY.map((w, i) => <span class="cal-wh" key={'h' + i}>{w}</span>)}
      {rows.flat().map(c => {
        const k = dayKey(c.ts), list = p.ctx.byDay.get(k);
        const max = p.big ? 4 : 3;
        return (
          <button type="button" key={k} class={'cal-cell' + (c.inMonth ? '' : ' out') + (k === p.ctx.today ? ' today' : '') + (k === p.selected ? ' sel' : '')}
            aria-label={dayLabel(c.ts, list)} onClick={() => p.onPick(c.ts)}>
            <span class="cal-num">{new Date(c.ts).getDate()}</span>
            <span class="cal-dots">
              {list?.slice(0, max).map(d => <Dot key={d.id} d={d} ctx={p.ctx} />)}
              {list && list.length > max && <em class="cal-more">+{list.length - max}</em>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function WeekGrid(p: { anchor: number; ctx: Ctx; selected: string | null; onPick: (ts: number) => void; big?: boolean }) {
  return (
    <div class={'cal-week' + (p.big ? ' big' : '')}>
      {weekDays(p.anchor).map((ts, i) => {
        const k = dayKey(ts), list = p.ctx.byDay.get(k) ?? [];
        return (
          <button type="button" key={k} class={'cal-wday' + (k === p.ctx.today ? ' today' : '') + (k === p.selected ? ' sel' : '')}
            aria-label={dayLabel(ts, list)} onClick={() => p.onPick(ts)}>
            <span class="cal-wh">{WEEKDAY[i]}</span>
            <span class="cal-num">{new Date(ts).getDate()}</span>
            <span class="cal-wlist">
              {list.map(d => <span class="cal-wdose" key={d.id}><Dot d={d} ctx={p.ctx} /><em>{shortTime(d.at)}</em>{p.big && <small>{d.kind} {fmtMg(d.mg)}</small>}</span>)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function YearGrid(p: { anchor: number; ctx: Ctx; onMonth: (ts: number) => void; big?: boolean }) {
  const y = new Date(p.anchor).getFullYear();
  return (
    <div class={'cal-year' + (p.big ? ' big' : '')}>
      {Array.from({ length: 12 }, (_, m) => {
        const first = new Date(y, m, 1).getTime();
        const cells = monthMatrix(first).flat();
        const thisMonth = new Date(p.ctx.now).getFullYear() === y && new Date(p.ctx.now).getMonth() === m;
        return (
          <button type="button" class={'cal-mini' + (thisMonth ? ' current' : '')} key={m} onClick={() => p.onMonth(first)}
            aria-label={`Open ${new Date(first).toLocaleDateString([], { month: 'long', year: 'numeric' })}`}>
            <span class="cal-mini-title">{new Date(first).toLocaleDateString([], { month: 'short' })}</span>
            <span class="cal-mini-grid">
              {cells.map(c => {
                if (!c.inMonth) return <i key={c.ts} class="mc empty" />;
                const k = dayKey(c.ts), list = p.ctx.byDay.get(k);
                const d = list?.[0];
                return <i key={c.ts} class={'mc' + (d ? ' on' : '') + (list && list.length > 1 ? ' multi' : '') + (k === p.ctx.today ? ' today' : '')}
                  style={d ? { background: p.ctx.color(d), color: p.ctx.color(d) } : undefined} />;
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Legend({ types }: { types: DoseType[] }) {
  if (!types.length) return <p class="cal-legend-note">Logged doses show up here as dots.</p>;
  if (types.length === 1) return <div class="cal-legend"><span><i class="cal-dot" style={{ background: '#ffffff', borderColor: '#ffffff' }} />All doses: {types[0].kind} {fmtMg(types[0].mg)} mg</span></div>;
  return (
    <div class="cal-legend">
      {types.map(t => <span key={t.key}><i class="cal-dot" style={{ background: t.color, borderColor: t.color }} />{t.kind} {fmtMg(t.mg)} mg</span>)}
      <span><i class="cal-dot planned" style={{ borderColor: 'rgba(235,235,245,.6)' }} />Planned</span>
    </div>
  );
}

function Nav(p: { scale: Scale; anchor: number; setAnchor: (n: number) => void }) {
  const isCurrent = (() => { const [s, e] = rangeOf(p.anchor, p.scale); return now.value >= s && now.value < e; })();
  return (
    <div class="cal-nav">
      <button type="button" class="cal-arrow" aria-label="Previous" onClick={() => p.setAnchor(shift(p.anchor, p.scale, -1))}><span class="chev left" /></button>
      <span class="cal-title">{rangeTitle(p.anchor, p.scale)}</span>
      {!isCurrent && <button type="button" class="link cal-today" onClick={() => p.setAnchor(now.value)}>Today</button>}
      <button type="button" class="cal-arrow" aria-label="Next" onClick={() => p.setAnchor(shift(p.anchor, p.scale, 1))}><span class="chev" /></button>
    </div>
  );
}

/* ---------------- inline card ---------------- */
export function CalendarCard() {
  const { ctx, types } = useCalendarData();
  const [scale, setScale] = useState<Scale>('month');
  const [anchor, setAnchor] = useState(() => now.value);
  const open = (selected: number | null, s = scale, a = anchor) => { calendarOpen.value = { scale: s, anchor: a, selected }; };

  return (
    <section class="dsec reveal" style={{ '--d': 6 } as any} aria-labelledby="hCal">
      <div class="sec-head">
        <h2 id="hCal">Calendar</h2>
        <button type="button" class="link cal-expand" onClick={() => open(null)} aria-label="Open the calendar full screen">
          Expand<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>
        </button>
      </div>
      <div class="card cal-card">
        <Segmented label="Calendar scale" value={scale} onChange={setScale} options={SCALES} />
        <Nav scale={scale} anchor={anchor} setAnchor={setAnchor} />
        {scale === 'month' && <MonthGrid anchor={anchor} ctx={ctx} selected={null} onPick={ts => open(ts, 'month', ts)} />}
        {scale === 'week' && <WeekGrid anchor={anchor} ctx={ctx} selected={null} onPick={ts => open(ts, 'week', ts)} />}
        {scale === 'year' && <YearGrid anchor={anchor} ctx={ctx} onMonth={ts => { setScale('month'); setAnchor(ts); }} />}
        <Legend types={types} />
      </div>
    </section>
  );
}

/* ---------------- full-screen viewer ---------------- */
function DayDetail({ ts, ctx }: { ts: number; ctx: Ctx }) {
  const list = ctx.byDay.get(dayKey(ts)) ?? [];
  return (
    <div class="card cal-detail">
      <div class="cal-detail-head">
        <b>{new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</b>
        <span>{list.length ? `${list.length} dose${list.length > 1 ? 's' : ''}` : 'No doses'}</span>
      </div>
      {list.length === 0 && <p class="cal-empty">Nothing was logged on this day.</p>}
      {list.map(d => (
        <div class="cal-detail-row" key={d.id}>
          <div class="mini-pill" dangerouslySetInnerHTML={{ __html: pillSVG(d, { glow: false }) }} />
          <div class="dose-info"><b>{d.kind} · {fmtMg(d.mg)} mg{d.at > ctx.now && <span class="tag">Planned</span>}</b><span class="sub">{fmtTime(d.at)}</span></div>
          <Dot d={d} ctx={ctx} size={10} />
        </div>
      ))}
    </div>
  );
}

function Summary({ scale, anchor }: { scale: Scale; anchor: number }) {
  const [s, e] = rangeOf(anchor, scale);
  const t = now.value;
  const inRange = doses.value.filter(d => d.at >= s && d.at < e && d.at <= t);
  const days = new Set(inRange.map(d => dayKey(d.at))).size;
  const top = doseTypes(inRange).sort((a, b) => b.count - a.count)[0];
  const label = scale === 'week' ? 'this week' : scale === 'month' ? 'this month' : 'this year';
  return (
    <div class="stats cal-stats">
      <div class="stat"><div class="k">Doses</div><div class="v">{inRange.length}</div><div class="s">{label}</div></div>
      <div class="stat"><div class="k">Days with a dose</div><div class="v">{days}</div><div class="s">{label}</div></div>
      <div class="stat"><div class="k">Most logged</div><div class="v">{top ? `${top.kind} ${fmtMg(top.mg)}` : '--'}</div><div class="s">{top ? `${top.count} time${top.count > 1 ? 's' : ''}` : ' '}</div></div>
    </div>
  );
}

export function CalendarViewer() {
  const req = calendarOpen.value;
  const { mounted, shown } = useOverlay(!!req);
  const { ctx, types } = useCalendarData();
  const [scale, setScale] = useState<Scale>('month');
  const [anchor, setAnchor] = useState(() => now.value);
  const [selected, setSelected] = useState<number>(() => startOfDay(now.value));
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!req) return;
    setScale(req.scale); setAnchor(req.anchor);
    setSelected(startOfDay(req.selected ?? now.value));
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [req]);

  if (!mounted) return null;
  const sel = dayKey(selected);
  const pick = (ts: number) => setSelected(startOfDay(ts));

  return (
    <div class={'viewer' + (shown ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Dose calendar" ref={bodyRef}>
      <header class="viewer-bar">
        <button class="back" type="button" onClick={() => { calendarOpen.value = null; }}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>Back</button>
        <span class="viewer-title">Dose Calendar</span>
        <span />
      </header>
      <div class="viewer-body">
        <Segmented label="Calendar scale" value={scale} onChange={setScale} options={SCALES} />
        <div class="card cal-card big">
          <Nav scale={scale} anchor={anchor} setAnchor={setAnchor} />
          {scale === 'month' && <MonthGrid big anchor={anchor} ctx={ctx} selected={sel} onPick={pick} />}
          {scale === 'week' && <WeekGrid big anchor={anchor} ctx={ctx} selected={sel} onPick={pick} />}
          {scale === 'year' && <YearGrid big anchor={anchor} ctx={ctx} onMonth={ts => { setScale('month'); setAnchor(ts); }} />}
          <Legend types={types} />
        </div>
        <Summary scale={scale} anchor={anchor} />
        {scale !== 'year' && <DayDetail ts={selected} ctx={ctx} />}
        {scale === 'year' && <p class="foot pad">Tap a month to open it.</p>}
      </div>
    </div>
  );
}
