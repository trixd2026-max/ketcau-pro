import { useState } from 'react';
import { convertLength, LengthUnit } from '../lib/units';

export default function UnitConverter() {
  const [value, setValue] = useState(300);
  const [from, setFrom] = useState<LengthUnit>('mm');
  const [to, setTo] = useState<LengthUnit>('cm');
  const result = convertLength(value, from, to);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="font-medium text-sm mb-3">Đổi đơn vị chiều dài</h3>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-slate-500">Giá trị</label>
          <input type="number" value={value} onChange={e => setValue(+e.target.value)}
            className="block w-24 px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Từ</label>
          <select value={from} onChange={e => setFrom(e.target.value as LengthUnit)}
            className="block px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m</option>
          </select>
        </div>
        <span className="pb-1.5">→</span>
        <div>
          <label className="text-xs text-slate-500">Sang</label>
          <select value={to} onChange={e => setTo(e.target.value as LengthUnit)}
            className="block px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m</option>
          </select>
        </div>
        <div className="pb-1.5 font-mono font-medium text-blue-600 dark:text-blue-400">
          = {result.toFixed(4)} {to}
        </div>
      </div>
    </div>
  );
}
