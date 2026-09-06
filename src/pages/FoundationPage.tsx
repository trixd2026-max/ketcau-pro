import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { createMaterial, CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';

export default function FoundationPage() {
  const { addElement, projects, currentProjectId } = useProjectStore();
  const project = projects.find(p => p.id === currentProjectId);

  const [form, setForm] = useState({
    name: '',
    L: 2.0,
    B: 2.0,
    H: 0.6,
    N: 1200,
    Mx: 40,
    My: 30,
    soilBearing: 200,
    concrete: 'B25',
    steel: 'CB400-V',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `M${Date.now().toString().slice(-4)}`;
    addElement({
      id,
      name: form.name || id,
      type: 'foundation',
      L: form.L,
      B: form.B,
      H: form.H,
      N: form.N,
      Mx: form.Mx,
      My: form.My,
      soilBearing: form.soilBearing,
      material: createMaterial(form.concrete, form.steel),
    });
    alert('Đã thêm móng và tính toán!');
  };

  const foundations = project?.elements.filter(e => e.type === 'foundation') || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Nhập liệu Móng đơn (TCVN 9362 + 5574)</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên móng</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="M1, Móng trục A..." />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">L (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.L} onChange={e => setForm({ ...form, L: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">B (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.B} onChange={e => setForm({ ...form, B: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">H (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.H} onChange={e => setForm({ ...form, H: +e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">N (kN)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.N} onChange={e => setForm({ ...form, N: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mx (kNm)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.Mx} onChange={e => setForm({ ...form, Mx: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">My (kNm)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.My} onChange={e => setForm({ ...form, My: +e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sức chịu tải đất R (kPa)</label>
            <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              value={form.soilBearing} onChange={e => setForm({ ...form, soilBearing: +e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Cấp bê tông</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.concrete} onChange={e => setForm({ ...form, concrete: e.target.value })}>
                {Object.keys(CONCRETE_GRADES).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mác thép</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.steel} onChange={e => setForm({ ...form, steel: e.target.value })}>
                {Object.keys(STEEL_GRADES).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
            Tính toán & Thêm móng
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Danh sách móng đã tính</h2>
        {foundations.length === 0 ? (
          <p className="text-slate-500 text-sm">Chưa có móng nào.</p>
        ) : (
          <div className="space-y-3">
            {foundations.map(f => {
              const res = project?.results[f.id];
              return (
                <div key={f.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {(f as any).L}×{(f as any).B}×{(f as any).H} m · N={(f as any).N} kN
                      </div>
                    </div>
                    {res && <StatusBadge status={res.status} />}
                  </div>
                  {res && (
                    <div className="mt-3">
                      <UtilizationBar value={res.utilization} />
                      <ul className="mt-2 text-xs text-slate-500 space-y-1">
                        {res.details.slice(0, 3).map((d, i) => <li key={i}>• {d}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}