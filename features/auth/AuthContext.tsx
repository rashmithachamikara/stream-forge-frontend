'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, AuthState } from '@/features/auth/types';
import { apiClient } from '@/shared/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt';
const REFRESH_TOKEN_EXPIRES_AT_KEY = 'refreshTokenExpiresAt';

const isExpired = (expiresAt: string | null) => {
  if (!expiresAt) {
    return true;
  }

  const expiryTime = new Date(expiresAt).getTime();
  return Number.isNaN(expiryTime) || expiryTime <= Date.now();
};

const clearStoredAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(REFRESH_TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem('user');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    isLoading: true,
    error: null,
  });

  const setSession = useCallback((session: {
    user: User;
    token: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, session.accessTokenExpiresAt);
    localStorage.setItem(REFRESH_TOKEN_EXPIRES_AT_KEY, session.refreshTokenExpiresAt);
    apiClient.setAuthToken(session.token);

    setAuthState({
      user: session.user,
      token: session.token,
      refreshToken: session.refreshToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearAuthState = useCallback((error: string | null = null) => {
    apiClient.clearAuth();
    clearStoredAuth();
    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      isLoading: false,
      error,
    });
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const accessTokenExpiresAt = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
      const refreshTokenExpiresAt = localStorage.getItem(REFRESH_TOKEN_EXPIRES_AT_KEY);

      if (!token || !refreshToken || !accessTokenExpiresAt || !refreshTokenExpiresAt) {
        clearAuthState();
        return;
      }

      if (isExpired(refreshTokenExpiresAt)) {
        clearAuthState();
        return;
      }

      let activeToken = token;
      let activeRefreshToken = refreshToken;
      let activeAccessTokenExpiresAt = accessTokenExpiresAt;
      let activeRefreshTokenExpiresAt = refreshTokenExpiresAt;

      if (isExpired(accessTokenExpiresAt)) {
        const refreshResponse = await apiClient.refreshAuth(refreshToken);

        if (!refreshResponse.success || !refreshResponse.data) {
          clearAuthState();
          return;
        }

        activeToken = refreshResponse.data.token;
        activeRefreshToken = refreshResponse.data.refreshToken;
        activeAccessTokenExpiresAt = refreshResponse.data.accessTokenExpiresAt;
        activeRefreshTokenExpiresAt = refreshResponse.data.refreshTokenExpiresAt;
      } else {
        apiClient.setAuthToken(token);
      }

      const userResponse = await apiClient.getCurrentUser();

      if (userResponse.success && userResponse.data) {
        setSession({
          user: userResponse.data,
          token: activeToken,
          refreshToken: activeRefreshToken,
          accessTokenExpiresAt: activeAccessTokenExpiresAt,
          refreshTokenExpiresAt: activeRefreshTokenExpiresAt,
        });
        return;
      }

      const refreshResponse = await apiClient.refreshAuth(activeRefreshToken);

      if (refreshResponse.success && refreshResponse.data) {
        const retryUserResponse = await apiClient.getCurrentUser();

        if (retryUserResponse.success && retryUserResponse.data) {
          setSession({
            ...refreshResponse.data,
            user: retryUserResponse.data,
          });
          return;
        }
      }

      clearAuthState();
    };

    initializeAuth();
  }, [clearAuthState, setSession]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.data) {
        setSession(response.data);
        return true;
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Login failed',
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [setSession]);

  const logout = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAuthenticated: !!authState.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
