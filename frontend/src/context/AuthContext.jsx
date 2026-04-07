import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api, { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onForcedLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:logout', onForcedLogout);
    return () => window.removeEventListener('auth:logout', onForcedLogout);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (!cancelled) {
          const userData = data?.user ?? data;
          setUser(userData);
          setToken(stored);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token: nextToken, user: nextUser } = data;
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return { ...data, user: nextUser };
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    const { token: nextToken, user: nextUser } = data;
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.put('/auth/profile', payload);
<<<<<<< HEAD
    const nextUser = data?.user ?? data;
    setUser(nextUser);
    return nextUser;
  }, []);

  const updateProfileImage = useCallback(async (formData) => {
    const { data } = await api.put('/auth/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const nextUser = data?.user ?? data;
    setUser(nextUser);
    return nextUser;
=======
    setUser(data);
    return data;
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateProfile,
<<<<<<< HEAD
      updateProfileImage,
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, loading, login, register, logout, updateProfile, updateProfileImage]
=======
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, loading, login, register, logout, updateProfile]
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook is intentionally co-located with AuthProvider for this module.
// eslint-disable-next-line react-refresh/only-export-components -- useAuth must live with provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
