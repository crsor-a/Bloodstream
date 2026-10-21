import { useRef, useState } from 'preact/hooks';
import { backupFileName, makeBackup, parseBackup } from '../lib/storage';
import { deleteEverything, doses, importSnapshot, persisted, requestPersist, showToast, snapshot, storeKind } from '../state';

async function exportBackup() {
  const text = makeBackup(snapshot());
  const name = backupFileName();
  const file = new File([text], name, { type: 'application/json' });
  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Bloodstream backup' }); return; }
    catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  showToast('Backup saved');
}

export function DataCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [armed, setArmed] = useState(false);
  const all = doses.value;
  const since = all.length ? new Date(all[0].at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const where = storeKind.value === 'indexeddb' ? 'Saved on this device' : storeKind.value === 'localStorage' ? 'Saved in basic browser storage' : 'Not saved: storage is blocked';
  const safe = storeKind.value !== 'memory' && persisted.value === true;

  const onFile = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0]; input.value = '';
    if (!f) return;
    try {
      const added = await importSnapshot(parseBackup(await f.text()));
      showToast(added ? `Imported ${added} dose${added === 1 ? '' : 's'}` : 'Backup imported, nothing new to add');
    } catch (err) { showToast((err as Error).message); }
  };

  return (
    <section class="dsec reveal" style={{ '--d': 10 } as any} aria-labelledby="hData">
      <div class="sec-head"><h2 id="hData">Your data</h2></div>
      <div class="card">
        <div class="data-meta">
          <div><b>{all.length} dose{all.length === 1 ? '' : 's'} in history</b><span>{since ? `Since ${since}` : 'Nothing logged yet'} · {where}</span></div>
          <button type="button" class={'status-dot' + (safe ? ' ok' : '')} onClick={() => requestPersist()}
            title={safe ? 'The browser has agreed not to clear this data on its own' : 'Ask the browser to keep this data'}>{safe ? 'Protected' : 'Protect'}</button>
        </div>
        <button type="button" class="list-btn" onClick={exportBackup}><span>Export backup</span><span class="chev" aria-hidden="true" /></button>
        <button type="button" class="list-btn" onClick={() => fileRef.current?.click()}><span>Import backup</span><span class="chev" aria-hidden="true" /></button>
        <button type="button" class="list-btn danger" onClick={() => { if (armed) { setArmed(false); deleteEverything(); } else setArmed(true); }}>
          <span>{armed ? 'Tap again to delete everything' : 'Delete all data'}</span>
        </button>
        <input ref={fileRef} class="visually-hidden" type="file" accept="application/json,.json" onChange={onFile} aria-label="Choose a Bloodstream backup file" />
      </div>
      <p class="foot pad">Everything stays on this device; nothing is uploaded. Export a backup now and then, especially before deleting the Home Screen icon or switching phones.</p>
    </section>
  );
}
