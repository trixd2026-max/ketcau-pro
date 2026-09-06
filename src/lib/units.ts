export type LengthUnit = 'mm' | 'cm' | 'm';

const toMm: Record<LengthUnit, number> = { mm: 1, cm: 10, m: 1000 };

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  if (from === to) return value;
  const mm = value * toMm[from];
  return mm / toMm[to];
}

export function formatLength(valueMm: number, unit: LengthUnit, digits = 1): string {
  const v = convertLength(valueMm, 'mm', unit);
  return `${v.toFixed(digits)} ${unit}`;
}
