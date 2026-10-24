/** Body weight input helpers. Weight is always stored in kilograms. */
export const LB_PER_KG = 2.20462;
export type WeightUnits = 'kg' | 'lb';

/** Pounds where the device locale is US English, kilograms everywhere else. */
export const defaultUnits = (): WeightUnits =>
  typeof navigator !== 'undefined' && /^en-US$/i.test(navigator.language || '') ? 'lb' : 'kg';

/** Text shown in an input for a stored weight. */
export function weightText(kg: number | null, units: WeightUnits): string {
  if (kg == null) return '';
  return String(Math.round((units === 'lb' ? kg * LB_PER_KG : kg) * 10) / 10);
}

/** Parses typed weight. Returns null for empty, NaN for invalid or outside 15–250 kg. */
export function parseWeight(text: string, units: WeightUnits): number | null {
  const t = text.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  const kg = units === 'lb' ? n / LB_PER_KG : n;
  if (!Number.isFinite(kg) || kg < 15 || kg > 250) return NaN;
  return Math.round(kg * 100) / 100;
}
