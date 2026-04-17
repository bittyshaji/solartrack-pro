-- ============================================================
-- DIAGNOSE PROJECTS TABLE - SHOW ALL DETAILS
-- Run this to see exactly what columns exist in projects table
-- ============================================================

-- Show all columns with their types
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;

-- Show the primary key column(s)
SELECT
  a.attname AS column_name,
  format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid
    AND a.attnum = ANY(i.indkey)
WHERE i.indrelname = 'projects_pkey';

-- Show first few rows to see actual data
SELECT * FROM public.projects LIMIT 5;
