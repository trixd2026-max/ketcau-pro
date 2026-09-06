import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { useToastStore } from '../store/useToastStore';
import { createMaterial, CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import { suggestOptimize } from '../lib/optimize';
import { arrangeColumnRebar } from '../lib/rebar';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';
import OptimizeBox from '../components/OptimizeBox';
import FormulaTooltip from '../components/FormulaTooltip';
import { Pencil, Trash2, Copy, X, Columns3 } from 'lucide-react';

const emptyForm = {
  name: '', sectionType: 'rectangular' as 'rectangular' | 'circular' | 'T',
  b: 300, h: 500, d: 400, height: 3.3, N: 1000, Mx: 50, My: 30, Q: 40,
  bucklingLength: 3.3, concrete: 'B25', steel: 'CB400-V',
};

export default function ColumnPage() {
  const { addElement, updateElement, removeElement, duplicateElement, projects, currentProjectId } = useProjectStore();
  const { pendingEditId, setPendingEditId } = useUIStore();
  const { addToast } = useToastStore();
  const project = projects.find(p => p.id === currentProjectId);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const columns = project?.elements.filter(e => e.type === 'column') || [];

  const stats = useMemo(() => {
    let pass = 0, fail = 0, warn = 0;
    columns.forEach(c => {
      const s = project?.results[c.id]?.status;
      if (s === 'pass') pass++; else if (s === 'fail') fail++; else if (s === 'warning') warn++;
    });
    return { pass, fail, warn, count: columns.length };
  }, [columns, project]);

  const loadToForm = (c: any) => {
    setForm({
      name: c.name || '', sectionType: c.sectionType || 'rectangular',
      b: c.b || 300, h: c.h || 500, d: c.d || 400, height: c.height || 3.3,
      N: c.N || 0, Mx: c.Mx || 0, My: c.My || 0, Q: c.Q || 0,
      bucklingLength: c.bucklingLength || c.height || 3.3,
      concrete: c.material?.concreteGrade || 'B25', steel: c.material?.steelGrade || 'CB400-V',
    });
    setEditingId(c.id);
  };

  useEffect(() => {
    if (pendingEditId && project) {
      const el = project.elements.find(e => e.id === pendingEditId && e.type === 'column');
      if (el) loadToForm(el);
      setPendingEditId(null);
    }
  }, [pendingEditId]);

  const resetForm = () => { setForm({ ...emptyForm }); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name || editingId || 'C',
      type: 'column', sectionType: form.sectionType,
      b: form.b, h: form.h, d: form.d, height: form.height,
      N: form.N, Mx: form.Mx, My: form.My, Q: form.Q, bucklingLength: form.bucklingLength,
      material: createMaterial(form.concrete, form.steel),
    };
    if (editingId) { updateElement(editingId, payload); addToast(`Đã cập nhật cột ${payload.name}`, 'success'); }
    else { const id = `C${Date.now().toString().slice(-4)}`; addElement({ ...payload, id, name: form.name || id }); addToast(`Đã thêm cột ${form.name || id}`, 'success'); }
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Xóa cột "${name}"?`)) return;
    removeElement(id); if (editingId === id) resetForm(); addToast(`Đã xóa cột ${name}`, 'info');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase"><Columns3 size={14} /> Số cột</div>
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
          <div className="text-xs text-slate-500 uppercase flex items-center">Cảnh báo <FormulaTooltip topic="column" /></div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.warn}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{editingId ? 'Sửa cột' : 'Nhập liệu Cột (TCVN 5574:2018)'}</h2>
            {editingId && <button onClick={resetForm} className="text-sm text-slate-500 flex items-center gap-1"><X size={14} /> Hủy sửa</button>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Tên cấu kiện</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="C1..." /></div>
            <div><label className="block text-sm font-medium mb-1">Loại tiết diện</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.sectionType} onChange={e => setForm({ ...form, sectionType: e.target.value as any })}>
                <option value="rectangular">Chữ nhật</option><option value="circular">Tròn</option><option value="T">Chữ T</option>
              </select></div>
            {form.sectionType !== 'circular' ? (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">b (mm)</label>
                  <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.b} onChange={e => setForm({ ...form, b: +e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">h (mm)</label>
                  <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.h} onChange={e => setForm({ ...form, h: +e.target.value })} /></div>
              </div>
            ) : (
              <div><label className="block text-sm font-medium mb-1">Đường kính d (mm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.d} onChange={e => setForm({ ...form, d: +e.target.value })} /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Chiều cao tầng (m)</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.height} onChange={e => setForm({ ...form, height: +e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">l₀ (m)</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.bucklingLength} onChange={e => setForm({ ...form, bucklingLength: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">N (kN)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.N} onChange={e => setForm({ ...form, N: +e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Q (kN)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.Q} onChange={e => setForm({ ...form, Q: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Mx (kNm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.Mx} onChange={e => setForm({ ...form, Mx: +e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">My (kNm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.My} onChange={e => setForm({ ...form, My: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Cấp bê tông</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.concrete} onChange={e => setForm({ ...form, concrete: e.target.value })}>
                  {Object.keys(CONCRETE_GRADES).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Mác thép</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" value={form.steel} onChange={e => setForm({ ...form, steel: e.target.value })}>
                  {Object.keys(STEEL_GRADES).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              {editingId ? 'Lưu & Tính lại' : 'Tính toán & Thêm cột'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-lg mb-4">Kết quả & bố trí thép ({columns.length})</h2>
          {columns.length === 0 ? <p className="text-slate-500 text-sm">Chưa có cột. Import CSV hoặc nhập form.</p> : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {columns.map(c => {
                const res = project?.results[c.id];
                const opts = res ? suggestOptimize(c, res) : [];
                const cc = c as any;
                const A = cc.sectionType === 'circular' ? Math.PI * (cc.d || 400) ** 2 / 4 : cc.b * cc.h;
                const AsReq = A * 0.01;
                const i = cc.sectionType === 'circular' ? (cc.d || 400) / 4 : Math.min(cc.b, cc.h) / Math.sqrt(12);
                const lambda = ((cc.bucklingLength || 3) * 1000) / i;
                const rebar = arrangeColumnRebar(cc.b || cc.d || 300, cc.h || cc.d || 300, AsReq, lambda);
                return (
                  <div key={c.id} className={`border rounded-lg p-4 ${editingId === c.id ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {cc.sectionType === 'circular' ? `Ø${cc.d} mm` : `${cc.b}×${cc.h} mm`} · N={cc.N} kN
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {res && <StatusBadge status={res.status} />}
                        <button onClick={() => loadToForm(c)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil size={14} /></button>
                        <button onClick={() => { if (duplicateElement(c.id)) addToast('Đã nhân bản', 'success'); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Copy size={14} /></button>
                        <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {res && (
                      <div className="mt-2">
                        <UtilizationBar value={res.utilization} />
                        <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs space-y-1">
                          <div className="font-medium text-slate-700 dark:text-slate-200">Bố trí thép gợi ý</div>
                          <div>Thép dọc: <strong>{rebar.main.label}</strong> (As = {rebar.main.AsCm2.toFixed(2)} cm²) · {rebar.main.layers}</div>
                          <div>Cốt đai: <strong>{rebar.stirrup.label}</strong> — {rebar.stirrup.note}</div>
                          <div className="text-slate-500">λ ≈ {lambda.toFixed(0)}</div>
                        </div>
                        <ul className="mt-1 text-xs text-slate-500">{res.details.slice(0, 2).map((d, i) => <li key={i}>• {d}</li>)}</ul>
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
