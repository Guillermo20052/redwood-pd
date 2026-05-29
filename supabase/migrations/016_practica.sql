-- 016_practica.sql
-- Practice tasks (Práctica): feature flag + completions (no diploma/progression).

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'false'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.feature_flags (key, value)
VALUES ('practica_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'feature_flags'
      AND policyname = 'feature_flags_select_authenticated'
  ) THEN
    CREATE POLICY "feature_flags_select_authenticated" ON public.feature_flags
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'feature_flags'
      AND policyname = 'feature_flags_admin_write'
  ) THEN
    CREATE POLICY "feature_flags_admin_write" ON public.feature_flags
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.practice_completions (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  feedback text NOT NULL,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, task_id)
);

ALTER TABLE public.practice_completions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'practice_completions'
      AND policyname = 'practice_completions_own_select'
  ) THEN
    CREATE POLICY "practice_completions_own_select" ON public.practice_completions
      FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'practice_completions'
      AND policyname = 'practice_completions_own_insert'
  ) THEN
    CREATE POLICY "practice_completions_own_insert" ON public.practice_completions
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'practice_completions'
      AND policyname = 'practice_completions_own_update'
  ) THEN
    CREATE POLICY "practice_completions_own_update" ON public.practice_completions
      FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'practice_completions'
      AND policyname = 'practice_completions_admin_select'
  ) THEN
    CREATE POLICY "practice_completions_admin_select" ON public.practice_completions
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_practice_completions_user
  ON public.practice_completions (user_id);

CREATE OR REPLACE FUNCTION public.set_practice_completions_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_practice_completions_updated_at ON public.practice_completions;
CREATE TRIGGER trg_practice_completions_updated_at
  BEFORE UPDATE ON public.practice_completions
  FOR EACH ROW EXECUTE FUNCTION public.set_practice_completions_updated_at();
