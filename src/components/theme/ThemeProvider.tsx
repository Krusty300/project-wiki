'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { darkMode, setDarkMode } = useUIStore();

  useEffect(() => {
    // Check system preference on first load
    if (typeof window !== 'undefined') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const stored = localStorage.getItem('ui-storage');
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setDarkMode(parsed.state?.darkMode ?? systemDark);
        } catch {
          setDarkMode(systemDark);
        }
      } else {
        setDarkMode(systemDark);
      }
    }
  }, [setDarkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  return <>{children}</>;
}
