import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient, { tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setLoading(false);
      return;
    }
    try {
      const me = await apiClient.me();
      setUser(me);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const data = await apiClient.login({ email, password });
    tokenStore.set(data.access_token, data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    await apiClient.register(payload);
    return login(payload.email, payload.password);
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      /* token likely already invalid — clear locally regardless */
    }
    tokenStore.clear();
    setUser(null);
  };

  const refreshProfile = async () => {
    const me = await apiClient.getProfile();
    setUser(me);
    return me;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
