-- 007_auto_profile.sql
-- Three concerns, all idempotent:
--   1. Replace the auto-profile trigger so signup never fails even if the
--      auth.users row is missing email or metadata. Uses ON CONFLICT DO NOTHING
--      so re-runs are safe.
--   2. Add the task_input_type and task_file_url columns to item_completions.
--      These are already written by completions-service.ts via graceful
--      degradation; adding the columns here makes file submissions persist.
--   3. Ensure the program-evaluation row can be created via PostgREST by
--      relaxing the FK from public.profiles (rather than auth.users) so RLS
--      and triggers play nicely with the simpler signup flow.

-- 1. Auto-profile trigger -----------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, subject, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'subject',
      NEW.raw_user_meta_data->>'subject_area',
      ''
    ),
    'teacher',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add missing columns referenced by completions-service.ts -----------------

ALTER TABLE public.item_completions
  ADD COLUMN IF NOT EXISTS task_input_type text
    CHECK (task_input_type IS NULL OR task_input_type IN ('text', 'screenshot', 'document')),
  ADD COLUMN IF NOT EXISTS task_file_url text;

-- 3. Helpful index for upload audit by user ----------------------------------

CREATE INDEX IF NOT EXISTS idx_item_completions_user_file
  ON public.item_completions (user_id)
  WHERE task_file_url IS NOT NULL;
