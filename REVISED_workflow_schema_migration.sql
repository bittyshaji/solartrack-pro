-- ============================================================
-- PROJECT WORKFLOW TABLES MIGRATION (REVISED)
-- SolarTrack Pro - Three-State Workflow
--
-- This is a simplified step-by-step version that handles errors gracefully
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- ============================================================
-- STEP 1: Update projects table with missing columns
-- ============================================================

-- Add project_code column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_code TEXT UNIQUE;

-- Add project_state column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_state TEXT DEFAULT 'Estimation';

-- Add stage column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS stage INTEGER DEFAULT 1;

-- ============================================================
-- STEP 2: Create stage_tasks table (WITHOUT foreign key first)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stage_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID,
  stage_id        INTEGER NOT NULL,
  task_name       TEXT NOT NULL,
  description     TEXT,
  quantity        NUMERIC(10, 2) DEFAULT 1,
  unit_cost       NUMERIC(10, 2) DEFAULT 0,
  is_completed    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint separately (if projects table exists)
DO $$
BEGIN
  ALTER TABLE public.stage_tasks
  ADD CONSTRAINT fk_stage_tasks_project_id
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, continue
  NULL;
END $$;

-- ============================================================
-- STEP 3: Enable RLS and create policies for stage_tasks
-- ============================================================

ALTER TABLE public.stage_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage stage tasks" ON public.stage_tasks;

-- Create new policy
CREATE POLICY "Authenticated users can manage stage tasks"
  ON public.stage_tasks FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- STEP 4: Create indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_stage_tasks_project_id ON public.stage_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_stage_tasks_stage_id ON public.stage_tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_tasks_created_at ON public.stage_tasks(created_at DESC);

-- ============================================================
-- STEP 5: Create project_estimates table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_estimates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID,
  state           TEXT NOT NULL DEFAULT 'Estimation',
  grand_total     NUMERIC(15, 2) DEFAULT 0,
  notes           TEXT,
  created_by      TEXT,
  estimate_date   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint separately
DO $$
BEGIN
  ALTER TABLE public.project_estimates
  ADD CONSTRAINT fk_project_estimates_project_id
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

ALTER TABLE public.project_estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage estimates" ON public.project_estimates;

CREATE POLICY "Authenticated users can manage estimates"
  ON public.project_estimates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_project_estimates_project_id ON public.project_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_estimates_state ON public.project_estimates(state);
CREATE INDEX IF NOT EXISTS idx_project_estimates_date ON public.project_estimates(estimate_date DESC);

-- ============================================================
-- STEP 6: Create project_invoices table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID,
  invoice_number  TEXT UNIQUE NOT NULL,
  total_amount    NUMERIC(15, 2) DEFAULT 0,
  paid_amount     NUMERIC(15, 2) DEFAULT 0,
  payment_status  TEXT DEFAULT 'Pending',
  invoice_date    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint separately
DO $$
BEGIN
  ALTER TABLE public.project_invoices
  ADD CONSTRAINT fk_project_invoices_project_id
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.project_invoices;

CREATE POLICY "Authenticated users can manage invoices"
  ON public.project_invoices FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_project_invoices_project_id ON public.project_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_status ON public.project_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_project_invoices_date ON public.project_invoices(invoice_date DESC);

-- ============================================================
-- SUCCESS - All tables created!
-- ============================================================
