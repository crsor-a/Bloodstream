import type { Dose } from '../model/types';
import { meds } from '../state';
import { fmtMg, shapeName } from './pill';

/** A saved medication's name plus whatever it doesn't already say: "Morning XR · 20 mg", "XR 20 mg". */
function withDetails(name: string, d: Dose, kind = true): string {
  const parts = [name];
  if (kind && !name.includes(d.kind)) parts.push(d.kind);
  if (!name.includes(fmtMg(d.mg))) parts.push(`${fmtMg(d.mg)} mg`);
  return parts.join(' · ');
}
const medOf = (d: Dose) => (d.medId ? meds.value.find(x => x.id === d.medId) : undefined);

/** Hero chip label: saved medication name with kind and strength, or "XR capsule · 20 mg". */
export function doseName(d: Dose): string {
  const m = medOf(d);
  return m ? withDetails(m.name, d) : `${d.kind} ${shapeName(d.shape)} · ${fmtMg(d.mg)} mg`;
}
/** Dose row title: "Morning XR · 20 mg" or "XR · 20 mg". */
export function doseTitle(d: Dose): string {
  const m = medOf(d);
  return m ? withDetails(m.name, d) : `${d.kind} · ${fmtMg(d.mg)} mg`;
}
