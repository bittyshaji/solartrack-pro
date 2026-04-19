-- ============================================================
-- CUSTOMER-FIRST WORKFLOW - COMPLETE SETUP SCRIPT
-- Handles both migration and schema setup
-- Execute this instead of the original SCHEMA.sql
-- ============================================================

-- ============================================================
-- STEP 1: Create Legacy Customer for existing projects
-- ============================================================
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
)
ON CONFLICT (customer_id) DO NOTHING;

-- ============================================================
-- STEP 2: Migrate existing projects without customer
-- ============================================================
UPDATE public.projects
SET customer_id = 'CUST-LEGACY-0000'
WHERE customer_id IS NULL;

-- ============================================================
-- STEP 3: Apply NOT NULL Constraint
-- ============================================================
ALTER TABLE public.projects
ALTER COLUMN customer_id SET NOT NULL;

-- ============================================================
-- STEP 4: Create Function to Verify Customer Exists
-- ============================================================
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
-- STEP 5: Create Trigger on projects Table
-- ============================================================
DROP TRIGGER IF EXISTS projects_customer_validation ON public.projects;

CREATE TRIGGER projects_customer_validation
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.verify_customer_exists();

-- ============================================================
-- STEP 6: Create Function to Prevent Customer Deletion with Projects
-- ============================================================
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
-- STEP 7: Create Trigger on project_customers Table
-- ============================================================
DROP TRIGGER IF EXISTS prevent_customer_deletion ON public.project_customers;

CREATE TRIGGER prevent_customer_deletion
BEFORE UPDATE ON public.project_customers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_customer_deletion_with_projects();

-- ============================================================
-- STEP 8: Create Indexes for Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_customer_id
ON public.projects(customer_id);

CREATE INDEX IF NOT EXISTS idx_projects_customer_status
ON public.projects(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_project_customers_is_active
ON public.project_customers(is_active);

CREATE INDEX IF NOT EXISTS idx_project_customers_active_name
ON public.project_customers(is_active, name);

-- ============================================================
-- STEP 9: Create Helper View - Customer Project Summary
-- ============================================================
DROP VIEW IF EXISTS public.customer_project_summary;

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
-- STEP 10: Create Helper View - Projects With Customer Details
-- ============================================================
DROP VIEW IF EXISTS public.projects_with_customers;

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
-- STEP 11: Create Monitoring Function
-- ============================================================
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
-- STEP 12: Update RLS Policies
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.project_customers;

CREATE POLICY "Authenticated users can manage customers"
  ON public.project_customers
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify everything was set up correctly

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as verification;
SELECT 'CUSTOMER-FIRST WORKFLOW VERIFICATION' as status;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as verification;

-- 1. Check NOT NULL constraint
SELECT 'Step 1: NOT NULL Constraint' as check_name;
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'customer_id';

-- 2. Check triggers
SELECT 'Step 2: Triggers' as check_name;
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table IN ('projects', 'project_customers')
ORDER BY trigger_name;

-- 3. Check views
SELECT 'Step 3: Views' as check_name;
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('customer_project_summary', 'projects_with_customers')
ORDER BY table_name;

-- 4. Check legacy customer
SELECT 'Step 4: Legacy Customer' as check_name;
SELECT customer_id, name, email, is_active
FROM public.project_customers
WHERE customer_id = 'CUST-LEGACY-0000';

-- 5. Check projects assigned to legacy
SELECT 'Step 5: Projects in Legacy' as check_name;
SELECT COUNT(*) as project_count
FROM public.projects
WHERE customer_id = 'CUST-LEGACY-0000';

-- 6. Check for NULL customer_ids (should be 0)
SELECT 'Step 6: Orphaned Projects (should be 0)' as check_name;
SELECT COUNT(*) as null_customer_count
FROM public.projects
WHERE customer_id IS NULL;

-- 7. Check all indexes
SELECT 'Step 7: Indexes Created' as check_name;
SELECT indexname FROM pg_indexes
WHERE tablename IN ('projects', 'project_customers')
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- 8. Test monitoring function
SELECT 'Step 8: Monitoring Function' as check_name;
SELECT * FROM public.get_customer_project_stats();

-- ============================================================
-- SUCCESS!
-- ============================================================
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as result;
SELECT '✅ Customer-First Workflow Setup Complete!' as status;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as result;

SELECT 'All existing projects migrated to legacy customer' as note_1;
SELECT 'NOT NULL constraint applied successfully' as note_2;
SELECT 'Triggers, views, and indexes created' as note_3;
SELECT 'Ready for production use!' as note_4;
