-- ============================================================
-- MIGRATE EXISTING PROJECTS TO CUSTOMER-FIRST WORKFLOW
-- Handle projects that exist without customer_id
-- ============================================================

-- STEP 1: Review projects without customers
-- ============================================================
SELECT 'Projects without customer_id:' as status;
SELECT id, name, created_at FROM public.projects WHERE customer_id IS NULL;

-- Count orphaned projects
SELECT COUNT(*) as orphaned_project_count FROM public.projects WHERE customer_id IS NULL;

-- ============================================================
-- STEP 2: Create a Legacy/Default Customer
-- ============================================================
-- This customer will be used for existing projects

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
  'Legacy Projects',
  'legacy@solartrack.local',
  'SolarTrack Legacy',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (customer_id) DO NOTHING;

SELECT 'Legacy customer created: CUST-LEGACY-0000' as status;

-- ============================================================
-- STEP 3: Assign all orphaned projects to Legacy Customer
-- ============================================================
UPDATE public.projects
SET customer_id = 'CUST-LEGACY-0000',
    updated_at = NOW()
WHERE customer_id IS NULL;

SELECT 'All orphaned projects assigned to legacy customer' as status;

-- Verify the update
SELECT COUNT(*) as projects_assigned FROM public.projects WHERE customer_id = 'CUST-LEGACY-0000';

-- ============================================================
-- STEP 4: Verify no more NULL customer_id values
-- ============================================================
SELECT COUNT(*) as null_customer_ids FROM public.projects WHERE customer_id IS NULL;
-- Expected: 0

-- ============================================================
-- STEP 5: Now safe to apply NOT NULL constraint
-- ============================================================
ALTER TABLE public.projects
ALTER COLUMN customer_id SET NOT NULL;

SELECT 'NOT NULL constraint applied successfully' as status;

-- ============================================================
-- SUCCESS!
-- ============================================================
SELECT 'Migration complete! Projects are now customer-first workflow compatible.' as status;

-- Review the results
SELECT
  c.name as customer,
  COUNT(p.id) as project_count
FROM public.project_customers c
LEFT JOIN public.projects p ON c.customer_id = p.customer_id
WHERE c.customer_id = 'CUST-LEGACY-0000'
GROUP BY c.name;
