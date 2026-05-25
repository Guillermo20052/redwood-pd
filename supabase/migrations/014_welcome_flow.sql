ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS welcome_cynthia_read_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS welcome_pope_read_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS welcome_about_read_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_welcome_complete
  ON profiles(welcome_cynthia_read_at, welcome_pope_read_at, welcome_about_read_at);
