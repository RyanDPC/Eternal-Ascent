import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import databaseService from '../services/databaseService';

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
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const checkAuthStatus = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      // Check if the token is still valid by trying to get user data
      const userData = localStorage.getItem('userData');
      const characterData = localStorage.getItem('characterData');
      if (userData) {
        setUser(JSON.parse(userData));
        if (characterData) {
          setCharacter(JSON.parse(characterData));
        }
      } else {
        // Token exists but no user data, clear token
        localStorage.removeItem('authToken');
        localStorage.removeItem('characterData');
        setToken(null);
        setUser(null);
        setCharacter(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('characterData');
      setToken(null);
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
      const data = await databaseService.login(username, password);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      if (data.character) {
        localStorage.setItem('characterData', JSON.stringify(data.character));
        setCharacter(data.character);
      }
      setToken(data.token);
      setUser(data.user);
      // Forcer la mise à jour immédiate
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, user: data.user, character: data.character };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const data = await databaseService.register({ username, email, password });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      if (data.character) {
        localStorage.setItem('characterData', JSON.stringify(data.character));
        setCharacter(data.character);
      }
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user, character: data.character };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('characterData');
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


