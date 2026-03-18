'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { loadState, saveState } from '@/lib/storage';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  hydrated: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [hydrated, setHydrated] = useState(false);
  const initialLoadRef = useRef(true);

  // Hydrate theme from localStorage after mount
  useEffect(() => {
    const saved = loadState();
    const savedTheme = saved?.theme ?? 'light';
    setTheme(savedTheme);
    setHydrated(true);
  }, []);

  // Sync dark class to <html> element and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Don't persist during initial hydration (CardContext will do it)
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Debounced persistence
    const timeout = setTimeout(() => {
      try {
        const saved = loadState();
        saveState({
          ...(saved ?? {
            version: 2,
            settings: { words: { cardsPerSession: 10 }, sentences: { cardsPerSession: 5 } },
            cardProgress: {},
          }),
          theme,
        });
      } catch {
        // Fail silently
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
