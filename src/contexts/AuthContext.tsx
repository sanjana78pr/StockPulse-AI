/**
 * AuthContext — global authentication state.
 *
 * Provides: token, user, isAuthenticated, isLoading, login, logout.
 *
 * Startup flow:
 *  1. Read sp_token from localStorage
 *  2. If exists → validate by calling GET /auth/me → populate user
 *  3. If /me fails (401 / network) → clear token, user = null
 *  4. Set isLoading = false
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { getToken, setToken, clearToken } from '../lib/api';
import * as authService from '../services/authService';
import type { UserResponse } from '../types/api';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
export interface AuthContextValue {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: validate existing token
  useEffect(() => {
    const stored = getToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }

    authService
      .getMe()
      .then((me) => {
        setUser(me);
        setTokenState(stored);
      })
      .catch(() => {
        // Token is invalid or expired — clean up silently
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Login action
  const login = useCallback(async (email: string, password: string) => {
    const tokenData = await authService.login(email, password);
    setToken(tokenData.access_token);
    setTokenState(tokenData.access_token);

    // Populate user immediately after login
    const me = await authService.getMe();
    setUser(me);
  }, []);

  // Logout action
  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
