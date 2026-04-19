-- Fix RLS policies that reference auth.users directly (causes permission denied)
-- Replace with auth.jwt() check which doesn't require table access
-- Run this in Supabase Dashboard → SQL Editor

BEGIN;

-- =============================================
-- FIX: completion_certificates RLS policies
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read completion certificates for their projects" ON completion_certificates;
DROP POLICY IF EXISTS "Users can create completion certificates for their projects" ON completion_certificates;
DROP POLICY IF EXISTS "Users can update completion certificates for their projects" ON completion_certificates;
DROP POLICY IF EXISTS "Users can delete completion certificates for their projects" ON completion_certificates;

-- Recreate with fixed admin check using auth.jwt() instead of auth.users
CREATE POLICY "Users can read completion certificates for their projects"
  ON completion_certificates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = completion_certificates.project_id AND projects.user_id = auth.uid())
    OR (auth.jwt()->>'role' = 'admin')
    OR ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  );

CREATE POLICY "Users can create completion certificates for their projects"
  ON completion_certificates FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = completion_certificates.project_id AND projects.user_id = auth.uid())
    OR (auth.jwt()->>'role' = 'admin')
    OR ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  );

CREATE POLICY "Users can update completion certificates for their projects"
  ON completion_certificates FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = completion_certificates.project_id AND projects.user_id = auth.uid())
    OR (auth.jwt()->>'role' = 'admin')
    OR ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = completion_certificates.project_id AND projects.user_id = auth.uid())
    OR (auth.jwt()->>'role' = 'admin')
    OR ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  );

CREATE POLICY "Users can delete completion certificates for their projects"
  ON completion_certificates FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = completion_certificates.project_id AND projects.user_id = auth.uid())
    OR (auth.jwt()->>'role' = 'admin')
    OR ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  );

-- Also drop the FK constraint on issued_by that references auth.users
-- (causes permission denied when inserting)
ALTER TABLE completion_certificates DROP CONSTRAINT IF EXISTS fk_issued_by;

COMMIT;
