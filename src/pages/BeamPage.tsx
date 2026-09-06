import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { useToastStore } from '../store/useToastStore';
import { createMaterial, CONCRETE_GRADES, STEEL_GRADES } from '../lib/materials';
import { suggestOptimize } from '../lib/optimize';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';
import OptimizeBox from '../components/OptimizeBox';
import FormulaTooltip from '../components/FormulaTooltip';
import { Pencil, Trash2, Copy, X, Layers } from 'lucide-react';

const emptyForm = {
  name: '',
  group: 'BX',
  b: 220,
  h: 500,
  L: 6,
  a: 40,
  M: 100,
  Q: 70,
  concrete: 'B25',
  steel: 'CB400-V',
};

export default function BeamPage() {
  const { addElement, updateElement, removeElement, duplicateElement, projects, currentProjectId } = useProjectStore();
  const { pendingEditId, setPendingEditId } = useUIStore();
  const { addToast } = useToastStore();
  const project = projects.find(p => p.id === currentProjectId);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const beams = project?.elements.filter(e => e.type === 'beam') || [];

  const stats = useMemo(() => {
    let pass = 0, fail = 0, warn = 0;
    let totalAs = 0;
    beams.forEach(b => {
      const res = project?.results[b.id];
      if (res?.status === 'pass') pass++;
      else if (res?.status === 'fail') fail++;
      else if (res?.status === 'warning') warn++;
      // Ước As ~ 0.8% bh
      const bb = b as any;
      totalAs += (bb.b * (bb.h - 40) * 0.008) / 100; // cm2
    });
    return { pass, fail, warn, totalAs, count: beams.length };
  }, [beams, project]);

  const byGroup = useMemo(() => {
    const map: Record<string, { total: number; pass: number }> = {};
    beams.forEach(b => {
      const g = (b as any).group || 'Khác';
      if (!map[g]) map[g] = { total: 0, pass: 0 };
      map[g].total++;
      if (project?.results[b.id]?.status === 'pass') map[g].pass++;
    });
    return map;
  }, [beams, project]);

  const loadToForm = (b: any) => {
    setForm({
      name: b.name || '',
      group: b.group || 'BX',
      b: b.b, h: b.h, L: b.L, a: b.a || 40,
      M: b.M, Q: b.Q,
      concrete: b.material?.concreteGrade || 'B25',
      steel: b.material?.steelGrade || 'CB400-V',
    });
    setEditingId(b.id);
  };

  useEffect(() => {
    if (pendingEditId && project) {
      const el = project.elements.find(e => e.id === pendingEditId && e.type === 'beam');
      if (el) loadToForm(el);
      setPendingEditId(null);
    }
  }, [pendingEditId]);

  const resetForm = () => { setForm({ ...emptyForm }); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name || editingId || 'D',
      type: 'beam' as const,
      group: form.group,
      b: form.b, h: form.h, L: form.L, a: form.a,
      M: form.M, Q: form.Q,
      material: createMaterial(form.concrete, form.steel),
    };
    if (editingId) {
      updateElement(editingId, payload);
      addToast(`Đã cập nhật dầm ${payload.name}`, 'success');
    } else {
      const id = `D${Date.now().toString().slice(-4)}`;
      addElement({ ...payload, id, name: form.name || id });
      addToast(`Đã thêm dầm ${form.name || id}`, 'success');
    }
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Xóa dầm "${name}"?`)) return;
    removeElement(id);
    if (editingId === id) resetForm();
    addToast(`Đã xóa dầm ${name}`, 'info');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Stats như bảng tính dầm chuyên dụng */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase">
            <Layers size={14} /> Số dầm
          </div>
          <div className="mt-1 text-2xl font-bold">{stats.count}</div>
          <div className="text-xs text-slate-500">{Object.keys(byGroup).length} nhóm</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase">Dầm đạt</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.pass}</div>
          <div className="text-xs text-slate-500">{stats.fail} không đạt · {stats.warn} cảnh báo</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase flex items-center">Tổng As bố trí <FormulaTooltip topic="beam" /></div>
          <div className="mt-1 text-2xl font-bold">{stats.totalAs.toFixed(2)}</div>
          <div className="text-xs text-slate-500">cm² (ước lượng 0.8%bh)</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 uppercase">Cần xử lý</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.fail + stats.warn}</div>
          <div className="text-xs text-slate-500">dầm chưa đạt / cảnh báo</div>
        </div>
      </div>

      {Object.keys(byGroup).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="font-medium text-sm mb-2">Theo nhóm dầm</h3>
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-xs">
              <tr>
                <th className="text-left py-1">Nhóm</th>
                <th className="text-left py-1">Mô tả</th>
                <th className="text-right py-1">Số dầm</th>
                <th className="text-right py-1">Đạt</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byGroup).map(([g, v]) => (
                <tr key={g} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="py-2 font-medium">{g}</td>
                  <td className="py-2 text-slate-500">{g === 'BX' ? 'Dầm theo phương X' : g === 'BY' ? 'Dầm theo phương Y' : 'Khác'}</td>
                  <td className="py-2 text-right">{v.total}</td>
                  <td className="py-2 text-right">{v.pass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{editingId ? 'Sửa dầm' : 'Nhập liệu Dầm (TCVN 5574:2018)'}</h2>
            {editingId && <button onClick={resetForm} className="text-sm text-slate-500 flex items-center gap-1"><X size={14} /> Hủy sửa</button>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tên dầm</label>
                <input className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="D1, Dầm trục A..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nhóm</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  value={form.group} onChange={e => setForm({ ...form, group: e.target.value })}>
                  <option value="BX">BX — Phương X</option>
                  <option value="BY">BY — Phương Y</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
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
              <div>
                <label className="block text-sm font-medium mb-1">L (m)</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  value={form.L} onChange={e => setForm({ ...form, L: +e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">a (mm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  value={form.a} onChange={e => setForm({ ...form, a: +e.target.value })} title="Lớp bảo vệ đến trọng tâm thép" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">M (kNm)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  value={form.M} onChange={e => setForm({ ...form, M: +e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Q (kN)</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  value={form.Q} onChange={e => setForm({ ...form, Q: +e.target.value })} />
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
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              {editingId ? 'Lưu & Tính lại' : 'Tính toán & Thêm dầm'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-lg mb-4">Kết quả dầm ({beams.length})</h2>
          {beams.length === 0 ? (
            <p className="text-slate-500 text-sm">Chưa có dầm. Nhập liệu bên trái hoặc Import CSV.</p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {beams.map(b => {
                const res = project?.results[b.id];
                const opts = res ? suggestOptimize(b, res) : [];
                const bb = b as any;
                const h0 = bb.h - (bb.a || 40);
                const AsEst = (bb.b * h0 * 0.008) / 100;
                return (
                  <div key={b.id} className={`border rounded-lg p-4 ${editingId === b.id ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-medium">{b.name} <span className="text-xs text-slate-400 font-normal">{bb.group || ''}</span></div>
                        <div className="text-xs text-slate-500 mt-1">
                          {bb.b}×{bb.h} mm · L={bb.L} m · M={bb.M} kNm · Q={bb.Q} kN
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {res && <StatusBadge status={res.status} />}
                        <button onClick={() => loadToForm(b)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Sửa"><Pencil size={14} /></button>
                        <button onClick={() => { if (duplicateElement(b.id)) addToast('Đã nhân bản dầm', 'success'); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title="Nhân bản"><Copy size={14} /></button>
                        <button onClick={() => handleDelete(b.id, b.name)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" title="Xóa"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {res && (
                      <div className="mt-2">
                        <UtilizationBar value={res.utilization} />
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <div>h₀ ≈ {h0} mm</div>
                          <div>As ước ≈ {AsEst.toFixed(2)} cm²</div>
                        </div>
                        <ul className="mt-1 text-xs text-slate-500 space-y-0.5">
                          {res.details.slice(0, 3).map((d, i) => <li key={i}>• {d}</li>)}
                        </ul>
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
