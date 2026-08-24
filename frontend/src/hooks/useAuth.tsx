'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { CurrentUser } from '@/types/api';

interface AuthContextValue {
  user?: CurrentUser;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(input: { name: string; email: string; password: string; accountType: 'candidate' | 'employer' | 'shop-owner' }): Promise<void>;
  logout(): Promise<void>;
  hasPermission(permission: string): boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | undefined>();
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const data = await api.get<{ user: CurrentUser }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMe(); }, [loadMe]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      await api.post('/auth/login', { email, password }, { skipCsrf: true });
      await loadMe();
    },
    async register(input) {
      await api.post('/auth/register', input, { skipCsrf: true });
    },
    async logout() {
      await api.post('/auth/logout');
      setUser(undefined);
    },
    hasPermission(permission) {
      return Boolean(user?.roles.includes('root-admin') || user?.permissions.includes(permission));
    }
  }), [loadMe, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
