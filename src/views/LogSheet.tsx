import { useEffect, useMemo, useState } from 'preact/hooks';
import type { LogType } from '../model/types';
import {
  CATEGORIES, CUSTOM_GUIDANCE, guidanceFor, suggestionById, suggestionsFor, typeLabel, type Guidance, type Suggestion
} from '../content/suggestions';
import { articleById } from '../content/articles';
import { addLog, libraryOpen, logs, logSheet, showToast, updateLog } from '../state';
import { Collapse, Sheet, Switch } from '../components/controls';
import { openArticle } from './Reader';

export const TYPE_ICONS: Record<LogType, string> = {
  effect: 'M12 3l9 16H3z M12 10v4 M12 17h.01',
  benefit: 'M5 12l4 4L19 6',
  question: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.3 M12 16.6h.01',
  concern: 'M4 5h16v11H10l-4.5 3.5V16H4z M12 8.2v3.6 M12 14.2h.01'
};
const TYPE_SUB: Record<LogType, string> = {
  effect: 'Something unwanted', benefit: 'Something that helps', question: 'To ask your doctor', concern: 'Something worrying you'
};
const TITLE_PROMPT: Record<LogType, string> = {
  effect: 'Describe the side effect', benefit: 'Describe the benefit', question: 'Your question', concern: 'Describe the concern'
};
export const URGENCY_COLOR: Record<string, string> = { emergency: '#ff453a', stop: '#ff6b3d', soon: '#ff9f0a', mention: 'rgba(235,235,245,.5)', info: 'rgba(235,235,245,.3)' };

export function TypeIcon({ type }: { type: LogType }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={TYPE_ICONS[type]} /></svg>;
}

export function GuidancePanel({ g, article, onRead }: { g: Guidance; article?: string; onRead?: () => void }) {
  const a = articleById(article);
  return (
    <div class={'guidance ' + g.tone} role={g.tone === 'emergency' || g.tone === 'stop' ? 'alert' : 'status'}>
      <b>{g.title}</b>
      <p>{g.body}</p>
      {a && onRead && <button type="button" class="guide-link" onClick={onRead}>Read: {a.title}<span class="chev" aria-hidden="true" /></button>}
    </div>
  );
}

function LogForm({ editId, onDone }: { editId?: string; onDone: () => void }) {
  const existing = editId ? logs.value.find(e => e.id === editId) : undefined;
  const [type, setType] = useState<LogType | null>(existing?.type ?? null);
  const [cat, setCat] = useState<string | null>(existing?.category ?? null);
  const [sid, setSid] = useState<string | null>(existing?.templateId ?? null);
  const [custom, setCustom] = useState(existing && !existing.templateId ? existing.title : '');
  const [details, setDetails] = useState(existing?.details ?? '');
  const [priority, setPriority] = useState(existing?.priority ?? false);
  const [listOpen, setListOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(!existing);

  const list = useMemo(() => type && cat ? suggestionsFor(type, cat) : [], [type, cat]);
  const chosen = suggestionById(sid);
  const title = chosen ? chosen.text : custom.trim();
  const can = !!type && !!title;

  const guidance: Guidance | null = chosen && type
    ? guidanceFor(chosen, type, articleById(chosen.article)?.covers ?? [])
    : custom.trim().length > 3 ? CUSTOM_GUIDANCE : null;

  const pickType = (t: LogType) => { setType(t); if (chosen && !chosen.types.includes(t)) setSid(null); };
  const pickCat = (c: string) => { setCat(c); setCatOpen(false); setListOpen(true); if (chosen && chosen.cat !== c) setSid(null); };
  const pick = (s: Suggestion | null) => { setSid(s ? s.id : null); setListOpen(false); };

  const save = () => {
    if (!can || !type) return;
    const entry = { type, category: chosen?.cat ?? cat ?? 'other', templateId: chosen?.id ?? null, title, details: details.trim(), priority };
    if (existing) { updateLog({ ...existing, ...entry }); showToast('Entry updated'); }
    else { addLog(entry); showToast(priority ? 'Added to your library as a priority' : 'Added to your library'); }
    onDone();
  };

  return (
    <div class="log-form">
      <div class="group-label">What is it?</div>
      <div class="type-grid" role="radiogroup" aria-label="Entry type">
        {(['effect', 'benefit', 'question', 'concern'] as LogType[]).map(t => (
          <button key={t} type="button" role="radio" aria-checked={type === t} class={'type-tile' + (type === t ? ' on' : '')} onClick={() => pickType(t)}>
            <TypeIcon type={t} /><b>{typeLabel[t]}</b><small>{TYPE_SUB[t]}</small>
          </button>
        ))}
      </div>

      <Collapse open={!!type}>
        <div class="group-label">About</div>
        {cat && !catOpen ? (
          <div class="cat-picked">
            <span class="chip on">{CATEGORIES.find(c => c.id === cat)?.label}</span>
            <button type="button" class="link" onClick={() => setCatOpen(true)}>Change</button>
          </div>
        ) : (
          <div class="chips cat-chips">
            {CATEGORIES.map(c => <button key={c.id} type="button" class={'chip' + (cat === c.id ? ' on' : '')} onClick={() => pickCat(c.id)}>{c.label}</button>)}
          </div>
        )}

        <div class="group-label">Suggestions</div>
        <div class="card dd">
          <button type="button" class={'dd-btn' + (chosen ? ' chosen' : '')} aria-expanded={listOpen} disabled={!cat} onClick={() => setListOpen(!listOpen)}>
            {chosen && <span class="u-dot" style={{ background: URGENCY_COLOR[chosen.urgency] }} />}
            <span class="dd-text">{chosen ? chosen.text : !cat ? 'Pick a category to see suggestions' : list.length ? `Choose from ${list.length} suggestion${list.length === 1 ? '' : 's'}` : 'No suggestions here yet'}</span>
            <span class={'dd-chev' + (listOpen ? ' up' : '')} aria-hidden="true" />
          </button>
          <Collapse open={listOpen && !!cat}>
            <div class="dd-list" role="listbox" aria-label="Suggestions">
              {list.map(s => (
                <button key={s.id} type="button" role="option" aria-selected={sid === s.id} class={'dd-opt' + (sid === s.id ? ' on' : '')} onClick={() => pick(s)}>
                  <span class="u-dot" style={{ background: URGENCY_COLOR[s.urgency] }} />{s.text}
                </button>
              ))}
              <button type="button" role="option" aria-selected={!sid} class={'dd-opt none' + (!sid ? ' on' : '')} onClick={() => pick(null)}>None of these, I'll write my own</button>
            </div>
          </Collapse>
        </div>

        <Collapse open={!chosen}>
          <div class="group-label">{type ? TITLE_PROMPT[type] : 'Describe it'}</div>
          <div class="card"><input class="text-input wide field" type="text" maxLength={120} value={custom} aria-label={type ? TITLE_PROMPT[type] : 'Describe it'}
            placeholder={type === 'question' ? 'e.g. Should I take it earlier on school days?' : 'In a few words'} onInput={e => setCustom((e.target as HTMLInputElement).value)} /></div>
        </Collapse>

        <div class="group-label">Additional information</div>
        <div class="card"><textarea class="text-area" rows={3} maxLength={1000} value={details} aria-label="Additional information"
          placeholder="When it happens, how long it lasts, how much it bothers you, anything that seems to help" onInput={e => setDetails((e.target as HTMLTextAreaElement).value)} /></div>

        {guidance && <GuidancePanel g={guidance} article={chosen?.article} onRead={chosen ? () => openArticle(chosen.article) : undefined} />}

        <div class="card list" style={{ marginTop: '12px' }}>
          <div class="row">
            <div class="row-text"><label for="prioSw">Priority</label><small>Pinned to the top of your list for the next appointment</small></div>
            <Switch id="prioSw" checked={priority} onChange={setPriority} />
          </div>
        </div>
      </Collapse>

      <button class="btn primary block" type="button" disabled={!can} style={can ? undefined : { opacity: 0.4 }} onClick={save}>{existing ? 'Save changes' : 'Add to library'}</button>
      <p class="foot pad center">Entries stay on this device. Bloodstream doesn't send them to anyone.</p>
    </div>
  );
}

export function LogSheet() {
  const st = logSheet.value;
  const [gen, setGen] = useState(0);
  useEffect(() => { if (st) setGen(g => g + 1); }, [!!st, st?.editId]);
  const close = () => { logSheet.value = null; };
  const toLibrary = () => { logSheet.value = null; libraryOpen.value = { section: 'entries' }; };
  return (
    <Sheet open={!!st} onClose={close} title={st?.editId ? 'Edit entry' : 'New entry'} cls="log" top={!!libraryOpen.value}>
      <div class="sheet-row-head">
        <div>
          <h2 class="sheet-intro">{st?.editId ? 'Edit entry' : 'Log for your doctor'}</h2>
          <p class="sheet-sub">Side effects, benefits, questions and concerns to bring to your next appointment.</p>
        </div>
      </div>
      {!libraryOpen.value && <button type="button" class="lib-link" onClick={toLibrary}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v14H4zM14 5h6v14h-6z" /></svg>Open your logging library<span class="chev" aria-hidden="true" />
      </button>}
      <LogForm key={gen} editId={st?.editId} onDone={close} />
    </Sheet>
  );
}
