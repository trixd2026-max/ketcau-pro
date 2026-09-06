import { useProjectStore } from '../store/useProjectStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatusBadge from '../components/StatusBadge';
import { estimateSteel } from '../lib/steelStats';

const typeLabel: Record<string, string> = {
  column: 'Cột', foundation: 'Móng đơn', beam: 'Dầm', slab: 'Sàn',
};

export default function ReportPage() {
  const { projects, currentProjectId } = useProjectStore();
  const project = projects.find(p => p.id === currentProjectId);

  const exportPDF = () => {
    if (!project) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('KetCau Pro - Bao cao kiem tra ket cau', 14, 20);
    doc.setFontSize(11);
    doc.text(`Du an: ${project.name}`, 14, 30);
    doc.text(`Ngay: ${new Date().toLocaleString('vi-VN')}`, 14, 36);
    doc.text('Tieu chuan: TCVN 5574:2018 / TCVN 9362:2012', 14, 42);

    const rows = project.elements.map(el => {
      const res = project.results[el.id];
      let size = '-';
      if (el.type === 'column') {
        const c = el as any;
        size = c.sectionType === 'circular' ? `D${c.d}mm` : `${c.b}x${c.h}mm`;
      } else if (el.type === 'foundation') {
        const f = el as any; size = `${f.L}x${f.B}x${f.H}m`;
      } else if (el.type === 'beam') {
        const b = el as any; size = `${b.b}x${b.h}mm L=${b.L}m`;
      } else if (el.type === 'slab') {
        const s = el as any; size = `${s.lx}x${s.ly}m h=${s.h}mm`;
      }
      return [
        el.name || el.id,
        typeLabel[el.type] || el.type,
        size,
        res ? res.utilization.toFixed(3) : '-',
        res ? (res.status === 'pass' ? 'Dat' : res.status === 'fail' ? 'Khong dat' : 'Canh bao') : '-',
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Cau kien', 'Loai', 'Kich thuoc', 'He so SD', 'Ket luan']],
      body: rows,
    });

    const steel = estimateSteel(project.elements);
    const steelRows = steel.map(s => [s.element, s.type, s.mainBar, s.stirrup, String(s.weightKg)]);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [['Cau kien', 'Loai', 'Thep chu', 'Dai', 'KL (kg)']],
      body: steelRows,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Canh bao: Ket qua chi mang tinh ho tro thiet ke.', 14, finalY);
    doc.save(`KetCauPro_${project.id}_${Date.now()}.pdf`);
  };

  if (!project) {
    return <div className="text-center py-20 text-slate-500">Chưa chọn dự án.</div>;
  }

  const steel = estimateSteel(project.elements);
  const totalKg = steel.reduce((s, r) => s + r.weightKg, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Báo cáo dự án: {project.name}</h2>
          <p className="text-sm text-slate-500">Xuất PDF + bảng thống kê thép sơ bộ</p>
        </div>
        <button onClick={exportPDF} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
          Xuất PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 font-medium">Kết quả kiểm tra</div>
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
                  <td className="px-5 py-3">{typeLabel[el.type] || el.type}</td>
                  <td className="px-5 py-3 font-mono">{res?.utilization.toFixed(3) || '-'}</td>
                  <td className="px-5 py-3">{res && <StatusBadge status={res.status} />}</td>
                  <td className="px-5 py-3 text-xs text-slate-500 max-w-xs">{res?.details.slice(0, 2).join(' | ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between">
          <span className="font-medium">Bảng thống kê thép (ước lượng sơ bộ)</span>
          <span className="text-sm text-slate-500">Tổng ≈ {totalKg.toFixed(1)} kg</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="text-left px-5 py-3">Cấu kiện</th>
              <th className="text-left px-5 py-3">Loại</th>
              <th className="text-left px-5 py-3">Thép chủ</th>
              <th className="text-left px-5 py-3">Đai</th>
              <th className="text-left px-5 py-3">KL (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {steel.map((s, i) => (
              <tr key={i}>
                <td className="px-5 py-3">{s.element}</td>
                <td className="px-5 py-3">{s.type}</td>
                <td className="px-5 py-3">{s.mainBar}</td>
                <td className="px-5 py-3">{s.stirrup}</td>
                <td className="px-5 py-3 font-mono">{s.weightKg}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-5 py-3 text-xs text-slate-500">
          * Ước lượng MVP (1% cốt thép cột, ~8 kg/m² sàn…). Cần tính chi tiết theo TCVN trước khi lập dự toán.
        </p>
      </div>
    </div>
  );
}
