-- ============================================================
-- Fixed Migration: Add missing columns to existing project_customers table
-- ============================================================

-- Step 1: Add missing columns if they don't exist
ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS company TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Add customer_id_ref to projects table (link to customer)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS customer_id_ref TEXT REFERENCES public.project_customers(customer_id);

-- Step 3: Remove duplicate customer columns from project_estimates (keep only for backward compatibility)
-- Don't delete yet, just mark for future removal
-- ALTER TABLE public.project_estimates
-- DROP COLUMN IF EXISTS customer_name CASCADE;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_customers_customer_id ON public.project_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_project_customers_name ON public.project_customers(name);
CREATE INDEX IF NOT EXISTS idx_project_customers_active ON public.project_customers(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id_ref ON public.projects(customer_id_ref);

-- Step 5: Verify the structure
SELECT
  'project_customers columns:' as info,
  string_agg(column_name, ', ' ORDER BY column_name) as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'project_customers'
GROUP BY table_name;

-- ============================================================
-- SUCCESS: Customer management structure fixed
-- ============================================================
