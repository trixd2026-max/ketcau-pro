import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { useToastStore } from '../store/useToastStore';
import { createMaterial, CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import { suggestOptimize } from '../lib/optimize';
import { arrangeSlabRebar } from '../lib/rebar';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';
import OptimizeBox from '../components/OptimizeBox';
import FormulaTooltip from '../components/FormulaTooltip';
import { Pencil, Trash2, Copy, X, Layers } from 'lucide-react';

const emptyForm = { name: '', lx: 4, ly: 5, h: 120, M: 12, concrete: 'B25', steel: 'CB400-V' };

export default function SlabPage() {
  const { addElement, updateElement, removeElement, duplicateElement, projects, currentProjectId } = useProjectStore();
  const { pendingEditId, setPendingEditId } = useUIStore();
  const { addToast } = useToastStore();
  const project = projects.find(p => p.id === currentProjectId);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const slabs = project?.elements.filter(e => e.type === 'slab') || [];

  const stats = useMemo(() => {
    let pass = 0, fail = 0, warn = 0, area = 0;
    slabs.forEach(s => {
      const st = project?.results[s.id]?.status;
      if (st === 'pass') pass++; else if (st === 'fail') fail++; else if (st === 'warning') warn++;
      const ss = s as any;
      area += (ss.lx || 0) * (ss.ly || 0);
    });
    return { pass, fail, warn, count: slabs.length, area };
  }, [slabs, project]);

  const loadToForm = (s: any) => {
    setForm({ name: s.name || '', lx: s.lx, ly: s.ly, h: s.h, M: s.M, concrete: s.material?.concreteGrade || 'B25', steel: s.material?.steelGrade || 'CB400-V' });
    setEditingId(s.id);
  };

  useEffect(() => {
    if (pendingEditId && project) {
      const el = project.elements.find(e => e.id === pendingEditId && e.type === 'slab');
      if (el) loadToForm(el);
      setPendingEditId(null);
    }
  }, [pendingEditId]);

  const resetForm = () => { setForm({ ...emptyForm }); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name || editingId || 'S', type: 'slab',
      lx: form.lx, ly: form.ly, h: form.h, M: form.M,
      material: createMaterial(form.concrete, form.steel),
    };
    if (editingId) { updateElement(editingId, payload); addToast(`Đã cập nhật sàn ${payload.name}`, 'success'); }
    else { const id = `S${Date.now().toString().slice(-4)}`; addElement({ ...payload, id, name: form.name || id }); addToast(`Đã thêm sàn ${form.name || id}`, 'success'); }
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Xóa sàn "${name}"?`)) return;
    removeElement(id); if (editingId === id) resetForm(); addToast(`Đã xóa sàn ${name}`, 'info');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase"><Layers size={14} /> Số sàn</div>
          <div className="mt-1 text-2xl font-bold">{stats.count}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase">Diện tích</div>
          <div className="mt-1 text-2xl font-bold">{stats.area.toFixed(1)}</div>
          <div className="text-xs text-slate-500">m²</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase">Đạt</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.pass}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase flex items-center">Cần xử lý <FormulaTooltip topic="slab" /></div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.fail + stats.warn}</div>
        </div>
      </div>

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
          <h2 className="font-semibold text-lg mb-4">Kết quả & bố trí thép ({slabs.length})</h2>
          {slabs.length === 0 ? <p className="text-slate-500 text-sm">Chưa có sàn.</p> : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {slabs.map(s => {
                const res = project?.results[s.id];
                const opts = res ? suggestOptimize(s, res) : [];
                const ss = s as any;
                const rebar = arrangeSlabRebar(ss.h, ss.M, ss.material?.Rs || 350);
                return (
                  <div key={s.id} className={`border rounded-lg p-4 ${editingId === s.id ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{ss.lx}×{ss.ly} m · h={ss.h} mm · M={ss.M} kNm/m</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {res && <StatusBadge status={res.status} />}
                        <button onClick={() => loadToForm(s)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil size={14} /></button>
                        <button onClick={() => { if (duplicateElement(s.id)) addToast('Đã nhân bản', 'success'); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Copy size={14} /></button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {res && (
                      <div className="mt-2">
                        <UtilizationBar value={res.utilization} />
                        <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs space-y-1">
                          <div className="font-medium">Bố trí thép sàn</div>
                          <div>Thép chịu lực: <strong>{rebar.main.label}</strong> (As ≈ {(rebar.main.As / 100).toFixed(2)} cm²/m)</div>
                          <div>Thép phân bố: <strong>{rebar.dist.label}</strong></div>
                          <div className="text-slate-500">As yêu cầu ≈ {rebar.AsReqCm2.toFixed(2)} cm²/m · h₀ ≈ {rebar.h0} mm</div>
                        </div>
                        <OptimizeBox suggestions={opts} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
