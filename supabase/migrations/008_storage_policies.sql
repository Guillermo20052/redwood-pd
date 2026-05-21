-- 008_storage_policies.sql
-- RLS policies for the "uploads" Storage bucket.
--
-- Path convention: uploads/{user_id}/{timestamp}-{filename}
--
-- IMPORTANT: Create the bucket FIRST (`scripts/setup-supabase.mjs` does this
-- via the JS admin client). Then run this SQL in the Supabase SQL editor.
-- All statements are idempotent (DROP POLICY IF EXISTS before CREATE).

DROP POLICY IF EXISTS "uploads_insert_own" ON storage.objects;
CREATE POLICY "uploads_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "uploads_select_own" ON storage.objects;
CREATE POLICY "uploads_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "uploads_update_own" ON storage.objects;
CREATE POLICY "uploads_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "uploads_delete_own" ON storage.objects;
CREATE POLICY "uploads_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin reads ----------------------------------------------------------------
DROP POLICY IF EXISTS "uploads_select_admin" ON storage.objects;
CREATE POLICY "uploads_select_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'uploads'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
