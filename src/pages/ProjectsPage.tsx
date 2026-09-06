import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Plus, Trash2 } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, currentProjectId, createProject, setCurrentProject, deleteProject } = useProjectStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createProject(name.trim(), desc.trim());
    setName('');
    setDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Tạo dự án mới</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            placeholder="Tên dự án"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            placeholder="Mô tả (tùy chọn)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus size={18} /> Tạo
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold">Danh sách dự án</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {projects.map(p => (
            <div
              key={p.id}
              className={`px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer ${
                p.id === currentProjectId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => setCurrentProject(p.id)}
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {p.elements.length} cấu kiện · Cập nhật: {new Date(p.updatedAt).toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.id === currentProjectId && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Đang chọn
                  </span>
                )}
                {projects.length > 1 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm('Xóa dự án này?')) deleteProject(p.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}