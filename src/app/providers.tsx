'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { CardProvider } from '@/context/CardContext';
import { useCards, extractProgress } from '@/context/CardContext';
import { useTheme } from '@/context/ThemeContext';
import { saveState } from '@/lib/storage';

// ─── Inner component that persists unified state ────────
function StatePersister({ children }: { children: React.ReactNode }) {
  const { cards, hydrated } = useCards();
  const { theme } = useTheme();

  useEffect(() => {
    if (!hydrated) return; // don't overwrite with empty state before load
    saveState({
      version: 1,
      theme,
      cardProgress: extractProgress(cards),
    });
  }, [cards, theme, hydrated]);

  // Show loading skeleton while hydrating to avoid flash of wrong state
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CardProvider>
        <StatePersister>{children}</StatePersister>
      </CardProvider>
    </ThemeProvider>
  );
}
