import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, currentProjectId, createProject, setCurrentProject, deleteProject, updateProject } = useProjectStore();
  const { addToast } = useToastStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createProject(name.trim(), desc.trim());
    setName('');
    setDesc('');
    addToast('Đã tạo dự án mới', 'success');
  };

  const startEdit = (p: { id: string; name: string; description?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(p.id);
    setEditName(p.name);
    setEditDesc(p.description || '');
  };

  const cancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  };

  const saveEdit = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editName.trim()) {
      addToast('Tên dự án không được trống', 'warning');
      return;
    }
    updateProject(id, { name: editName.trim(), description: editDesc.trim() });
    addToast('Đã cập nhật tên dự án', 'success');
    setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-lg mb-4">Tạo dự án mới</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            placeholder="Tên dự án"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            placeholder="Mô tả (tùy chọn)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shrink-0"
          >
            <Plus size={18} /> Tạo
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold">Danh sách dự án</h2>
          <p className="text-xs text-slate-500 mt-1">Bấm icon bút để sửa tên / mô tả · Bấm hàng để chọn dự án</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {projects.map(p => (
            <div
              key={p.id}
              className={`px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                p.id === currentProjectId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              } ${editingId === p.id ? '' : 'cursor-pointer'}`}
              onClick={() => {
                if (editingId !== p.id) setCurrentProject(p.id);
              }}
            >
              {editingId === p.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2 min-w-0" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    className="flex-1 px-3 py-1.5 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-sm font-medium"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(p.id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    placeholder="Tên dự án"
                  />
                  <input
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(p.id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    placeholder="Mô tả"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => saveEdit(p.id, e)}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      title="Lưu"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Hủy"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {p.elements.length} cấu kiện · Cập nhật: {new Date(p.updatedAt).toLocaleString('vi-VN')}
                      {p.description ? ` · ${p.description}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.id === currentProjectId && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded mr-1">
                        Đang chọn
                      </span>
                    )}
                    <button
                      onClick={e => startEdit(p, e)}
                      className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      title="Sửa tên dự án"
                    >
                      <Pencil size={16} />
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Xóa dự án "${p.name}"?`)) {
                            deleteProject(p.id);
                            addToast('Đã xóa dự án', 'info');
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Xóa dự án"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
