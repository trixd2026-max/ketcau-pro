import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Columns3, Square, Layers, FileSpreadsheet, FileText,
  Moon, Sun, Building2, RefreshCw, Upload, LogOut, User, ChevronDown,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Dự án', icon: Building2 },
  { path: '/column', label: 'Thiết kế Cột', icon: Columns3 },
  { path: '/foundation', label: 'Móng đơn', icon: Square },
  { path: '/beam', label: 'Dầm', icon: Layers },
  { path: '/slab', label: 'Sàn', icon: Layers },
  { path: '/import', label: 'Import CSV', icon: Upload },
  { path: '/report', label: 'Báo cáo', icon: FileText },
  { path: '/tools', label: 'Công cụ tra cứu', icon: FileSpreadsheet },
];

const mobileNav = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/column', label: 'Cột', icon: Columns3 },
  { path: '/foundation', label: 'Móng', icon: Square },
  { path: '/report', label: 'Báo cáo', icon: FileText },
  { path: '/import', label: 'Import', icon: Upload },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, projects, currentProjectId, recalculateAll } = useProjectStore();
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const current = projects.find(p => p.id === currentProjectId);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleRecalc = () => { recalculateAll(); addToast('Đã tính lại tất cả cấu kiện', 'success'); };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    addToast('Đã đăng xuất', 'info');
    navigate('/login');
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-sm">K</div>
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
              <Link key={item.path} to={item.path}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}>
                <Icon size={18} />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
          Công cụ hỗ trợ thiết kế.<br />Kỹ sư phải kiểm tra và phê duyệt kết quả.
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="min-w-0">
            <h1 className="font-semibold text-base md:text-lg truncate">
              {location.pathname === '/' ? 'Dashboard' :
               location.pathname === '/column' ? 'Thiết kế Cột' :
               location.pathname === '/foundation' ? 'Móng đơn' :
               location.pathname === '/beam' ? 'Thiết kế Dầm' :
               location.pathname === '/slab' ? 'Thiết kế Sàn' :
               location.pathname === '/report' ? 'Báo cáo' :
               location.pathname === '/projects' ? 'Quản lý Dự án' :
               location.pathname === '/import' ? 'Import CSV' :
               location.pathname === '/tools' ? 'Công cụ tra cứu' : 'KetCau Pro'}
            </h1>
            {current && <p className="text-xs text-slate-500 truncate">{current.name}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleRecalc} className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
              <RefreshCw size={14} /> <span className="hidden sm:inline">Tính lại</span>
            </button>
            <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                  {initials}
                </div>
                <span className="hidden md:block text-sm max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown size={14} className="text-slate-400 hidden md:block" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="text-sm font-medium truncate">{user?.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  </div>
                  <div className="px-3 py-2 text-xs text-slate-400 flex items-center gap-1.5">
                    <User size={12} /> Tài khoản đã xác thực
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around py-2">
          {mobileNav.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={cn('flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]',
                  active ? 'text-blue-600' : 'text-slate-500')}>
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
