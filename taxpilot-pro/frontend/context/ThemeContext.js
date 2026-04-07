import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const lightTheme = {
  dark: false,
  colors: {
    primary: '#3498db',
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#2c3e50',
    textSecondary: '#7f8c8d',
    border: '#ecf0f1',
    notification: '#e74c3c',
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    income: '#3498db',
    tax: '#e74c3c',
    savings: '#27ae60',
  },
};

export const darkTheme = {
  dark: true,
  colors: {
    primary: '#3498db',
    background: '#1a1a2e',
    card: '#16213e',
    text: '#ffffff',
    textSecondary: '#bdc3c7',
    border: '#2c3e50',
    notification: '#e74c3c',
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    income: '#5dade2',
    tax: '#e57373',
    savings: '#66bb6a',
  },
};

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMode, setThemeMode] = useState('system');
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    loadThemePreference();
    
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      loadThemePreference();
    });

    return () => subscription.remove();
  }, [systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      setThemeMode(savedMode || 'system');

      if (savedMode === 'system') {
        const isSystemDark = systemColorScheme === 'dark';
        setIsDarkMode(isSystemDark);
        setTheme(isSystemDark ? darkTheme : lightTheme);
      } else if (savedMode === 'dark') {
        setIsDarkMode(true);
        setTheme(darkTheme);
      } else {
        setIsDarkMode(false);
        setTheme(lightTheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const setThemePreference = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);

      if (mode === 'system') {
        const isSystemDark = systemColorScheme === 'dark';
        setIsDarkMode(isSystemDark);
        setTheme(isSystemDark ? darkTheme : lightTheme);
      } else if (mode === 'dark') {
        setIsDarkMode(true);
        setTheme(darkTheme);
      } else {
        setIsDarkMode(false);
        setTheme(lightTheme);
      }
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    if (themeMode === 'system') {
      setThemePreference('dark');
    } else if (themeMode === 'dark') {
      setThemePreference('light');
    } else {
      setThemePreference('system');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, themeMode, setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
