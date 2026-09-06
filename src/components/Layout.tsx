import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Columns3,
  Square,
  Layers,
  FileSpreadsheet,
  FileText,
  History,
  Settings,
  Moon,
  Sun,
  Plus,
  Building2,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Dự án', icon: Building2 },
  { path: '/column', label: 'Thiết kế Cột', icon: Columns3 },
  { path: '/foundation', label: 'Móng đơn', icon: Square },
  { path: '/beam', label: 'Dầm', icon: Layers },
  { path: '/slab', label: 'Sàn', icon: Layers },
  { path: '/report', label: 'Báo cáo', icon: FileText },
  { path: '/tools', label: 'Công cụ tra cứu', icon: FileSpreadsheet },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { darkMode, toggleDarkMode, projects, currentProjectId } = useProjectStore();
  const current = projects.find(p => p.id === currentProjectId);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-sm">
              K
            </div>
            <div>
              <div className="font-semibold text-sm">KetCau Pro</div>
              <div className="text-xs text-slate-400">TCVN 5574:2018</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
          Công cụ hỗ trợ thiết kế.\nKỹ sư phải kiểm tra và phê duyệt kết quả.
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="font-semibold text-lg">
              {location.pathname === '/' ? 'Dashboard' :
               location.pathname === '/column' ? 'Thiết kế Cột' :
               location.pathname === '/foundation' ? 'Móng đơn' :
               location.pathname === '/beam' ? 'Thiết kế Dầm' :
               location.pathname === '/slab' ? 'Thiết kế Sàn' :
               location.pathname === '/report' ? 'Báo cáo' :
               location.pathname === '/projects' ? 'Quản lý Dự án' :
               location.pathname === '/tools' ? 'Công cụ tra cứu' : 'KetCau Pro'}
            </h1>
            {current && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {current.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Dark/Light mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}