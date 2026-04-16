-- ============================================================
-- Module 4: Project Master - SQL Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Add new columns to the existing projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_code    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_phone  TEXT,
  ADD COLUMN IF NOT EXISTS site_address    TEXT,
  ADD COLUMN IF NOT EXISTS district        TEXT,
  ADD COLUMN IF NOT EXISTS project_type    TEXT DEFAULT 'Residential',
  ADD COLUMN IF NOT EXISTS stage           INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS assigned_to     UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Step 2: Normalise status values to Active / On Hold / Completed
UPDATE projects SET status = 'Active'    WHERE status IN ('Planning', 'In Progress');
UPDATE projects SET status = 'Active'    WHERE status = 'Cancelled';
-- 'On Hold' and 'Completed' keep their values — no update needed

-- Step 3: Back-fill project_code for any existing rows that have none
DO $$
DECLARE
  r RECORD;
  yr TEXT;
  seq INT := 1;
BEGIN
  FOR r IN
    SELECT id, created_at FROM projects WHERE project_code IS NULL ORDER BY created_at ASC
  LOOP
    yr := EXTRACT(YEAR FROM r.created_at)::TEXT;
    UPDATE projects
      SET project_code = 'SOL-' || yr || '-' || LPAD(seq::TEXT, 3, '0')
      WHERE id = r.id;
    seq := seq + 1;
  END LOOP;
END $$;

-- Step 4: RLS — allow authenticated users to read all projects
-- (existing policies already cover this, but add SELECT policy if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'projects' AND policyname = 'projects_select_all'
  ) THEN
    EXECUTE 'CREATE POLICY projects_select_all ON projects FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;
