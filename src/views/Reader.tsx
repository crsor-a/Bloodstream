import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Article, Block } from '../content/types';
import { articleById } from '../content/articles';
import { categoryLabel, typeLabel } from '../content/suggestions';
import { EFFECT_GROUPS, effItemByArea, PHASES } from '../model/copy';
import { areaNow, areaSeries, nextZoneChange } from '../lib/area';
import { zoneColors, ZONE_EDGES, type Tier, type ZoneKind } from '../lib/zones';
import { fmtTime, fmtWhen } from '../lib/time';
import { logs, now, reader, regimen } from '../state';
import { useOverlay } from '../components/controls';
import { Rich, VisualView, ZoneScale } from '../components/Visuals';

const SIZES = [17, 19, 21];
function loadSize(): number { try { const v = Number(localStorage.getItem('bs.readerSize')); return SIZES.includes(v) ? v : 19; } catch { return 19; } }
function saveSize(v: number) { try { localStorage.setItem('bs.readerSize', String(v)); } catch { /* storage unavailable */ } }

export function openArticle(id: string, entryId?: string) {
  const cur = reader.value;
  reader.value = { id, entryId, back: cur ? [...(cur.back ?? []), { id: cur.id, entryId: cur.entryId }] : [] };
}

/* ---------------- adaptive "right now" panel ---------------- */
function MiniArea({ area }: { area: string }) {
  const found = effItemByArea(area);
  const reg = regimen.value, t = now.value;
  const W = 320, H = 96, PL = 4, PR = 4, PT = 8, PB = 16;
  const s = useMemo(() => found ? areaSeries(reg, found.item, t) : null, [reg, found?.item.name]);
  if (!found || !s || !s.pts.length) return null;
  const kind = found.item.kind as ZoneKind;
  const cs = zoneColors(kind);
  const X = (ts: number) => PL + (ts - s.a) / (s.b - s.a) * (W - PL - PR);
  const Y = (v: number) => PT + (1 - v) * (H - PT - PB);
  const d = s.pts.map((p, i) => (i ? 'L' : 'M') + X(p.ts).toFixed(1) + ',' + Y(p.v).toFixed(1)).join('');
  const nowIn = t >= s.a && t <= s.b;
  const cur = areaNow(reg, found.item, t);
  let lo = 0;
  const gid = 'ag' + area;
  return (
    <svg class="viz-svg area-mini" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="This area across today">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1={Y(0)} y2={Y(1)} gradientUnits="userSpaceOnUse">
          {cs.map((c, i) => { const a = i ? ZONE_EDGES[i - 1] : 0, b = Math.min(1, ZONE_EDGES[i]); return [<stop key={'a' + i} offset={a} stop-color={c} />, <stop key={'b' + i} offset={b} stop-color={c} />]; })}
        </linearGradient>
      </defs>
      {cs.map((c, i) => { const hi = Math.min(1, ZONE_EDGES[i]); const r = <rect key={i} x={PL} width={W - PL - PR} y={Y(hi)} height={Y(lo) - Y(hi)} fill={c} opacity=".07" />; lo = hi; return r; })}
      <path d={d} fill="none" stroke={`url(#${gid})`} stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" />
      {nowIn && <><line x1={X(t)} x2={X(t)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.5)" stroke-dasharray="3 3" />
        <circle cx={X(t)} cy={Y(cur.value)} r="5" fill={cur.zone.color} stroke="#000" stroke-width="2" /></>}
      <text class="viz-t dim" x={PL} y={H - 3}>{fmtTime(s.a)}</text>
      <text class="viz-t dim" x={W - PR} y={H - 3} text-anchor="end">{fmtTime(s.b)}</text>
    </svg>
  );
}

function AreaPanel({ area }: { area: string }) {
  const found = effItemByArea(area);
  const reg = regimen.value, t = now.value;
  if (!found) return null;
  const { item } = found;
  const kind = item.kind as ZoneKind;
  const cur = areaNow(reg, item, t);
  const ph = reg.empty ? 'pre' : reg.phaseAt(t);
  const next = nextZoneChange(reg, item, t);
  const idle = reg.empty || reg.takenMg(t) === 0;
  return (
    <div class="area-now" style={{ '--zc': cur.zone.color } as any}>
      <div class="area-now-top">
        <span class="area-live"><i />Right now · {fmtTime(t)}</span>
        {!idle && <span class="area-phase">{PHASES[ph][0]}</span>}
      </div>
      <div class="area-now-main">
        <b class="area-zone">{cur.zone.name}</b>
        <span class="area-pct">{Math.round(cur.value * 100)}%</span>
      </div>
      <ZoneScale kind={kind} marker={cur.value} />
      <p class="area-now-text">{idle
        ? (reg.empty ? 'Nothing is being tracked right now, so this shows your unmedicated baseline. The tips below are written for that.' : 'Nothing has been taken yet today, so this shows your baseline. The tips below are written for that.')
        : item.text(cur.c, ph)}</p>
      {!idle && <MiniArea area={area} />}
      {next && <p class="area-next">{next.zone.index > cur.zone.index ? 'Rises' : 'Drops'} to <b style={{ color: next.zone.color }}>{next.zone.name}</b> around {fmtWhen(next.at, true, t)}. This article updates as it changes.</p>}
    </div>
  );
}

/* ---------------- blocks ---------------- */
function Blocks({ blocks, tier, tokens }: { blocks: Block[]; tier: Tier; tokens: Record<string, string> }) {
  return <>{blocks.map((b, i) => {
    switch (b.k) {
      case 'p': return <p key={i}><Rich t={b.t} tokens={tokens} /></p>;
      case 'h': return <h2 key={i}>{b.t}</h2>;
      case 'ul': return <ul key={i}>{b.items.map((s, j) => <li key={j}><Rich t={s} tokens={tokens} /></li>)}</ul>;
      case 'ol': return <ol key={i}>{b.items.map((s, j) => <li key={j}><Rich t={s} tokens={tokens} /></li>)}</ol>;
      case 'callout': return <div key={i} class={'callout ' + b.tone}>{b.title && <b>{b.title}</b>}<p><Rich t={b.t} tokens={tokens} /></p></div>;
      case 'v': return <figure key={i}><VisualView v={b.v} />{b.cap && <figcaption>{b.cap}</figcaption>}</figure>;
      case 'now': return null; // rendered in the header
      case 'byZone': return <div key={i} class={'by-zone tier-' + tier}><Blocks blocks={b[tier]} tier={tier} tokens={tokens} /></div>;
    }
  })}</>;
}

function EntryBanner({ entryId }: { entryId: string }) {
  const e = logs.value.find(x => x.id === entryId);
  if (!e) return null;
  return (
    <div class="entry-banner">
      <span class="eb-label">Linked to your entry</span>
      <b>{e.title}</b>
      <span class="eb-meta">{typeLabel[e.type]} · {categoryLabel(e.category)} · logged {new Date(e.created).toLocaleDateString([], { month: 'short', day: 'numeric' })}{e.priority ? ' · Priority' : ''}</span>
      {e.details && <p>{e.details}</p>}
    </div>
  );
}

function ArticleBody({ a, entryId }: { a: Article; entryId?: string }) {
  const reg = regimen.value, t = now.value;
  const found = a.area ? effItemByArea(a.area) : null;
  const cur = found ? areaNow(reg, found.item, t) : null;
  const tier: Tier = cur?.zone.tier ?? 'low';
  const tokens: Record<string, string> = cur ? { zone: cur.zone.name, pct: Math.round(cur.value * 100) + '%' } : {};
  const rel = (a.related ?? []).map(articleById).filter(Boolean) as Article[];
  return (
    <article class="article">
      {entryId && <EntryBanner entryId={entryId} />}
      <p class="art-eyebrow">{a.section}{found ? ` · ${found.group}` : ''}</p>
      <h1 class="art-title">{a.title}</h1>
      <p class="art-dek">{a.dek}</p>
      <p class="art-meta">{a.read} min read · {a.sources.length} source{a.sources.length === 1 ? '' : 's'}{a.area ? ' · Updates with your curve' : ''}</p>
      {a.area && <AreaPanel area={a.area} />}
      <div class="art-body"><Blocks blocks={a.blocks} tier={tier} tokens={tokens} /></div>
      <section class="art-sources" aria-label="Sources">
        <h3>Sources</h3>
        <ol>{a.sources.map(s => <li key={s.u}><a href={s.u} target="_blank" rel="noopener">{s.t}</a></li>)}</ol>
        <p class="art-note">Written for Bloodstream from the sources above. It’s general information, not advice for your situation. Your prescriber and pharmacist know your history; check anything important with them.</p>
      </section>
      {rel.length > 0 && <section class="art-related" aria-label="Related articles">
        <h3>Related</h3>
        {rel.map(r => <button key={r.id} type="button" class="rel-card" onClick={() => openArticle(r.id)}><span class="rel-sec">{r.section}</span><b>{r.title}</b><span class="rel-dek">{r.dek}</span></button>)}
      </section>}
    </article>
  );
}

export function Reader() {
  const r = reader.value;
  const { mounted, shown } = useOverlay(!!r);
  const last = useRef(r);
  if (r) last.current = r;
  const cur = r ?? last.current;
  const [size, setSize] = useState(loadSize);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; }, [r?.id]);
  if (!mounted || !cur) return null;
  const a = articleById(cur.id);
  const back = () => {
    const stack = reader.value?.back ?? [];
    if (stack.length) { const prev = stack[stack.length - 1]; reader.value = { ...prev, back: stack.slice(0, -1) }; }
    else reader.value = null;
  };
  const cycle = () => { const n = SIZES[(SIZES.indexOf(size) + 1) % SIZES.length]; setSize(n); saveSize(n); };
  return (
    <div ref={scroller} class={'viewer reader' + (shown ? ' open' : '')} role="dialog" aria-modal="true" aria-label={a?.title ?? 'Article'} style={{ '--rs': size + 'px' } as any}>
      <div class="viewer-bar">
        <button class="back" type="button" onClick={back}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>{(cur.back ?? []).length ? 'Back' : 'Close'}</button>
        <span class="viewer-title">{a?.section ?? 'Article'}</span>
        <button class="size-btn" type="button" onClick={cycle} aria-label={`Text size ${SIZES.indexOf(size) + 1} of 3`}><small>A</small>A</button>
      </div>
      <div class="viewer-body reader-body">
        {a ? <ArticleBody a={a} entryId={cur.entryId} /> : <p class="cal-empty">This article isn’t available.</p>}
      </div>
    </div>
  );
}

/** Which effectivity group/area names exist (used by tests and the library). */
export const AREA_NAMES = EFFECT_GROUPS.flatMap(g => g.items.map(i => i.name));
