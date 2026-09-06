import { ColumnInput, FoundationInput, BeamInput, SlabInput, CheckResult } from '../types';

/**
 * Simplified calculations approximating TCVN 5574:2018
 * Beam/Slab: strength + μmin + võng + nứt (gần đúng MVP)
 */

export function checkColumn(col: ColumnInput): CheckResult {
  const details: string[] = [];
  const formulaRefs: string[] = ['TCVN 5574:2018 - Mục 8.1', 'Mô hình biến dạng'];

  let A = 0;
  if (col.sectionType === 'rectangular') {
    A = col.b * col.h;
  } else if (col.sectionType === 'circular') {
    A = Math.PI * (col.d || col.b) ** 2 / 4;
  } else {
    A = col.b * col.h;
  }

  const As = A * 0.01;
  const Ncapacity = 0.9 * (col.material.Rb * A / 1000 + col.material.Rs * As / 1000);

  const h0 = (col.sectionType === 'rectangular' ? col.h : (col.d || col.b)) - 40;
  const Mcx = 0.9 * col.material.Rb * col.b * h0 * h0 / 6 / 1e6;

  const utilN = col.N / Ncapacity;
  const utilM = Math.max(Math.abs(col.Mx), Math.abs(col.My)) / (Mcx || 1);
  const utilization = Math.max(utilN + utilM * 0.8, utilN, utilM);

  details.push(`Diện tích tiết diện A = ${A.toFixed(0)} mm²`);
  details.push(`Khả năng chịu lực dọc gần đúng Nu ≈ ${Ncapacity.toFixed(1)} kN`);
  details.push(`Hệ số sử dụng lực dọc = ${utilN.toFixed(3)}`);
  details.push(`Hệ số sử dụng mô men ≈ ${utilM.toFixed(3)}`);
  details.push(`Hệ số sử dụng tổng hợp = ${utilization.toFixed(3)}`);

  const i = col.sectionType === 'circular'
    ? (col.d || col.b) / 4
    : Math.min(col.b, col.h) / Math.sqrt(12);
  const lambda = (col.bucklingLength * 1000) / i;
  details.push(`Độ mảnh λ ≈ ${lambda.toFixed(1)}`);
  if (lambda > 120) details.push('Cảnh báo: Độ mảnh lớn, cần kiểm tra ổn định kỹ');

  let status: CheckResult['status'] = 'pass';
  if (utilization > 1.0) status = 'fail';
  else if (utilization > 0.9) status = 'warning';

  return { utilization, status, details, formulaRefs };
}

export function checkFoundation(f: FoundationInput): CheckResult {
  const details: string[] = [];
  const formulaRefs: string[] = ['TCVN 9362:2012', 'TCVN 5574:2018'];

  const area = f.L * f.B;
  const pressure = f.N / area;
  const utilBearing = pressure / f.soilBearing;

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
  details.push('Kiểm tra lún: Cần dữ liệu module biến dạng đất (chưa nhập đầy đủ)');

  let status: CheckResult['status'] = 'pass';
  if (utilization > 1.0) status = 'fail';
  else if (utilization > 0.85) status = 'warning';

  return { utilization, status, details, formulaRefs };
}

/** μmin theo TCVN 5574 gần đúng: dầm uốn ≥ 0.05% … 0.1% tùy điều kiện; lấy 0.1% bảo thủ cho thép dọc chịu kéo */
function muMinBeam(): number {
  return 0.001; // 0.1%
}

function muMinSlab(): number {
  return 0.0015; // 0.15% thường dùng sàn 1 phương / 2 phương sơ bộ
}

/**
 * Võng gần đúng dầm đơn giản qL^4/(384EI) với M ≈ qL²/8 → q = 8M/L²
 * Giới hạn võng L/250 (thường xuyên) theo tinh thần TCVN 5574 Mục 10
 */
function checkDeflectionBeam(b: BeamInput, h0: number): { fmm: number; flimit: number; util: number; note: string } {
  const Lmm = b.L * 1000;
  const MNmm = Math.abs(b.M) * 1e6; // N·mm
  // I crudely ≈ b h^3 / 12, giảm 50% do nứt (gần đúng trạng thái II)
  const I = (b.b * Math.pow(b.h, 3)) / 12 * 0.5;
  const Eb = 30_000; // MPa ≈ B25
  // f = 5/48 * M L² / (EI) cho dầm đơn giản M giữa nhịp
  const fmm = (5 / 48) * (MNmm * Lmm * Lmm) / (Eb * I);
  const flimit = Lmm / 250;
  const util = fmm / flimit;
  return {
    fmm,
    flimit,
    util,
    note: `Võng gần đúng f ≈ ${fmm.toFixed(1)} mm; [f] = L/250 = ${flimit.toFixed(1)} mm (TCVN 5574 Mục 10 — sơ bộ)`,
  };
}

function checkDeflectionSlab(s: SlabInput): { fmm: number; flimit: number; util: number; note: string } {
  const L = Math.min(s.lx, s.ly) * 1000; // mm — nhịp ngắn
  const MNmm = Math.abs(s.M) * 1e6; // trên 1m bề rộng → b=1000
  const I = (1000 * Math.pow(s.h, 3)) / 12 * 0.4;
  const Eb = 30_000;
  const fmm = (5 / 48) * (MNmm * L * L) / (Eb * I);
  const flimit = L / 250;
  const util = fmm / flimit;
  return {
    fmm,
    flimit,
    util,
    note: `Võng sàn gần đúng f ≈ ${fmm.toFixed(2)} mm; [f] = L/250 = ${flimit.toFixed(1)} mm`,
  };
}

/**
 * Bề rộng vết nứt gần đúng (công thức kinh nghiệm / TCVN tinh thần Mục 10):
 * acrc ≈ 0.5 · ψ · σs / Es · 20 · (3.5−100μ) · √d  (rút gọn)
 * Giới hạn thường 0.3 mm (môi trường bình thường)
 */
function checkCrack(As_mm2: number, b: number, h0: number, M_kNm: number, Rs: number, dBar = 16): {
  acrc: number; limit: number; util: number; note: string
} {
  const z = 0.9 * h0;
  const As = Math.max(As_mm2, 1);
  const sigmaS = Math.min((Math.abs(M_kNm) * 1e6) / (As * z), Rs); // MPa
  const mu = As / (b * h0);
  const Es = 200_000;
  const psi = 0.8;
  const acrc = 0.5 * psi * (sigmaS / Es) * 20 * Math.max(3.5 - 100 * mu, 0.5) * Math.sqrt(dBar);
  const limit = 0.3;
  const util = acrc / limit;
  return {
    acrc,
    limit,
    util,
    note: `Bề rộng vết nứt gần đúng acrc ≈ ${acrc.toFixed(3)} mm (giới hạn ${limit} mm — TCVN 5574 Mục 10)`,
  };
}

export function checkBeam(b: BeamInput & { a?: number }): CheckResult {
  const details: string[] = [];
  const formulaRefs: string[] = [
    'TCVN 5574:2018 Mục 8.1.2–8.1.3 (bền)',
    'TCVN 5574:2018 Mục 10 (võng, nứt)',
    'μmin cốt dọc chịu kéo',
  ];

  const a = (b as any).a ?? 40;
  const h0 = b.h - a;
  const xi = 0.35;
  const Mu = 0.9 * b.material.Rb * b.b * h0 * h0 * xi * (1 - 0.5 * xi) / 1e6;
  const utilM = Math.abs(b.M) / (Mu || 1);

  const Qb = 0.6 * b.material.Rbt * b.b * h0 / 1000;
  const utilQ = Math.abs(b.Q) / (Qb || 1);

  // As required & μ
  const AsReq_mm2 = Math.abs(b.M) * 1e6 / (b.material.Rs * 0.9 * h0);
  const AsMin_mm2 = muMinBeam() * b.b * h0;
  const AsUse = Math.max(AsReq_mm2, AsMin_mm2);
  const mu = AsUse / (b.b * h0);
  const muMin = muMinBeam();
  const utilMu = muMin / Math.max(mu, 1e-9); // >1 nếu As quá nhỏ so min — nhưng AsUse đã max nên ≤1

  const defl = checkDeflectionBeam(b, h0);
  const crack = checkCrack(AsUse, b.b, h0, b.M, b.material.Rs, 16);

  const utilization = Math.max(utilM, utilQ, defl.util, crack.util);

  details.push(`— BỀN (Mục 8) —`);
  details.push(`Chiều cao làm việc h0 = h − a = ${h0} mm (a = ${a} mm)`);
  details.push(`Khả năng chịu mô men gần đúng Mu ≈ ${Mu.toFixed(1)} kNm → μM = ${utilM.toFixed(3)}`);
  details.push(`Khả năng chịu cắt gần đúng Qb ≈ ${Qb.toFixed(1)} kN → μQ = ${utilQ.toFixed(3)}`);
  details.push(`As yêu cầu ≈ ${(AsReq_mm2 / 100).toFixed(2)} cm²; As,min (μmin=${(muMin * 100).toFixed(2)}%) ≈ ${(AsMin_mm2 / 100).toFixed(2)} cm²`);
  details.push(`Dùng As ≈ ${(AsUse / 100).toFixed(2)} cm² → μ = ${(mu * 100).toFixed(3)}% ${mu >= muMin ? '≥ μmin ✓' : '< μmin ✗'}`);

  details.push(`— VÕNG (Mục 10) —`);
  details.push(defl.note);
  details.push(`Hệ số võng f/[f] = ${defl.util.toFixed(3)}`);

  details.push(`— NỨT (Mục 10) —`);
  details.push(crack.note);
  details.push(`Hệ số nứt acrc/[acrc] = ${crack.util.toFixed(3)}`);

  const swMax = Math.min(0.5 * h0, 300);
  details.push(`Khoảng cách cốt đai max khuyến nghị sw,max ≈ ${swMax.toFixed(0)} mm`);

  let status: CheckResult['status'] = 'pass';
  if (utilization > 1.0 || mu < muMin) status = 'fail';
  else if (utilization > 0.9) status = 'warning';

  // utilMu unused in max when AsUse>=AsMin; keep mu check in status
  void utilMu;

  return { utilization, status, details, formulaRefs };
}

export function checkSlab(s: SlabInput): CheckResult {
  const details: string[] = [];
  const formulaRefs: string[] = [
    'TCVN 5574:2018 Mục 8 (bền uốn sàn)',
    'TCVN 5574:2018 Mục 10 (võng, nứt)',
    'μmin cốt sàn',
  ];

  const h0 = s.h - 20;
  const b = 1000; // 1m dải sàn
  const Mu = 0.9 * s.material.Rb * b * h0 * h0 * 0.3 / 1e6; // kNm/m
  const utilM = Math.abs(s.M) / (Mu || 1);

  const AsReq_mm2 = Math.abs(s.M) * 1e6 / (s.material.Rs * 0.9 * h0);
  const AsMin_mm2 = muMinSlab() * b * h0;
  const AsUse = Math.max(AsReq_mm2, AsMin_mm2);
  const mu = AsUse / (b * h0);
  const muMin = muMinSlab();

  const defl = checkDeflectionSlab(s);
  const crack = checkCrack(AsUse, b, h0, s.M, s.material.Rs, 10);

  const utilization = Math.max(utilM, defl.util, crack.util);

  details.push(`— BỀN —`);
  details.push(`Chiều dày h = ${s.h} mm, h0 ≈ ${h0} mm`);
  details.push(`Khả năng chịu mô men gần đúng Mu ≈ ${Mu.toFixed(2)} kNm/m → μM = ${utilM.toFixed(3)}`);
  details.push(`As yêu cầu ≈ ${(AsReq_mm2 / 100).toFixed(2)} cm²/m; As,min (μmin=${(muMin * 100).toFixed(2)}%) ≈ ${(AsMin_mm2 / 100).toFixed(2)} cm²/m`);
  details.push(`Dùng As ≈ ${(AsUse / 100).toFixed(2)} cm²/m → μ = ${(mu * 100).toFixed(3)}% ${mu >= muMin ? '≥ μmin ✓' : '< μmin ✗'}`);

  details.push(`— VÕNG —`);
  details.push(defl.note);
  details.push(`Hệ số võng f/[f] = ${defl.util.toFixed(3)}`);

  details.push(`— NỨT —`);
  details.push(crack.note);
  details.push(`Hệ số nứt acrc/[acrc] = ${crack.util.toFixed(3)}`);

  let status: CheckResult['status'] = 'pass';
  if (utilization > 1.0 || mu < muMin) status = 'fail';
  else if (utilization > 0.9) status = 'warning';

  return { utilization, status, details, formulaRefs };
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
