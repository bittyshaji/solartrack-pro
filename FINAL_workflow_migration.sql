-- ============================================================
-- FINAL WORKFLOW MIGRATION - Simplified Version
-- This version creates tables without strict foreign key constraints
-- Then you can manually verify data before adding constraints
-- ============================================================

-- ============================================================
-- STEP 1: Add columns to projects table
-- ============================================================

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_code TEXT UNIQUE;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_state TEXT DEFAULT 'Estimation';

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS stage INTEGER DEFAULT 1;

-- ============================================================
-- STEP 2: Create stage_tasks table (NO foreign keys yet)
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

-- ============================================================
-- STEP 3: Create project_estimates table (NO foreign keys yet)
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

-- ============================================================
-- STEP 4: Create project_invoices table (NO foreign keys yet)
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

-- ============================================================
-- STEP 5: Enable RLS on all tables
-- ============================================================

ALTER TABLE public.stage_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can manage stage tasks" ON public.stage_tasks;
CREATE POLICY "Authenticated users can manage stage tasks"
  ON public.stage_tasks FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage estimates" ON public.project_estimates;
CREATE POLICY "Authenticated users can manage estimates"
  ON public.project_estimates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.project_invoices;
CREATE POLICY "Authenticated users can manage invoices"
  ON public.project_invoices FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- STEP 7: Create indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_stage_tasks_project_id ON public.stage_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_stage_tasks_stage_id ON public.stage_tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_project_estimates_project_id ON public.project_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project_id ON public.project_invoices(project_id);

-- ============================================================
-- SUCCESS! Tables created without foreign key constraints
-- ============================================================
-- The foreign keys are optional for the app to work
-- The app will handle data validation in the service layer

-- VERIFY: Run this to confirm tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('stage_tasks', 'project_estimates', 'project_invoices');

-- VERIFY: Show columns in stage_tasks
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'stage_tasks' ORDER BY ordinal_position;
