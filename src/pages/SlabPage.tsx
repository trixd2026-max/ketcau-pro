import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { createMaterial, CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';
import { Pencil, Trash2, Copy, X } from 'lucide-react';

const emptyForm = { name: '', lx: 4, ly: 5, h: 120, M: 12, concrete: 'B25', steel: 'CB400-V' };

export default function SlabPage() {
  const { addElement, updateElement, removeElement, duplicateElement, projects, currentProjectId } = useProjectStore();
  const { addToast } = useToastStore();
  const project = projects.find(p => p.id === currentProjectId);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const slabs = project?.elements.filter(e => e.type === 'slab') || [];

  const loadToForm = (s: any) => {
    setForm({ name: s.name || '', lx: s.lx, ly: s.ly, h: s.h, M: s.M, concrete: s.material?.concreteGrade || 'B25', steel: s.material?.steelGrade || 'CB400-V' });
    setEditingId(s.id);
  };
  const resetForm = () => { setForm({ ...emptyForm }); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name || editingId || 'S', type: 'slab' as const, lx: form.lx, ly: form.ly, h: form.h, M: form.M, material: createMaterial(form.concrete, form.steel) };
    if (editingId) { updateElement(editingId, payload); addToast(`Đã cập nhật sàn ${payload.name}`, 'success'); }
    else { const id = `S${Date.now().toString().slice(-4)}`; addElement({ ...payload, id, name: form.name || id }); addToast(`Đã thêm sàn ${form.name || id}`, 'success'); }
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Xóa sàn "${name}"?`)) return;
    removeElement(id); if (editingId === id) resetForm(); addToast(`Đã xóa sàn ${name}`, 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{editingId ? 'Sửa sàn' : 'Nhập liệu Sàn'}</h2>
          {editingId && <button onClick={resetForm} className="text-sm text-slate-500 flex items-center gap-1"><X size={14} /> Hủy sửa</button>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Tên sàn</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium mb-1">lx (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.lx} onChange={e => setForm({ ...form, lx: +e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">ly (m)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.ly} onChange={e => setForm({ ...form, ly: +e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">h (mm)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.h} onChange={e => setForm({ ...form, h: +e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">M (kNm/m)</label>
            <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.M} onChange={e => setForm({ ...form, M: +e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Cấp bê tông</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.concrete} onChange={e => setForm({ ...form, concrete: e.target.value })}>
                {Object.keys(CONCRETE_GRADES).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Mác thép</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.steel} onChange={e => setForm({ ...form, steel: e.target.value })}>
                {Object.keys(STEEL_GRADES).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">{editingId ? 'Lưu & Tính lại' : 'Tính toán & Thêm sàn'}</button>
        </form>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Danh sách sàn ({slabs.length})</h2>
        {slabs.length === 0 ? <p className="text-slate-500 text-sm">Chưa có sàn.</p> : (
          <div className="space-y-3">
            {slabs.map(s => {
              const res = project?.results[s.id];
              return (
                <div key={s.id} className={`border rounded-lg p-4 ${editingId === s.id ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div><div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{(s as any).lx}×{(s as any).ly} m · h={(s as any).h} mm</div></div>
                    <div className="flex items-center gap-1">
                      {res && <StatusBadge status={res.status} />}
                      <button onClick={() => loadToForm(s)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Sửa"><Pencil size={14} /></button>
                      <button onClick={() => { const n = duplicateElement(s.id); if (n) addToast('Đã nhân bản sàn', 'success'); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Nhân bản"><Copy size={14} /></button>
                      <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" title="Xóa"><Trash2 size={14} /></button>
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
