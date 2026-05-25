-- 012_reflection_feedback.sql
-- Stores AI coaching feedback on per-part reflection submissions.
-- Run manually in the Supabase SQL editor.

ALTER TABLE public.item_completions
  ADD COLUMN IF NOT EXISTS reflection_ai_feedback TEXT;
