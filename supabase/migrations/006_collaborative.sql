-- 006_collaborative.sql
-- Adds partner tracking to item_completions for collaborative tasks.
--
-- Collaborative tasks live at parts b-p4, i-p4, a-p3 and a-p5. The teacher
-- declares her partner in the UI before submitting the task; this migration
-- stores that pairing alongside the completion so admins can audit who paired
-- with whom and the AI grader can verify the declared name appears in the
-- evidence text.
--
-- IMPORTANT: This file is prepared but NOT executed by application code.
-- Run it manually in the Supabase SQL editor when wiring up Supabase.

ALTER TABLE public.item_completions
  ADD COLUMN IF NOT EXISTS partner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_name text;

-- Optional helpful index for admin pairing queries.
CREATE INDEX IF NOT EXISTS idx_item_completions_partner_user_id
  ON public.item_completions (partner_user_id)
  WHERE partner_user_id IS NOT NULL;
