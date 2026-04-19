-- ============================================================
-- ULTRA SIMPLE MIGRATION - Bare Minimum Tables Only
-- No constraints, no checks, just basic tables
-- ============================================================

-- Create stage_tasks table - SIMPLE VERSION
CREATE TABLE IF NOT EXISTS public.stage_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  stage_id INTEGER,
  task_name TEXT,
  description TEXT,
  quantity NUMERIC,
  unit_cost NUMERIC,
  is_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Create project_estimates table - SIMPLE VERSION
CREATE TABLE IF NOT EXISTS public.project_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  state TEXT,
  grand_total NUMERIC,
  notes TEXT,
  created_by TEXT,
  estimate_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- Create project_invoices table - SIMPLE VERSION
CREATE TABLE IF NOT EXISTS public.project_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  invoice_number TEXT,
  total_amount NUMERIC,
  paid_amount NUMERIC,
  payment_status TEXT,
  invoice_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stage_tasks_project_id ON public.stage_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_stage_tasks_stage_id ON public.stage_tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_project_estimates_project_id ON public.project_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project_id ON public.project_invoices(project_id);

-- Enable RLS
ALTER TABLE public.stage_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

-- Create basic policies
DROP POLICY IF EXISTS "stage_tasks_auth" ON public.stage_tasks;
CREATE POLICY "stage_tasks_auth" ON public.stage_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "project_estimates_auth" ON public.project_estimates;
CREATE POLICY "project_estimates_auth" ON public.project_estimates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "project_invoices_auth" ON public.project_invoices;
CREATE POLICY "project_invoices_auth" ON public.project_invoices FOR ALL USING (true) WITH CHECK (true);

-- Done
SELECT 'Tables created successfully' AS status;
