import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { createMaterial } from '../lib/materials';
import { CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';

export default function ColumnPage() {
  const { addElement, projects, currentProjectId } = useProjectStore();
  const project = projects.find(p => p.id === currentProjectId);

  const [form, setForm] = useState({
    name: '',
    sectionType: 'rectangular' as 'rectangular' | 'circular' | 'T',
    b: 300,
    h: 500,
    d: 400,
    height: 3.3,
    N: 1000,
    Mx: 50,
    My: 30,
    Q: 40,
    bucklingLength: 3.3,
    concrete: 'B25',
    steel: 'CB400-V',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `C${Date.now().toString().slice(-4)}`;
    addElement({
      id,
      name: form.name || id,
      type: 'column',
      sectionType: form.sectionType,
      b: form.b,
      h: form.h,
      d: form.d,
      height: form.height,
      N: form.N,
      Mx: form.Mx,
      My: form.My,
      Q: form.Q,
      bucklingLength: form.bucklingLength,
      material: createMaterial(form.concrete, form.steel),
    });
    alert('Đã thêm cột và tính toán!');
  };

  const columns = project?.elements.filter(e => e.type === 'column') || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Nhập liệu Cột (TCVN 5574:2018)</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên cấu kiện</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="C1, Cột trục A..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Loại tiết diện</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              value={form.sectionType}
              onChange={e => setForm({ ...form, sectionType: e.target.value as any })}
            >
              <option value="rectangular">Chữ nhật</option>
              <option value="circular">Tròn</option>
              <option value="T">Chữ T</option>
            </select>
          </div>

          {form.sectionType !== 'circular' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">b (mm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  value={form.b} onChange={e => setForm({ ...form, b: +e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">h (mm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  value={form.h} onChange={e => setForm({ ...form, h: +e.target.value })} />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Đường kính d (mm)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.d} onChange={e => setForm({ ...form, d: +e.target.value })} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Chiều cao tầng (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.height} onChange={e => setForm({ ...form, height: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chiều dài tính toán l0 (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.bucklingLength} onChange={e => setForm({ ...form, bucklingLength: +e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">N (kN)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.N} onChange={e => setForm({ ...form, N: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Q (kN)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.Q} onChange={e => setForm({ ...form, Q: +e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            Tính toán & Thêm cột
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Danh sách cột đã tính</h2>
        {columns.length === 0 ? (
          <p className="text-slate-500 text-sm">Chưa có cột nào.</p>
        ) : (
          <div className="space-y-3">
            {columns.map(c => {
              const res = project?.results[c.id];
              return (
                <div key={c.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {(c as any).sectionType === 'circular'
                          ? `Ø${(c as any).d} mm`
                          : `${(c as any).b}×${(c as any).h} mm`} · N={(c as any).N} kN
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