-- Show all columns in projects table
SELECT * FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;