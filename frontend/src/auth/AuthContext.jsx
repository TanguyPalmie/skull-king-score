import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (email, pseudo, password) => {
    const data = await api.register(email, pseudo, password);
    // L'utilisateur n'est PAS connecte apres register (doit verifier d'abord)
    return data;
  }, []);

  const verify = useCallback(async (email, code) => {
    const data = await api.verify(email, code);
    setUser(data.user);
    return data;
  }, []);

  const resendCode = useCallback(async (email) => {
    return api.resendCode(email);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, verify, resendCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
