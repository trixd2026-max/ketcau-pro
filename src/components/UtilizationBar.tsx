import { cn } from '../lib/utils';

interface Props {
  value: number;
  className?: string;
}

export default function UtilizationBar({ value, className }: Props) {
  const pct = Math.min(value * 100, 150);
  const color =
    value > 1 ? 'bg-red-500' :
    value > 0.9 ? 'bg-amber-500' :
    'bg-emerald-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={cn(
        'text-sm font-mono w-14 text-right',
        value > 1 ? 'text-red-600 dark:text-red-400' :
        value > 0.9 ? 'text-amber-600 dark:text-amber-400' :
        'text-emerald-600 dark:text-emerald-400'
      )}>
        {value.toFixed(3)}
      </span>
    </div>
  );
}