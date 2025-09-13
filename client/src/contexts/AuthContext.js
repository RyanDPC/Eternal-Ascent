import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('cookie');

  const checkAuthStatus = useCallback(async () => {
    try {
      // Hydrater depuis l'API (cookies httpOnly envoyés automatiquement)
      const me = await api.getDashboardData();
      if (me && me.character) {
        setUser({ id: me.character.user_id, username: me.character.username, email: me.character.email });
        setCharacter(me.character);
        return;
      }
      // fallback profil simple
      const prof = await api.getMe().catch(() => null);
      if (prof && prof.user) {
        setUser(prof.user);
        setCharacter(prof.character || null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      // Verify token and get user data
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token, checkAuthStatus]);

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      setUser(data.user);
      setCharacter(data.character);
      // token géré par cookie httpOnly, pas de localStorage
      return { success: true, user: data.user, character: data.character };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const data = await api.register({ username, email, password });
      setUser(data.user);
      setCharacter(data.character);
      return { success: true, user: data.user, character: data.character };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const logout = async () => {
    try { await api.authenticatedRequest('/auth/logout', { method: 'POST' }); } catch (_) {}
    setToken(null);
    setUser(null);
    setCharacter(null);
  };

  const value = {
    user,
    character,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    checkAuthStatus,
    // Ajout de propriétés utiles
    isLoggedIn: !!token,
    hasUser: !!user,
    hasCharacter: !!character
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


