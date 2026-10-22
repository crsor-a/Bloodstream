import { useEffect, useRef } from 'preact/hooks';
import { APP_VERSION, CHANGELOG, type Release } from '../changelog';
import { changelogOpen, markVersionSeen, whatsNew } from '../state';
import { useOverlay } from '../components/controls';

const fmtDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
const LABEL = { new: 'New', improved: 'Better', fixed: 'Fixed' } as const;

function ReleaseItem({ r, latest }: { r: Release; latest: boolean }) {
  return (
    <li class={'cl-release' + (latest ? ' latest' : '')}>
      <span class="cl-node" aria-hidden="true" />
      <div class="cl-ver"><b>{r.version}</b><span>{r.title}</span><span class="cl-date">{fmtDate(r.date)}</span></div>
      <ul class="cl-items">
        {r.changes.map((c, i) => <li key={i}><span class={'cl-tag ' + c.type}>{LABEL[c.type]}</span><span>{c.text}</span></li>)}
      </ul>
    </li>
  );
}

/** One quiet line under the disclaimer, in the same type. */
export function ChangelogLine() {
  const unseen = whatsNew.value;
  return (
    <p class="cl-line">
      Bloodstream version {APP_VERSION}.{' '}
      <button type="button" class="cl-link" onClick={() => { changelogOpen.value = true; }}>
        {unseen && <span class="cl-dot" aria-label="New" />}See the changelog<span class="chev" aria-hidden="true" />
      </button>
    </p>
  );
}

export function ChangelogViewer() {
  const open = changelogOpen.value;
  const { mounted, shown } = useOverlay(open);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    if (ref.current) ref.current.scrollTop = 0;
    const t = setTimeout(markVersionSeen, 800);
    return () => clearTimeout(t);
  }, [open]);
  if (!mounted) return null;
  return (
    <div ref={ref} class={'viewer changelog-view' + (shown ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Changelog">
      <div class="viewer-bar">
        <button class="back" type="button" onClick={() => { changelogOpen.value = false; }}><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" /></svg>Back</button>
        <span class="viewer-title">Changelog</span>
        <span />
      </div>
      <div class="viewer-body">
        <div class="cl-hero">
          <p class="eyebrow">Version {APP_VERSION}</p>
          <h1 class="large">{CHANGELOG[0].title}</h1>
          <p class="sheet-sub">Updates install on their own. Your saved data is never touched.</p>
        </div>
        <ul class="cl-timeline big">{CHANGELOG.map((r, i) => <ReleaseItem key={r.version} r={r} latest={i === 0} />)}</ul>
      </div>
    </div>
  );
}
