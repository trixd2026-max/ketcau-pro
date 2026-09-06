import { cn } from '../lib/utils';

interface Props {
  status: 'pass' | 'fail' | 'warning';
  utilization?: number;
}

export default function StatusBadge({ status, utilization }: Props) {
  const map = {
    pass: { label: 'Đạt', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    fail: { label: 'Không đạt', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    warning: { label: 'Cảnh báo', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  };

  const { label, className } = map[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', className)}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'pass' && 'bg-emerald-500',
        status === 'fail' && 'bg-red-500',
        status === 'warning' && 'bg-amber-500'
      )} />
      {label}
      {utilization !== undefined && (
        <span className="opacity-70">({utilization.toFixed(3)})</span>
      )}
    </span>
  );
}