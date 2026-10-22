/** Shared building blocks for anything that defines a medication: kind, mg and how the pill looks. */
import type { Ref } from 'preact';
import { useState } from 'preact/hooks';
import type { Kind } from '../model/pk';
import type { ColorMode, PillLook, Shape } from '../model/types';
import { COLORS, DOSE_PRESETS, fmtMg, pillSVG } from '../lib/pill';
import { Segmented } from './controls';

export interface DraftInit { kind: Kind; mg: number; shape: Shape; mode: ColorMode; colors: { L: string; R: string }; shapeTouched?: boolean }

export function useMedDraft(init: DraftInit) {
  const [kind, setKindRaw] = useState<Kind>(init.kind);
  const [mg, setMg] = useState(init.mg);
  const [shape, setShapeRaw] = useState<Shape>(init.shape);
  const [shapeTouched, setShapeTouched] = useState(!!init.shapeTouched);
  const [mode, setModeRaw] = useState<ColorMode>(init.mode);
  const [half, setHalf] = useState<'L' | 'R'>('L');
  const [colors, setColors] = useState(init.colors);
  const look: PillLook = { shape, mode, colors: mode === 'whole' ? { L: colors.L, R: colors.L } : colors };
  return {
    kind, mg, shape, shapeTouched, mode, half, colors, look,
    setMg, setHalf,
    setKind(k: Kind) { setKindRaw(k); if (!shapeTouched) setShapeRaw(k === 'XR' ? 'capsule' : 'round'); },
    setShape(s: Shape) { setShapeRaw(s); setShapeTouched(true); },
    setMode(m: ColorMode) {
      setModeRaw(m);
      if (m === 'halves' && colors.R === colors.L) setColors({ L: colors.L, R: colors.L === '#f4f3ef' ? '#4a8cf0' : '#f4f3ef' });
      if (m === 'whole') setColors({ L: colors.L, R: colors.L });
    },
    applyColor(c: string) { setColors(mode === 'whole' ? { L: c, R: c } : { ...colors, [half]: c }); },
    step(dir: 1 | -1) { setMg(m => Math.min(60, Math.max(2.5, Math.round((m + dir * 2.5) / 2.5) * 2.5))); }
  };
}
export type MedDraft = ReturnType<typeof useMedDraft>;

export function PillPreview({ draft, previewRef, id }: { draft: MedDraft; previewRef?: Ref<HTMLDivElement>; id?: string }) {
  const { mode, half, look } = draft;
  return (
    <div class="pill-stage">
      <div id={id} class="pill-preview" ref={previewRef} role="button" tabIndex={0}
        aria-label={mode === 'halves' ? `Pill preview. Coloring the ${half === 'L' ? 'left' : 'right'} half. Press to switch halves.` : 'Pill preview'}
        onClick={e => { if (mode !== 'halves') return; const h = (e.target as Element).closest('[data-half]') as HTMLElement | null; if (h) draft.setHalf(h.dataset.half as 'L' | 'R'); }}
        onKeyDown={e => { if (mode === 'halves' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); draft.setHalf(half === 'L' ? 'R' : 'L'); } }}
        dangerouslySetInnerHTML={{ __html: pillSVG(look, { sel: mode === 'halves' ? half : null }) }} />
      <p class="hint">{mode === 'halves' ? 'Tap a half, then pick its color' : 'Pick a color below'}</p>
    </div>
  );
}

/** Release type + strength rows. Render inside a `.card.list`. */
export function KindDoseRows({ draft }: { draft: MedDraft }) {
  const { kind, mg } = draft;
  const presets: number[] = [...DOSE_PRESETS[kind]];
  if (!presets.includes(mg)) presets.push(mg);
  return (
    <>
      <div class="row col">
        <Segmented big label="Release type" value={kind} onChange={draft.setKind}
          options={[{ v: 'IR', label: 'IR', sub: 'Immediate release' }, { v: 'XR', label: 'XR', sub: 'Extended release' }]} />
        <p class="foot">{kind === 'IR'
          ? 'Tablet. Peaks around 3 hours after the dose and is usually felt for 4 to 6 hours.'
          : 'Capsule with two bead releases. Peaks around 7 hours and is usually felt for 8 to 12 hours.'}</p>
      </div>
      <div class="row col">
        <div class="row-head">
          <span>Dose</span>
          <div class="stepper">
            <button type="button" aria-label="Lower dose by 2.5 mg" onClick={() => draft.step(-1)}>&minus;</button>
            <output aria-live="polite">{fmtMg(mg)} mg</output>
            <button type="button" aria-label="Raise dose by 2.5 mg" onClick={() => draft.step(1)}>+</button>
          </div>
        </div>
        <div class="chips">
          {presets.sort((a, b) => a - b).map(d => <button key={d} type="button" class={'chip' + (d === mg ? ' on' : '')} onClick={() => draft.setMg(d)}>{fmtMg(d)} mg</button>)}
        </div>
      </div>
    </>
  );
}

/** Form + color rows. Render inside a `.card.list`. */
export function AppearanceRows({ draft }: { draft: MedDraft }) {
  const { shape, mode, half, colors } = draft;
  const current = mode === 'halves' ? colors[half] : colors.L;
  return (
    <>
      <div class="row col">
        <span class="row-label">Form</span>
        <Segmented label="Form" value={shape} onChange={draft.setShape}
          options={[{ v: 'capsule', label: 'Capsule' }, { v: 'round', label: 'Round tablet' }, { v: 'oval', label: 'Oval tablet' }]} />
      </div>
      <div class="row col">
        <span class="row-label">Color</span>
        <Segmented label="Color mode" value={mode} onChange={draft.setMode}
          options={[{ v: 'whole', label: 'Whole pill' }, { v: 'halves', label: 'Two halves' }]} />
        {mode === 'halves' && <Segmented small label="Half" value={half} onChange={draft.setHalf}
          options={[{ v: 'L', label: 'Left half' }, { v: 'R', label: 'Right half' }]} />}
        <div class="swatches">
          {COLORS.map(([n, c]) => (
            <button key={c} type="button" class={'sw' + (c === 'clear' ? ' clear' : '') + (current === c ? ' on' : '')} aria-label={n} title={n}
              style={c === 'clear' ? undefined : { background: c }} onClick={() => draft.applyColor(c)} />
          ))}
          <span class={'sw custom' + (COLORS.some(c => c[1] === current) ? '' : ' on')} title="Custom color">
            <input type="color" aria-label="Custom color" value={current.startsWith('#') ? current : '#7d7aff'} onInput={e => draft.applyColor((e.target as HTMLInputElement).value)} />
          </span>
        </div>
      </div>
    </>
  );
}
