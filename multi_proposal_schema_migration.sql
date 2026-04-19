-- ============================================================
-- MULTI-PROPOSAL SCHEMA MIGRATION
-- Support multiple estimation and negotiation proposals per project
-- ============================================================

-- ============================================================
-- CREATE PROPOSAL_REFERENCES TABLE
-- Tracks unique proposals with reference numbers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.proposal_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  proposal_number TEXT UNIQUE NOT NULL,
  proposal_type TEXT NOT NULL,
  parent_proposal_id UUID,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Add foreign keys separately
DO $$
BEGIN
  ALTER TABLE public.proposal_references
  ADD CONSTRAINT fk_proposal_refs_project_id
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.proposal_references
  ADD CONSTRAINT fk_proposal_refs_parent_id
  FOREIGN KEY (parent_proposal_id) REFERENCES public.proposal_references(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposal_refs_project_id ON public.proposal_references(project_id);
CREATE INDEX IF NOT EXISTS idx_proposal_refs_type ON public.proposal_references(proposal_type);
CREATE INDEX IF NOT EXISTS idx_proposal_refs_parent ON public.proposal_references(parent_proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_refs_number ON public.proposal_references(proposal_number);

-- ============================================================
-- UPDATE PROJECT_ESTIMATES TABLE
-- Add proposal reference and selected stages
-- ============================================================

ALTER TABLE public.project_estimates
ADD COLUMN IF NOT EXISTS proposal_id UUID,
ADD COLUMN IF NOT EXISTS selected_stage_ids TEXT;

-- Add foreign key constraint
DO $$
BEGIN
  ALTER TABLE public.project_estimates
  ADD CONSTRAINT fk_project_estimates_proposal_id
  FOREIGN KEY (proposal_id) REFERENCES public.proposal_references(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create index on proposal_id
CREATE INDEX IF NOT EXISTS idx_project_estimates_proposal_id ON public.project_estimates(proposal_id);

-- ============================================================
-- UPDATE PROJECT_INVOICES TABLE
-- Link invoices to proposal references
-- ============================================================

ALTER TABLE public.project_invoices
ADD COLUMN IF NOT EXISTS proposal_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
  ALTER TABLE public.project_invoices
  ADD CONSTRAINT fk_project_invoices_proposal_id
  FOREIGN KEY (proposal_id) REFERENCES public.proposal_references(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_project_invoices_proposal_id ON public.project_invoices(proposal_id);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Show new table
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'proposal_references';

-- Show new columns
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('project_estimates', 'project_invoices')
ORDER BY table_name, ordinal_position;
