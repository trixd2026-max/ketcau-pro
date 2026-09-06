export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Bảng tra nhanh theo TCVN 5574:2018</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">1. Chiều dài neo cơ sở (công thức 255)</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              l<sub>0,an</sub> = (α / 4) · (R<sub>s</sub> / R<sub>b</sub>) · d
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 dark:border-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 border">Mác thép</th>
                    <th className="px-3 py-2 border">B25</th>
                    <th className="px-3 py-2 border">B30</th>
                    <th className="px-3 py-2 border">B35</th>
                    <th className="px-3 py-2 border">B40</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border">CB400-V (d=14)</td>
                    <td className="px-3 py-2 border">≈ 42d</td>
                    <td className="px-3 py-2 border">≈ 36d</td>
                    <td className="px-3 py-2 border">≈ 32d</td>
                    <td className="px-3 py-2 border">≈ 28d</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border">CB500-V (d=14)</td>
                    <td className="px-3 py-2 border">≈ 52d</td>
                    <td className="px-3 py-2 border">≈ 45d</td>
                    <td className="px-3 py-2 border">≈ 40d</td>
                    <td className="px-3 py-2 border">≈ 35d</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-2">Giá trị gần đúng, α = 2.5 (thép có gân). Cần nhân hệ số điều chỉnh theo vị trí.</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">2. Khoảng cách cốt đai tối đa</h3>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Vùng chịu cắt: s<sub>w,max</sub> = min(0.5 h<sub>0</sub>, 300 mm)</li>
              <li>• Vùng cấu tạo: s<sub>w,max</sub> = min(0.75 h<sub>0</sub>, 500 mm)</li>
              <li>• Hàm lượng tối thiểu μ<sub>sw,min</sub> = 0.25 R<sub>bt</sub> / R<sub>sw</sub></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">3. Chiều dài nối chồng</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              l<sub>l</sub> = α<sub>2</sub> · l<sub>0,an</sub><br />
              α<sub>2</sub> = 1.2 (nối so le, vùng kéo) · 2.0 (nối cùng vị trí, vùng kéo)
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
            <strong>Lưu ý:</strong> Các giá trị trên chỉ mang tính tham khảo nhanh.
            Kỹ sư cần tính toán đầy đủ theo TCVN 5574:2018 Mục 10.3.5 và 10.3.6 trước khi áp dụng vào hồ sơ thiết kế.
          </div>
        </div>
      </div>
    </div>
  );
}