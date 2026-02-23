'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { CardProvider } from '@/context/CardContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CardProvider>{children}</CardProvider>
    </ThemeProvider>
  );
}
