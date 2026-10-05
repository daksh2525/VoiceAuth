import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('voiceauth_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verify and hydrate current user from JWT token
  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('voiceauth_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.getMe();
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        localStorage.removeItem('voiceauth_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Session expired or invalid:', err.message);
      localStorage.removeItem('voiceauth_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Standard Registration
  const register = async (formData) => {
    setAuthError(null);
    try {
      const data = await api.register(formData);
      if (data.token && data.user) {
        localStorage.setItem('voiceauth_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Standard Password Login
  const login = async (credentials) => {
    setAuthError(null);
    try {
      const data = await api.login(credentials);
      if (data.token && data.user) {
        localStorage.setItem('voiceauth_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Voice Biometric Passphrase Login
  const voiceLogin = async (voicePayload) => {
    setAuthError(null);
    try {
      const data = await api.voiceLogin(voicePayload);
      if (data.token && data.user) {
        localStorage.setItem('voiceauth_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('voiceauth_token');
    setToken(null);
    setUser(null);
    setAuthError(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Update Voice Profile / Settings
  const updateVoiceSettings = async (settings) => {
    const data = await api.updateVoiceProfile(settings);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    authError,
    setAuthError,
    register,
    login,
    voiceLogin,
    logout,
    refreshUser: loadUser,
    updateVoiceSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
