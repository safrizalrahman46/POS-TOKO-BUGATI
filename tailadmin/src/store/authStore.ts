import { create } from 'zustand';
import type { User } from '../types/auth';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  const perms = parsePermissions(user.permissions, user.role);
  return perms.includes(permission);
}

function parsePermissions(permissions?: string, role?: string): string[] {
  if (permissions) {
    try {
      const p = JSON.parse(permissions);
      if (Array.isArray(p) && p.length > 0) return p;
    } catch {}
  }
  if (role === 'admin') return ['dashboard', 'products', 'categories', 'vouchers', 'auto_discounts', 'reports', 'promos', 'pos', 'mirror', 'customers', 'settings', 'users'];
  if (role === 'kasir') return ['pos', 'mirror'];
  return [];
}

export function getUserPermissions(user: User | null): string[] {
  if (!user) return [];
  if (user.role === 'superadmin') {
    return ['dashboard', 'products', 'categories', 'vouchers', 'auto_discounts', 'reports', 'users', 'promos', 'pos', 'mirror', 'customers', 'settings'];
  }
  return parsePermissions(user.permissions, user.role);
}

function restoreUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      id: data.user_id,
      username: data.username,
      full_name: data.full_name,
      role: data.role as 'superadmin' | 'admin' | 'kasir',
      permissions: data.permissions,
      photo: data.photo || '',
      is_active: true,
      created_at: '',
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: restoreUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (username, password) => {
    const result = await authService.login({ username, password });
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result));
    set({
      token: result.token,
      isAuthenticated: true,
      user: {
        id: result.user_id,
        username: result.username,
        full_name: result.full_name,
        role: result.role as 'superadmin' | 'admin' | 'kasir',
        permissions: result.permissions,
        photo: result.photo || '',
        is_active: true,
        created_at: '',
      },
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
