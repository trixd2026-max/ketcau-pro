import { useProjectStore } from '../store/useProjectStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatusBadge from '../components/StatusBadge';

export default function ReportPage() {
  const { projects, currentProjectId } = useProjectStore();
  const project = projects.find(p => p.id === currentProjectId);

  const exportPDF = () => {
    if (!project) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('KetCau Pro - Báo cáo kiểm tra kết cấu', 14, 20);
    doc.setFontSize(11);
    doc.text(`Dự án: ${project.name}`, 14, 30);
    doc.text(`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`, 14, 36);
    doc.text('Tiêu chuẩn: TCVN 5574:2018 / TCVN 9362:2012', 14, 42);

    const rows = project.elements.map(el => {
      const res = project.results[el.id];
      let size = '-';
      if (el.type === 'column') {
        const c = el as any;
        size = c.sectionType === 'circular' ? `Ø${c.d}mm` : `${c.b}x${c.h}mm`;
      } else if (el.type === 'foundation') {
        const f = el as any;
        size = `${f.L}x${f.B}x${f.H}m`;
      } else if (el.type === 'beam') {
        const b = el as any;
        size = `${b.b}x${b.h}mm L=${b.L}m`;
      } else if (el.type === 'slab') {
        const s = el as any;
        size = `${s.lx}x${s.ly}m h=${s.h}mm`;
      }
      return [
        el.name || el.id,
        el.type,
        size,
        res ? res.utilization.toFixed(3) : '-',
        res ? (res.status === 'pass' ? 'Đạt' : res.status === 'fail' ? 'Không đạt' : 'Cảnh báo') : '-',
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Cấu kiện', 'Loại', 'Kích thước', 'Hệ số SD', 'Kết luận']],
      body: rows,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Cảnh báo: Kết quả chỉ mang tính hỗ trợ thiết kế. Kỹ sư phải tự kiểm tra và chịu trách nhiệm.', 14, finalY);
    doc.text('KetCau Pro - TCVN 5574:2018', 14, finalY + 6);

    doc.save(`KetCauPro_${project.id}_${Date.now()}.pdf`);
  };

  if (!project) {
    return <div className="text-center py-20 text-slate-500">Chưa chọn dự án.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Báo cáo dự án: {project.name}</h2>
          <p className="text-sm text-slate-500">Xuất PDF chuyên nghiệp với bảng tổng hợp kết quả</p>
        </div>
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          Xuất PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="text-left px-5 py-3">Cấu kiện</th>
              <th className="text-left px-5 py-3">Loại</th>
              <th className="text-left px-5 py-3">Hệ số SD</th>
              <th className="text-left px-5 py-3">Kết luận</th>
              <th className="text-left px-5 py-3">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {project.elements.map(el => {
              const res = project.results[el.id];
              return (
                <tr key={el.id}>
                  <td className="px-5 py-3 font-medium">{el.name}</td>
                  <td className="px-5 py-3">{el.type}</td>
                  <td className="px-5 py-3 font-mono">{res?.utilization.toFixed(3) || '-'}</td>
                  <td className="px-5 py-3">{res && <StatusBadge status={res.status} />}</td>
                  <td className="px-5 py-3 text-xs text-slate-500 max-w-xs">
                    {res?.details.slice(0, 2).join(' | ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}