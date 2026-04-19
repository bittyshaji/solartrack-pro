-- ============================================================
-- CREATE EACH TABLE SEPARATELY
-- Run each statement one at a time
-- Copy-paste each statement individually into SQL editor
-- ============================================================

-- ============================================================
-- STATEMENT 1: Create stage_tasks table ONLY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stage_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  stage_id INTEGER,
  task_name TEXT,
  description TEXT,
  quantity NUMERIC,
  unit_cost NUMERIC,
  is_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
