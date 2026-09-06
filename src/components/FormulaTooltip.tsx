import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

const FORMULAS: Record<string, string> = {
  utilization: 'Hệ số sử dụng = Nội lực / Khả năng chịu lực. ≤ 1: Đạt; > 1: Không đạt (TCVN 5574:2018).',
  column: 'Cột: kiểm tra nén lệch tâm + độ mảnh λ. Ưu tiên mô hình biến dạng (Mục 8.1).',
  foundation: 'Móng: p = N/A ≤ R (TCVN 9362). e ≤ L/6 để tránh lật.',
  beam: 'Dầm: Mu, Qu theo Mục 8.1.2–8.1.3. sw,max = min(0.5h0, 300mm).',
  slab: 'Sàn: kiểm tra uốn theo dải. h0 ≈ h − 20mm.',
};

export default function FormulaTooltip({ topic = 'utilization' }: { topic?: string }) {
  const [open, setOpen] = useState(false);
  const text = FORMULAS[topic] || FORMULAS.utilization;

  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="text-slate-400 hover:text-blue-500"
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs bg-slate-900 text-white rounded-lg shadow-lg">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}
