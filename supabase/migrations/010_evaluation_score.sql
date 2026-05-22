-- 010_evaluation_score.sql
-- AI-generated final evaluation score (0–100) with coaching comment.

ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS score smallint
    CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  ADD COLUMN IF NOT EXISTS score_feedback text;
