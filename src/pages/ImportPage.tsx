import { useState, useRef } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { createMaterial } from '../lib/materials';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';

/** Template CSV mẫu */
const TEMPLATES: Record<string, string> = {
  column: `name,sectionType,b,h,d,height,bucklingLength,N,Mx,My,Q,concrete,steel
Cột A1,rectangular,300,500,,3.3,3.3,1200,80,40,50,B25,CB400-V
Cột B1,circular,,,400,3.3,3.3,1000,60,60,40,B30,CB400-V`,
  foundation: `name,L,B,H,N,Mx,My,soilBearing,concrete,steel
Móng M1,2.4,2.0,0.6,1400,50,30,200,B25,CB400-V`,
  beam: `name,b,h,L,M,Q,concrete,steel
Dầm D1,220,500,6,120,80,B25,CB400-V`,
  slab: `name,lx,ly,h,M,concrete,steel
Sàn S1,4,5,120,15,B25,CB400-V`,
};

function parseCSV(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .map(line => line.split(',').map(c => c.trim()))
    .filter(row => row.length > 1 && row.some(c => c));
}

export default function ImportPage() {
  const { addElement } = useProjectStore();
  const { addToast } = useToastStore();
  const [type, setType] = useState<'column' | 'foundation' | 'beam' | 'slab'>('column');
  const [preview, setPreview] = useState<string[][]>([]);
  const [log, setLog] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATES[type]], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ketcau-template-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Đã tải template CSV', 'success');
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 8));
      setLog([`Đã đọc ${rows.length - 1} dòng dữ liệu (bỏ header)`]);
    };
    reader.readAsText(file);
  };

  const importRows = () => {
    if (preview.length < 2) {
      addToast('Chưa có dữ liệu để import', 'warning');
      return;
    }
    const header = preview[0].map(h => h.toLowerCase());
    const dataRows = preview.length > 1 ? preview.slice(1) : [];
    // Re-read full file from last parse - use all rows from state; for simplicity re-parse from template structure
    // Actually preview is only first 8; we need full data. Store full in state.
    addToast('Đang import...', 'info');
  };

  const importFromText = (text: string) => {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      addToast('File trống hoặc sai định dạng', 'error');
      return;
    }
    const header = rows[0].map(h => h.toLowerCase());
    const get = (row: string[], key: string) => {
      const i = header.indexOf(key.toLowerCase());
      return i >= 0 ? row[i] : '';
    };
    let count = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (type === 'column') {
          const id = `C${Date.now().toString().slice(-4)}${i}`;
          const sectionType = (get(row, 'sectionType') || 'rectangular') as any;
          addElement({
            id,
            name: get(row, 'name') || id,
            type: 'column',
            sectionType,
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
          const id = `M${Date.now().toString().slice(-4)}${i}`;
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
          const id = `D${Date.now().toString().slice(-4)}${i}`;
          addElement({
            id,
            name: get(row, 'name') || id,
            type: 'beam',
            b: +get(row, 'b') || 220,
            h: +get(row, 'h') || 500,
            L: +get(row, 'L') || 6,
            M: +get(row, 'M') || 0,
            Q: +get(row, 'Q') || 0,
            material: createMaterial(get(row, 'concrete') || 'B25', get(row, 'steel') || 'CB400-V'),
          });
          count++;
        } else if (type === 'slab') {
          const id = `S${Date.now().toString().slice(-4)}${i}`;
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
      } catch (err) {
        errors.push(`Dòng ${i + 1}: lỗi`);
      }
    }
    setLog([`Import thành công ${count} cấu kiện`, ...errors]);
    addToast(`Đã import ${count} cấu kiện`, count ? 'success' : 'error');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setPreview(parseCSV(text).slice(0, 10));
      (window as any).__ketcauImportText = text;
    };
    reader.readAsText(file);
  };

  const doImport = () => {
    const text = (window as any).__ketcauImportText;
    if (!text) {
      addToast('Chọn file CSV trước', 'warning');
      return;
    }
    importFromText(text);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
          <FileSpreadsheet size={20} /> Import Excel / CSV
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Tải template → điền số liệu trên Excel (Save as CSV UTF-8) → Upload → Import
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm">
            <option value="column">Cột</option>
            <option value="foundation">Móng đơn</option>
            <option value="beam">Dầm</option>
            <option value="slab">Sàn</option>
          </select>
          <button onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
            <Download size={16} /> Tải template CSV
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Upload size={16} /> Chọn file CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFileChange} />
        </div>

        {preview.length > 0 && (
          <>
            <div className="overflow-x-auto mb-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="w-full text-xs">
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={i === 0 ? 'bg-slate-50 dark:bg-slate-900 font-medium' : ''}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-700 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={doImport} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
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

      <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
        <strong>Hướng dẫn:</strong> Mở Excel → Data → From Text/CSV hoặc Save As → CSV UTF-8.
        Giữ nguyên tên cột trong template. File .xlsx thuần có thể Save As .csv trước khi upload.
      </div>
    </div>
  );
}
