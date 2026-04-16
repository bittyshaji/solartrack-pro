-- ============================================================
-- Module 4: Daily Progress Updates - SQL Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Add new columns to daily_updates table
ALTER TABLE public.daily_updates
  ADD COLUMN IF NOT EXISTS stage_at_time_of_update  INTEGER CHECK (stage_at_time_of_update BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS work_done_today           TEXT,
  ADD COLUMN IF NOT EXISTS issues_faced              TEXT,
  ADD COLUMN IF NOT EXISTS next_day_plan             TEXT,
  ADD COLUMN IF NOT EXISTS workers_present_count     INTEGER DEFAULT 0;

-- Step 2: Create update_photos table
CREATE TABLE IF NOT EXISTS public.update_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id   UUID NOT NULL REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  photo_url   TEXT NOT NULL,
  caption     TEXT DEFAULT '',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: RLS for update_photos
ALTER TABLE public.update_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "update_photos_select" ON public.update_photos;
DROP POLICY IF EXISTS "update_photos_insert" ON public.update_photos;
DROP POLICY IF EXISTS "update_photos_delete" ON public.update_photos;

CREATE POLICY "update_photos_select" ON public.update_photos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "update_photos_insert" ON public.update_photos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "update_photos_delete" ON public.update_photos
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Step 4: Update RLS on daily_updates to allow team leaders to insert
-- (keep existing policies, add broader insert if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_updates' AND policyname = 'daily_updates_select_all'
  ) THEN
    EXECUTE 'CREATE POLICY daily_updates_select_all ON public.daily_updates FOR SELECT TO authenticated USING (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_updates' AND policyname = 'daily_updates_insert_all'
  ) THEN
    EXECUTE 'CREATE POLICY daily_updates_insert_all ON public.daily_updates FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_updates' AND policyname = 'daily_updates_delete_own'
  ) THEN
    EXECUTE 'CREATE POLICY daily_updates_delete_own ON public.daily_updates FOR DELETE TO authenticated USING (auth.uid() = author_id)';
  END IF;
END $$;

-- Step 5: Create Supabase Storage bucket for photos
-- NOTE: Run this separately or create via Supabase Dashboard:
-- Dashboard → Storage → New Bucket → Name: "update-photos" → Public: ON
INSERT INTO storage.buckets (id, name, public)
VALUES ('update-photos', 'update-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for update-photos bucket
DROP POLICY IF EXISTS "update_photos_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "update_photos_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "update_photos_storage_delete" ON storage.objects;

CREATE POLICY "update_photos_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'update-photos');

CREATE POLICY "update_photos_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'update-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "update_photos_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'update-photos' AND auth.uid() IS NOT NULL);
