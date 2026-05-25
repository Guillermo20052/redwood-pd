'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useProgressContext } from './Providers';

function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

type Props = {
  itemKey: string;
  youtubeUrl: string | null | undefined;
  /** Level used to derive `allowScrub` (b → free, i/a → anti-scrub enforced). */
  level: 'b' | 'i' | 'a';
  /** When true, video was verified previously — full seeking, no watch gate. */
  alreadyVerified?: boolean;
  /** Optional callback fired after a successful submit. */
  onVerified?: () => void;
  disabled?: boolean;
};

// ─── shared YouTube IFrame API loader ────────────────────────────────────────
// One module-level promise so concurrent VideoPlayer mounts share the same
// script load and the same onYouTubeIframeAPIReady handler.
let ytApiPromise: Promise<typeof YT> | null = null;

function loadYouTubeApi(): Promise<typeof YT> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YT API requires a browser'));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<typeof YT>((resolve) => {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      resolve(window.YT);
    };
    if (!document.getElementById('yt-api')) {
      const s = document.createElement('script');
      s.id = 'yt-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(s);
    }
  });
  return ytApiPromise;
}

// Polling cadence for both watch-tracking and anti-scrub enforcement.
const POLL_MS = 250;
// Treat any forward jump larger than this (in seconds) as a deliberate scrub.
// Natural playback advances by ~POLL_MS / 1000 = 0.25s between ticks; we leave
// generous headroom for stutter, buffering catch-up and host machine pauses.
const SCRUB_FORWARD_THRESHOLD_S = 2;
const SCRUB_WARNING_MS = 2500;

export function VideoPlayer({
  itemKey,
  youtubeUrl,
  level,
  alreadyVerified = false,
  onVerified,
  disabled,
}: Props) {
  const { verifyVideo } = useProgressContext();
  const id = youtubeId(youtubeUrl);
  const allowScrub = alreadyVerified || level === 'b';

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  // Furthest playhead position reached during natural playback (seconds).
  const maxWatchedSecondsRef = useRef(0);
  // Previous polling reading (seconds) — used to distinguish playback drift
  // from a deliberate seek.
  const lastPlayheadRef = useRef(0);

  const [watchPct, setWatchPct] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [scrubWarningAt, setScrubWarningAt] = useState(0);

  const flashScrubWarning = useCallback(() => {
    setScrubWarningAt(Date.now());
  }, []);

  useEffect(() => {
    if (!id || disabled) return;
    // First-time path: after successful submit, teardown until unmount (unchanged).
    if (!alreadyVerified && verified) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    const enforceRestrictions = !alreadyVerified && !allowScrub;

    const onScrubDetected = (snapToSeconds: number) => {
      const player = playerRef.current;
      if (!player) return;
      player.seekTo(Math.max(0, snapToSeconds), true);
      lastPlayheadRef.current = snapToSeconds;
      flashScrubWarning();
    };

    const tick = () => {
      const player = playerRef.current;
      if (!player?.getCurrentTime || !player?.getDuration) return;
      const dur = player.getDuration();
      if (!dur || dur <= 0) return; // video unavailable / not loaded
      let cur = player.getCurrentTime();
      const last = lastPlayheadRef.current;
      const maxWatched = maxWatchedSecondsRef.current;

      // Forward seek beyond the furthest legitimately watched point.
      if (cur > maxWatched + SCRUB_FORWARD_THRESHOLD_S) {
        onScrubDetected(maxWatched);
        cur = maxWatched;
      }

      // Update max only on natural (small) forward progression. Backward seeks
      // and "scrub then snap" both end up here without bumping the max.
      const delta = cur - last;
      if (delta > 0 && delta <= SCRUB_FORWARD_THRESHOLD_S && cur > maxWatched) {
        maxWatchedSecondsRef.current = cur;
      }
      lastPlayheadRef.current = cur;

      const pct = Math.min(1, maxWatchedSecondsRef.current / dur);
      setWatchPct((prev) => (Math.abs(prev - pct) > 0.001 ? pct : prev));
    };

    loadYouTubeApi()
      .then((YTNs) => {
        if (cancelled || !containerRef.current || playerRef.current) return;

        const events: YT.PlayerOptions['events'] = {};
        if (enforceRestrictions) {
          events.onStateChange = (e) => {
            if (e.data === YTNs.PlayerState.ENDED) {
              const dur = e.target?.getDuration?.() ?? 0;
              if (dur > 0) {
                maxWatchedSecondsRef.current = dur;
                setWatchPct(1);
              }
            } else if (e.data === YTNs.PlayerState.PLAYING) {
              // Re-evaluate on resume in case the user scrubbed while paused.
              tick();
            }
          };
        }

        playerRef.current = new YTNs.Player(containerRef.current, {
          videoId: id,
          playerVars: { rel: 0, modestbranding: 1 },
          events,
        });

        if (enforceRestrictions) {
          interval = setInterval(tick, POLL_MS);
        }
      })
      .catch(() => {
        // YT API failed to load — UI stays in "Video no disponible" guard above
        // for missing id; for transient failures the user simply can't watch
        // but the rest of the flow (e.g. Saltar video on Level 1) still works.
      });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      const player = playerRef.current;
      if (player?.destroy) {
        try {
          player.destroy();
        } catch {
          // Defensive: destroy on a half-initialised iframe can throw.
        }
      }
      playerRef.current = null;
      maxWatchedSecondsRef.current = 0;
      lastPlayheadRef.current = 0;
    };
  }, [id, disabled, verified, allowScrub, alreadyVerified, flashScrubWarning]);

  // Auto-hide the snap-back warning a few seconds after it last fired.
  useEffect(() => {
    if (!scrubWarningAt) return;
    const t = setTimeout(() => setScrubWarningAt(0), SCRUB_WARNING_MS);
    return () => clearTimeout(t);
  }, [scrubWarningAt]);

  const submit = async () => {
    if (submitting || alreadyVerified) return;
    setSubmitting(true);
    setError('');
    try {
      await verifyVideo(itemKey, watchPct, false);
      setVerified(true);
      onVerified?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return <p className="text-sm text-[var(--gray-500)]">Video no disponible</p>;
  }

  const showWarning = !alreadyVerified && scrubWarningAt > 0;
  const meetsThreshold = watchPct >= 0.8;

  return (
    <div className="video-verify-block">
      {alreadyVerified && (
        <p
          className="mb-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-[var(--green)]"
          role="status"
        >
          Video verificado — puedes rebobinar y saltar libremente
        </p>
      )}

      <div
        ref={containerRef}
        className="aspect-video w-full max-w-lg rounded-lg overflow-hidden bg-black"
      />

      {showWarning && (
        <p
          role="status"
          className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          No puedes adelantar el video en este nivel. Continúa viéndolo desde donde quedaste.
        </p>
      )}

      <div className="mt-2 flex items-center gap-3 flex-wrap">
        {!alreadyVerified && (
          <>
            <span className="text-xs text-[var(--gray-600)]">
              Progreso: {Math.round(watchPct * 100)}% (mín. 80%)
            </span>
            {!verified && !disabled && (
              <button
                type="button"
                className="btn-primary"
                disabled={submitting || !meetsThreshold}
                onClick={submit}
              >
                {submitting ? 'Guardando…' : 'Confirmar video visto'}
              </button>
            )}
            {verified && <span className="text-xs font-bold text-[var(--green)]">Verificado</span>}
          </>
        )}
        {alreadyVerified && (
          <span className="text-xs font-semibold text-[var(--green)]">
            ✓ Video verificado · puedes saltar
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
