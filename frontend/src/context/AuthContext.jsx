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
    localStorage.removeItem('user');
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
          localStorage.setItem('user', JSON.stringify(userData));
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
    localStorage.setItem('user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return { ...data, user: nextUser };
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    const { token: nextToken, user: nextUser } = data;
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return data;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password });
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    const { token: nextToken, user: nextUser } = data;
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.put('/auth/profile', payload);
    const nextUser = data?.user ?? data;
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
    return nextUser;
  }, []);

  const updateProfileImage = useCallback(async (formData) => {
    const { data } = await api.put('/auth/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const nextUser = data?.user ?? data;
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
    return nextUser;
  }, []);

  const removeProfileImage = useCallback(async () => {
    const { data } = await api.delete('/auth/profile-image');
    const nextUser = data?.user ?? data;
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
    return nextUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      verifyOtp,
      forgotPassword,
      resetPassword,
      register,
      logout,
      updateProfile,
      updateProfileImage,
      removeProfileImage,
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, loading, login, verifyOtp, forgotPassword, resetPassword, register, logout, updateProfile, updateProfileImage, removeProfileImage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
