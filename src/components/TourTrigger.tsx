'use client';

import 'shepherd.js/dist/css/shepherd.css';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProgressContext } from '@/components/Providers';
import { createTour, shouldAutoStartTour } from '@/lib/tour';
import type { Tour } from 'shepherd.js';

export function TourTrigger() {
  const { profile, loading, reload } = useProgressContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const startedRef = useRef(false);
  const tourRef = useRef<Tour | null>(null);

  useEffect(() => {
    if (loading) return;
    if (profile.role === 'admin') return;

    const replay = searchParams.get('tour') === 'replay';
    const autoStart = shouldAutoStartTour(profile);

    if (!replay && !autoStart) return;
    if (!replay && startedRef.current) return;
    if (!replay) startedRef.current = true;

    const timer = window.setTimeout(() => {
      if (replay) {
        router.replace('/dashboard', { scroll: false });
      }

      const persistCompletion = !profile.tour_completed_at;

      const tour = createTour({
        onFinish: async () => {
          if (persistCompletion) {
            await fetch('/api/tour/complete', { method: 'POST' });
            await reload();
          }
        },
        onStartNivel1: () => {
          router.push('/nivel/b');
        },
      });

      tourRef.current = tour;
      void tour.start();
    }, 800);

    return () => {
      window.clearTimeout(timer);
      const active = tourRef.current;
      if (active?.isActive()) {
        void active.cancel();
      }
      tourRef.current = null;
    };
  }, [loading, profile, reload, router, searchParams]);

  return null;
}
