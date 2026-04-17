-- ============================================================
-- Create Customer Management Tables
-- Date: March 25, 2026
-- ============================================================

-- ============================================================
-- Step 1: Create project_customers table for storing customer details
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL,
  customer_id     TEXT UNIQUE NOT NULL,        -- Format: CUST-YYYYMMDD-XXXX
  name            TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  postal_code     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 2: Add customer_id column to projects table
-- ============================================================
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES project_customers(customer_id);

-- ============================================================
-- Step 3: Add customer_id column to project_estimates table
-- ============================================================
ALTER TABLE public.project_estimates
ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- ============================================================
-- Step 4: Create indexes for faster queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_project_customers_project_id ON public.project_customers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_customers_customer_id ON public.project_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON public.projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_project_estimates_customer_id ON public.project_estimates(customer_id);

-- ============================================================
-- Step 5: Enable RLS on project_customers
-- ============================================================
ALTER TABLE public.project_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.project_customers;
CREATE POLICY "Authenticated users can manage customers"
  ON public.project_customers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Success!
-- ============================================================
-- Now you can:
-- 1. Create customers with unique IDs
-- 2. Link customers to projects
-- 3. Store customer info separately from projects
-- 4. Reference customers in proposals

SELECT 'Project Customers table created successfully!' as status;
