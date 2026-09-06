import { useProjectStore } from '../store/useProjectStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatusBadge from '../components/StatusBadge';
import { estimateSteel } from '../lib/steelStats';
import { downloadCSV, downloadJSON } from '../lib/exportExcel';
import { useToastStore } from '../store/useToastStore';
import { FileSpreadsheet, FileJson, FileText } from 'lucide-react';

const typeLabel: Record<string, string> = {
  column: 'Cột', foundation: 'Móng đơn', beam: 'Dầm', slab: 'Sàn',
};

export default function ReportPage() {
  const { projects, currentProjectId } = useProjectStore();
  const { addToast } = useToastStore();
  const project = projects.find(p => p.id === currentProjectId);

  if (!project) {
    return <div className="text-center py-20 text-slate-500">Chưa chọn dự án.</div>;
  }

  const steel = estimateSteel(project.elements);
  const totalKg = steel.reduce((s, r) => s + r.weightKg, 0);

  const buildResultRows = () =>
    project.elements.map(el => {
      const res = project.results[el.id];
      let size = '-';
      if (el.type === 'column') {
        const c = el as any;
        size = c.sectionType === 'circular' ? `Ø${c.d}mm` : `${c.b}x${c.h}mm`;
      } else if (el.type === 'foundation') {
        const f = el as any; size = `${f.L}x${f.B}x${f.H}m`;
      } else if (el.type === 'beam') {
        const b = el as any; size = `${b.b}x${b.h}mm L=${b.L}m`;
      } else if (el.type === 'slab') {
        const s = el as any; size = `${s.lx}x${s.ly}m h=${s.h}mm`;
      }
      return {
        name: el.name || el.id,
        type: typeLabel[el.type] || el.type,
        size,
        material: `${(el as any).material?.concreteGrade || ''} / ${(el as any).material?.steelGrade || ''}`,
        util: res ? res.utilization.toFixed(3) : '-',
        status: res ? (res.status === 'pass' ? 'Đạt' : res.status === 'fail' ? 'Không đạt' : 'Cảnh báo') : '-',
        detail: res?.details?.[0] || '',
      };
    });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('KetCau Pro - Bao cao kiem tra ket cau', 14, 20);
    doc.setFontSize(11);
    doc.text(`Du an: ${project.name}`, 14, 30);
    doc.text(`Ngay: ${new Date().toLocaleString('vi-VN')}`, 14, 36);
    doc.text('Tieu chuan: TCVN 5574:2018 / TCVN 9362:2012', 14, 42);

    const rows = buildResultRows().map(r => [r.name, r.type, r.size, r.util, r.status]);
    autoTable(doc, {
      startY: 50,
      head: [['Cau kien', 'Loai', 'Kich thuoc', 'He so SD', 'Ket luan']],
      body: rows,
    });

    const steelRows = steel.map(s => [s.element, s.type, s.mainBar, s.stirrup, String(s.weightKg)]);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [['Cau kien', 'Loai', 'Thep chu', 'Dai', 'KL (kg)']],
      body: steelRows,
    });

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Canh bao: Ket qua chi mang tinh ho tro thiet ke.', 14, (doc as any).lastAutoTable.finalY + 12);
    doc.save(`KetCauPro_${project.id}_${Date.now()}.pdf`);
    addToast('Đã xuất PDF', 'success');
  };

  const exportExcelResults = () => {
    const data = buildResultRows();
    downloadCSV(
      `KetCauPro_KetQua_${project.id}.csv`,
      ['Cấu kiện', 'Loại', 'Kích thước', 'Vật liệu', 'Hệ số SD', 'Kết luận', 'Chi tiết'],
      data.map(r => [r.name, r.type, r.size, r.material, r.util, r.status, r.detail])
    );
    addToast('Đã xuất Excel (CSV) kết quả — mở bằng Excel', 'success');
  };

  const exportExcelSteel = () => {
    downloadCSV(
      `KetCauPro_Thep_${project.id}.csv`,
      ['Cấu kiện', 'Loại', 'Thép chủ', 'Đai', 'Khối lượng (kg)'],
      steel.map(s => [s.element, s.type, s.mainBar, s.stirrup, s.weightKg])
    );
    addToast('Đã xuất bảng thống kê thép (CSV)', 'success');
  };

  const exportJSON = () => {
    downloadJSON(`KetCauPro_${project.id}.json`, {
      project: { id: project.id, name: project.name },
      elements: project.elements,
      results: project.results,
      steel,
      exportedAt: new Date().toISOString(),
    });
    addToast('Đã xuất JSON', 'success');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Báo cáo dự án: {project.name}</h2>
          <p className="text-sm text-slate-500">Xuất PDF / Excel (CSV) / JSON — mở CSV bằng Microsoft Excel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportExcelResults}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <FileSpreadsheet size={16} /> Excel kết quả
          </button>
          <button onClick={exportExcelSteel}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <FileSpreadsheet size={16} /> Excel thép
          </button>
          <button onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <FileJson size={16} /> JSON
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <FileText size={16} /> Xuất PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 font-medium">Kết quả kiểm tra</div>
        <div className="overflow-x-auto">
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
          * Ước lượng MVP. File CSV mở trực tiếp bằng Excel (UTF-8 BOM).
        </p>
      </div>
    </div>
  );
}
