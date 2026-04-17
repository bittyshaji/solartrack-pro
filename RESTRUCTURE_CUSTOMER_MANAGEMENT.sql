-- ============================================================
-- Migration: Restructure Customer Management
-- Date: March 25, 2026
-- Link projects to pre-created customers (one-to-many)
-- ============================================================

-- Step 1: Ensure project_customers table exists with proper structure
CREATE TABLE IF NOT EXISTS public.project_customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         TEXT UNIQUE NOT NULL,        -- Format: CUST-YYYYMMDD-XXXX
  name                TEXT NOT NULL,
  email               TEXT,
  phone               TEXT,
  address             TEXT,
  city                TEXT,
  state               TEXT,
  postal_code         TEXT,
  company             TEXT,
  notes               TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add customer_id to projects table (link to customer)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS customer_id_ref TEXT REFERENCES project_customers(customer_id);

-- Step 3: Drop customer columns from project_estimates (customer info comes from project)
ALTER TABLE public.project_estimates
DROP COLUMN IF EXISTS customer_name CASCADE;

ALTER TABLE public.project_estimates
DROP COLUMN IF EXISTS customer_phone CASCADE;

ALTER TABLE public.project_estimates
DROP COLUMN IF EXISTS customer_id CASCADE;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_customers_customer_id ON public.project_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_project_customers_name ON public.project_customers(name);
CREATE INDEX IF NOT EXISTS idx_project_customers_active ON public.project_customers(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id_ref ON public.projects(customer_id_ref);

-- Step 5: Enable RLS
ALTER TABLE public.project_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.project_customers;
CREATE POLICY "Authenticated users can manage customers"
  ON public.project_customers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Step 6: Verify the structure
SELECT
  'project_customers table:' as info,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'project_customers'
UNION ALL
SELECT
  'projects table customer_id_ref column:' as info,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'customer_id_ref';

-- ============================================================
-- SUCCESS: Customer management restructured
-- Now projects link to customers via customer_id_ref
-- Customer info is NOT duplicated in project_estimates
-- ============================================================
