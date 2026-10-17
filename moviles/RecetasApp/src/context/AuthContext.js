// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // sesión corrupta, ignorar
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const _persist = async (userData, jwt) => {
    await AsyncStorage.setItem('token', jwt);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  const register = async ({ name, email, password }) => {
    const result = await authApi.register({ name, email, password });
    await _persist(result.user, result.token);
    return result;
  };

  const login = async ({ email, password }) => {
    const result = await authApi.login({ email, password });
    await _persist(result.user, result.token);
    return result;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  // Actualizar datos locales del usuario (usado desde ProfileScreen)
  const updateLocalUser = (updated) => {
    setUser(updated);
    AsyncStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, register, login, logout, updateLocalUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
