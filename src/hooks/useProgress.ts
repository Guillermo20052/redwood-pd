'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/Toast';
import type { CompletionMap } from '@/lib/verification';
import { FILE_NOT_FOUND_ERROR_CODE } from '@/lib/upload-errors';
import { sumVerifiedHours, getDiplomaTier, progressPercent } from '@/lib/progress';
import { fetchDiplomaAwardDates, type DiplomaAwardDates } from '@/lib/diploma-dates';
import { getEarnedTiers, type DiplomaTier } from '@/lib/diplomas';
import { buildProgressState, detectCelebrations } from '@/lib/celebration-detector';
import { runCelebrations } from '@/lib/celebrate';

export function useProgress() {
  const showToast = useToast();
  const [completions, setCompletions] = useState<CompletionMap>({});
  const [profile, setProfile] = useState({
    full_name: '',
    subject: '',
    start_date: '',
    email: '',
    role: 'teacher' as 'teacher' | 'admin',
    welcome_cynthia_read_at: null as string | null,
    welcome_pope_read_at: null as string | null,
    welcome_about_read_at: null as string | null,
    tour_completed_at: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [diplomaAwardDates, setDiplomaAwardDates] = useState<DiplomaAwardDates>({});
  const [celebrationTier, setCelebrationTier] = useState<DiplomaTier | null>(null);
  const completionsRef = useRef<CompletionMap>({});
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    completionsRef.current = completions;
  }, [completions]);

  useEffect(() => {
    if (!loading) hasLoadedRef.current = true;
  }, [loading]);

  const maybeCelebrate = useCallback(
    (prev: CompletionMap, next: CompletionMap) => {
      if (!hasLoadedRef.current) return;
      const events = detectCelebrations(buildProgressState(prev), buildProgressState(next));
      void runCelebrations(events, showToast);
    },
    [showToast]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [progressRes, dates] = await Promise.all([
        fetch('/api/progress'),
        fetchDiplomaAwardDates(),
      ]);
      setDiplomaAwardDates(dates);
      if (progressRes.ok) {
        const data = await progressRes.json();
        setCompletions(data.completions || {});
        if (data.profile) {
          setProfile({
            full_name: data.profile.full_name || '',
            subject: data.profile.subject || '',
            start_date: data.profile.start_date || '',
            email: data.profile.email || '',
            role: (data.profile.role as 'teacher' | 'admin') || 'teacher',
            welcome_cynthia_read_at: data.profile.welcome_cynthia_read_at ?? null,
            welcome_pope_read_at: data.profile.welcome_pope_read_at ?? null,
            welcome_about_read_at: data.profile.welcome_about_read_at ?? null,
            tour_completed_at: data.profile.tour_completed_at ?? null,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [load]);

  const updateProfile = async (patch: Partial<Omit<typeof profile, 'role'>>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    const { role: _role, ...profilePatch } = next;
    void _role;
    await fetch('/api/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profilePatch }),
    });
  };

  const refreshCompletions = useCallback(async () => {
    const prev = completionsRef.current;
    const res = await fetch('/api/progress');
    if (res.ok) {
      const data = await res.json();
      const next = (data.completions || {}) as CompletionMap;
      setCompletions(next);
      maybeCelebrate(prev, next);
    }
  }, [maybeCelebrate]);

  const applyVerifyResponse = useCallback(async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Error al verificar');
    const prev = completionsRef.current;
    if (data?.completions) {
      const next = data.completions as CompletionMap;
      setCompletions(next);
      maybeCelebrate(prev, next);
    } else if (data?.ok !== false) {
      // Only refresh when the server actually mutated state. A grading response
      // with `ok: false` is a valid 200 but did not change completions.
      await refreshCompletions();
    }
    return data;
  }, [maybeCelebrate, refreshCompletions]);

  const verifyVideo = useCallback(
    async (itemKey: string, watchPct: number, skipped: boolean = false) => {
      const res = await fetch('/api/verify/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey, watchPct, skipped }),
      });
      return applyVerifyResponse(res);
    },
    [applyVerifyResponse]
  );

  const verifyTask = useCallback(
    async (
      itemKey: string,
      payload: {
        evidenceText?: string;
        storageKey?: string;
        fileUrl?: string;
        inputType?: 'text' | 'screenshot' | 'document';
      },
      partner?: { user_id: string | null; name: string } | null,
      options?: { isClientRetry?: boolean; onRetrying?: () => void }
    ) => {
      const res = await fetch('/api/verify/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemKey,
          evidenceText: payload.evidenceText ?? '',
          key: payload.storageKey,
          fileUrl: payload.fileUrl,
          inputType: payload.inputType ?? 'text',
          ...(partner ? { partner } : {}),
        }),
      });

      if (
        !res.ok &&
        res.status === 400 &&
        payload.storageKey &&
        !options?.isClientRetry
      ) {
        const errData = await res.clone().json().catch(() => ({}));
        if (errData?.code === FILE_NOT_FOUND_ERROR_CODE) {
          options?.onRetrying?.();
          await new Promise((r) => setTimeout(r, 1000));
          return verifyTask(itemKey, payload, partner, {
            isClientRetry: true,
            onRetrying: options?.onRetrying,
          });
        }
      }

      return applyVerifyResponse(res);
    },
    [applyVerifyResponse]
  );

  const verifyReflection = useCallback(async (itemKey: string, reflectionText: string) => {
    const res = await fetch('/api/verify/reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemKey, reflectionText }),
    });
    return applyVerifyResponse(res);
  }, [applyVerifyResponse]);

  const adminSkipItem = useCallback(
    async (itemKey: string, kind: 'video' | 'task' | 'reflection') => {
      let res: Response;
      if (kind === 'video') {
        res = await fetch('/api/verify/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemKey, watchPct: 1, skipped: true, adminSkip: true }),
        });
      } else if (kind === 'task') {
        res = await fetch('/api/verify/task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemKey, adminSkip: true }),
        });
      } else {
        res = await fetch('/api/verify/reflection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemKey, adminSkip: true }),
        });
      }
      return applyVerifyResponse(res);
    },
    [applyVerifyResponse]
  );

  const resetItem = useCallback(
    async (itemKey: string) => {
      const res = await fetch('/api/admin/reset-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey }),
      });
      return applyVerifyResponse(res);
    },
    [applyVerifyResponse]
  );

  /**
   * @deprecated Use adminSkipItem — kept for any legacy callers.
   */
  const markAdminSkipped = useCallback(
    async (itemKey: string) => {
      await adminSkipItem(itemKey, 'task');
    },
    [adminSkipItem]
  );

  const totalHours = sumVerifiedHours(completions);
  const percent = progressPercent(totalHours);
  const diplomaTier = getDiplomaTier(totalHours, completions);
  const earnedDiplomas: DiplomaTier[] = getEarnedTiers(totalHours, completions);

  // Fire-and-forget: any time the earned-tiers set changes, ask the server to
  // record events for tiers not yet logged. Recording is idempotent server-side.
  // Effect key is a string so we don't re-run on every render (the
  // `earnedDiplomas` array is reconstructed each call).
  const earnedKey = earnedDiplomas.join(',');
  const postedRef = useRef<Set<DiplomaTier>>(new Set());
  useEffect(() => {
    if (loading) return;
    if (earnedDiplomas.length === 0) return;
    const toPost = earnedDiplomas.filter((t) => !postedRef.current.has(t));
    if (toPost.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        // Sync with whatever the server already has so we don't spam POSTs.
        const res = await fetch('/api/diplomas');
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { earned?: DiplomaTier[] };
          (data.earned ?? []).forEach((t) => postedRef.current.add(t));
        }
        for (const tier of toPost) {
          if (postedRef.current.has(tier)) continue;
          postedRef.current.add(tier); // optimistic mark — POST is idempotent
          fetch('/api/diplomas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier }),
          })
            .then(async (postRes) => {
              if (!postRes.ok) return;
              const postData = (await postRes.json()) as {
                created?: boolean;
                tier?: DiplomaTier;
              };
              if (postData.created && postData.tier) {
                const earnedAt = new Date();
                setDiplomaAwardDates((prev) => ({
                  ...prev,
                  [postData.tier!]: earnedAt,
                }));
                // Brief delay so confetti from detectCelebrations leads the modal.
                window.setTimeout(() => {
                  setCelebrationTier(postData.tier!);
                }, 900);
              }
            })
            .catch(() => {
              // Silently swallow — event log is nice-to-have, not critical.
            });
        }
      } catch {
        // Network failure — try again next render.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnedKey, loading]);

  const dismissCelebration = useCallback(() => {
    setCelebrationTier(null);
  }, []);

  return {
    completions,
    profile,
    loading,
    updateProfile,
    reload: load,
    refreshCompletions,
    verifyVideo,
    verifyTask,
    verifyReflection,
    adminSkipItem,
    resetItem,
    markAdminSkipped,
    totalHours,
    percent,
    diplomaTier,
    earnedDiplomas,
    diplomaAwardDates,
    celebrationTier,
    dismissCelebration,
  };
}
