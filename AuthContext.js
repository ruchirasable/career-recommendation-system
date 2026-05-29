import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (!token) { setLoading(false); return; }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api.get('/api/auth/me')
      .then(res => { if (res.data.success) setUser(res.data.user); })
      .catch(() => { localStorage.removeItem('cc_token'); delete api.defaults.headers.common['Authorization']; })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('cc_token', res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
    }
    return res.data;
  }, []);

  const signup = useCallback(async (formData) => {
    const res = await api.post('/api/auth/signup', formData);
    if (res.data.success) {
      localStorage.setItem('cc_token', res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
    }
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    // so the user's own data is available on next login. They are never shared
    // across users because each key is namespaced by userId.
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await api.put('/api/auth/profile', data);
    if (res.data.success) setUser(res.data.user);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
