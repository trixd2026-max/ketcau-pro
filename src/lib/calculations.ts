import { ColumnInput, FoundationInput, BeamInput, SlabInput, CheckResult } from '../types';

/**
 * Simplified calculations approximating TCVN 5574:2018
 * These are engineering approximations for MVP.
 * Real production should implement full formulas from the standard.
 */

export function checkColumn(col: ColumnInput): CheckResult {
  const details: string[] = [];
  const formulaRefs: string[] = ['TCVN 5574:2018 - Mục 8.1', 'Mô hình biến dạng'];

  // Cross section area (mm2)
  let A = 0;
  if (col.sectionType === 'rectangular') {
    A = col.b * col.h;
  } else if (col.sectionType === 'circular') {
    A = Math.PI * (col.d || col.b) ** 2 / 4;
  } else {
    A = col.b * col.h; // simplified T
  }

  // Approximate capacity under axial + bending (very simplified)
  // Nu ≈ φ * (Rb*A + Rs*As) - here we assume minimal steel 1%
  const As = A * 0.01; // assume 1% reinforcement
  const Ncapacity = 0.9 * (col.material.Rb * A / 1000 + col.material.Rs * As / 1000); // kN

  // Moment capacity approximation
  const h0 = (col.sectionType === 'rectangular' ? col.h : (col.d || col.b)) - 40; // mm
  const Mcx = 0.9 * col.material.Rb * col.b * h0 * h0 / 6 / 1e6; // rough kNm

  const utilN = col.N / Ncapacity;
  const utilM = Math.max(Math.abs(col.Mx), Math.abs(col.My)) / (Mcx || 1);

  // Interaction (simplified)
  const utilization = Math.max(utilN + utilM * 0.8, utilN, utilM);

  details.push(`Diện tích tiết diện A = ${A.toFixed(0)} mm²`);
  details.push(`Khả năng chịu lực dọc gần đúng Nu ≈ ${Ncapacity.toFixed(1)} kN`);
  details.push(`Hệ số sử dụng lực dọc = ${utilN.toFixed(3)}`);
  details.push(`Hệ số sử dụng mô men ≈ ${utilM.toFixed(3)}`);
  details.push(`Hệ số sử dụng tổng hợp = ${utilization.toFixed(3)}`);

  // Slenderness check
  const i = col.sectionType === 'circular'
    ? (col.d || col.b) / 4
    : Math.min(col.b, col.h) / Math.sqrt(12);
  const lambda = (col.bucklingLength * 1000) / i;
  details.push(`Độ mảnh λ ≈ ${lambda.toFixed(1)}`);
  if (lambda > 120) {
    details.push('Cảnh báo: Độ mảnh lớn, cần kiểm tra ổn định kỹ');
  }

  let status: CheckResult['status'] = 'pass';
  if (utilization > 1.0) status = 'fail';
  else if (utilization > 0.9) status = 'warning';

  return { utilization, status, details, formulaRefs };
}

export function checkFoundation(f: FoundationInput): CheckResult {
  const details: string[] = [];
  const formulaRefs: string[] = ['TCVN 9362:2012', 'TCVN 5574:2018'];

  const area = f.L * f.B; // m2
  const pressure = f.N / area; // kPa
  const utilBearing = pressure / f.soilBearing;

  // Eccentricity check (simplified)
  const eX = f.My / f.N || 0;
  const eY = f.Mx / f.N || 0;
  const maxE = Math.max(Math.abs(eX), Math.abs(eY));
  const limitE = Math.min(f.L, f.B) / 6;

  details.push(`Diện tích đáy móng A = ${area.toFixed(2)} m²`);
  details.push(`Áp lực đất trung bình p = ${pressure.toFixed(1)} kPa`);
  details.push(`Sức chịu tải đất R = ${f.soilBearing} kPa`);
  details.push(`Hệ số sử dụng cường độ đất = ${utilBearing.toFixed(3)}`);
  details.push(`Độ lệch tâm max e = ${maxE.toFixed(3)} m (giới hạn L/6 = ${limitE.toFixed(3)} m)`);

  let utilization = utilBearing;
  if (maxE > limitE) {
    utilization = Math.max(utilization, 1.1);
    details.push('Cảnh báo: Độ lệch tâm vượt L/6 - nguy cơ lật');
  }

  // Rough settlement check placeholder
  details.push('Kiểm tra lún: Cần dữ liệu module biến dạng đất (chưa nhập đầy đủ)');

  let status: CheckResult['status'] = 'pass';
  if (utilization > 1.0) status = 'fail';
  else if (utilization > 0.85) status = 'warning';

  return { utilization, status, details, formulaRefs };
}

export function checkBeam(b: BeamInput): CheckResult {
  const details: string[] = [];
  const formulaRefs: string[] = ['TCVN 5574:2018 Mục 8.1.2 & 8.1.3'];

  const h0 = b.h - 40; // mm
  // Moment capacity rough (singly reinforced)
  const xi = 0.4; // assume
  const Mu = 0.9 * b.material.Rb * b.b * h0 * h0 * xi * (1 - 0.5 * xi) / 1e6; // kNm

  const utilM = Math.abs(b.M) / (Mu || 1);

  // Shear capacity rough
  const Qb = 0.6 * b.material.Rbt * b.b * h0 / 1000; // kN very rough
  const utilQ = Math.abs(b.Q) / (Qb || 1);

  const utilization = Math.max(utilM, utilQ);

  details.push(`Chiều cao làm việc h0 ≈ ${h0} mm`);
  details.push(`Khả năng chịu mô men gần đúng Mu ≈ ${Mu.toFixed(1)} kNm`);
  details.push(`Hệ số sử dụng uốn = ${utilM.toFixed(3)}`);
  details.push(`Khả năng chịu cắt gần đúng Qb ≈ ${Qb.toFixed(1)} kN`);
  details.push(`Hệ số sử dụng cắt = ${utilQ.toFixed(3)}`);

  // Min stirrup
  const swMax = Math.min(0.5 * h0, 300);
  details.push(`Khoảng cách cốt đai max khuyến nghị ≈ ${swMax.toFixed(0)} mm`);

  let status: CheckResult['status'] = 'pass';
  if (utilization > 1.0) status = 'fail';
  else if (utilization > 0.9) status = 'warning';

  return { utilization, status, details, formulaRefs };
}

export function checkSlab(s: SlabInput): CheckResult {
  const details: string[] = [];
  const formulaRefs: string[] = ['TCVN 5574:2018'];

  const h0 = s.h - 20;
  const Mu = 0.9 * s.material.Rb * 1000 * h0 * h0 * 0.3 / 1e6; // per meter width rough
  const util = Math.abs(s.M) / (Mu || 1);

  details.push(`Chiều dày sàn h = ${s.h} mm, h0 ≈ ${h0} mm`);
  details.push(`Khả năng chịu mô men gần đúng ≈ ${Mu.toFixed(2)} kNm/m`);
  details.push(`Hệ số sử dụng = ${util.toFixed(3)}`);

  let status: CheckResult['status'] = 'pass';
  if (util > 1.0) status = 'fail';
  else if (util > 0.9) status = 'warning';

  return { utilization: util, status, details, formulaRefs };
}

export function runCheck(el: any): CheckResult {
  switch (el.type) {
    case 'column': return checkColumn(el);
    case 'foundation': return checkFoundation(el);
    case 'beam': return checkBeam(el);
    case 'slab': return checkSlab(el);
    default:
      return { utilization: 0, status: 'pass', details: ['Chưa hỗ trợ'], formulaRefs: [] };
  }
}