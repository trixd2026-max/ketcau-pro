import { useProjectStore } from '../store/useProjectStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatusBadge from '../components/StatusBadge';
import { estimateSteel } from '../lib/steelStats';
import { downloadCSV, downloadJSON } from '../lib/exportExcel';
import { useToastStore } from '../store/useToastStore';
import { FileSpreadsheet, FileJson, FileText, Download } from 'lucide-react';

const typeLabel: Record<string, string> = {
  column: 'Cột', foundation: 'Móng đơn', beam: 'Dầm', slab: 'Sàn',
};

function elementSize(el: any): string {
  if (el.type === 'column') {
    return el.sectionType === 'circular' ? `Ø${el.d} mm` : `${el.b}×${el.h} mm`;
  }
  if (el.type === 'foundation') return `${el.L}×${el.B}×${el.H} m`;
  if (el.type === 'beam') return `${el.b}×${el.h} mm · L=${el.L} m`;
  if (el.type === 'slab') return `${el.lx}×${el.ly} m · h=${el.h} mm`;
  return '-';
}

function elementLoads(el: any): string[] {
  if (el.type === 'column') return [`N = ${el.N} kN`, `Mx = ${el.Mx} kNm`, `My = ${el.My} kNm`, `Q = ${el.Q} kN`, `H = ${el.height} m`, `l0 = ${el.bucklingLength} m`];
  if (el.type === 'foundation') return [`N = ${el.N} kN`, `Mx = ${el.Mx} kNm`, `My = ${el.My} kNm`, `R đất = ${el.soilBearing} kPa`];
  if (el.type === 'beam') return [`M = ${el.M} kNm`, `Q = ${el.Q} kN`, `L = ${el.L} m`, `a = ${el.a || 40} mm`];
  if (el.type === 'slab') return [`M = ${el.M} kNm/m`, `lx = ${el.lx} m`, `ly = ${el.ly} m`];
  return [];
}

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
      return {
        name: el.name || el.id,
        type: typeLabel[el.type] || el.type,
        size: elementSize(el),
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
    addToast('Đã xuất PDF toàn dự án', 'success');
  };

  /** Báo cáo PDF riêng 1 cấu kiện */
  const exportElementPDF = (el: any) => {
    const res = project.results[el.id];
    const st = steel.find(s => s.element === el.name);
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text('KetCau Pro - Bao cao cau kien', 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Du an: ${project.name}`, 14, y); y += 6;
    doc.text(`Cau kien: ${el.name || el.id}`, 14, y); y += 6;
    doc.text(`Loai: ${typeLabel[el.type] || el.type}`, 14, y); y += 6;
    doc.text(`Ngay: ${new Date().toLocaleString('vi-VN')}`, 14, y); y += 6;
    doc.text('Tieu chuan: TCVN 5574:2018 / TCVN 9362:2012', 14, y); y += 10;

    doc.setFontSize(12);
    doc.text('1. Thong so dau vao', 14, y); y += 7;
    doc.setFontSize(10);
    doc.text(`Kich thuoc: ${elementSize(el)}`, 18, y); y += 5;
    doc.text(`Vat lieu: ${el.material?.concreteGrade || '-'} / ${el.material?.steelGrade || '-'}`, 18, y); y += 5;
    elementLoads(el).forEach(line => {
      doc.text(line, 18, y);
      y += 5;
    });
    y += 5;

    doc.setFontSize(12);
    doc.text('2. Ket qua kiem tra', 14, y); y += 7;
    doc.setFontSize(10);
    if (res) {
      const statusVi = res.status === 'pass' ? 'DAT' : res.status === 'fail' ? 'KHONG DAT' : 'CANH BAO';
      doc.text(`He so su dung: ${res.utilization.toFixed(3)}`, 18, y); y += 5;
      doc.text(`Ket luan: ${statusVi}`, 18, y); y += 7;
      doc.text('Chi tiet tinh toan:', 18, y); y += 5;
      res.details.forEach((d: string) => {
        const lines = doc.splitTextToSize(`- ${d}`, 170);
        doc.text(lines, 18, y);
        y += lines.length * 5;
      });
      if (res.formulaRefs?.length) {
        y += 3;
        doc.text(`Tham chieu: ${res.formulaRefs.join(', ')}`, 18, y);
        y += 6;
      }
    } else {
      doc.text('Chua co ket qua tinh toan.', 18, y);
      y += 6;
    }

    y += 4;
    doc.setFontSize(12);
    doc.text('3. Thong ke thep (uoc luong)', 14, y); y += 7;
    doc.setFontSize(10);
    if (st) {
      doc.text(`Thep chu: ${st.mainBar}`, 18, y); y += 5;
      doc.text(`Cot dai: ${st.stirrup}`, 18, y); y += 5;
      doc.text(`Khoi luong uoc: ${st.weightKg} kg`, 18, y); y += 5;
    } else {
      doc.text('Khong co du lieu thep.', 18, y); y += 5;
    }

    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Canh bao: Ket qua chi mang tinh ho tro thiet ke. Ky su phai kiem tra theo TCVN.', 14, y);

    const safeName = (el.name || el.id).replace(/[^a-zA-Z0-9\u00C0-\u1EF9_-]/g, '_');
    doc.save(`KetCauPro_${safeName}_${Date.now()}.pdf`);
    addToast(`Đã xuất PDF: ${el.name}`, 'success');
  };

  /** CSV riêng 1 cấu kiện */
  const exportElementCSV = (el: any) => {
    const res = project.results[el.id];
    const st = steel.find(s => s.element === el.name);
    const statusVi = res
      ? res.status === 'pass' ? 'Đạt' : res.status === 'fail' ? 'Không đạt' : 'Cảnh báo'
      : '-';
    downloadCSV(
      `KetCauPro_${(el.name || el.id).replace(/\s/g, '_')}.csv`,
      ['Trường', 'Giá trị'],
      [
        ['Dự án', project.name],
        ['Cấu kiện', el.name || el.id],
        ['Loại', typeLabel[el.type] || el.type],
        ['Kích thước', elementSize(el)],
        ['Vật liệu', `${el.material?.concreteGrade || ''} / ${el.material?.steelGrade || ''}`],
        ...elementLoads(el).map(l => {
          const [k, v] = l.split('=').map(s => s.trim());
          return [k, v || l];
        }),
        ['Hệ số SD', res ? res.utilization.toFixed(3) : '-'],
        ['Kết luận', statusVi],
        ...(res?.details || []).map((d: string, i: number) => [`Chi tiết ${i + 1}`, d]),
        ['Thép chủ', st?.mainBar || '-'],
        ['Cốt đai', st?.stirrup || '-'],
        ['KL thép (kg)', st?.weightKg ?? '-'],
      ]
    );
    addToast(`Đã xuất CSV: ${el.name}`, 'success');
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
          <p className="text-sm text-slate-500">Xuất toàn bộ hoặc từng cấu kiện (PDF / CSV)</p>
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
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 font-medium">
          Kết quả kiểm tra
          <span className="ml-2 text-xs font-normal text-slate-500">— cột Xuất: báo cáo riêng từng cấu kiện</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="text-left px-5 py-3">Cấu kiện</th>
                <th className="text-left px-5 py-3">Loại</th>
                <th className="text-left px-5 py-3">Hệ số SD</th>
                <th className="text-left px-5 py-3">Kết luận</th>
                <th className="text-left px-5 py-3">Chi tiết</th>
                <th className="text-right px-5 py-3">Xuất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {project.elements.map(el => {
                const res = project.results[el.id];
                return (
                  <tr key={el.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="px-5 py-3 font-medium">{el.name}</td>
                    <td className="px-5 py-3">{typeLabel[el.type] || el.type}</td>
                    <td className="px-5 py-3 font-mono">{res?.utilization.toFixed(3) || '-'}</td>
                    <td className="px-5 py-3">{res && <StatusBadge status={res.status} />}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs">{res?.details.slice(0, 2).join(' | ')}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => exportElementPDF(el)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600"
                          title="Xuất PDF cấu kiện này"
                        >
                          <FileText size={12} /> PDF
                        </button>
                        <button
                          onClick={() => exportElementCSV(el)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700"
                          title="Xuất CSV cấu kiện này"
                        >
                          <Download size={12} /> CSV
                        </button>
                      </div>
                    </td>
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
