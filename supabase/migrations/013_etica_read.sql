-- Track when a teacher confirms they have read the Éthica / academic integrity page.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS etica_read_at TIMESTAMPTZ DEFAULT NULL;
