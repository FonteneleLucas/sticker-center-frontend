import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, userToken, type AuthUser } from './api';

const CACHE_KEY = 'stickerhub:user-cache';
const CACHE_TTL_MS = 60 * 1000; // 60 segundos de validade do cache

interface CachedUser {
  user: AuthUser;
  timestamp: number;
}

function getCachedUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const item: CachedUser = JSON.parse(raw);
    if (Date.now() - item.timestamp < CACHE_TTL_MS) {
      return item.user;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedUser(u: AuthUser | null) {
  try {
    if (!u) {
      sessionStorage.removeItem(CACHE_KEY);
    } else {
      const item: CachedUser = { user: u, timestamp: Date.now() };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(item));
    }
  } catch {
    /* ignore */
  }
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name?: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: (forceSync?: boolean) => Promise<AuthUser | null>;
  setUser: (u: AuthUser | null) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

let inFlightSync: Promise<AuthUser | null> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    return userToken.get() ? getCachedUser() : null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return Boolean(userToken.get() && !getCachedUser());
  });

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    setCachedUser(u);
  }, []);

  const refresh = useCallback(
    async (forceSync = false): Promise<AuthUser | null> => {
      if (!userToken.get()) {
        setUser(null);
        return null;
      }

      // Se não for forçado e houver cache válido, retorna o cache
      if (!forceSync) {
        const cached = getCachedUser();
        if (cached) {
          setUserState(cached);
          return cached;
        }
      }

      // Se já houver um sync em andamento, reaproveita a mesma promessa para evitar requisições duplicadas
      if (inFlightSync) {
        return inFlightSync;
      }

      inFlightSync = (async () => {
        try {
          // Chama o endpoint de sync para confirmar o status da assinatura diretamente no Mercado Pago
          const synced = await api.billing.sync();
          setUser(synced);
          return synced;
        } catch {
          // Fallback para /auth/me caso a API externa do MP demore ou offline
          try {
            const me = await api.auth.me();
            setUser(me);
            return me;
          } catch {
            userToken.clear();
            setUser(null);
            return null;
          }
        } finally {
          inFlightSync = null;
        }
      })();

      return inFlightSync;
    },
    [setUser],
  );

  useEffect(() => {
    if (userToken.get()) {
      const cached = getCachedUser();
      // Se não há cache OU se o usuário ainda não está com status premium ativo:
      // Executa o sync com o Mercado Pago para reconhecer pagamentos feitos fora do site
      if (!cached || !cached.is_premium) {
        setLoading(!cached);
        refresh(true).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
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
    [user, loading, refresh, setUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
