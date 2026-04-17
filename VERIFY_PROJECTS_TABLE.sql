-- ============================================================
-- VERIFY PROJECTS TABLE STRUCTURE
-- Run this FIRST to check if projects table exists and has correct columns
-- ============================================================

-- Check if projects table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'projects'
);

-- If table exists, show all columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;

-- Show table constraints and primary key
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'projects';
