-- ============================================================
-- CUSTOMER-FIRST WORKFLOW - FIXED SCHEMA SETUP
-- Handles the project_customers schema issue
-- ============================================================

-- ============================================================
-- STEP 1: Check current schema
-- ============================================================
SELECT 'Current schema for project_customers:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_customers'
ORDER BY ordinal_position;

-- ============================================================
-- STEP 2: Remove project_id column if it exists and is causing issues
-- ============================================================
ALTER TABLE public.project_customers
DROP COLUMN IF EXISTS project_id CASCADE;

-- ============================================================
-- STEP 3: Ensure project_customers has correct structure
-- ============================================================
-- Verify columns exist, create if missing
ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS customer_id TEXT UNIQUE;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS postal_code TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS company TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.project_customers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- STEP 4: Create legacy customer (handle existing insert)
-- ============================================================
DELETE FROM public.project_customers
WHERE customer_id = 'CUST-LEGACY-0000';

INSERT INTO public.project_customers (
  customer_id,
  name,
  email,
  company,
  phone,
  address,
  city,
  state,
  postal_code,
  notes,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'CUST-LEGACY-0000',
  'Legacy/Unassigned Projects',
  'legacy@solartrack.local',
  'System Default',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'Projects migrated before customer-first workflow implementation',
  true,
  NOW(),
  NOW()
);

SELECT 'Legacy customer created/updated: CUST-LEGACY-0000' as status;

-- ============================================================
-- STEP 5: Migrate all orphaned projects
-- ============================================================
UPDATE public.projects
SET customer_id = 'CUST-LEGACY-0000'
WHERE customer_id IS NULL;

SELECT 'Orphaned projects migrated' as status;

-- ============================================================
-- STEP 6: Apply NOT NULL constraint
-- ============================================================
ALTER TABLE public.projects
ALTER COLUMN customer_id SET NOT NULL;

SELECT 'NOT NULL constraint applied to projects.customer_id' as status;

-- ============================================================
-- STEP 7: Create Validation Function
-- ============================================================
DROP FUNCTION IF EXISTS public.verify_customer_exists() CASCADE;

CREATE OR REPLACE FUNCTION public.verify_customer_exists()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required for project creation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.project_customers
    WHERE customer_id = NEW.customer_id
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Referenced customer (%) does not exist or is inactive', NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 8: Create Triggers
-- ============================================================
DROP TRIGGER IF EXISTS projects_customer_validation ON public.projects;

CREATE TRIGGER projects_customer_validation
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.verify_customer_exists();

-- ============================================================
-- STEP 9: Customer Deletion Prevention
-- ============================================================
DROP FUNCTION IF EXISTS public.prevent_customer_deletion_with_projects() CASCADE;

CREATE OR REPLACE FUNCTION public.prevent_customer_deletion_with_projects()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    IF EXISTS (
      SELECT 1 FROM public.projects
      WHERE customer_id = OLD.customer_id
      AND status != 'Cancelled'
    ) THEN
      RAISE EXCEPTION 'Cannot deactivate customer (%) with active projects', OLD.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 10: Create Deletion Prevention Trigger
-- ============================================================
DROP TRIGGER IF EXISTS prevent_customer_deletion ON public.project_customers;

CREATE TRIGGER prevent_customer_deletion
BEFORE UPDATE ON public.project_customers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_customer_deletion_with_projects();

-- ============================================================
-- STEP 11: Create Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_customer_id
ON public.projects(customer_id);

CREATE INDEX IF NOT EXISTS idx_projects_customer_status
ON public.projects(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_project_customers_customer_id
ON public.project_customers(customer_id);

CREATE INDEX IF NOT EXISTS idx_project_customers_is_active
ON public.project_customers(is_active);

-- ============================================================
-- STEP 12: Create Views
-- ============================================================
DROP VIEW IF EXISTS public.customer_project_summary CASCADE;

CREATE VIEW public.customer_project_summary AS
SELECT
  c.id,
  c.customer_id,
  c.name,
  c.email,
  c.phone,
  c.created_at,
  COUNT(p.id) AS total_projects,
  COUNT(CASE WHEN p.status = 'Completed' THEN 1 END) AS completed_projects,
  COUNT(CASE WHEN p.status = 'In Progress' THEN 1 END) AS active_projects,
  COUNT(CASE WHEN p.status = 'On Hold' THEN 1 END) AS on_hold_projects,
  COUNT(CASE WHEN p.status = 'Cancelled' THEN 1 END) AS cancelled_projects,
  MAX(p.created_at) AS last_project_created,
  MAX(p.updated_at) AS last_project_updated
FROM public.project_customers c
LEFT JOIN public.projects p ON c.customer_id = p.customer_id
WHERE c.is_active = true
GROUP BY c.id, c.customer_id, c.name, c.email, c.phone, c.created_at;

GRANT SELECT ON public.customer_project_summary TO authenticated;
GRANT SELECT ON public.customer_project_summary TO anon;

-- ============================================================
-- STEP 13: Create Projects with Customers View
-- ============================================================
DROP VIEW IF EXISTS public.projects_with_customers CASCADE;

CREATE VIEW public.projects_with_customers AS
SELECT
  p.id,
  p.name AS project_name,
  p.status,
  p.stage,
  p.description,
  p.created_at,
  p.updated_at,
  c.customer_id,
  c.name AS customer_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  c.address AS customer_address,
  c.city AS customer_city,
  c.state AS customer_state,
  c.postal_code AS customer_postal_code
FROM public.projects p
INNER JOIN public.project_customers c ON p.customer_id = c.customer_id
WHERE c.is_active = true;

GRANT SELECT ON public.projects_with_customers TO authenticated;
GRANT SELECT ON public.projects_with_customers TO anon;

-- ============================================================
-- STEP 14: Monitoring Function
-- ============================================================
DROP FUNCTION IF EXISTS public.get_customer_project_stats();

CREATE OR REPLACE FUNCTION public.get_customer_project_stats()
RETURNS TABLE (
  total_customers BIGINT,
  total_projects BIGINT,
  active_projects BIGINT,
  completed_projects BIGINT,
  customers_with_projects BIGINT,
  customers_without_projects BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id)::BIGINT,
    COUNT(DISTINCT p.id)::BIGINT,
    COUNT(DISTINCT CASE WHEN p.status = 'In Progress' THEN p.id END)::BIGINT,
    COUNT(DISTINCT CASE WHEN p.status = 'Completed' THEN p.id END)::BIGINT,
    COUNT(DISTINCT c.id) FILTER (WHERE p.id IS NOT NULL)::BIGINT,
    COUNT(DISTINCT c.id) FILTER (WHERE p.id IS NULL)::BIGINT
  FROM public.project_customers c
  LEFT JOIN public.projects p ON c.customer_id = p.customer_id
  WHERE c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as verification;
SELECT 'CUSTOMER-FIRST WORKFLOW VERIFICATION' as status;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as verification;

-- 1. Check NOT NULL constraint
SELECT 'Step 1: NOT NULL Constraint on customer_id' as check_name;
SELECT is_nullable FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'customer_id';

-- 2. Check triggers exist
SELECT 'Step 2: Triggers' as check_name;
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table IN ('projects', 'project_customers')
ORDER BY trigger_name;

-- 3. Check views exist
SELECT 'Step 3: Views' as check_name;
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('customer_project_summary', 'projects_with_customers')
ORDER BY table_name;

-- 4. Check legacy customer
SELECT 'Step 4: Legacy Customer Status' as check_name;
SELECT customer_id, name, is_active FROM public.project_customers
WHERE customer_id = 'CUST-LEGACY-0000';

-- 5. Check projects assigned to legacy
SELECT 'Step 5: Projects Migrated to Legacy' as check_name;
SELECT COUNT(*) as migrated_projects
FROM public.projects
WHERE customer_id = 'CUST-LEGACY-0000';

-- 6. Check for NULL customer_ids (should be 0)
SELECT 'Step 6: Orphaned Projects (should be 0)' as check_name;
SELECT COUNT(*) as null_customer_count
FROM public.projects
WHERE customer_id IS NULL;

-- 7. Check project_customers schema
SELECT 'Step 7: Project Customers Schema' as check_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_customers'
ORDER BY ordinal_position;

-- 8. Check indexes
SELECT 'Step 8: Indexes' as check_name;
SELECT indexname FROM pg_indexes
WHERE tablename IN ('projects', 'project_customers')
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- ============================================================
-- SUCCESS!
-- ============================================================
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as result;
SELECT '✅ Customer-First Workflow Setup Complete!' as status;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as result;
SELECT 'Database is ready for customer-first workflow!' as note;
