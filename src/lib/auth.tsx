import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, userToken, type AuthUser } from './api';

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name?: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<AuthUser | null>;
  setUser: (u: AuthUser | null) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(userToken.get()));

  const refresh = useCallback(async () => {
    if (!userToken.get()) {
      setUser(null);
      return null;
    }
    try {
      const me = await api.auth.me();
      setUser(me);
      return me;
    } catch {
      userToken.clear();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      setUser,
      refresh,
      login: async (email, password) => {
        const res = await api.auth.login(email, password);
        userToken.set(res.access_token);
        setUser(res.user);
        return res.user;
      },
      register: async (email, password, name) => {
        const res = await api.auth.register(email, password, name);
        userToken.set(res.access_token);
        setUser(res.user);
        return res.user;
      },
      logout: () => {
        userToken.clear();
        setUser(null);
        window.location.reload();
      },
    }),
    [user, loading, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
