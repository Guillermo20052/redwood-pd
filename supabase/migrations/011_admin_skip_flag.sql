-- 011_admin_skip_flag.sql
-- Marks item completions created via admin skip so they persist for admins
-- but can be excluded from cohort metrics.
-- Run manually in the Supabase SQL editor.

ALTER TABLE public.item_completions
  ADD COLUMN IF NOT EXISTS is_admin_skip BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_item_completions_admin_skip
  ON public.item_completions (is_admin_skip)
  WHERE is_admin_skip = FALSE;
