import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { useToastStore } from '../store/useToastStore';
import { createMaterial, CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import { suggestOptimize } from '../lib/optimize';
import { arrangeFoundationRebar } from '../lib/rebar';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';
import OptimizeBox from '../components/OptimizeBox';
import FormulaTooltip from '../components/FormulaTooltip';
import { Pencil, Trash2, Copy, X, Square } from 'lucide-react';

const emptyForm = {
  name: '', L: 2.0, B: 2.0, H: 0.6, N: 1200, Mx: 40, My: 30, soilBearing: 200, concrete: 'B25', steel: 'CB400-V',
};

export default function FoundationPage() {
  const { addElement, updateElement, removeElement, duplicateElement, projects, currentProjectId } = useProjectStore();
  const { pendingEditId, setPendingEditId } = useUIStore();
  const { addToast } = useToastStore();
  const project = projects.find(p => p.id === currentProjectId);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const foundations = project?.elements.filter(e => e.type === 'foundation') || [];

  const stats = useMemo(() => {
    let pass = 0, fail = 0, warn = 0;
    foundations.forEach(f => {
      const s = project?.results[f.id]?.status;
      if (s === 'pass') pass++; else if (s === 'fail') fail++; else if (s === 'warning') warn++;
    });
    return { pass, fail, warn, count: foundations.length };
  }, [foundations, project]);

  const loadToForm = (f: any) => {
    setForm({
      name: f.name || '', L: f.L, B: f.B, H: f.H, N: f.N, Mx: f.Mx, My: f.My,
      soilBearing: f.soilBearing, concrete: f.material?.concreteGrade || 'B25', steel: f.material?.steelGrade || 'CB400-V',
    });
    setEditingId(f.id);
  };

  useEffect(() => {
    if (pendingEditId && project) {
      const el = project.elements.find(e => e.id === pendingEditId && e.type === 'foundation');
      if (el) loadToForm(el);
      setPendingEditId(null);
    }
  }, [pendingEditId]);

  const resetForm = () => { setForm({ ...emptyForm }); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name || editingId || 'M', type: 'foundation',
      L: form.L, B: form.B, H: form.H, N: form.N, Mx: form.Mx, My: form.My,
      soilBearing: form.soilBearing, material: createMaterial(form.concrete, form.steel),
    };
    if (editingId) { updateElement(editingId, payload); addToast(`Đã cập nhật móng ${payload.name}`, 'success'); }
    else { const id = `M${Date.now().toString().slice(-4)}`; addElement({ ...payload, id, name: form.name || id }); addToast(`Đã thêm móng ${form.name || id}`, 'success'); }
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Xóa móng "${name}"?`)) return;
    removeElement(id); if (editingId === id) resetForm(); addToast(`Đã xóa móng ${name}`, 'info');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase"><Square size={14} /> Số móng</div>
          <div className="mt-1 text-2xl font-bold">{stats.count}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase">Đạt</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.pass}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase">Không đạt</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{stats.fail}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase flex items-center">Cảnh báo <FormulaTooltip topic="foundation" /></div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.warn}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{editingId ? 'Sửa móng' : 'Nhập liệu Móng đơn (TCVN 9362)'}</h2>
            {editingId && <button onClick={resetForm} className="text-sm text-slate-500 flex items-center gap-1"><X size={14} /> Hủy sửa</button>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Tên móng</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium mb-1">L (m)</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.L} onChange={e => setForm({ ...form, L: +e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">B (m)</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.B} onChange={e => setForm({ ...form, B: +e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">H (m)</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.H} onChange={e => setForm({ ...form, H: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium mb-1">N (kN)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.N} onChange={e => setForm({ ...form, N: +e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Mx (kNm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.Mx} onChange={e => setForm({ ...form, Mx: +e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">My (kNm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.My} onChange={e => setForm({ ...form, My: +e.target.value })} /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Sức chịu tải đất R (kPa)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.soilBearing} onChange={e => setForm({ ...form, soilBearing: +e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Cấp bê tông</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.concrete} onChange={e => setForm({ ...form, concrete: e.target.value })}>
                  {Object.keys(CONCRETE_GRADES).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Mác thép</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.steel} onChange={e => setForm({ ...form, steel: e.target.value })}>
                  {Object.keys(STEEL_GRADES).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">{editingId ? 'Lưu & Tính lại' : 'Tính toán & Thêm móng'}</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-lg mb-4">Kết quả & bố trí thép ({foundations.length})</h2>
          {foundations.length === 0 ? <p className="text-slate-500 text-sm">Chưa có móng.</p> : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {foundations.map(f => {
                const res = project?.results[f.id];
                const opts = res ? suggestOptimize(f, res) : [];
                const ff = f as any;
                const rebar = arrangeFoundationRebar(ff.L, ff.B, 8);
                return (
                  <div key={f.id} className={`border rounded-lg p-4 ${editingId === f.id ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{ff.L}×{ff.B}×{ff.H} m · N={ff.N} kN</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {res && <StatusBadge status={res.status} />}
                        <button onClick={() => loadToForm(f)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil size={14} /></button>
                        <button onClick={() => { if (duplicateElement(f.id)) addToast('Đã nhân bản', 'success'); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Copy size={14} /></button>
                        <button onClick={() => handleDelete(f.id, f.name)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {res && (
                      <div className="mt-2">
                        <UtilizationBar value={res.utilization} />
                        <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs space-y-1">
                          <div className="font-medium">Bố trí thép đáy</div>
                          <div>Phương X: <strong>{rebar.bottomX.label}</strong></div>
                          <div>Phương Y: <strong>{rebar.bottomY.label}</strong></div>
                          <div className="text-slate-500">{rebar.note}</div>
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
