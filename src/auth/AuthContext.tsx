"use client";

import { authApi } from "@/api/authApi";
import type { AuthUser, Role } from "@/types/auth";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextValue {
  token: string | null;
  currentUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "mysawit_token";

const defaultRouteByRole = (role: Role) => {
  if (role === "ADMIN") return "/admin";
  if (role === "BURUH") return "/buruh/harvests";
  if (role === "MANDOR") return "/mandor/harvests";
  return "/dashboard";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }
      setToken(stored);
      authApi
        .me(stored)
        .then(setCurrentUser)
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!token) return;
    const me = await authApi.me(token);
    setCurrentUser(me);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.signIn(email, password);
      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      const me = await authApi.me(response.token);
      setCurrentUser(me);
      router.push(defaultRouteByRole(me.role));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch {
      // ignore signout failure on local stateless auth
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
    if (pathname !== "/login") {
      router.push("/login");
    }
  }, [pathname, router]);

  const hasRole = useCallback((roles: Role[]) => !!currentUser && roles.includes(currentUser.role), [currentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ token, currentUser, loading, error, login, logout, refreshCurrentUser, hasRole }),
    [token, currentUser, loading, error, login, logout, refreshCurrentUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
