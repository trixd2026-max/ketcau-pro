import { StructuralElement, CheckResult } from '../types';

export interface OptimizeSuggestion {
  field: string;
  current: string;
  suggested: string;
  reason: string;
}

/** Gợi ý tối ưu khi hệ số sử dụng > 1 */
export function suggestOptimize(el: StructuralElement, result: CheckResult): OptimizeSuggestion[] {
  if (result.utilization <= 1) return [];
  const suggestions: OptimizeSuggestion[] = [];
  const util = result.utilization;

  if (el.type === 'column') {
    const c = el as any;
    if (c.sectionType === 'rectangular' || c.sectionType === 'T') {
      const newB = Math.ceil((c.b * Math.sqrt(util)) / 50) * 50;
      const newH = Math.ceil((c.h * Math.sqrt(util)) / 50) * 50;
      suggestions.push({
        field: 'Tiết diện',
        current: `${c.b}×${c.h} mm`,
        suggested: `${Math.max(newB, c.b)}×${Math.max(newH, c.h)} mm`,
        reason: `Tăng tiết diện ~${((Math.sqrt(util) - 1) * 100).toFixed(0)}% để hệ số ≤ 1`,
      });
    } else {
      const newD = Math.ceil(((c.d || c.b) * Math.sqrt(util)) / 50) * 50;
      suggestions.push({
        field: 'Đường kính',
        current: `Ø${c.d || c.b} mm`,
        suggested: `Ø${newD} mm`,
        reason: 'Tăng đường kính cột tròn',
      });
    }
    const grades = ['B25', 'B30', 'B35', 'B40', 'B45', 'B50'];
    const idx = grades.indexOf(c.material?.concreteGrade || 'B25');
    if (idx >= 0 && idx < grades.length - 1) {
      suggestions.push({
        field: 'Cấp bê tông',
        current: c.material?.concreteGrade || 'B25',
        suggested: grades[Math.min(idx + 1, grades.length - 1)],
        reason: 'Nâng cấp bê tông để tăng Rb',
      });
    }
  }

  if (el.type === 'foundation') {
    const f = el as any;
    const factor = Math.sqrt(util);
    const newL = Math.ceil(f.L * factor * 10) / 10;
    const newB = Math.ceil(f.B * factor * 10) / 10;
    suggestions.push({
      field: 'Đáy móng',
      current: `${f.L}×${f.B} m`,
      suggested: `${newL}×${newB} m`,
      reason: `Tăng diện tích đáy ~${((factor * factor - 1) * 100).toFixed(0)}% giảm áp lực đất`,
    });
  }

  if (el.type === 'beam') {
    const b = el as any;
    const newH = Math.ceil((b.h * Math.sqrt(util)) / 50) * 50;
    suggestions.push({
      field: 'Chiều cao dầm',
      current: `${b.b}×${b.h} mm`,
      suggested: `${b.b}×${newH} mm`,
      reason: 'Tăng h để tăng khả năng chịu uốn/cắt',
    });
  }

  if (el.type === 'slab') {
    const s = el as any;
    const newH = Math.ceil((s.h * Math.sqrt(util)) / 10) * 10;
    suggestions.push({
      field: 'Chiều dày sàn',
      current: `${s.h} mm`,
      suggested: `${newH} mm`,
      reason: 'Tăng chiều dày sàn',
    });
  }

  return suggestions;
}
