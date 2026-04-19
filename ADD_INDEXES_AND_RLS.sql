-- ============================================================
-- ADD INDEXES AND RLS POLICIES
-- Run this to optimize performance and add security
-- ============================================================

-- ============================================================
-- STEP 1: Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stage_tasks_project_id ON public.stage_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_stage_tasks_stage_id ON public.stage_tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_project_estimates_project_id ON public.project_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project_id ON public.project_invoices(project_id);

-- ============================================================
-- STEP 2: Enable RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.stage_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Create RLS Policies
-- ============================================================

-- stage_tasks policies
DROP POLICY IF EXISTS "stage_tasks_auth" ON public.stage_tasks;
CREATE POLICY "stage_tasks_auth" ON public.stage_tasks
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- project_estimates policies
DROP POLICY IF EXISTS "project_estimates_auth" ON public.project_estimates;
CREATE POLICY "project_estimates_auth" ON public.project_estimates
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- project_invoices policies
DROP POLICY IF EXISTS "project_invoices_auth" ON public.project_invoices;
CREATE POLICY "project_invoices_auth" ON public.project_invoices
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- DONE - Tables are optimized and secured
-- ============================================================
