import { useEffect, useRef } from 'preact/hooks';
import { APP_VERSION, CHANGELOG, type Release } from '../changelog';
import { markVersionSeen, whatsNew } from '../state';

const fmtDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
const LABEL = { new: 'New', improved: 'Better', fixed: 'Fixed' } as const;

function ReleaseItem({ r, latest, unseen }: { r: Release; latest: boolean; unseen: boolean }) {
  return (
    <li class={'cl-release' + (latest ? ' latest' : '') + (latest && unseen ? ' unseen' : '')}>
      <span class="cl-node" aria-hidden="true" />
      <div class="cl-ver">
        <b>{r.version}</b><span>{r.title}</span><span>· {fmtDate(r.date)}</span>
        {latest && unseen && <span class="cl-badge">New</span>}
      </div>
      <ul class="cl-items">
        {r.changes.map((c, i) => <li key={i}><span class={'cl-tag ' + c.type}>{LABEL[c.type]}</span><span>{c.text}</span></li>)}
      </ul>
    </li>
  );
}

export function Changelog() {
  const ref = useRef<HTMLElement>(null);
  const unseen = whatsNew.value;

  // Mark the newest release as seen once it has been on screen for a moment.
  useEffect(() => {
    if (!unseen || !ref.current || typeof IntersectionObserver === 'undefined') return;
    let t = 0;
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(t);
      if (e.isIntersecting) t = window.setTimeout(markVersionSeen, 1500);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [unseen]);

  const [first, second, ...older] = CHANGELOG;
  return (
    <section class="changelog" ref={ref} aria-labelledby="hChangelog">
      <div class="cl-card">
        <div class="cl-head"><b id="hChangelog">Changelog</b><span>Version {APP_VERSION}</span></div>
        <ul class="cl-timeline">
          <ReleaseItem r={first} latest unseen={unseen} />
          {second && <ReleaseItem r={second} latest={false} unseen={false} />}
        </ul>
        {older.length > 0 && (
          <details class="cl-more">
            <summary>Show {older.length} earlier release{older.length > 1 ? 's' : ''}</summary>
            <ul class="cl-timeline">{older.map(r => <ReleaseItem key={r.version} r={r} latest={false} unseen={false} />)}</ul>
          </details>
        )}
      </div>
    </section>
  );
}
