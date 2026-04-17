-- ============================================================
-- Create Stage Checklists & Metrics Tables
-- Date: April 17, 2026
-- Description: Track construction stage progress with checklists and metrics
-- ============================================================

-- ============================================================
-- Step 1: Create construction_stage_metrics table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.construction_stage_metrics (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_name                  TEXT NOT NULL,
  stage_sequence              INTEGER,
  planned_start_date          DATE,
  actual_start_date           DATE,
  planned_end_date            DATE,
  actual_end_date             DATE,
  completion_percentage       INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  time_spent_hours            DECIMAL(10,2),
  team_members_assigned       INTEGER,
  photos_count                INTEGER DEFAULT 0,
  checklist_items_total       INTEGER DEFAULT 0,
  checklist_items_completed   INTEGER DEFAULT 0,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, stage_name)
);

-- ============================================================
-- Step 2: Create stage_checklists table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stage_checklists (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_name            TEXT NOT NULL,
  item_number           INTEGER,
  item_description      TEXT NOT NULL,
  is_completed          BOOLEAN DEFAULT false,
  completed_by          UUID,
  completed_at          TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 3: Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stage_metrics_project_id ON public.construction_stage_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_stage_metrics_stage_name ON public.construction_stage_metrics(stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_metrics_project_stage ON public.construction_stage_metrics(project_id, stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_checklists_project_id ON public.stage_checklists(project_id);
CREATE INDEX IF NOT EXISTS idx_stage_checklists_stage_name ON public.stage_checklists(stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_checklists_project_stage ON public.stage_checklists(project_id, stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_checklists_item_number ON public.stage_checklists(item_number);
CREATE INDEX IF NOT EXISTS idx_stage_checklists_completed ON public.stage_checklists(is_completed);

-- ============================================================
-- Step 4: Enable RLS on both tables
-- ============================================================
ALTER TABLE public.construction_stage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_checklists ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 5: Create RLS Policies for authenticated access
-- ============================================================

-- Construction Stage Metrics: Allow authenticated users to view/modify all metrics
DROP POLICY IF EXISTS "stage_metrics_auth" ON public.construction_stage_metrics;
CREATE POLICY "stage_metrics_auth"
  ON public.construction_stage_metrics FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Stage Checklists: Allow authenticated users to view/modify all checklist items
DROP POLICY IF EXISTS "stage_checklists_auth" ON public.stage_checklists;
CREATE POLICY "stage_checklists_auth"
  ON public.stage_checklists FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Success! Stage Checklists tables created
-- ============================================================
SELECT 'Stage Checklists & Metrics tables created successfully!' as status;
