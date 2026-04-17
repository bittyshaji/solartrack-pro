-- ============================================================
-- PROJECT WORKFLOW TABLES MIGRATION
-- SolarTrack Pro - Three-State Workflow (Estimation → Negotiation → Execution)
--
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- Then seed default stage tasks with the sample data below
-- ============================================================

-- ============================================================
-- STEP 1: Update projects table with missing columns
-- ============================================================

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_code TEXT UNIQUE;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_state TEXT DEFAULT 'Estimation'
CHECK (project_state IN ('Estimation', 'Negotiation', 'Execution'));

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS stage INTEGER DEFAULT 1;

-- ============================================================
-- STEP 2: Create stage_tasks table
-- ============================================================
-- Stores tasks for each of the 10 project stages
-- Each task has quantity and unit_cost that can be edited in proposals

CREATE TABLE IF NOT EXISTS public.stage_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id        INTEGER NOT NULL,
  task_name       TEXT NOT NULL,
  description     TEXT,
  quantity        NUMERIC(10, 2) DEFAULT 1 CHECK (quantity >= 0),
  unit_cost       NUMERIC(10, 2) DEFAULT 0 CHECK (unit_cost >= 0),
  is_completed    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stage_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage stage tasks"
  ON public.stage_tasks FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_stage_tasks_project_id ON public.stage_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_stage_tasks_stage_id ON public.stage_tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_tasks_created_at ON public.stage_tasks(created_at DESC);

-- ============================================================
-- STEP 3: Create project_estimates table
-- ============================================================
-- Stores proposal/estimate data at each workflow stage
-- Tracks the proposal grand total and which state it was created in

CREATE TABLE IF NOT EXISTS public.project_estimates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  state           TEXT NOT NULL CHECK (state IN ('Estimation', 'Negotiation', 'Execution')),
  grand_total     NUMERIC(15, 2) DEFAULT 0 CHECK (grand_total >= 0),
  notes           TEXT,
  created_by      TEXT,
  estimate_date   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage estimates"
  ON public.project_estimates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_project_estimates_project_id ON public.project_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_estimates_state ON public.project_estimates(state);
CREATE INDEX IF NOT EXISTS idx_project_estimates_date ON public.project_estimates(estimate_date DESC);

-- ============================================================
-- STEP 4: Create project_invoices table
-- ============================================================
-- Stores final invoices generated during execution
-- Tracks payment status: Pending, Partial, Paid

CREATE TABLE IF NOT EXISTS public.project_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_number  TEXT UNIQUE NOT NULL,
  total_amount    NUMERIC(15, 2) DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount     NUMERIC(15, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  payment_status  TEXT DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Partial', 'Paid')),
  invoice_date    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage invoices"
  ON public.project_invoices FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_project_invoices_project_id ON public.project_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_status ON public.project_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_project_invoices_date ON public.project_invoices(invoice_date DESC);

-- ============================================================
-- STEP 5: OPTIONAL - Grant necessary permissions
-- ============================================================
-- Uncomment if you have specific role-based requirements

-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.stage_tasks TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_estimates TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invoices TO authenticated;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
-- All workflow tables created successfully!
-- Next step: Run the seed data script below to populate default stage tasks
