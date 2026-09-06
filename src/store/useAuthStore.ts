import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  isFirebaseConfigured,
  fbLogin,
  fbRegister,
  fbLogout,
  fbOnAuth,
  mapFirebaseUser,
} from '../lib/firebase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  provider?: 'local' | 'firebase';
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

interface AuthState {
  user: AuthUser | null;
  users: StoredUser[];
  authMode: 'local' | 'firebase';
  ready: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string }) => void;
  initFirebaseListener: () => () => void;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + 'ketcau-pro-salt-v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      authMode: isFirebaseConfigured ? 'firebase' : 'local',
      ready: !isFirebaseConfigured,

      initFirebaseListener: () => {
        if (!isFirebaseConfigured) {
          set({ ready: true, authMode: 'local' });
          return () => {};
        }
        return fbOnAuth(u => {
          if (u) set({ user: mapFirebaseUser(u), authMode: 'firebase', ready: true });
          else set({ user: null, authMode: 'firebase', ready: true });
        });
      },

      login: async (email, password) => {
        const e = email.trim().toLowerCase();
        if (!e || !password) return { ok: false, error: 'Vui lòng nhập email và mật khẩu' };

        if (isFirebaseConfigured) {
          try {
            const u = await fbLogin(e, password);
            set({ user: mapFirebaseUser(u), authMode: 'firebase' });
            return { ok: true };
          } catch (err: any) {
            const code = err?.code || '';
            if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential'))
              return { ok: false, error: 'Email hoặc mật khẩu không đúng' };
            if (code.includes('too-many-requests'))
              return { ok: false, error: 'Thử quá nhiều lần — đợi vài phút' };
            return { ok: false, error: err?.message || 'Đăng nhập Firebase thất bại' };
          }
        }

        const hash = await hashPassword(password);
        const found = get().users.find(u => u.email === e && u.passwordHash === hash);
        if (!found) return { ok: false, error: 'Email hoặc mật khẩu không đúng' };
        const { passwordHash: _, ...user } = found;
        set({ user: { ...user, provider: 'local' }, authMode: 'local' });
        return { ok: true };
      },

      register: async (name, email, password) => {
        const e = email.trim().toLowerCase();
        const n = name.trim();
        if (!n || !e || !password) return { ok: false, error: 'Điền đầy đủ thông tin' };
        if (password.length < 6) return { ok: false, error: 'Mật khẩu tối thiểu 6 ký tự' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: 'Email không hợp lệ' };

        if (isFirebaseConfigured) {
          try {
            const u = await fbRegister(n, e, password);
            set({ user: mapFirebaseUser(u), authMode: 'firebase' });
            return { ok: true };
          } catch (err: any) {
            const code = err?.code || '';
            if (code.includes('email-already-in-use'))
              return { ok: false, error: 'Email đã được đăng ký' };
            if (code.includes('weak-password'))
              return { ok: false, error: 'Mật khẩu quá yếu' };
            return { ok: false, error: err?.message || 'Đăng ký Firebase thất bại' };
          }
        }

        if (get().users.some(u => u.email === e)) return { ok: false, error: 'Email đã được đăng ký' };
        const hash = await hashPassword(password);
        const newUser: StoredUser = {
          id: `U${Date.now()}`,
          email: e,
          name: n,
          createdAt: new Date().toISOString(),
          passwordHash: hash,
          provider: 'local',
        };
        const { passwordHash: _, ...user } = newUser;
        set(state => ({
          users: [...state.users, newUser],
          user: { ...user, provider: 'local' },
          authMode: 'local',
        }));
        return { ok: true };
      },

      logout: async () => {
        if (isFirebaseConfigured) {
          try { await fbLogout(); } catch { /* ignore */ }
        }
        set({ user: null });
      },

      updateProfile: (data) => {
        const { user, users } = get();
        if (!user) return;
        const next = { ...user, ...data };
        set({
          user: next,
          users: users.map(u => (u.id === user.id ? { ...u, ...data } : u)),
        });
      },
    }),
    {
      name: 'ketcau-pro-auth',
      partialize: (s) => ({
        user: s.authMode === 'local' ? s.user : null,
        users: s.users,
      }),
    }
  )
);
