import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

interface AuthState {
  user: AuthUser | null;
  users: StoredUser[]; // local account registry (client-side MVP)
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: { name?: string }) => void;
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

      login: async (email, password) => {
        const e = email.trim().toLowerCase();
        if (!e || !password) return { ok: false, error: 'Vui lòng nhập email và mật khẩu' };
        const hash = await hashPassword(password);
        const found = get().users.find(u => u.email === e && u.passwordHash === hash);
        if (!found) return { ok: false, error: 'Email hoặc mật khẩu không đúng' };
        const { passwordHash: _, ...user } = found;
        set({ user });
        return { ok: true };
      },

      register: async (name, email, password) => {
        const e = email.trim().toLowerCase();
        const n = name.trim();
        if (!n || !e || !password) return { ok: false, error: 'Điền đầy đủ thông tin' };
        if (password.length < 6) return { ok: false, error: 'Mật khẩu tối thiểu 6 ký tự' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: 'Email không hợp lệ' };
        if (get().users.some(u => u.email === e)) return { ok: false, error: 'Email đã được đăng ký' };

        const hash = await hashPassword(password);
        const newUser: StoredUser = {
          id: `U${Date.now()}`,
          email: e,
          name: n,
          createdAt: new Date().toISOString(),
          passwordHash: hash,
        };
        const { passwordHash: _, ...user } = newUser;
        set(state => ({
          users: [...state.users, newUser],
          user,
        }));
        return { ok: true };
      },

      logout: () => set({ user: null }),

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
      partialize: (s) => ({ user: s.user, users: s.users }),
    }
  )
);
