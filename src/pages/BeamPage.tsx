import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { createMaterial, CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';
import { Pencil, Trash2, Copy, X } from 'lucide-react';

const emptyForm = { name: '', b: 220, h: 500, L: 6, M: 100, Q: 70, concrete: 'B25', steel: 'CB400-V' };

export default function BeamPage() {
  const { addElement, updateElement, removeElement, duplicateElement, projects, currentProjectId } = useProjectStore();
  const { addToast } = useToastStore();
  const project = projects.find(p => p.id === currentProjectId);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const beams = project?.elements.filter(e => e.type === 'beam') || [];

  const loadToForm = (b: any) => {
    setForm({ name: b.name || '', b: b.b, h: b.h, L: b.L, M: b.M, Q: b.Q, concrete: b.material?.concreteGrade || 'B25', steel: b.material?.steelGrade || 'CB400-V' });
    setEditingId(b.id);
  };
  const resetForm = () => { setForm({ ...emptyForm }); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name || editingId || 'D', type: 'beam' as const, b: form.b, h: form.h, L: form.L, M: form.M, Q: form.Q, material: createMaterial(form.concrete, form.steel) };
    if (editingId) { updateElement(editingId, payload); addToast(`Đã cập nhật dầm ${payload.name}`, 'success'); }
    else { const id = `D${Date.now().toString().slice(-4)}`; addElement({ ...payload, id, name: form.name || id }); addToast(`Đã thêm dầm ${form.name || id}`, 'success'); }
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Xóa dầm "${name}"?`)) return;
    removeElement(id); if (editingId === id) resetForm(); addToast(`Đã xóa dầm ${name}`, 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{editingId ? 'Sửa dầm' : 'Nhập liệu Dầm'}</h2>
          {editingId && <button onClick={resetForm} className="text-sm text-slate-500 flex items-center gap-1"><X size={14} /> Hủy sửa</button>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Tên dầm</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium mb-1">b (mm)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.b} onChange={e => setForm({ ...form, b: +e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">h (mm)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.h} onChange={e => setForm({ ...form, h: +e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">L (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.L} onChange={e => setForm({ ...form, L: +e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">M (kNm)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.M} onChange={e => setForm({ ...form, M: +e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Q (kN)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.Q} onChange={e => setForm({ ...form, Q: +e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Cấp bê tông</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.concrete} onChange={e => setForm({ ...form, concrete: e.target.value })}>
                {Object.keys(CONCRETE_GRADES).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Mác thép</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.steel} onChange={e => setForm({ ...form, steel: e.target.value })}>
                {Object.keys(STEEL_GRADES).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">{editingId ? 'Lưu & Tính lại' : 'Tính toán & Thêm dầm'}</button>
        </form>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Danh sách dầm ({beams.length})</h2>
        {beams.length === 0 ? <p className="text-slate-500 text-sm">Chưa có dầm.</p> : (
          <div className="space-y-3">
            {beams.map(b => {
              const res = project?.results[b.id];
              return (
                <div key={b.id} className={`border rounded-lg p-4 ${editingId === b.id ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div><div className="font-medium">{b.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{(b as any).b}×{(b as any).h} mm · L={(b as any).L} m</div></div>
                    <div className="flex items-center gap-1">
                      {res && <StatusBadge status={res.status} />}
                      <button onClick={() => loadToForm(b)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Sửa"><Pencil size={14} /></button>
                      <button onClick={() => { const n = duplicateElement(b.id); if (n) addToast('Đã nhân bản dầm', 'success'); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Nhân bản"><Copy size={14} /></button>
                      <button onClick={() => handleDelete(b.id, b.name)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" title="Xóa"><Trash2 size={14} /></button>
                    </div>
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
