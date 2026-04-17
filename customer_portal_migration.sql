-- ============================================================
-- Module 6: Customer Portal Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add customer_email column to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Step 2: Allow customers to view their own project by email match
DROP POLICY IF EXISTS "customers_can_view_own_project" ON public.projects;
CREATE POLICY "customers_can_view_own_project" ON public.projects
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND lower(auth.email()) = lower(customer_email)
  );

-- Step 3: Allow all approved staff to view all projects
DROP POLICY IF EXISTS "staff_can_view_all_projects" ON public.projects;
CREATE POLICY "staff_can_view_all_projects" ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager', 'team_leader', 'worker')
        AND approval_status = 'approved'
    )
  );

-- Step 4: Allow customers to read daily_updates for their project
DROP POLICY IF EXISTS "customers_can_view_their_project_updates" ON public.daily_updates;
CREATE POLICY "customers_can_view_their_project_updates" ON public.daily_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND lower(p.customer_email) = lower(auth.email())
    )
  );

-- Step 5: Allow customers to read update_photos for their project
DROP POLICY IF EXISTS "customers_can_view_their_photos" ON public.update_photos;
CREATE POLICY "customers_can_view_their_photos" ON public.update_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.daily_updates du
      JOIN public.projects p ON p.id = du.project_id
      WHERE du.id = update_id
        AND lower(p.customer_email) = lower(auth.email())
    )
  );

-- Step 6: Allow customers to read their assigned team
DROP POLICY IF EXISTS "customers_can_view_their_team" ON public.teams;
CREATE POLICY "customers_can_view_their_team" ON public.teams
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Staff can see all teams
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'manager', 'team_leader', 'worker')
      )
      OR
      -- Customer can see team assigned to their project
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
          AND lower(p.customer_email) = lower(auth.email())
      )
    )
  );

-- Step 7: Allow all authenticated users to read user_profiles (name/phone)
DROP POLICY IF EXISTS "all_users_can_view_profiles" ON public.user_profiles;
CREATE POLICY "all_users_can_view_profiles" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
