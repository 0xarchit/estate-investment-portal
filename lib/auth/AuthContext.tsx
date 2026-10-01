'use client';

/**
 * P5 owns this file.
 * AuthContext — stores token in localStorage['fre_token'],
 * on mount if token → GET /auth/me to rehydrate user.
 * Exposes useAuth() with exact contract from §9.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loginApi, meApi, registerApi, logoutApi } from '../api/auth';
import type { AuthUser, RegisterPayload } from '../api/auth';

const TOKEN_KEY = 'fre_token';

// ── Context shape (exact §9 contract) ─────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helper: attach token to axios instance ─────────────────────────────────

function persistToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate on mount
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    // Fetch current user with the stored token
    meApi()
      .then(({ user: me }) => {
        setUser(me);
      })
      .catch(() => {
        // Token expired / invalid — clear it
        persistToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { token: newToken, user: me } = await loginApi({ email, password });
    persistToken(newToken);
    setToken(newToken);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (data: RegisterPayload): Promise<AuthUser> => {
    const { user: created } = await registerApi(data);
    // Auto-login after registration
    const { token: newToken, user: me } = await loginApi({
      email: data.email,
      password: data.password,
    });
    persistToken(newToken);
    setToken(newToken);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget server logout
    logoutApi().catch(() => {});
    persistToken(null);
    setToken(null);
    setUser(null);
    // Clear React Query cache if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qc = (window as any).__queryClient;
      if (qc && typeof qc.clear === 'function') qc.clear();
    } catch {
      // ignore — QueryClient may not be set up yet
    }
    // Navigate to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const { user: me } = await meApi();
    setUser(me);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, refreshUser }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used inside <AuthProvider>');
  }
  return ctx;
}
