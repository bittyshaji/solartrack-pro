-- ============================================================
-- Migration: Add Customer Name and Phone to project_estimates
-- Date: March 25, 2026
-- ============================================================

-- Add customer_name column
ALTER TABLE public.project_estimates
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add customer_phone column
ALTER TABLE public.project_estimates
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_estimates_customer_name ON public.project_estimates(customer_name);

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'project_estimates'
AND column_name IN ('customer_name', 'customer_phone')
ORDER BY ordinal_position;
