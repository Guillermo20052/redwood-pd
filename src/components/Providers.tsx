'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { Diploma3ExitMessage } from '@/components/Diploma3ExitMessage';
import { DiplomaModal } from '@/components/DiplomaModal';
import { ToastProvider } from '@/components/Toast';
import type { DiplomaTier } from '@/lib/diplomas';
import { teacherFirstName } from '@/lib/prakash-nair-resources';

const ProgressContext = createContext<ReturnType<typeof useProgress> | null>(null);

const D3_EXIT_DELAY_MS = 300;

function ProgressProvidersInner({ children }: { children: React.ReactNode }) {
  const progress = useProgress();
  const [showD3Exit, setShowD3Exit] = useState(false);
  const [replayDiplomaTier, setReplayDiplomaTier] = useState<DiplomaTier | null>(null);

  const celebrationDate =
    progress.celebrationTier != null
      ? progress.diplomaAwardDates[progress.celebrationTier] ?? new Date()
      : new Date();

  const handleCelebrationClose = useCallback(() => {
    const tier = progress.celebrationTier;
    progress.dismissCelebration();
    if (tier === 3) {
      window.setTimeout(() => setShowD3Exit(true), D3_EXIT_DELAY_MS);
    }
  }, [progress]);

  const activeDiplomaTier = progress.celebrationTier ?? replayDiplomaTier;

  return (
    <ProgressContext.Provider value={progress}>
      {children}
      {activeDiplomaTier != null && (
        <DiplomaModal
          tier={activeDiplomaTier}
          teacherName={progress.profile.full_name}
          teacherEmail={progress.profile.email}
          awardedDate={
            progress.celebrationTier != null
              ? celebrationDate
              : progress.diplomaAwardDates[activeDiplomaTier] ?? new Date()
          }
          totalHours={progress.totalHours}
          celebrate={progress.celebrationTier != null}
          onClose={() => {
            if (progress.celebrationTier != null) {
              handleCelebrationClose();
            } else {
              setReplayDiplomaTier(null);
            }
          }}
        />
      )}
      {showD3Exit && (
        <Diploma3ExitMessage
          firstName={teacherFirstName(progress.profile.full_name, progress.profile.email)}
          onClose={() => setShowD3Exit(false)}
          onViewDiplomaAgain={() => {
            setShowD3Exit(false);
            setReplayDiplomaTier(3);
          }}
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
