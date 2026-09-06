import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project } from '../types';
import { estimateSteel } from './steelStats';

const typeLabel: Record<string, string> = {
  column: 'Cot', foundation: 'Mong don', beam: 'Dam', slab: 'San',
};

export interface ReportMeta {
  companyName?: string;
  companyAddress?: string;
  projectCode?: string;
  designerName?: string;
  checkerName?: string;
  chiefName?: string;
  logoDataUrl?: string | null; // optional PNG/JPEG data URL
}

function elementSize(el: any): string {
  if (el.type === 'column') {
    return el.sectionType === 'circular' ? `O${el.d}mm` : `${el.b}x${el.h}mm`;
  }
  if (el.type === 'foundation') return `${el.L}x${el.B}x${el.H}m`;
  if (el.type === 'beam') return `${el.b}x${el.h}mm L=${el.L}m`;
  if (el.type === 'slab') return `${el.lx}x${el.ly}m h=${el.h}mm`;
  return '-';
}

/** Báo cáo PDF kiểu hồ sơ thiết kế (bìa + bảng kết quả + thép + trang ký) */
export function exportDesignDossierPDF(project: Project, meta: ReportMeta = {}) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const company = meta.companyName || 'CONG TY TU VAN THIET KE';
  const address = meta.companyAddress || 'Dia chi: ...............................................';
  const code = meta.projectCode || project.id;
  const designer = meta.designerName || '........................';
  const checker = meta.checkerName || '........................';
  const chief = meta.chiefName || '........................';

  // —— Trang bìa ——
  if (meta.logoDataUrl) {
    try {
      doc.addImage(meta.logoDataUrl, 'PNG', 14, 12, 22, 22);
    } catch {
      // ignore invalid logo
    }
  } else {
    // Logo placeholder box
    doc.setDrawColor(200);
    doc.rect(14, 12, 22, 22);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('LOGO', 25, 24, { align: 'center' });
  }

  doc.setTextColor(30);
  doc.setFontSize(11);
  doc.text(company, pageW / 2, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(address, pageW / 2, 24, { align: 'center' });
  doc.setTextColor(30);

  doc.setDrawColor(30);
  doc.setLineWidth(0.4);
  doc.line(14, 38, pageW - 14, 38);

  doc.setFontSize(16);
  doc.text('HO SO TINH TOAN KET CAU', pageW / 2, 55, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Ket cau be tong cot thep — TCVN 5574:2018', pageW / 2, 64, { align: 'center' });

  doc.setFontSize(11);
  let y = 85;
  const rows = [
    ['Ten cong trinh / Du an', project.name],
    ['Ma du an', code],
    ['Mo ta', project.description || '—'],
    ['So cau kien', String(project.elements.length)],
    ['Tieu chuan ap dung', 'TCVN 5574:2018, TCVN 9362:2012'],
    ['Ngay xuat', new Date().toLocaleString('vi-VN')],
    ['Phan mem', 'KetCau Pro (ho tro thiet ke)'],
  ];
  rows.forEach(([k, v]) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${k}:`, 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(String(v).slice(0, 70), 70, y);
    y += 8;
  });

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Tai lieu nay mang tinh chat ho tro. Ky su phai kiem tra, ky duyet theo quy dinh.', pageW / 2, 270, { align: 'center' });

  // —— Trang kết quả ——
  doc.addPage();
  doc.setTextColor(30);
  doc.setFontSize(13);
  doc.text('1. Bang tong hop ket qua kiem tra', 14, 20);

  const body = project.elements.map(el => {
    const res = project.results[el.id];
    const st = res
      ? res.status === 'pass' ? 'Dat' : res.status === 'fail' ? 'Khong dat' : 'Canh bao'
      : '-';
    return [
      el.name || el.id,
      typeLabel[el.type] || el.type,
      elementSize(el),
      res ? res.utilization.toFixed(3) : '-',
      st,
    ];
  });

  autoTable(doc, {
    startY: 26,
    head: [['Cau kien', 'Loai', 'Kich thuoc', 'He so SD', 'Ket luan']],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175] },
  });

  let y2 = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.text('2. Thong ke thep (uoc luong)', 14, y2);
  y2 += 6;

  const steel = estimateSteel(project.elements);
  autoTable(doc, {
    startY: y2,
    head: [['Cau kien', 'Loai', 'Thep chu', 'Dai', 'KL (kg)']],
    body: steel.map(s => [s.element, s.type, s.mainBar, s.stirrup, String(s.weightKg)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175] },
  });

  // Chi tiết một số cấu kiện (mục 10 võng/nứt nếu có)
  y2 = (doc as any).lastAutoTable.finalY + 12;
  if (y2 > 250) {
    doc.addPage();
    y2 = 20;
  }
  doc.setFontSize(13);
  doc.text('3. Ghi chu kiem tra dam / san (μmin, vong, nut)', 14, y2);
  y2 += 8;
  doc.setFontSize(9);
  project.elements
    .filter(el => el.type === 'beam' || el.type === 'slab')
    .slice(0, 8)
    .forEach(el => {
      const res = project.results[el.id];
      if (!res) return;
      if (y2 > 270) {
        doc.addPage();
        y2 = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text(`${el.name} (${typeLabel[el.type]}) — SD=${res.utilization.toFixed(3)}`, 14, y2);
      y2 += 5;
      doc.setFont(undefined, 'normal');
      res.details.slice(0, 6).forEach(d => {
        const lines = doc.splitTextToSize(`- ${d}`, 180);
        doc.text(lines, 16, y2);
        y2 += lines.length * 4;
      });
      y2 += 3;
    });

  // —— Trang chữ ký ——
  doc.addPage();
  doc.setFontSize(13);
  doc.text('4. Xac nhan va chu ky', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text('Nguoi lap / Nguoi tinh toan, nguoi kiem tra va chu nhiem du an ky xac nhan.', 14, 30);

  const colW = (pageW - 28) / 3;
  const baseY = 55;
  const roles = [
    { title: 'NGUOI TINH TOAN', name: designer },
    { title: 'NGUOI KIEM TRA', name: checker },
    { title: 'CHU NHIEM DO AN', name: chief },
  ];
  roles.forEach((r, i) => {
    const x = 14 + i * colW;
    doc.setFontSize(10);
    doc.setTextColor(30);
    doc.text(r.title, x + colW / 2 - 4, baseY, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('(Ky, ghi ro ho ten)', x + colW / 2 - 4, baseY + 8, { align: 'center' });
    // signature box
    doc.setDrawColor(180);
    doc.rect(x + 8, baseY + 14, colW - 20, 36);
    doc.setTextColor(30);
    doc.text(r.name, x + colW / 2 - 4, baseY + 58, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Ngay: ....../....../..........', x + colW / 2 - 4, baseY + 66, { align: 'center' });
  });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    'KetCau Pro — phan mem ho tro. Ket qua can duoc kiem tra doc lap theo TCVN truoc khi dua vao cong trinh.',
    pageW / 2,
    280,
    { align: 'center' }
  );

  doc.save(`HoSo_KetCau_${project.id}_${Date.now()}.pdf`);
}
