-- Check Supabase version and settings
SELECT version();

-- Check if extensions are installed
SELECT * FROM pg_extension;

-- Check if there are any triggers on the public schema
SELECT * FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check if there are any views that might interfere
SELECT * FROM information_schema.views
WHERE table_schema = 'public';

-- List all tables in public schema
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
