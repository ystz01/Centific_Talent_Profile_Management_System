'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';

type ThemeContextType = {
  theme: 'light';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const storageKey = 'centific-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem(storageKey, 'light');
  }, []);

  const value = useMemo<ThemeContextType>(() => ({ theme: 'light' }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
