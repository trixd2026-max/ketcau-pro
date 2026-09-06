import { useProjectStore } from '../store/useProjectStore';
import StatusBadge from '../components/StatusBadge';
import UtilizationBar from '../components/UtilizationBar';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { projects, currentProjectId } = useProjectStore();
  const project = projects.find(p => p.id === currentProjectId);

  if (!project) {
    return <div className="text-center py-20 text-slate-500">Chưa có dự án nào. Hãy tạo dự án mới.</div>;
  }

  const elements = project.elements;
  const results = project.results;

  const passCount = Object.values(results).filter(r => r.status === 'pass').length;
  const failCount = Object.values(results).filter(r => r.status === 'fail').length;
  const warnCount = Object.values(results).filter(r => r.status === 'warning').length;
  const maxUtil = Math.max(...Object.values(results).map(r => r.utilization), 0);

  const typeLabel: Record<string, string> = {
    column: 'Cột',
    foundation: 'Móng đơn',
    beam: 'Dầm',
    slab: 'Sàn',
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dự án</div>
          <div className="mt-2 text-3xl font-bold">{projects.length}</div>
          <div className="text-sm text-slate-500 mt-1">Đang quản lý</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cấu kiện</div>
          <div className="mt-2 text-3xl font-bold">{elements.length}</div>
          <div className="text-sm text-slate-500 mt-1">
            {elements.filter(e => e.type === 'column').length} cột · {elements.filter(e => e.type === 'foundation').length} móng
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hệ số SD lớn nhất</div>
          <div className={`mt-2 text-3xl font-bold ${maxUtil > 1 ? 'text-red-600' : maxUtil > 0.9 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {maxUtil.toFixed(3)}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {maxUtil > 1 ? 'Vượt khả năng chịu lực' : 'Trong giới hạn'}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kết quả</div>
          <div className="mt-2 text-3xl font-bold">{passCount}/{elements.length}</div>
          <div className="text-sm text-slate-500 mt-1">
            {failCount} không đạt · {warnCount} cảnh báo
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold">Tổng hợp kiểm tra cấu kiện</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Cấu kiện</th>
                <th className="text-left px-5 py-3 font-medium">Loại</th>
                <th className="text-left px-5 py-3 font-medium">Vật liệu</th>
                <th className="text-left px-5 py-3 font-medium">Kích thước</th>
                <th className="text-left px-5 py-3 font-medium min-w-[180px]">Hệ số sử dụng</th>
                <th className="text-left px-5 py-3 font-medium">Kết luận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {elements.map(el => {
                const res = results[el.id];
                let size = '-';
                if (el.type === 'column') {
                  const c = el as any;
                  size = c.sectionType === 'circular'
                    ? `Ø${c.d || c.b} mm`
                    : `${c.b}×${c.h} mm`;
                } else if (el.type === 'foundation') {
                  const f = el as any;
                  size = `${f.L}×${f.B}×${f.H} m`;
                } else if (el.type === 'beam') {
                  const b = el as any;
                  size = `${b.b}×${b.h} mm — L = ${b.L} m`;
                } else if (el.type === 'slab') {
                  const s = el as any;
                  size = `${s.lx}×${s.ly} m — h = ${s.h} mm`;
                }

                return (
                  <tr key={el.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-5 py-3 font-medium">{el.name || el.id}</td>
                    <td className="px-5 py-3">{typeLabel[el.type] || el.type}</td>
                    <td className="px-5 py-3">
                      {(el as any).material?.concreteGrade} / {(el as any).material?.steelGrade}
                    </td>
                    <td className="px-5 py-3">{size}</td>
                    <td className="px-5 py-3">
                      {res ? <UtilizationBar value={res.utilization} /> : '-'}
                    </td>
                    <td className="px-5 py-3">
                      {res ? <StatusBadge status={res.status} /> : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Cảnh báo:</strong> Toàn bộ kết quả tính toán chỉ là <strong>công cụ hỗ trợ thiết kế</strong>.
          Kỹ sư thiết kế phải tự kiểm tra số liệu đầu vào, đối chiếu tiêu chuẩn TCVN 5574:2018 / TCVN 9362:2012
          và chịu trách nhiệm phê duyệt trước khi đưa vào hồ sơ.
        </div>
      </div>
    </div>
  );
}