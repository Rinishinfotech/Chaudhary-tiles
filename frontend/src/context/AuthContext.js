import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ct_active_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = (u) => {
    setUser(u);
    localStorage.setItem('ct_active_user', JSON.stringify(u));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('ct_active_user');
  };

  const isAdmin = user && (user.role === 'Super Admin' || user.role === 'Admin');

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
