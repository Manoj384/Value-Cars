'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  apiClient,
  CustomerProfile,
  getCustomerToken,
  getCustomerUser,
  clearCustomerSession,
} from '../services/api';

export type AuthIntent =
  | { action: 'create-password'; token: string }
  | { action: 'reset-password'; token: string }
  | { action: 'open'; token?: undefined };

interface AuthContextValue {
  user: CustomerProfile | null;
  isLoading: boolean;
  /** Minimal avatar-friendly identity used by the navbar. */
  displayName: string;
  authOpen: boolean;
  authIntent: AuthIntent;
  /** Open the auth modal, optionally targeting a create/reset-password token flow. */
  openAuth: (intent?: AuthIntent) => void;
  closeAuth: () => void;
  login: (email: string, password: string) => Promise<CustomerProfile>;
  setUser: (user: CustomerProfile) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>({ action: 'open' });

  // Restore a persisted session on first client render, then validate the token.
  useEffect(() => {
    const persisted = getCustomerUser();
    if (persisted) setUserState(persisted);

    let cancelled = false;
    (async () => {
      const token = getCustomerToken();
      if (token) {
        try {
          const fresh = await apiClient.getCustomerMe(token);
          if (!cancelled) setUserState(fresh);
        } catch {
          // Token is invalid/expired -> drop the stale session.
          if (!cancelled) {
            clearCustomerSession();
            setUserState(null);
          }
        }
      }
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const openAuth = useCallback((intent?: AuthIntent) => {
    setAuthIntent(intent ?? { action: 'open' });
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setAuthIntent({ action: 'open' });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.customerLogin(email, password);
    setUserState(data.user);
    return data.user;
  }, []);

  const setUser = useCallback((u: CustomerProfile) => {
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    apiClient.logoutCustomer();
    setUserState(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = getCustomerToken();
    if (!token) {
      setUserState(null);
      return;
    }
    try {
      const fresh = await apiClient.getCustomerMe(token);
      setUserState(fresh);
    } catch {
      clearCustomerSession();
      setUserState(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      displayName: user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '',
      authOpen,
      authIntent,
      openAuth,
      closeAuth,
      login,
      setUser,
      logout,
      refresh,
    }),
    [user, isLoading, authOpen, authIntent, openAuth, closeAuth, login, setUser, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}

export default AuthContext;