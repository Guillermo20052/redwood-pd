-- 005_evaluations.sql
-- Final program evaluation responses (one per teacher, editable).
--
-- IMPORTANT: This file is prepared but NOT executed by application code.
-- Run it manually in the Supabase SQL editor when wiring up Supabase
-- (tracked under Prompt #9).

CREATE TABLE IF NOT EXISTS public.evaluations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  q1_value smallint NOT NULL CHECK (q1_value BETWEEN 1 AND 5),
  q2_value smallint NOT NULL CHECK (q2_value BETWEEN 1 AND 5),
  q3_value smallint NOT NULL CHECK (q3_value BETWEEN 1 AND 5),
  q4_text text NOT NULL,
  q5_text text NOT NULL,
  q6_text text,
  q7_value smallint NOT NULL CHECK (q7_value BETWEEN 1 AND 5),
  q8_value smallint NOT NULL CHECK (q8_value BETWEEN 1 AND 5),
  q9_selections text[] NOT NULL DEFAULT '{}',
  q10_text text NOT NULL,
  q11_text text,
  q12_value text NOT NULL CHECK (q12_value IN ('yes', 'yes-with-reservations', 'no')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Teachers can read, insert, and update only their own evaluation row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'evaluations'
      AND policyname = 'evaluations_own_select'
  ) THEN
    CREATE POLICY "evaluations_own_select" ON public.evaluations
      FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'evaluations'
      AND policyname = 'evaluations_own_insert'
  ) THEN
    CREATE POLICY "evaluations_own_insert" ON public.evaluations
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'evaluations'
      AND policyname = 'evaluations_own_update'
  ) THEN
    CREATE POLICY "evaluations_own_update" ON public.evaluations
      FOR UPDATE USING (user_id = auth.uid());
  END IF;

  -- Admins can read all rows (insert/update is still owner-only).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'evaluations'
      AND policyname = 'evaluations_admin_select'
  ) THEN
    CREATE POLICY "evaluations_admin_select" ON public.evaluations
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evaluations_submitted_at
  ON public.evaluations (submitted_at DESC);

-- Auto-update updated_at on every row update.
CREATE OR REPLACE FUNCTION public.set_evaluations_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_evaluations_updated_at ON public.evaluations;
CREATE TRIGGER trg_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_evaluations_updated_at();
