-- ============================================================
-- CUSTOMER-FIRST WORKFLOW - DATABASE SCHEMA IMPLEMENTATION
-- SolarTrack Pro
-- Date: April 19, 2026
-- ============================================================

-- ============================================================
-- STEP 1: Add NOT NULL Constraint to projects.customer_id
-- ============================================================
-- This ensures every project MUST have a customer
ALTER TABLE IF EXISTS public.projects
ALTER COLUMN customer_id SET NOT NULL;

-- ============================================================
-- STEP 2: Create Function to Verify Customer Exists
-- ============================================================
-- This trigger will prevent creation of projects with invalid customers
CREATE OR REPLACE FUNCTION public.verify_customer_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Check that customer_id is not null
  IF NEW.customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required for project creation';
  END IF;

  -- Verify the referenced customer actually exists and is active
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
-- STEP 3: Create Trigger on projects Table
-- ============================================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS projects_customer_validation ON public.projects;

-- Create new trigger that validates customer on INSERT or UPDATE
CREATE TRIGGER projects_customer_validation
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.verify_customer_exists();

-- ============================================================
-- STEP 4: Add Indexes for Performance
-- ============================================================
-- Index for customer-project lookups
CREATE INDEX IF NOT EXISTS idx_projects_customer_id
ON public.projects(customer_id);

-- Index for quick project status/stage queries by customer
CREATE INDEX IF NOT EXISTS idx_projects_customer_status
ON public.projects(customer_id, status);

-- Index for customer active status
CREATE INDEX IF NOT EXISTS idx_project_customers_is_active
ON public.project_customers(is_active);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_project_customers_active_name
ON public.project_customers(is_active, name);

-- ============================================================
-- STEP 5: Create Helper View - Customer Project Summary
-- ============================================================
-- This view provides a quick overview of each customer and their projects
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

-- Grant view permissions
GRANT SELECT ON public.customer_project_summary TO authenticated;
GRANT SELECT ON public.customer_project_summary TO anon;

-- ============================================================
-- STEP 6: Create Helper View - Projects With Customer Details
-- ============================================================
-- This view joins projects with customer information
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

-- Grant view permissions
GRANT SELECT ON public.projects_with_customers TO authenticated;
GRANT SELECT ON public.projects_with_customers TO anon;

-- ============================================================
-- STEP 7: Create Function to Prevent Customer Deletion if Projects Exist
-- ============================================================
-- Prevent deleting a customer that has projects
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_customer_deletion ON public.project_customers;

-- Create trigger
CREATE TRIGGER prevent_customer_deletion
BEFORE UPDATE ON public.project_customers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_customer_deletion_with_projects();

-- ============================================================
-- STEP 8: Update RLS Policies
-- ============================================================
-- Ensure authenticated users can read customer information
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.project_customers;

CREATE POLICY "Authenticated users can manage customers"
  ON public.project_customers
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- STEP 9: Create Status Monitoring Function
-- ============================================================
-- This function gets statistics about the customer-project relationship
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
-- STEP 10: Validate Existing Data
-- ============================================================
-- Find projects without customers (these will fail after NOT NULL constraint)
-- SELECT id, name, created_at FROM public.projects WHERE customer_id IS NULL;

-- Find customers with projects
-- SELECT c.customer_id, c.name, COUNT(p.id) as project_count
-- FROM public.project_customers c
-- LEFT JOIN public.projects p ON c.customer_id = p.customer_id
-- GROUP BY c.customer_id, c.name
-- ORDER BY project_count DESC;

-- ============================================================
-- STEP 11: Verification Queries
-- ============================================================
-- Run these to verify the implementation:

-- Check NOT NULL constraint is applied
-- SELECT column_name, is_nullable FROM information_schema.columns
-- WHERE table_name = 'projects' AND column_name = 'customer_id';

-- Check triggers are created
-- SELECT trigger_name FROM information_schema.triggers
-- WHERE event_object_table = 'projects' OR event_object_table = 'project_customers';

-- Check indexes are created
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('projects', 'project_customers')
-- ORDER BY indexname;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
SELECT 'Customer-First Workflow schema successfully implemented!' as status;

-- List of changes applied:
-- ✅ 1. Added NOT NULL constraint to projects.customer_id
-- ✅ 2. Created verify_customer_exists() trigger function
-- ✅ 3. Created projects_customer_validation trigger
-- ✅ 4. Created performance indexes
-- ✅ 5. Created customer_project_summary view
-- ✅ 6. Created projects_with_customers view
-- ✅ 7. Created prevent_customer_deletion_with_projects() function
-- ✅ 8. Updated RLS policies
-- ✅ 9. Created get_customer_project_stats() function
-- ✅ 10. All changes logged and documented
