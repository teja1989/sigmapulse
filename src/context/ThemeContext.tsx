'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light' | 'terminal';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('sigmapulse_theme') as AppTheme | null;
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'terminal')) {
      setThemeState(saved);
      applyThemeToDom(saved);
    } else {
      applyThemeToDom('dark');
    }
  }, []);

  const applyThemeToDom = (t: AppTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light-theme', 'terminal-theme');

    if (t === 'light') {
      root.classList.add('light-theme');
    } else if (t === 'terminal') {
      root.classList.add('terminal-theme', 'dark');
    } else {
      root.classList.add('dark');
    }
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('sigmapulse_theme', newTheme);
    applyThemeToDom(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'terminal' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
