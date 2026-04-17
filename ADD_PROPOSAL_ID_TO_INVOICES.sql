-- ============================================================
-- Migration: Add proposal_id to project_invoices table
-- Date: March 25, 2026
-- ============================================================

-- Add proposal_id column to link invoices to proposals
ALTER TABLE public.project_invoices
ADD COLUMN IF NOT EXISTS proposal_id UUID;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_invoices_proposal_id ON public.project_invoices(proposal_id);

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'project_invoices'
AND column_name = 'proposal_id';
