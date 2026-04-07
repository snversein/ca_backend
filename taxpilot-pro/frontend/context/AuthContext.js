import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, authService } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.client.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      api.client.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || error.error?.message || 'Login failed. Please check your credentials.';
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      api.client.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.message || error.error?.message || 'Registration failed. Please try again.';
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = async () => {
    console.log('AuthContext: Starting logout');
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      console.log('AuthContext: Storage cleared');
    } catch (e) {
      console.log('AuthContext: Storage clear error', e);
    }
    delete api.client.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    console.log('AuthContext: Logout complete, user is now:', null);
    console.log('AuthContext: token is now:', token);
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/profile', data);
      const updatedUser = response.data.profile || response.data.user;
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Update failed. Please try again.' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
