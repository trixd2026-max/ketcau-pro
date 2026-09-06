import { OptimizeSuggestion } from '../lib/optimize';
import { Lightbulb } from 'lucide-react';

export default function OptimizeBox({ suggestions }: { suggestions: OptimizeSuggestion[] }) {
  if (!suggestions.length) return null;
  return (
    <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
        <Lightbulb size={14} /> Gợi ý tối ưu
      </div>
      <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-100">
        {suggestions.map((s, i) => (
          <li key={i}>
            <span className="font-medium">{s.field}:</span>{' '}
            <span className="line-through opacity-60">{s.current}</span>
            {' → '}
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">{s.suggested}</span>
            <div className="opacity-70">{s.reason}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
