import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    role:  localStorage.getItem('role'),
    name:  localStorage.getItem('userName'),
    id:    localStorage.getItem('userId'),
  });

  function login(data) {
    localStorage.setItem('token',    data.token);
    localStorage.setItem('role',     data.role);
    localStorage.setItem('userName', data.name);
    localStorage.setItem('userId',   String(data.id));
    setAuth({ token: data.token, role: data.role, name: data.name, id: String(data.id) });
  }

  function logout() {
    ['token','role','userName','userId'].forEach(k => localStorage.removeItem(k));
    setAuth({ token: null, role: null, name: null, id: null });
  }

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);