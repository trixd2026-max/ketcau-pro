import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { createMaterial, CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';

export default function SlabPage() {
  const { addElement, projects, currentProjectId } = useProjectStore();
  const project = projects.find(p => p.id === currentProjectId);

  const [form, setForm] = useState({
    name: '',
    lx: 4,
    ly: 5,
    h: 120,
    M: 12,
    concrete: 'B25',
    steel: 'CB400-V',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `S${Date.now().toString().slice(-4)}`;
    addElement({
      id,
      name: form.name || id,
      type: 'slab',
      lx: form.lx,
      ly: form.ly,
      h: form.h,
      M: form.M,
      material: createMaterial(form.concrete, form.steel),
    });
    alert('Đã thêm sàn và tính toán!');
  };

  const slabs = project?.elements.filter(e => e.type === 'slab') || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Nhập liệu Sàn</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên sàn</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">lx (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.lx} onChange={e => setForm({ ...form, lx: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ly (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.ly} onChange={e => setForm({ ...form, ly: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">h (mm)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                value={form.h} onChange={e => setForm({ ...form, h: +e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">M (kNm/m)</label>
            <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              value={form.M} onChange={e => setForm({ ...form, M: +e.target.value })} />
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
          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
            Tính toán & Thêm sàn
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Danh sách sàn</h2>
        {slabs.length === 0 ? <p className="text-slate-500 text-sm">Chưa có sàn.</p> : (
          <div className="space-y-3">
            {slabs.map(s => {
              const res = project?.results[s.id];
              return (
                <div key={s.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between">
                    <div className="font-medium">{s.name}</div>
                    {res && <StatusBadge status={res.status} />}
                  </div>
                  {res && <div className="mt-2"><UtilizationBar value={res.utilization} /></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}