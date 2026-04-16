-- ============================================================
-- TEMPORARILY DISABLE RLS TO DEBUG
-- If tasks appear after this, then RLS is the issue
-- ============================================================

-- Disable RLS on stage_tasks
ALTER TABLE public.stage_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_estimates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT * FROM public.stage_tasks LIMIT 5;
