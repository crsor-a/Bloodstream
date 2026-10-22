import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { LogEntry } from '../model/types';
import { articlesBySection, articleById, searchArticles } from '../content/articles';
import { categoryLabel, guidanceFor, suggestionById, typeLabel, CUSTOM_GUIDANCE } from '../content/suggestions';
import { shareText } from '../lib/share';
import { fmtTime } from '../lib/time';
import {
  appointments, apptSheet, deleteLogs, libraryOpen, logs, logSheet, now, showToast, updateLog, type LibrarySection
} from '../state';
import { Collapse, Segmented, useOverlay } from '../components/controls';
import { openArticle } from './Reader';
import { GuidancePanel, TypeIcon, URGENCY_COLOR } from './LogSheet';
import { apptWhen, CalIcon, untilWords, upcomingAppt } from './Appointments';

const fmtDay = (ts: number) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });

/* ---------------- entries ---------------- */
function EntryRow({ e, open, onToggle, selecting, checked, onCheck }: { e: LogEntry; open: boolean; onToggle: () => void; selecting: boolean; checked: boolean; onCheck: () => void }) {
  const s = suggestionById(e.templateId);
  const art = articleById(s?.article);
  const [armed, setArmed] = useState(false);
  const g = s ? guidanceFor(s, e.type, art?.covers ?? []) : CUSTOM_GUIDANCE;
  return (
    <div class={'entry' + (open ? ' open' : '')}>
      <button type="button" class="entry-main" aria-expanded={selecting ? undefined : open} onClick={selecting ? onCheck : onToggle}>
        {selecting && <span class={'check-box' + (checked ? ' on' : '')} role="checkbox" aria-checked={checked} />}
        <span class={'entry-ic ' + e.type}><TypeIcon type={e.type} /></span>
        <span class="entry-text">
          <b>{e.priority && <span class="prio" aria-label="Priority">Priority</span>}{e.title}</b>
          <small>{typeLabel[e.type]} · {categoryLabel(e.category)} · {fmtDay(e.created)}</small>
        </span>
        {s && (s.urgency === 'emergency' || s.urgency === 'stop' || s.urgency === 'soon') && <span class="u-dot" style={{ background: URGENCY_COLOR[s.urgency] }} aria-hidden="true" />}
        {!selecting && <span class={'dd-chev' + (open ? ' up' : '')} aria-hidden="true" />}
      </button>
      <Collapse open={open && !selecting}>
        <div class="entry-detail">
          {e.details ? <p class="entry-notes">{e.details}</p> : <p class="entry-notes dim">No additional information.</p>}
          <p class="entry-when">Logged {new Date(e.created).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} at {fmtTime(e.created)}</p>
          <GuidancePanel g={g} />
          {art && <p class="linked">Linked article: <button type="button" class="u-link" onClick={() => openArticle(art.id, e.id)}>{art.title}</button></p>}
          <div class="entry-actions">
            <button type="button" class="pill-btn" onClick={() => { updateLog({ ...e, priority: !e.priority }); }}>{e.priority ? 'Unpin' : 'Mark priority'}</button>
            <button type="button" class="pill-btn" onClick={() => { logSheet.value = { editId: e.id }; }}>Edit</button>
            <button type="button" class="btn-text danger" onClick={() => { if (!armed) { setArmed(true); return; } deleteLogs([e.id]); showToast('Entry removed'); }}>{armed ? 'Tap again to remove' : 'Remove'}</button>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

function entriesText(list: LogEntry[], next?: { at: number }) {
  const lines = [`Notes for my ${next ? `appointment on ${new Date(next.at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}` : 'next appointment'}`, ''];
  const fmt = (e: LogEntry) => `- [${typeLabel[e.type]}] ${e.title}${e.details ? `: ${e.details}` : ''} (${fmtDay(e.created)})`;
  const pr = list.filter(e => e.priority), rest = list.filter(e => !e.priority);
  if (pr.length) lines.push('Priority', ...pr.map(fmt), '');
  for (const type of ['effect', 'benefit', 'question', 'concern'] as const) {
    const g = rest.filter(e => e.type === type);
    if (g.length) lines.push(typeLabel[type] + (g.length > 1 ? 's' : ''), ...g.map(fmt), '');
  }
  return lines.join('\n').trim();
}

function Entries() {
  const list = logs.value;
  const [open, setOpen] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [armed, setArmed] = useState(false);
  const sorted = useMemo(() => [...list].sort((a, b) => Number(b.priority) - Number(a.priority) || b.created - a.created), [list]);
  const toggleSel = (id: string) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); setArmed(false); };
  const exitSelect = () => { setSelecting(false); setSel(new Set()); setArmed(false); };
  const share = async () => {
    const r = await shareText('Notes for my appointment', entriesText(sorted, upcomingAppt(appointments.value, now.value)));
    if (r === 'copied') showToast('Copied your list');
    if (r === 'failed') showToast('Sharing isn\'t available here');
  };
  if (!list.length) return (
    <div class="card empty-card">
      <b>No entries yet</b>
      <p>Log side effects, benefits, questions and concerns as they come up. They'll gather here for your next appointment.</p>
      <button type="button" class="pill-btn solid" onClick={() => { logSheet.value = {}; }}>New entry</button>
    </div>
  );
  return (
    <div>
      <div class="lib-tools">
        <span>{list.length} entr{list.length === 1 ? 'y' : 'ies'}{list.some(e => e.priority) ? ` · ${list.filter(e => e.priority).length} priority` : ''}</span>
        <div>
          {!selecting && <button type="button" class="link" onClick={share}>Share list</button>}
          <button type="button" class="link" onClick={() => selecting ? exitSelect() : setSelecting(true)}>{selecting ? 'Cancel' : 'Select'}</button>
        </div>
      </div>
      <div class="card entries">
        {sorted.map(e => <EntryRow key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)}
          selecting={selecting} checked={sel.has(e.id)} onCheck={() => toggleSel(e.id)} />)}
      </div>
      {selecting ? (
        <div class="select-bar">
          <button type="button" class="link" onClick={() => setSel(sel.size === list.length ? new Set() : new Set(list.map(e => e.id)))}>{sel.size === list.length ? 'Select none' : 'Select all'}</button>
          <button type="button" class={'btn sm' + (sel.size ? ' danger-fill' : '')} disabled={!sel.size} onClick={() => {
            if (!armed) { setArmed(true); return; }
            deleteLogs([...sel]); showToast(`Removed ${sel.size} entr${sel.size === 1 ? 'y' : 'ies'}`); exitSelect();
          }}>{armed ? `Tap again to remove ${sel.size}` : `Remove${sel.size ? ' ' + sel.size : ''}`}</button>
        </div>
      ) : (
        <button type="button" class="btn primary block" onClick={() => { logSheet.value = {}; }}>New entry</button>
      )}
      <p class="foot pad">Tap an entry for details and its linked article. Share list sends a plain-text summary you can show your prescriber.</p>
    </div>
  );
}

/* ---------------- articles ---------------- */
function Articles() {
  const [q, setQ] = useState('');
  const [openSec, setOpenSec] = useState<Set<string>>(() => new Set(['Safety']));
  const hits = useMemo(() => q.trim() ? searchArticles(q) : null, [q]);
  const groups = useMemo(articlesBySection, []);
  const toggle = (s: string) => { const n = new Set(openSec); n.has(s) ? n.delete(s) : n.add(s); setOpenSec(n); };
  return (
    <div>
      <div class="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input type="search" placeholder="Search articles and sections" value={q} aria-label="Search articles" onInput={e => setQ((e.target as HTMLInputElement).value)} />
        {q && <button type="button" class="search-clear" aria-label="Clear search" onClick={() => setQ('')}>×</button>}
      </div>
      {hits ? (
        <div class="card art-list">
          {hits.length ? hits.map(({ article: a, heading }) => (
            <button key={a.id} type="button" class="art-row" onClick={() => openArticle(a.id)}>
              <span class="art-row-text"><b>{a.title}</b>{heading ? <small>Section: {heading}</small> : <small class="clamp">{a.dek}</small>}</span>
              <span class="chev" aria-hidden="true" />
            </button>
          )) : <p class="cal-empty" style={{ paddingTop: '14px' }}>Nothing matches "{q}". Try a simpler word, like sleep, heart or appetite.</p>}
        </div>
      ) : groups.map(g => (
        <div key={g.section} class={'art-group' + (openSec.has(g.section) ? ' open' : '')}>
          <button type="button" class="art-group-head" aria-expanded={openSec.has(g.section)} onClick={() => toggle(g.section)}>
            <span>{g.section}</span><small>{g.items.length}</small><span class={'dd-chev' + (openSec.has(g.section) ? ' up' : '')} aria-hidden="true" />
          </button>
          <Collapse open={openSec.has(g.section)}>
            <div class="card art-list">
              {g.items.map(a => (
                <button key={a.id} type="button" class="art-row" onClick={() => openArticle(a.id)}>
                  <span class="art-row-text"><b>{a.title}</b><small class="clamp">{a.dek}</small></span>
                  <span class="art-min">{a.read} min</span>
                </button>
              ))}
            </div>
          </Collapse>
        </div>
      ))}
      <p class="foot pad">Each article is written for Bloodstream from the FDA label and other medical sources, listed at the end of every article.</p>
    </div>
  );
}

/* ---------------- appointments ---------------- */
function Appts() {
  const t = now.value, list = appointments.value;
  const upcoming = list.filter(a => a.at > t), past = list.filter(a => a.at <= t).reverse().slice(0, 8);
  const row = (a: typeof list[number], isPast: boolean) => (
    <button key={a.id} type="button" class="appt-row" onClick={() => { apptSheet.value = { id: a.id }; }}>
      <CalIcon at={a.at} />
      <span class="entry-text"><b>{a.visit || 'Appointment'}{a.doctor ? ` · ${a.doctor}` : ''}</b>
        <small>{apptWhen(a)}{isPast ? (a.reviewed ? ' · reviewed' : '') : ` · ${untilWords(a.at, t)}`}</small></span>
      <span class="chev" aria-hidden="true" />
    </button>
  );
  return (
    <div>
      <div class="group-label">Upcoming</div>
      <div class="card list">
        {upcoming.map(a => row(a, false))}
        <button type="button" class={'add-row' + (upcoming.length ? '' : ' first')} onClick={() => { apptSheet.value = { id: null }; }}>
          <span class="plus"><span><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span></span>Add an appointment
        </button>
      </div>
      <p class="foot pad">Appointments show as markers on your dose calendar. Within a month of one, your dashboard reminds you to start noting things.</p>
      {past.length > 0 && <>
        <div class="group-label">Past</div>
        <div class="card list">{past.map(a => row(a, true))}</div>
      </>}
    </div>
  );
}

/* ---------------- viewer ---------------- */
export function Library() {
  const st = libraryOpen.value;
  const { mounted, shown } = useOverlay(!!st);
  const last = useRef<LibrarySection>('entries');
  if (st) last.current = st.section;
  const section = st?.section ?? last.current;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (st && ref.current) ref.current.scrollTop = 0; }, [!!st]);
  if (!mounted) return null;
  return (
    <div ref={ref} class={'viewer library' + (shown ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Logging library">
      <div class="viewer-bar">
        <button class="back" type="button" onClick={() => { libraryOpen.value = null; }}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>Done</button>
        <span class="viewer-title">Logging library</span>
        <button type="button" class="link right" onClick={() => { logSheet.value = {}; }} aria-label="New entry">New</button>
      </div>
      <div class="viewer-body">
        <Segmented label="Library sections" value={section} onChange={v => { libraryOpen.value = { section: v }; }}
          options={[{ v: 'entries', label: 'Entries' }, { v: 'articles', label: 'Articles' }, { v: 'appointments', label: 'Appointments' }]} />
        {section === 'entries' && <Entries />}
        {section === 'articles' && <Articles />}
        {section === 'appointments' && <Appts />}
      </div>
    </div>
  );
}
