-- ============================================================
-- Module 5: Team Management Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add 'team_leader' role to user_profiles if not already present
-- (Drops and recreates the role check constraint)
DO $$
BEGIN
  -- Drop old constraint if it exists
  ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'manager', 'team_leader', 'worker', 'customer'));

-- Step 2: Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  team_leader_id  UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  project_id      UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create team_users table (roster: which workers belong to which team)
CREATE TABLE IF NOT EXISTS public.team_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Step 4: RLS for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_select_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_update_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON public.teams;

-- All approved users can view teams
CREATE POLICY "teams_select_policy" ON public.teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admin and manager can create teams
CREATE POLICY "teams_insert_policy" ON public.teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND approval_status = 'approved'
    )
  );

-- Only admin and manager can update teams
CREATE POLICY "teams_update_policy" ON public.teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND approval_status = 'approved'
    )
  );

-- Only admin can delete teams
CREATE POLICY "teams_delete_policy" ON public.teams
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND approval_status = 'approved'
    )
  );

-- Step 5: RLS for team_users
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_users_select_policy" ON public.team_users;
DROP POLICY IF EXISTS "team_users_insert_policy" ON public.team_users;
DROP POLICY IF EXISTS "team_users_delete_policy" ON public.team_users;

CREATE POLICY "team_users_select_policy" ON public.team_users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "team_users_insert_policy" ON public.team_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND approval_status = 'approved'
    )
  );

CREATE POLICY "team_users_delete_policy" ON public.team_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND approval_status = 'approved'
    )
  );

-- Step 6: Auto-update updated_at on teams
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_updated_at ON public.teams;
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_teams_updated_at();
