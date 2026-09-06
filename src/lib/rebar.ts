/** Bố trí thép chi tiết — chọn tổ hợp đường kính tiêu chuẩn */

export const BAR_DIAMS = [10, 12, 14, 16, 18, 20, 22, 25, 28, 32] as const;

export function areaOfBar(d: number): number {
  return (Math.PI * d * d) / 4; // mm²
}

export interface RebarLayout {
  label: string;       // e.g. "4Ø16"
  n: number;
  d: number;
  As: number;          // mm²
  AsCm2: number;
  layers?: string;     // gợi ý lớp
}

/** Chọn bố trí n×Ød sao cho As ≥ AsReq (mm²), ưu tiên ít thanh, d phổ biến */
export function arrangeMainBars(AsReqMm2: number, maxBars = 8, preferred: number[] = [16, 18, 20, 14, 22, 12, 25]): RebarLayout {
  const need = Math.max(AsReqMm2, 0);
  let best: RebarLayout | null = null;

  for (const d of preferred) {
    const a = areaOfBar(d);
    const n = Math.max(2, Math.ceil(need / a));
    if (n > maxBars) continue;
    const As = n * a;
    const cand: RebarLayout = {
      label: `${n}Ø${d}`,
      n,
      d,
      As,
      AsCm2: As / 100,
      layers: n <= 4 ? '1 lớp' : n <= 6 ? '2 lớp (3+3 hoặc 4+2)' : '2–3 lớp',
    };
    if (!best || As < best.As || (As === best.As && n < best.n)) best = cand;
  }

  // fallback
  if (!best) {
    const d = 20;
    const n = Math.max(2, Math.ceil(need / areaOfBar(d)));
    best = { label: `${n}Ø${d}`, n, d, As: n * areaOfBar(d), AsCm2: (n * areaOfBar(d)) / 100, layers: 'kiểm tra lại' };
  }
  return best;
}

/** Cốt đai gợi ý theo h0 */
export function arrangeStirrups(h0: number, highShear: boolean): { label: string; note: string } {
  const sMax = Math.min(0.5 * h0, highShear ? 150 : 300);
  const s = Math.min(Math.floor(sMax / 25) * 25, highShear ? 150 : 200);
  return {
    label: highShear ? `Ø8a${s}` : `Ø8a${Math.min(s, 200)}`,
    note: `sw,max ≈ ${sMax.toFixed(0)} mm · vùng ${highShear ? 'cắt lớn' : 'cấu tạo'}`,
  };
}

/** Bố trí cột: thép dọc + đai */
export function arrangeColumnRebar(b: number, h: number, AsReqMm2: number, lambda: number) {
  const main = arrangeMainBars(AsReqMm2, 12, [16, 18, 20, 22, 14, 25, 12]);
  const densestirrup = lambda > 60 || true;
  const stirrup = arrangeStirrups(Math.min(b, h) - 40, densestirrup);
  return { main, stirrup };
}

/** Bố trí dầm */
export function arrangeBeamRebar(b: number, h: number, a: number, AsReqMm2: number, utilQ: number) {
  const h0 = h - a;
  const main = arrangeMainBars(AsReqMm2, 6, [16, 18, 20, 14, 22, 12, 25]);
  const stirrup = arrangeStirrups(h0, utilQ > 0.7);
  // thép cấu tạo trên
  const top = arrangeMainBars(Math.max(AsReqMm2 * 0.25, 0.001 * b * h0), 4, [12, 14, 16, 10]);
  return { bottom: main, top, stirrup, h0 };
}

/** Bố trí sàn 2 hướng */
export function arrangeSlabRebar(h: number, M: number, Rs: number) {
  const h0 = h - 20;
  const AsReq = (Math.abs(M) * 1e6) / (Rs * 0.9 * h0); // mm²/m
  // chọn khoảng cách
  let best = { label: 'Ø8a200', As: 0, spacing: 200, d: 8 };
  for (const d of [8, 10, 12]) {
    for (const s of [100, 125, 150, 175, 200, 250]) {
      const As = (areaOfBar(d) * 1000) / s; // mm²/m
      if (As >= AsReq && (best.As === 0 || As < best.As)) {
        best = { label: `Ø${d}a${s}`, As, spacing: s, d };
      }
    }
  }
  if (best.As === 0) {
    best = { label: 'Ø10a100', As: (areaOfBar(10) * 1000) / 100, spacing: 100, d: 10 };
  }
  return {
    main: best,
    dist: { label: 'Ø8a200', note: 'thép phân bố / cấu tạo' },
    AsReqCm2: AsReq / 100,
    h0,
  };
}

/** Bố trí thép móng đơn */
export function arrangeFoundationRebar(L: number, B: number, AsReqPerM = 6) {
  // AsReqPerM cm²/m mỗi hướng
  const need = AsReqPerM * 100; // mm²/m
  let best = { label: 'Ø12a150', As: 0 };
  for (const d of [12, 14, 16, 10]) {
    for (const s of [100, 125, 150, 200]) {
      const As = (areaOfBar(d) * 1000) / s;
      if (As >= need && (best.As === 0 || As < best.As)) {
        best = { label: `Ø${d}a${s}`, As };
      }
    }
  }
  return {
    bottomX: best,
    bottomY: best,
    note: `Lưới thép đáy ${L.toFixed(1)}×${B.toFixed(1)} m`,
  };
}
