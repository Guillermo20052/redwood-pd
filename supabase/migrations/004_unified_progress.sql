-- 004_unified_progress.sql
-- Unifies the progress data model:
--   1. Drops legacy progress_items table (replaced by item_completions)
--   2. Adds task_score and task_feedback columns to item_completions for AI-graded persistence
--   3. Adds UNIQUE (user_id, tier) on diploma_events for hard idempotency
--   4. Verifies RLS so teachers only read their own rows; admins read all
--
-- IMPORTANT: This file is prepared but NOT executed by application code.
-- Run it manually in the Supabase SQL editor when wiring up Supabase
-- (tracked under Prompt #9).

-- 1. Drop legacy table (only if it exists)
DROP TABLE IF EXISTS public.progress_items CASCADE;

-- 2. Extend item_completions with AI-graded persistence columns
ALTER TABLE public.item_completions
  ADD COLUMN IF NOT EXISTS task_score smallint
    CHECK (task_score IS NULL OR (task_score >= 0 AND task_score <= 100)),
  ADD COLUMN IF NOT EXISTS task_feedback text;

-- 3. Hard idempotency on diploma_events. Application code is already idempotent,
--    but this prevents duplicate awards if a race condition slips through.
--    Wrapped in a DO block so re-running the migration is a no-op.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'diploma_events_user_tier_unique'
      AND conrelid = 'public.diploma_events'::regclass
  ) THEN
    ALTER TABLE public.diploma_events
      ADD CONSTRAINT diploma_events_user_tier_unique
      UNIQUE (user_id, tier);
  END IF;
END $$;

-- 4. Helpful indexes for admin cohort + leaderboard queries
CREATE INDEX IF NOT EXISTS idx_item_completions_user_status
  ON public.item_completions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_item_completions_status_verified_at
  ON public.item_completions (status, verified_at)
  WHERE status = 'verified';

-- 5. RLS verification — item_completions policy was set in 002, but re-assert
--    here so this migration is self-contained for review. Both teachers (their
--    own rows) and admins (all rows) can read; writes follow the same rule.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'item_completions'
      AND policyname = 'item_completions_own'
  ) THEN
    CREATE POLICY item_completions_own ON public.item_completions
      FOR ALL USING (user_id = auth.uid() OR public.is_admin())
      WITH CHECK (user_id = auth.uid() OR public.is_admin());
  END IF;
END $$;
