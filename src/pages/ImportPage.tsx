import { useState, useRef } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { createMaterial } from '../lib/materials';
import { downloadCSV } from '../lib/exportExcel';
import { Upload, Download, FileSpreadsheet, FileDown } from 'lucide-react';

const TEMPLATES: Record<string, { headers: string[]; sample: string[][] }> = {
  column: {
    headers: ['name', 'sectionType', 'b', 'h', 'd', 'height', 'bucklingLength', 'N', 'Mx', 'My', 'Q', 'concrete', 'steel'],
    sample: [
      ['Cột C1', 'rectangular', '300', '500', '', '3.3', '3.3', '1200', '80', '40', '50', 'B25', 'CB400-V'],
      ['Cột C2', 'rectangular', '400', '400', '', '3.3', '3.3', '1500', '60', '60', '40', 'B25', 'CB400-V'],
      ['Cột tròn', 'circular', '', '', '400', '3.3', '3.3', '1000', '50', '50', '30', 'B30', 'CB400-V'],
    ],
  },
  foundation: {
    headers: ['name', 'L', 'B', 'H', 'N', 'Mx', 'My', 'soilBearing', 'concrete', 'steel'],
    sample: [
      ['Móng M1', '2.4', '2.0', '0.6', '1400', '50', '30', '200', 'B25', 'CB400-V'],
      ['Móng M2', '2.0', '2.0', '0.5', '900', '20', '20', '180', 'B25', 'CB400-V'],
    ],
  },
  beam: {
    headers: ['name', 'group', 'b', 'h', 'L', 'a', 'M', 'Q', 'concrete', 'steel'],
    sample: [
      ['Dầm D1', 'BX', '220', '500', '6', '40', '120', '80', 'B25', 'CB400-V'],
      ['Dầm D2', 'BX', '220', '550', '7', '40', '150', '90', 'B25', 'CB400-V'],
      ['Dầm D3', 'BY', '200', '400', '4.5', '35', '80', '50', 'B25', 'CB400-V'],
      ['Dầm D4', 'BY', '200', '450', '5', '35', '95', '55', 'B30', 'CB400-V'],
    ],
  },
  slab: {
    headers: ['name', 'lx', 'ly', 'h', 'M', 'concrete', 'steel'],
    sample: [
      ['Sàn S1', '4', '5', '120', '15', 'B25', 'CB400-V'],
      ['Sàn S2', '3.5', '4', '100', '12', 'B25', 'CB400-V'],
    ],
  },
};

function parseCSV(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .map(line => {
      const cells: string[] = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    })
    .filter(row => row.some(c => c));
}

export default function ImportPage() {
  const { addElement, projects, currentProjectId } = useProjectStore();
  const { addToast } = useToastStore();
  const project = projects.find(p => p.id === currentProjectId);
  const [type, setType] = useState<'column' | 'foundation' | 'beam' | 'slab'>('beam');
  const [preview, setPreview] = useState<string[][]>([]);
  const [rawText, setRawText] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const t = TEMPLATES[type];
    downloadCSV(`ketcau-template-${type}.csv`, t.headers, t.sample);
    addToast('Đã tải template CSV (mở bằng Excel)', 'success');
  };

  const downloadSampleAll = () => {
    // multi-sheet simulation: sequential files tip — export beam sample as main demo
    const t = TEMPLATES.beam;
    downloadCSV('ketcau-sample-beams.csv', t.headers, t.sample);
    addToast('Đã tải dữ liệu mẫu dầm (4 dầm như app mẫu)', 'success');
  };

  const exportCurrent = () => {
    if (!project) return;
    const els = project.elements.filter(e => e.type === type);
    if (!els.length) {
      addToast(`Chưa có ${type} trong dự án`, 'warning');
      return;
    }
    const t = TEMPLATES[type];
    const rows = els.map((el: any) =>
      t.headers.map(h => {
        if (h === 'concrete') return el.material?.concreteGrade || '';
        if (h === 'steel') return el.material?.steelGrade || '';
        return el[h] ?? '';
      })
    );
    downloadCSV(`ketcau-export-${type}.csv`, t.headers, rows);
    addToast(`Đã xuất ${els.length} ${type} ra CSV`, 'success');
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setRawText(text);
      setPreview(parseCSV(text).slice(0, 12));
      setLog([`Đã đọc file: ${file.name}`]);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const importFromText = (text: string) => {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      addToast('File trống hoặc sai định dạng', 'error');
      return;
    }
    const header = rows[0].map(h => h.toLowerCase().replace(/\s/g, ''));
    const get = (row: string[], key: string) => {
      const i = header.indexOf(key.toLowerCase());
      return i >= 0 ? row[i] : '';
    };
    let count = 0;
    const errors: string[] = [];
    const ts = Date.now().toString().slice(-5);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (type === 'column') {
          const id = `C${ts}${i}`;
          addElement({
            id,
            name: get(row, 'name') || id,
            type: 'column',
            sectionType: (get(row, 'sectionType') || 'rectangular') as any,
            b: +get(row, 'b') || 300,
            h: +get(row, 'h') || 500,
            d: +get(row, 'd') || 400,
            height: +get(row, 'height') || 3.3,
            bucklingLength: +get(row, 'bucklingLength') || 3.3,
            N: +get(row, 'N') || 0,
            Mx: +get(row, 'Mx') || 0,
            My: +get(row, 'My') || 0,
            Q: +get(row, 'Q') || 0,
            material: createMaterial(get(row, 'concrete') || 'B25', get(row, 'steel') || 'CB400-V'),
          });
          count++;
        } else if (type === 'foundation') {
          const id = `M${ts}${i}`;
          addElement({
            id,
            name: get(row, 'name') || id,
            type: 'foundation',
            L: +get(row, 'L') || 2,
            B: +get(row, 'B') || 2,
            H: +get(row, 'H') || 0.6,
            N: +get(row, 'N') || 0,
            Mx: +get(row, 'Mx') || 0,
            My: +get(row, 'My') || 0,
            soilBearing: +get(row, 'soilBearing') || 200,
            material: createMaterial(get(row, 'concrete') || 'B25', get(row, 'steel') || 'CB400-V'),
          });
          count++;
        } else if (type === 'beam') {
          const id = `D${ts}${i}`;
          addElement({
            id,
            name: get(row, 'name') || id,
            type: 'beam',
            group: get(row, 'group') || 'BX',
            b: +get(row, 'b') || 220,
            h: +get(row, 'h') || 500,
            L: +get(row, 'L') || 6,
            a: +get(row, 'a') || 40,
            M: +get(row, 'M') || 0,
            Q: +get(row, 'Q') || 0,
            material: createMaterial(get(row, 'concrete') || 'B25', get(row, 'steel') || 'CB400-V'),
          } as any);
          count++;
        } else if (type === 'slab') {
          const id = `S${ts}${i}`;
          addElement({
            id,
            name: get(row, 'name') || id,
            type: 'slab',
            lx: +get(row, 'lx') || 4,
            ly: +get(row, 'ly') || 5,
            h: +get(row, 'h') || 120,
            M: +get(row, 'M') || 0,
            material: createMaterial(get(row, 'concrete') || 'B25', get(row, 'steel') || 'CB400-V'),
          });
          count++;
        }
      } catch {
        errors.push(`Dòng ${i + 1}`);
      }
    }
    setLog([`Import thành công ${count} cấu kiện kiểu ${type}`, ...errors.map(e => `Lỗi ${e}`)]);
    addToast(`Đã import ${count} ${type}`, count ? 'success' : 'error');
  };

  const loadSampleIntoPreview = () => {
    const t = TEMPLATES[type];
    const text = [t.headers.join(','), ...t.sample.map(r => r.join(','))].join('\n');
    setRawText(text);
    setPreview(parseCSV(text));
    setLog(['Đã nạp dữ liệu mẫu vào preview — bấm Import để thêm vào dự án']);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-20 md:pb-0">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
          <FileSpreadsheet size={20} /> Import / Export CSV (giống bảng tính mẫu)
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Tải template → điền trên Excel → lưu CSV UTF-8 → Upload → Import. Có thể xuất lại dữ liệu đang có.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
            <option value="beam">Dầm</option>
            <option value="column">Cột</option>
            <option value="foundation">Móng</option>
            <option value="slab">Sàn</option>
          </select>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <Download size={15} /> CSV template
          </button>
          <button onClick={loadSampleIntoPreview} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            Dữ liệu mẫu
          </button>
          <button onClick={downloadSampleAll} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <FileDown size={15} /> CSV mẫu dầm
          </button>
          <button onClick={exportCurrent} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <Download size={15} /> CSV xuất
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Upload size={15} /> Nhập file
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>

        {preview.length > 0 && (
          <>
            <div className="overflow-x-auto mb-4 border border-slate-200 dark:border-slate-700 rounded-lg max-h-64">
              <table className="w-full text-xs">
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={i === 0 ? 'bg-slate-50 dark:bg-slate-900 font-medium sticky top-0' : ''}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-700 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => importFromText(rawText)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
            >
              Import vào dự án hiện tại
            </button>
          </>
        )}

        {log.length > 0 && (
          <ul className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-1">
            {log.map((l, i) => <li key={i}>• {l}</li>)}
          </ul>
        )}
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-1">
        <p><strong>Quy trình giống app mẫu:</strong></p>
        <p>1. Chọn loại cấu kiện → <em>CSV template</em> hoặc <em>Dữ liệu mẫu</em></p>
        <p>2. Mở bằng Excel, chỉnh số liệu, Save As → CSV UTF-8</p>
        <p>3. <em>Nhập file</em> → kiểm tra preview → <em>Import</em></p>
        <p>4. <em>CSV xuất</em> để tải lại dữ liệu đã có trong dự án</p>
      </div>
    </div>
  );
}
