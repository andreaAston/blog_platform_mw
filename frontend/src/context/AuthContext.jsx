import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get())); // only "loading" if there is a token to check

  const logout = useCallback(() => {
    tokenStore.clear(); // JWTs are stateless: logging out = forgetting the token
    setUser(null);
  }, []);

  // On first load, ask the API who the stored token belongs to.
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // api.js fires this when the server says our token is no longer valid.
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const authenticate = useCallback(async (path, body) => {
    const data = await api.post(path, body);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
      login: (email, password) => authenticate('/auth/login', { email, password }),
      register: (fields) => authenticate('/auth/register', fields),
    }),
    [user, loading, logout, authenticate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook so components write useAuth() instead of useContext(AuthContext).
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
