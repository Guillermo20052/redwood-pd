'use client';

import { createContext, useContext } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { DiplomaModal } from '@/components/DiplomaModal';
import { ToastProvider } from '@/components/Toast';

const ProgressContext = createContext<ReturnType<typeof useProgress> | null>(null);

function ProgressProvidersInner({ children }: { children: React.ReactNode }) {
  const progress = useProgress();
  const celebrationDate =
    progress.celebrationTier != null
      ? progress.diplomaAwardDates[progress.celebrationTier] ?? new Date()
      : new Date();

  return (
    <ProgressContext.Provider value={progress}>
      {children}
      {progress.celebrationTier != null && (
        <DiplomaModal
          tier={progress.celebrationTier}
          teacherName={progress.profile.full_name}
          teacherEmail={progress.profile.email}
          awardedDate={celebrationDate}
          totalHours={progress.totalHours}
          celebrate
          onClose={progress.dismissCelebration}
        />
      )}
    </ProgressContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ProgressProvidersInner>{children}</ProgressProvidersInner>
    </ToastProvider>
  );
}

export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgressContext must be used within Providers');
  return ctx;
}
