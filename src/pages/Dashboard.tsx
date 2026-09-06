import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { useToastStore } from '../store/useToastStore';
import { suggestOptimize } from '../lib/optimize';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';
import OptimizeBox from '../components/OptimizeBox';
import FormulaTooltip from '../components/FormulaTooltip';
import { AlertTriangle, RefreshCw, Pencil, Trash2, Copy, X, Search } from 'lucide-react';

const typeLabel: Record<string, string> = {
  column: 'Cột', foundation: 'Móng đơn', beam: 'Dầm', slab: 'Sàn',
};
const routeMap: Record<string, string> = {
  column: '/column', foundation: '/foundation', beam: '/beam', slab: '/slab',
};

export default function Dashboard() {
  const { projects, currentProjectId, recalculateAll, removeElement, duplicateElement } = useProjectStore();
  const { setPendingEditId } = useUIStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === currentProjectId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (!project) {
    return <div className="text-center py-20 text-slate-500">Chưa có dự án nào. Hãy tạo dự án mới.</div>;
  }

  const elements = project.elements;
  const results = project.results;

  const filtered = useMemo(() => {
    return elements.filter(el => {
      const res = results[el.id];
      if (filterType !== 'all' && el.type !== filterType) return false;
      if (filterStatus !== 'all' && res?.status !== filterStatus) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!el.name.toLowerCase().includes(q) && !el.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [elements, results, query, filterType, filterStatus]);

  const passCount = Object.values(results).filter(r => r.status === 'pass').length;
  const failCount = Object.values(results).filter(r => r.status === 'fail').length;
  const warnCount = Object.values(results).filter(r => r.status === 'warning').length;
  const maxUtil = Math.max(...Object.values(results).map(r => r.utilization), 0);
  const selected = elements.find(e => e.id === selectedId);
  const selectedRes = selectedId ? results[selectedId] : null;
  const suggestions = selected && selectedRes ? suggestOptimize(selected, selectedRes) : [];

  const allFilteredIds = filtered.map(e => e.id);
  const allChecked = allFilteredIds.length > 0 && allFilteredIds.every(id => checked.has(id));
  const someChecked = checked.size > 0;

  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allChecked) setChecked(new Set());
    else setChecked(new Set(allFilteredIds));
  };

  const handleBulkDelete = () => {
    if (!someChecked) return;
    const n = checked.size;
    if (!confirm(`Xóa ${n} cấu kiện đã chọn?`)) return;
    checked.forEach(id => removeElement(id));
    setChecked(new Set());
    setSelectedId(null);
    addToast(`Đã xóa ${n} cấu kiện`, 'info');
  };

  const handleRecalc = () => { recalculateAll(); addToast('Đã tính lại tất cả cấu kiện', 'success'); };
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Xóa cấu kiện "${name}"?`)) return;
    removeElement(id); setSelectedId(null);
    setChecked(prev => { const n = new Set(prev); n.delete(id); return n; });
    addToast(`Đã xóa ${name}`, 'info');
  };
  const handleDuplicate = (id: string) => {
    if (duplicateElement(id)) addToast('Đã nhân bản cấu kiện', 'success');
  };
  const goEdit = (el: any) => {
    setPendingEditId(el.id);
    setSelectedId(null);
    navigate(routeMap[el.type] || '/');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm cấu kiện..."
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 w-44" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-sm px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
            <option value="all">Tất cả loại</option>
            <option value="column">Cột</option>
            <option value="foundation">Móng</option>
            <option value="beam">Dầm</option>
            <option value="slab">Sàn</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
            <option value="all">Tất cả KQ</option>
            <option value="pass">Đạt</option>
            <option value="warning">Cảnh báo</option>
            <option value="fail">Không đạt</option>
          </select>
          {someChecked && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white">
              <Trash2 size={14} /> Xóa đã chọn ({checked.size})
            </button>
          )}
        </div>
        <button onClick={handleRecalc} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          <RefreshCw size={16} /> Tính lại tất cả
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase">Dự án</div>
          <div className="mt-2 text-3xl font-bold">{projects.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase">Cấu kiện</div>
          <div className="mt-2 text-3xl font-bold">{elements.length}</div>
          <div className="text-sm text-slate-500">{elements.filter(e => e.type === 'column').length} cột · {elements.filter(e => e.type === 'foundation').length} móng</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase flex items-center">Hệ số SD lớn nhất <FormulaTooltip /></div>
          <div className={`mt-2 text-3xl font-bold ${maxUtil > 1 ? 'text-red-600' : maxUtil > 0.9 ? 'text-amber-600' : 'text-emerald-600'}`}>{maxUtil.toFixed(3)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase">Kết quả</div>
          <div className="mt-2 text-3xl font-bold">{passCount}/{elements.length}</div>
          <div className="text-sm text-slate-500">{failCount} không đạt · {warnCount} cảnh báo</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Tổng hợp kiểm tra cấu kiện</h2>
            <p className="text-xs text-slate-500 mt-1">
              Tick chọn để xóa hàng loạt · Click hàng để chi tiết · Hiển thị {filtered.length}/{elements.length}
              {someChecked ? ` · Đã chọn ${checked.size}` : ''}
            </p>
          </div>
          {someChecked && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 size={14} /> Xóa {checked.size} mục
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll}
                    className="rounded border-slate-300" title="Chọn tất cả" />
                </th>
                <th className="text-left px-3 py-3 font-medium">Cấu kiện</th>
                <th className="text-left px-3 py-3 font-medium">Loại</th>
                <th className="text-left px-3 py-3 font-medium">Vật liệu</th>
                <th className="text-left px-3 py-3 font-medium">Kích thước</th>
                <th className="text-left px-3 py-3 font-medium min-w-[140px]">Hệ số SD <FormulaTooltip /></th>
                <th className="text-left px-3 py-3 font-medium">Kết luận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(el => {
                const res = results[el.id];
                let size = '-';
                if (el.type === 'column') {
                  const c = el as any;
                  size = c.sectionType === 'circular' ? `Ø${c.d || c.b} mm` : `${c.b}×${c.h} mm`;
                } else if (el.type === 'foundation') {
                  const f = el as any; size = `${f.L}×${f.B}×${f.H} m`;
                } else if (el.type === 'beam') {
                  const b = el as any; size = `${b.b}×${b.h} mm — L=${b.L}m`;
                } else if (el.type === 'slab') {
                  const s = el as any; size = `${s.lx}×${s.ly}m h=${s.h}mm`;
                }
                const isChecked = checked.has(el.id);
                return (
                  <tr key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer ${isChecked ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                    <td className="px-3 py-3" onClick={e => toggleOne(el.id, e)}>
                      <input type="checkbox" checked={isChecked} onChange={() => {}}
                        className="rounded border-slate-300" />
                    </td>
                    <td className="px-3 py-3 font-medium">{el.name}</td>
                    <td className="px-3 py-3">{typeLabel[el.type]}</td>
                    <td className="px-3 py-3">{(el as any).material?.concreteGrade} / {(el as any).material?.steelGrade}</td>
                    <td className="px-3 py-3">{size}</td>
                    <td className="px-3 py-3">{res ? <UtilizationBar value={res.utilization} /> : '-'}</td>
                    <td className="px-3 py-3">{res ? <StatusBadge status={res.status} /> : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Cảnh báo:</strong> Kết quả chỉ là công cụ hỗ trợ thiết kế. Kỹ sư phải tự kiểm tra theo TCVN 5574:2018 / 9362:2012.
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelectedId(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-semibold text-lg">{selected.name}</h3>
                <p className="text-xs text-slate-500">{typeLabel[selected.type]} · {selected.id}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {selectedRes && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Kết quả <FormulaTooltip topic={selected.type} /></span>
                    <StatusBadge status={selectedRes.status} utilization={selectedRes.utilization} />
                  </div>
                  <UtilizationBar value={selectedRes.utilization} />
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    {selectedRes.details.map((d, i) => <li key={i}>• {d}</li>)}
                  </ul>
                  <OptimizeBox suggestions={suggestions} />
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <button onClick={() => goEdit(selected)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                <Pencil size={14} /> Sửa
              </button>
              <button onClick={() => handleDuplicate(selected.id)} className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm">
                <Copy size={14} /> Nhân bản
              </button>
              <button onClick={() => handleDelete(selected.id, selected.name)} className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm">
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
