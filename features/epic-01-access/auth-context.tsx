"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "@/lib/api/authApi";
import { readStoredAuth, writeStoredAuth } from "@/lib/api/token-store";
import type { AuthUser } from "@/lib/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(stored.user);
      setAccessToken(stored.accessToken);
      setStatus("authenticated");
    } else {
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setUser(result.user);
    setAccessToken(result.accessToken);
    setStatus("authenticated");
    writeStoredAuth({ user: result.user, accessToken: result.accessToken });
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
    writeStoredAuth(null);
  }, []);

  const value = useMemo(
    () => ({ status, user, accessToken, login, logout }),
    [status, user, accessToken, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
