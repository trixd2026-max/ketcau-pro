import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { isFirebaseConfigured } from '../lib/firebase';

export default function LoginPage() {
  const login = useAuthStore(s => s.login);
  const register = useAuthStore(s => s.register);
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === 'Email hoặc mật khẩu không đúng'
          ? 'Email hoặc mật khẩu không đúng. Auth local: phải Đăng ký trước trên trình duyệt này (không dùng mật khẩu Gmail thật).'
          : (res.error || 'Đăng nhập thất bại')
      );
      return;
    }
    addToast('Đăng nhập thành công', 'success');
    navigate('/');
  };

  /** Tạo / đăng nhập tài khoản demo 1 click */
  const handleDemo = async () => {
    setError('');
    setLoading(true);
    const demoEmail = 'demo@ketcau.local';
    const demoPass = 'demo123';
    // thử login trước
    let res = await login(demoEmail, demoPass);
    if (!res.ok) {
      res = await register('Người dùng Demo', demoEmail, demoPass);
      if (!res.ok && res.error === 'Email đã được đăng ký') {
        res = await login(demoEmail, demoPass);
      }
    }
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Không vào được demo');
      return;
    }
    addToast('Đã vào tài khoản demo', 'success');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white">K</div>
          <div>
            <div className="font-semibold text-lg">KetCau Pro</div>
            <div className="text-xs text-slate-500">TCVN 5574:2018</div>
          </div>
        </div>
        <h1 className="text-xl font-semibold mb-1">Đăng nhập</h1>
        <p className="text-sm text-slate-500 mb-2">Truy cập dự án thiết kế kết cấu của bạn</p>
        <div className={`inline-flex text-xs px-2 py-1 rounded-full mb-4 ${
          isFirebaseConfigured
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
        }`}>
          {isFirebaseConfigured ? 'Firebase Auth' : 'Auth local (MVP) — tài khoản chỉ lưu trên trình duyệt này'}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ban@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-medium"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {!isFirebaseConfigured && (
          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="mt-3 w-full py-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium"
          >
            Vào nhanh (tài khoản demo)
          </button>
        )}

        <p className="mt-6 text-sm text-center text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">Đăng ký</Link>
        </p>
        {!isFirebaseConfigured && (
          <p className="mt-3 text-xs text-center text-slate-400">
            Lần đầu: bấm <strong>Đăng ký</strong> hoặc <strong>Vào nhanh (demo)</strong>.
            Không dùng mật khẩu Gmail — auth local không kết nối Google.
          </p>
        )}
      </div>
    </div>
  );
}
