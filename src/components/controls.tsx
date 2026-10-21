import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { actionOpen, calendarOpen, sheetOpen, toast } from '../state';

export interface SegOption<T extends string> { v: T; label: ComponentChildren; sub?: string }

/** iOS segmented control with a sliding thumb. */
export function Segmented<T extends string>(p: { options: SegOption<T>[]; value: T; onChange: (v: T) => void; big?: boolean; small?: boolean; label?: string }) {
  const i = Math.max(0, p.options.findIndex(o => o.v === p.value));
  return (
    <div class={'seg' + (p.big ? ' big' : '') + (p.small ? ' small' : '')} role="group" aria-label={p.label}
      style={{ '--i': i, '--n': p.options.length } as any}>
      <span class="thumb" />
      {p.options.map(o => (
        <button type="button" key={o.v} aria-pressed={o.v === p.value} onClick={() => p.onChange(o.v)}>
          {p.big ? <><b>{o.label}</b>{o.sub && <small>{o.sub}</small>}</> : o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch(p: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label class="switch">
      <input type="checkbox" id={p.id} role="switch" checked={p.checked} onChange={e => p.onChange((e.target as HTMLInputElement).checked)} />
      <span />
    </label>
  );
}

const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const prefersReducedMotion = () => reduce;

/** Keeps an overlay mounted while its close animation plays. */
export function useOverlay(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const t = setTimeout(() => { setMounted(false); document.body.style.overflow = ''; }, reduce ? 0 : 420);
    return () => clearTimeout(t);
  }, [open]);
  return { mounted, shown };
}

export function Sheet(p: { open: boolean; onClose: () => void; title: string; children: ComponentChildren }) {
  const { mounted, shown } = useOverlay(p.open);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (p.open && ref.current) ref.current.scrollTop = 0; }, [p.open]);
  if (!mounted) return null;
  return (
    <div class={'overlay' + (shown ? ' open' : '')}>
      <div class="backdrop" onClick={p.onClose} />
      <div class="sheet" ref={ref} role="dialog" aria-modal="true" aria-label={p.title}>
        <div class="sheet-head">
          <span class="grabber" aria-hidden="true" />
          <button class="sheet-cancel" type="button" onClick={p.onClose}>Cancel</button>
          <span class="sheet-title">{p.title}</span>
          <span />
        </div>
        {p.children}
      </div>
    </div>
  );
}

export function ActionSheet(p: { open: boolean; onClose: () => void; title: string; actions: { label: string; danger?: boolean; onClick: () => void }[] }) {
  const { mounted, shown } = useOverlay(p.open);
  if (!mounted) return null;
  return (
    <div class={'overlay' + (shown ? ' open' : '')}>
      <div class="backdrop" onClick={p.onClose} />
      <div class="action" role="dialog" aria-modal="true" aria-label={p.title}>
        <div class="action-group">
          <p class="action-title">{p.title}</p>
          {p.actions.map(a => <button key={a.label} class={'action-btn' + (a.danger ? ' danger' : '')} type="button" onClick={a.onClick}>{a.label}</button>)}
        </div>
        <button class="action-btn cancel" type="button" onClick={p.onClose}>Cancel</button>
      </div>
    </div>
  );
}

export function Toast() {
  const t = toast.value;
  const [last, setLast] = useState('');
  useEffect(() => { if (t) setLast(t.text); }, [t]);
  return <div class={'toast' + (t ? ' show' : '')} role="status" aria-live="polite">{t ? t.text : last}</div>;
}

/** Escape closes whichever overlay is open. */
export function useEscape() {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; if (sheetOpen.value) sheetOpen.value = false; else if (actionOpen.value) actionOpen.value = false; else if (calendarOpen.value) calendarOpen.value = null; };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);
}
