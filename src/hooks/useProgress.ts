'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CompletionMap } from '@/lib/verification';
import { sumVerifiedHours, getDiplomaTier, progressPercent } from '@/lib/progress';
import { getEarnedTiers, type DiplomaTier } from '@/lib/diplomas';

export function useProgress() {
  const [completions, setCompletions] = useState<CompletionMap>({});
  const [profile, setProfile] = useState({
    full_name: '',
    subject: '',
    start_date: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/progress');
      if (res.ok) {
        const data = await res.json();
        setCompletions(data.completions || {});
        if (data.profile) {
          setProfile({
            full_name: data.profile.full_name || '',
            subject: data.profile.subject || '',
            start_date: data.profile.start_date || '',
            email: data.profile.email || '',
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

  const updateProfile = async (patch: Partial<typeof profile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    await fetch('/api/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: next }),
    });
  };

  const refreshCompletions = useCallback(async () => {
    const res = await fetch('/api/progress');
    if (res.ok) {
      const data = await res.json();
      setCompletions(data.completions || {});
    }
  }, []);

  const applyVerifyResponse = useCallback(async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Error al verificar');
    if (data?.completions) {
      setCompletions(data.completions);
    } else if (data?.ok !== false) {
      // Only refresh when the server actually mutated state. A grading response
      // with `ok: false` is a valid 200 but did not change completions.
      await refreshCompletions();
    }
    return data;
  }, [refreshCompletions]);

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
        fileUrl?: string;
        inputType?: 'text' | 'screenshot' | 'document';
      },
      partner?: { user_id: string | null; name: string } | null
    ) => {
      const res = await fetch('/api/verify/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemKey,
          evidenceText: payload.evidenceText ?? '',
          fileUrl: payload.fileUrl,
          inputType: payload.inputType ?? 'text',
          ...(partner ? { partner } : {}),
        }),
      });
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

  const totalHours = sumVerifiedHours(completions);
  const percent = progressPercent(totalHours);
  const diplomaTier = getDiplomaTier(totalHours);
  const earnedDiplomas: DiplomaTier[] = getEarnedTiers(totalHours);

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
          }).catch(() => {
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
    totalHours,
    percent,
    diplomaTier,
    earnedDiplomas,
  };
}
