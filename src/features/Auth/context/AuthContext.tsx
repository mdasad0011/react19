import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { useSecureStorage } from '@/shared/hooks/useStorage';
import { useToast } from '@/shared/contexts/ToastContext';
import {
  apiRequest,
  setStoredApiTokens,
  subscribeToApiLogs,
  subscribeToTokenUpdates,
  setSimulationExpiryTimes,
  ApiLog
} from '../api/authApiClient';
import { User, decodeJwt } from '../api/mockAuthEngine';

interface SimulationTimes {
  access: number;
  refresh: number;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiLogs: ApiLog[];
  simulationTimes: SimulationTimes;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: {
    name?: string;
    bio?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  clearLogs: () => void;
  setSimulationTimes: (accessSeconds: number, refreshSeconds: number) => void;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [simulationTimes, setSimulationTimesState] = useState<SimulationTimes>({
    access: 60, // default 1 min
    refresh: 300 // default 5 min
  });

  const { notify } = useToast();

  // Load tokens securely using the custom hook from the template
  const [
    secAccessToken,
    setSecAccessToken,
    removeSecAccessToken,
    accessLoading
  ] = useSecureStorage('auth_access_token', '');
  const [
    secRefreshToken,
    setSecRefreshToken,
    removeSecRefreshToken,
    refreshLoading
  ] = useSecureStorage('auth_refresh_token', '');

  const [isLoading, setIsLoading] = useState(true);

  // Sync tokenStorage in the API module whenever secure storage has finished reading initially
  const initialSyncDone = useRef(false);

  // Expose token setting functions as refs to avoid dependency loops in callbacks
  const tokenSettersRef = useRef({
    setSecAccessToken,
    setSecRefreshToken,
    removeSecAccessToken,
    removeSecRefreshToken
  });

  useEffect(() => {
    tokenSettersRef.current = {
      setSecAccessToken,
      setSecRefreshToken,
      removeSecAccessToken,
      removeSecRefreshToken
    };
  }, [
    setSecAccessToken,
    setSecRefreshToken,
    removeSecAccessToken,
    removeSecRefreshToken
  ]);

  // Handle Initial Bootup Session Recovery
  useEffect(() => {
    const initAuth = async () => {
      // Wait until useSecureStorage has finished loading keys from localStorage
      if (accessLoading || refreshLoading) return;
      if (initialSyncDone.current) return;

      initialSyncDone.current = true;

      if (secAccessToken && secRefreshToken) {
        // Sync tokens to Api client
        setStoredApiTokens(secAccessToken, secRefreshToken);

        try {
          // Verify current access token content
          const decoded = decodeJwt(secAccessToken);
          if (decoded) {
            // Load fresh profile details
            const res = await apiRequest('GET', '/auth/me');
            setUser(res.user);
          } else {
            // Expired or invalid, try silent refresh right away
            const refreshRes = await apiRequest('POST', '/auth/refresh', {
              refreshToken: secRefreshToken
            });
            await tokenSettersRef.current.setSecAccessToken(
              refreshRes.accessToken
            );
            await tokenSettersRef.current.setSecRefreshToken(
              refreshRes.refreshToken
            );
            setStoredApiTokens(refreshRes.accessToken, refreshRes.refreshToken);

            const meRes = await apiRequest('GET', '/auth/me');
            setUser(meRes.user);
          }
        } catch (err) {
          console.error('Initial token validation failed:', err);
          // Token is dead, wipe credentials
          setStoredApiTokens(null, null);
          removeSecAccessToken();
          removeSecRefreshToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    void initAuth();
  }, [
    accessLoading,
    refreshLoading,
    secAccessToken,
    secRefreshToken,
    removeSecAccessToken,
    removeSecRefreshToken
  ]);

  // Subscribe to Silent Token Refreshes inside HTTP client
  useEffect(() => {
    const unsubscribe = subscribeToTokenUpdates((newAccess, newRefresh) => {
      if (newAccess && newRefresh) {
        // Silent refresh obtained new tokens, save to secure storage
        void tokenSettersRef.current.setSecAccessToken(newAccess);
        void tokenSettersRef.current.setSecRefreshToken(newRefresh);

        // Update user state if not loaded
        const decoded = decodeJwt(newAccess);
        if (decoded && !user) {
          apiRequest('GET', '/auth/me')
            .then(res => setUser(res.user))
            .catch(() => {});
        }
      } else {
        // Invalid session (refresh expired) - logout
        setStoredApiTokens(null, null);
        tokenSettersRef.current.removeSecAccessToken();
        tokenSettersRef.current.removeSecRefreshToken();
        setUser(null);
        notify('error', 'Session expired. Please log in again.');
      }
    });

    return unsubscribe;
  }, [user, notify]);

  // Subscribe to API request logs
  useEffect(() => {
    const unsubscribe = subscribeToApiLogs(log => {
      setApiLogs(prev => [log, ...prev].slice(0, 100)); // Cap logs at 100 entries
    });

    return unsubscribe;
  }, []);

  // Update backend simulation parameters
  const setSimulationTimes = useCallback(
    (accessSeconds: number, refreshSeconds: number) => {
      setSimulationTimesState({
        access: accessSeconds,
        refresh: refreshSeconds
      });
      setSimulationExpiryTimes(accessSeconds, refreshSeconds);
    },
    []
  );

  // Actions
  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const res = await apiRequest('POST', '/auth/login', {
          email,
          password
        });

        // Save in state & memory client
        setUser(res.user);
        setStoredApiTokens(res.accessToken, res.refreshToken);

        // Save in Secure Storage (async)
        await tokenSettersRef.current.setSecAccessToken(res.accessToken);
        await tokenSettersRef.current.setSecRefreshToken(res.refreshToken);

        notify('success', `Welcome back, ${res.user.name}!`);
      } catch (err: any) {
        notify(
          'error',
          err.message || 'Login failed. Please check credentials.'
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [notify]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const res = await apiRequest('POST', '/auth/register', {
          name,
          email,
          password
        });

        setUser(res.user);
        setStoredApiTokens(res.accessToken, res.refreshToken);

        await tokenSettersRef.current.setSecAccessToken(res.accessToken);
        await tokenSettersRef.current.setSecRefreshToken(res.refreshToken);

        notify('success', 'Account registered successfully!');
      } catch (err: any) {
        notify('error', err.message || 'Registration failed.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [notify]
  );

  const logout = useCallback(() => {
    // Clear State
    setUser(null);
    setStoredApiTokens(null, null);

    // Clear Secure Storage
    tokenSettersRef.current.removeSecAccessToken();
    tokenSettersRef.current.removeSecRefreshToken();

    notify('info', 'Logged out successfully.');
  }, [notify]);

  const updateProfile = useCallback(
    async (updates: { name?: string; bio?: string; avatarUrl?: string }) => {
      try {
        const res = await apiRequest('PUT', '/auth/update-profile', updates);
        setUser(res.user);
        notify('success', 'Profile updated successfully!');
      } catch (err: any) {
        notify('error', err.message || 'Failed to update profile.');
        throw err;
      }
    },
    [notify]
  );

  const refreshSession = useCallback(async () => {
    if (!secRefreshToken) {
      notify('error', 'No refresh token available');
      return;
    }
    try {
      const res = await apiRequest('POST', '/auth/refresh', {
        refreshToken: secRefreshToken
      });
      setStoredApiTokens(res.accessToken, res.refreshToken);
      await tokenSettersRef.current.setSecAccessToken(res.accessToken);
      await tokenSettersRef.current.setSecRefreshToken(res.refreshToken);
      notify('success', 'Session tokens manual refresh complete!');
    } catch (err: any) {
      notify('error', err.message || 'Failed to refresh tokens.');
    }
  }, [secRefreshToken, notify]);

  const clearLogs = useCallback(() => {
    setApiLogs([]);
  }, []);

  const value: AuthContextType = {
    user,
    accessToken: secAccessToken || null,
    refreshToken: secRefreshToken || null,
    isAuthenticated: !!user,
    isLoading: isLoading || accessLoading || refreshLoading,
    apiLogs,
    simulationTimes,
    login,
    register,
    logout,
    updateProfile,
    clearLogs,
    setSimulationTimes,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
