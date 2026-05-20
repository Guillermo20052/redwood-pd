'use client';

import { createContext, useContext } from 'react';
import { useProgress } from '@/hooks/useProgress';

const ProgressContext = createContext<ReturnType<typeof useProgress> | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const progress = useProgress();
  return <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>;
}

export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgressContext must be used within Providers');
  return ctx;
}
