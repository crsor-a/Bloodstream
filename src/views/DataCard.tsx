import { useEffect, useRef, useState } from 'preact/hooks';
import { parseBackup } from '../lib/storage';
import { exportBackup } from '../lib/exportData';
import {
  deleteEverything, doses, importSnapshot, libraryOpen, logs, persisted, profile, requestPersist, setBand, setLogging, setName,
  settings, showToast, storeKind, tour
} from '../state';
import { Segmented, Switch } from '../components/controls';

const PHASE_LABEL = { adjusting: 'Still adjusting', settled: 'Settled', unsure: 'Not sure' } as const;

function NameField() {
  const [v, setV] = useState(profile.value.name);
  useEffect(() => { setV(profile.value.name); }, [profile.value.name]);
  const commit = () => { if (v.trim() !== profile.value.name) { setName(v); showToast(v.trim() ? 'Name saved' : 'Name removed'); } };
  return (
    <div class="data-row first">
      <label class="row-label" for="nameIn">Name <span class="opt">optional</span></label>
      <input id="nameIn" class="text-input wide field" type="text" maxLength={30} autoComplete="given-name" placeholder="What should Bloodstream call you?"
        value={v} onInput={e => setV((e.target as HTMLInputElement).value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
      <p class="foot">Personalizes the greeting at the top of your dashboard, which changes through the day, like "Good evening{v.trim() ? `, ${v.trim()}` : ', Sam'}." Stored only on this device, and hidden in incognito.</p>
    </div>
  );
}

export function DataCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [armed, setArmed] = useState(false);
  const all = doses.value;
  const lg = settings.value.logging;
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
  const toggleLogging = (on: boolean) => {
    if (on) { tour.value = 'logging'; return; }
    setLogging(false);
    showToast(logs.value.length ? 'Doctor logging off. Your entries are kept.' : 'Doctor logging off');
  };

  return (
    <section class="dsec reveal" style={{ '--d': 10 } as any} aria-labelledby="hData">
      <div class="sec-head"><h2 id="hData">Data & information controls</h2></div>

      <div class="group-label">You</div>
      <div class="card">
        <NameField />
        <div class="data-row">
          <span class="row-label">Age group</span>
          <Segmented label="Age group" value={profile.value.band} onChange={b => { setBand(b); showToast('Age group updated'); }}
            options={[{ v: 'child', label: '6 to 12' }, { v: 'teen', label: '13 to 17' }, { v: 'adult', label: '18+' }]} />
          <p class="foot">Sets how quickly your body clears each dose, using the FDA label's half-lives for each age group.</p>
        </div>
      </div>

      <div class="group-label">Doctor logging</div>
      <div class="card list">
        <div class="row">
          <div class="row-text"><label for="logSw">Medicine adjustment logging</label><small>Note side effects, benefits and questions for your prescriber</small></div>
          <Switch id="logSw" checked={lg.enabled} onChange={toggleLogging} />
        </div>
        {lg.enabled ? <>
          <button type="button" class="list-btn" onClick={() => { libraryOpen.value = { section: 'entries' }; }}>
            <span>Logging library<small class="block">{logs.value.length} entr{logs.value.length === 1 ? 'y' : 'ies'}, articles and appointments</small></span><span class="chev" aria-hidden="true" />
          </button>
          <button type="button" class="list-btn" onClick={() => { tour.value = 'logging'; }}>
            <span>Treatment phase<small class="block">{PHASE_LABEL[lg.phase ?? 'unsure']}</small></span><span class="chev" aria-hidden="true" />
          </button>
        </> : (
          <button type="button" class="list-btn" onClick={() => { libraryOpen.value = { section: 'articles' }; }}>
            <span>Browse articles<small class="block">Side effects, safety and areas of functioning</small></span><span class="chev" aria-hidden="true" />
          </button>
        )}
      </div>
      <p class="foot pad">{lg.enabled ? 'The log button in the top bar opens a new entry, with a shortcut to your library.' : 'Turning this on walks you through a short setup and adds a log button to the top bar.'}</p>

      <div class="group-label">Your data</div>
      <div class="card">
        <div class="data-meta">
          <div><b>{all.length} dose{all.length === 1 ? '' : 's'} in history</b><span>{since ? `Since ${since}` : 'Nothing logged yet'} · {where}</span></div>
          <button type="button" class={'status-dot' + (safe ? ' ok' : '')} onClick={() => requestPersist()}
            title={safe ? 'The browser has agreed not to clear this data on its own' : 'Ask the browser to keep this data'}>{safe ? 'Protected' : 'Protect'}</button>
        </div>
        <button type="button" class="list-btn" onClick={exportBackup}><span>Export backup<small class="block">Doses, medications, schedules, logs and settings</small></span><span class="chev" aria-hidden="true" /></button>
        <button type="button" class="list-btn" onClick={() => fileRef.current?.click()}><span>Import backup</span><span class="chev" aria-hidden="true" /></button>
        <button type="button" class="list-btn danger" onClick={() => { if (armed) { setArmed(false); deleteEverything(); } else setArmed(true); }}>
          <span>{armed ? 'Tap again to delete everything' : 'Delete all data'}</span>
          {!armed && <small>Erases history, logs and settings</small>}
        </button>
        <input ref={fileRef} class="visually-hidden" type="file" accept="application/json,.json" onChange={onFile} aria-label="Choose a Bloodstream backup file" />
      </div>
      <p class="foot pad">Everything stays on this device; nothing is uploaded and there are no analytics. Export a backup now and then, especially before deleting the Home Screen icon or switching phones.</p>
    </section>
  );
}
