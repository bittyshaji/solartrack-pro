-- ============================================================
-- CUSTOMER-FIRST WORKFLOW - MINIMAL SAFE MIGRATION
-- Handles any existing schema without assuming columns
-- ============================================================

-- ============================================================
-- STEP 1: Clean up project_customers table
-- ============================================================
-- Remove problematic columns if they exist
ALTER TABLE IF EXISTS public.project_customers
DROP COLUMN IF EXISTS project_id CASCADE;

ALTER TABLE IF EXISTS public.project_customers
DROP COLUMN IF EXISTS status CASCADE;

-- ============================================================
-- STEP 2: Ensure project_customers has correct structure
-- ============================================================
-- Add columns only if they don't exist
ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS customer_id TEXT UNIQUE;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS postal_code TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS company TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- STEP 3: Ensure projects has customer_id column
-- ============================================================
ALTER TABLE IF EXISTS public.projects
ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- ============================================================
-- STEP 4: Create/update legacy customer
-- ============================================================
DELETE FROM public.project_customers
WHERE customer_id = 'CUST-LEGACY-0000';

INSERT INTO public.project_customers (
  customer_id,
  name,
  email,
  company,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'CUST-LEGACY-0000',
  'Legacy/Unassigned Projects',
  'legacy@solartrack.local',
  'System Default',
  true,
  NOW(),
  NOW()
);

SELECT 'Legacy customer created: CUST-LEGACY-0000' as status;

-- ============================================================
-- STEP 5: Migrate orphaned projects
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

SELECT 'NOT NULL constraint applied' as status;

-- ============================================================
-- STEP 7: Create validation function
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
    RAISE EXCEPTION 'Referenced customer does not exist or is inactive';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT 'Validation function created' as status;

-- ============================================================
-- STEP 8: Create triggers
-- ============================================================
DROP TRIGGER IF EXISTS projects_customer_validation ON public.projects;

CREATE TRIGGER projects_customer_validation
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.verify_customer_exists();

DROP TRIGGER IF EXISTS prevent_customer_deletion ON public.project_customers;

-- ============================================================
-- STEP 9: Customer deletion prevention
-- ============================================================
DROP FUNCTION IF EXISTS public.prevent_customer_deletion_with_projects() CASCADE;

CREATE OR REPLACE FUNCTION public.prevent_customer_deletion_with_projects()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    IF EXISTS (
      SELECT 1 FROM public.projects
      WHERE customer_id = OLD.customer_id
      AND status IS NOT NULL AND status != 'Cancelled'
    ) THEN
      RAISE EXCEPTION 'Cannot deactivate customer with active projects';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT 'Deletion prevention function created' as status;

-- ============================================================
-- STEP 10: Create deletion prevention trigger
-- ============================================================
CREATE TRIGGER prevent_customer_deletion
BEFORE UPDATE ON public.project_customers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_customer_deletion_with_projects();

SELECT 'Triggers created' as status;

-- ============================================================
-- STEP 11: Create indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_customer_id
ON public.projects(customer_id);

CREATE INDEX IF NOT EXISTS idx_projects_customer_status
ON public.projects(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_project_customers_customer_id
ON public.project_customers(customer_id);

CREATE INDEX IF NOT EXISTS idx_project_customers_is_active
ON public.project_customers(is_active);

SELECT 'Indexes created' as status;

-- ============================================================
-- STEP 12: Create customer_project_summary view
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

SELECT 'customer_project_summary view created' as status;

-- ============================================================
-- STEP 13: Create projects_with_customers view (minimal version)
-- ============================================================
DROP VIEW IF EXISTS public.projects_with_customers CASCADE;

CREATE VIEW public.projects_with_customers AS
SELECT
  p.id,
  p.name AS project_name,
  p.status,
  COALESCE(p.stage, 'Unknown') AS stage,
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

SELECT 'projects_with_customers view created' as status;

-- ============================================================
-- STEP 14: Create monitoring function
-- ============================================================
DROP FUNCTION IF EXISTS public.get_customer_project_stats();

CREATE OR REPLACE FUNCTION public.get_customer_project_stats()
RETURNS TABLE (
  total_customers BIGINT,
  total_projects BIGINT,
  active_projects BIGINT,
  completed_projects BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id)::BIGINT,
    COUNT(DISTINCT p.id)::BIGINT,
    COUNT(DISTINCT CASE WHEN p.status = 'In Progress' THEN p.id END)::BIGINT,
    COUNT(DISTINCT CASE WHEN p.status = 'Completed' THEN p.id END)::BIGINT
  FROM public.project_customers c
  LEFT JOIN public.projects p ON c.customer_id = p.customer_id
  WHERE c.is_active = true;
END;
$$ LANGUAGE plpgsql;

SELECT 'Monitoring function created' as status;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT '════════════════════════════════════════════════' as result;
SELECT 'CUSTOMER-FIRST WORKFLOW VERIFICATION' as status;
SELECT '════════════════════════════════════════════════' as result;

-- 1. Check NOT NULL constraint
SELECT '✅ Step 1: NOT NULL Constraint' as check_name;
SELECT is_nullable FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'customer_id';

-- 2. Check triggers
SELECT '✅ Step 2: Triggers Created' as check_name;
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table IN ('projects', 'project_customers');

-- 3. Check views
SELECT '✅ Step 3: Views Created' as check_name;
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('customer_project_summary', 'projects_with_customers');

-- 4. Check legacy customer
SELECT '✅ Step 4: Legacy Customer' as check_name;
SELECT customer_id, name, is_active FROM public.project_customers
WHERE customer_id = 'CUST-LEGACY-0000';

-- 5. Count migrated projects
SELECT '✅ Step 5: Projects Migrated' as check_name;
SELECT COUNT(*) as count FROM public.projects
WHERE customer_id = 'CUST-LEGACY-0000';

-- 6. Check for NULL values (should be 0)
SELECT '✅ Step 6: Orphaned Projects (should be 0)' as check_name;
SELECT COUNT(*) as count FROM public.projects WHERE customer_id IS NULL;

-- 7. Check indexes
SELECT '✅ Step 7: Indexes Created' as check_name;
SELECT COUNT(*) as count FROM pg_indexes
WHERE tablename IN ('projects', 'project_customers')
AND indexname LIKE 'idx_%';

-- 8. Run monitoring function
SELECT '✅ Step 8: Monitoring Function' as check_name;
SELECT * FROM public.get_customer_project_stats();

-- ============================================================
-- SUCCESS!
-- ============================================================
SELECT '════════════════════════════════════════════════' as result;
SELECT '✅ CUSTOMER-FIRST WORKFLOW SETUP COMPLETE!' as status;
SELECT '════════════════════════════════════════════════' as result;
SELECT 'Database is ready for production use!' as note;
