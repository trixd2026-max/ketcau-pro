import { StructuralElement } from '../types';

/** Ước lượng thống kê thép sơ bộ (MVP) */
export interface SteelRow {
  element: string;
  type: string;
  mainBar: string;
  stirrup: string;
  weightKg: number;
}

export function estimateSteel(elements: StructuralElement[]): SteelRow[] {
  return elements.map(el => {
    if (el.type === 'column') {
      const c = el as any;
      const A = c.sectionType === 'circular'
        ? Math.PI * (c.d || 400) ** 2 / 4
        : c.b * c.h;
      const As = A * 0.01; // 1%
      const length = (c.height || 3) * 1.05; // m + neo
      const weight = (As / 1e6) * 7850 * length; // kg
      return {
        element: c.name,
        type: 'Cột',
        mainBar: `≈ ${(As / 100).toFixed(1)} cm² (1%A)`,
        stirrup: 'Ø8@150',
        weightKg: Math.round(weight * 10) / 10,
      };
    }
    if (el.type === 'beam') {
      const b = el as any;
      const As = b.b * (b.h - 40) * 0.008;
      const weight = (As / 1e6) * 7850 * (b.L || 6) * 1.1;
      return {
        element: b.name,
        type: 'Dầm',
        mainBar: `≈ ${(As / 100).toFixed(1)} cm²`,
        stirrup: 'Ø8@100/200',
        weightKg: Math.round(weight * 10) / 10,
      };
    }
    if (el.type === 'slab') {
      const s = el as any;
      const area = (s.lx || 4) * (s.ly || 5);
      const weight = area * 8; // ~8 kg/m2 sơ bộ
      return {
        element: s.name,
        type: 'Sàn',
        mainBar: 'Ø8@150 2 hướng',
        stirrup: '—',
        weightKg: Math.round(weight * 10) / 10,
      };
    }
    if (el.type === 'foundation') {
      const f = el as any;
      const weight = f.L * f.B * 25; // rough
      return {
        element: f.name,
        type: 'Móng',
        mainBar: 'Ø12@150',
        stirrup: '—',
        weightKg: Math.round(weight * 10) / 10,
      };
    }
    return { element: el.name, type: el.type, mainBar: '—', stirrup: '—', weightKg: 0 };
  });
}
