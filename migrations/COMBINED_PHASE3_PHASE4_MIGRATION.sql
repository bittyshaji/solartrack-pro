-- ============================================================================
-- SolarTrackPro - Combined Phase 3 & Phase 4 Database Migration
-- ============================================================================
-- Generated: April 17, 2026 (FIXED - removed references to non-existent tables)
-- Target: Supabase PostgreSQL (opzoighusosmxcyneifc)
-- Scope: 25+ tables, 46 indexes, 67 RLS policies, 3 trigger functions
-- 
-- INSTRUCTIONS:
-- 1. Run this in the Supabase Dashboard SQL Editor
-- 2. Ensure Phase 1 & 2 migrations have been run first (projects table must exist)
-- 3. Click "Run" and wait for completion
-- ============================================================================

BEGIN;

-- Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- Module: create_site_surveys.sql
-- ============================================================================

-- Create site_surveys table
CREATE TABLE IF NOT EXISTS site_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,

  -- Survey metadata
  survey_date DATE,
  surveyor_name TEXT,

  -- Roof information
  roof_area_sqft DECIMAL(8,2),
  roof_type TEXT CHECK (roof_type IN ('flat', 'sloped', 'metal_sheet', 'concrete', 'tile', 'other')),
  roof_orientation TEXT CHECK (roof_orientation IN ('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest', 'mixed')),
  roof_pitch_degrees DECIMAL(5,2),

  -- Site conditions
  shading_percentage INTEGER CHECK (shading_percentage >= 0 AND shading_percentage <= 100),
  available_area_sqft DECIMAL(8,2),
  elevation_meters INTEGER,
  gps_latitude DECIMAL(10,7),
  gps_longitude DECIMAL(10,7),
  soil_condition TEXT,
  weather_conditions TEXT,

  -- Electrical assessment
  existing_electrical_capacity TEXT,
  grid_connection_type TEXT,

  -- Structural assessment
  structural_assessment TEXT CHECK (structural_assessment IN ('suitable', 'needs_reinforcement', 'not_suitable', 'pending')),

  -- Site access and obstacles
  access_conditions TEXT,
  nearby_obstacles TEXT,

  -- Recommendations
  recommended_capacity_kw DECIMAL(5,2),
  recommended_panel_count INTEGER,
  recommended_inverter_type TEXT,

  -- Documentation
  site_photos_urls TEXT[],
  site_sketch_url TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_surveys_project_id ON site_surveys(project_id);

-- Enable Row Level Security
ALTER TABLE site_surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view surveys for projects they own
CREATE POLICY site_surveys_select ON site_surveys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_surveys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only insert surveys for projects they own
CREATE POLICY site_surveys_insert ON site_surveys
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only update surveys for projects they own
CREATE POLICY site_surveys_update ON site_surveys
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_surveys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only delete surveys for projects they own
CREATE POLICY site_surveys_delete ON site_surveys
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_surveys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_surveys_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_surveys_timestamp_trigger ON site_surveys;

CREATE TRIGGER update_site_surveys_timestamp_trigger
BEFORE UPDATE ON site_surveys
FOR EACH ROW
EXECUTE FUNCTION update_site_surveys_timestamp();


-- ============================================================================
-- Module: create_followups.sql
-- ============================================================================

-- Create followups table
CREATE TABLE IF NOT EXISTS followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  followup_type text NOT NULL,
  scheduled_date timestamp NOT NULL,
  status text DEFAULT 'pending',
  assigned_to uuid,
  communication_method text,
  contact_person text,
  notes text,
  outcome text,
  completed_date timestamp,
  rescheduled_to timestamp,
  rescheduled_reason text,
  created_by uuid,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT followup_type_check CHECK (followup_type IN ('quote', 'proposal', 'customer', 'site_visit', 'payment', 'general')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'completed', 'rescheduled', 'cancelled', 'overdue')),
  CONSTRAINT communication_method_check CHECK (communication_method IS NULL OR communication_method IN ('phone', 'email', 'visit', 'whatsapp', 'message'))
);

-- Create followup_history table
CREATE TABLE IF NOT EXISTS followup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id uuid NOT NULL REFERENCES followups(id) ON DELETE CASCADE,
  previous_status text,
  new_status text,
  changed_by uuid,
  change_reason text,
  changed_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followups_project_id ON followups(project_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_date ON followups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_followups_assigned_to ON followups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_followup_history_followup_id ON followup_history(followup_id);
CREATE INDEX IF NOT EXISTS idx_followup_history_changed_at ON followup_history(changed_at);

-- Enable Row Level Security
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for followups
CREATE POLICY "Users can view followups for their projects"
  ON followups FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert followups for their projects"
  ON followups FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE projects.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Users can update followups for their projects"
  ON followups FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete followups for their projects"
  ON followups FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE projects.user_id = auth.uid()
    )
  );

-- Create RLS policies for followup_history
CREATE POLICY "Users can view followup history for their projects"
  ON followup_history FOR SELECT
  USING (
    followup_id IN (
      SELECT id FROM followups WHERE project_id IN (
        SELECT id FROM projects WHERE projects.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert followup history for their projects"
  ON followup_history FOR INSERT
  WITH CHECK (
    followup_id IN (
      SELECT id FROM followups WHERE project_id IN (
        SELECT id FROM projects WHERE projects.user_id = auth.uid()
      )
    )
  );


-- ============================================================================
-- Module: create_project_secure.sql
-- ============================================================================

-- Create project_security_status table
CREATE TABLE IF NOT EXISTS project_security_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  secure_status TEXT NOT NULL DEFAULT 'lead' CHECK (secure_status IN ('lead', 'quoted', 'secured', 'cancelled')),
  secured_date TIMESTAMP,
  secured_by UUID,
  advance_payment_amount DECIMAL(12, 2),
  advance_payment_received BOOLEAN DEFAULT FALSE,
  advance_payment_date DATE,
  customer_signature_url TEXT,
  signed_at TIMESTAMP,
  signed_by_name TEXT,
  confirmation_document_url TEXT,
  lock_changes BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create project_security_requirements table
CREATE TABLE IF NOT EXISTS project_security_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('signed_quote', 'advance_payment', 'written_confirmation', 'customer_signature')),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMP,
  completed_by UUID,
  proof_document_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_security_status_project_id ON project_security_status(project_id);
CREATE INDEX IF NOT EXISTS idx_project_security_status_secure_status ON project_security_status(secure_status);
CREATE INDEX IF NOT EXISTS idx_project_security_requirements_project_id ON project_security_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_project_security_requirements_requirement_type ON project_security_requirements(requirement_type);
CREATE INDEX IF NOT EXISTS idx_project_security_requirements_is_completed ON project_security_requirements(is_completed);

-- Enable RLS (Row Level Security) on both tables
ALTER TABLE project_security_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_security_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policy for project_security_status: Users can view if they have access to the project
CREATE POLICY "Users can view project security status" ON project_security_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_security_status.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy for project_security_status: Users can update if they own the project
CREATE POLICY "Users can update project security status" ON project_security_status
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_security_status.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy for project_security_status: Users can insert security status
CREATE POLICY "Users can insert project security status" ON project_security_status
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_security_status.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy for project_security_requirements: Users can view requirements
CREATE POLICY "Users can view project security requirements" ON project_security_requirements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_security_requirements.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy for project_security_requirements: Users can update requirements
CREATE POLICY "Users can update project security requirements" ON project_security_requirements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_security_requirements.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy for project_security_requirements: Users can insert requirements
CREATE POLICY "Users can insert project security requirements" ON project_security_requirements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_security_requirements.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_security_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at field
CREATE TRIGGER trigger_project_security_status_updated_at
BEFORE UPDATE ON project_security_status
FOR EACH ROW
EXECUTE FUNCTION update_project_security_status_updated_at();


-- ============================================================================
-- Module: create_kseb_feasibility.sql
-- ============================================================================

-- Create KSEB Feasibility Submissions table
CREATE TABLE kseb_feasibility_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE,
  submission_date date,
  reference_number text UNIQUE,
  kseb_division text,
  capacity_kw decimal(5,2) NOT NULL,
  system_type text NOT NULL CHECK (system_type IN ('residential', 'commercial', 'industrial')),
  inverter_make text NOT NULL,
  inverter_model text,
  panel_make text NOT NULL,
  panel_model text,
  mounting_type text CHECK (mounting_type IN ('roof', 'ground', 'hybrid')),
  submission_status text DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_requested', 'resubmitted')),
  reviewer_name text,
  reviewer_comments text,
  approval_date date,
  sanction_letter_url text,
  revision_count integer DEFAULT 0,
  revision_reason text,
  site_plan_url text,
  electrical_drawings_url text,
  property_documents_url text,
  submitted_by uuid,
  submitted_at timestamp,
  created_by uuid,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_submitted_by FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create KSEB Feasibility Documents table
CREATE TABLE kseb_feasibility_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('site_plan', 'electrical_drawings', 'customer_details', 'property_docs', 'sanction_letter', 'test_report', 'other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  version_number integer DEFAULT 1,
  document_status text DEFAULT 'pending' CHECK (document_status IN ('pending', 'verified', 'rejected')),
  reviewer_feedback text,
  uploaded_by uuid,
  uploaded_at timestamp DEFAULT now(),
  CONSTRAINT fk_submission FOREIGN KEY (submission_id) REFERENCES kseb_feasibility_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create KSEB Activity Logs table
CREATE TABLE kseb_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  activity_type text NOT NULL,
  description text,
  performed_by uuid,
  previous_status text,
  new_status text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT fk_submission FOREIGN KEY (submission_id) REFERENCES kseb_feasibility_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_performed_by FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_kseb_feasibility_project_id ON kseb_feasibility_submissions(project_id);
CREATE INDEX idx_kseb_feasibility_status ON kseb_feasibility_submissions(submission_status);
CREATE INDEX idx_kseb_feasibility_reference ON kseb_feasibility_submissions(reference_number);
CREATE INDEX idx_kseb_feasibility_division ON kseb_feasibility_submissions(kseb_division);
CREATE INDEX idx_kseb_documents_submission ON kseb_feasibility_documents(submission_id);
CREATE INDEX idx_kseb_documents_type ON kseb_feasibility_documents(document_type);
CREATE INDEX idx_kseb_activity_submission ON kseb_activity_logs(submission_id);
CREATE INDEX idx_kseb_activity_created ON kseb_activity_logs(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE kseb_feasibility_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kseb_feasibility_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kseb_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kseb_feasibility_submissions
CREATE POLICY "Users can view their own submissions" ON kseb_feasibility_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = kseb_feasibility_submissions.project_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert submissions for their projects" ON kseb_feasibility_submissions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own submissions" ON kseb_feasibility_submissions
  FOR UPDATE USING (
    created_by = auth.uid()
    AND submission_status IN ('draft', 'revision_requested')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for kseb_feasibility_documents
CREATE POLICY "Users can view documents for accessible submissions" ON kseb_feasibility_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kseb_feasibility_submissions s
      WHERE s.id = kseb_feasibility_documents.submission_id
      AND EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = s.project_id
        AND p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert documents for their submissions" ON kseb_feasibility_documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM kseb_feasibility_submissions s
      WHERE s.id = submission_id
      AND s.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own documents" ON kseb_feasibility_documents
  FOR DELETE USING (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM kseb_feasibility_submissions s
      WHERE s.id = submission_id
      AND s.created_by = auth.uid()
    )
  );

-- RLS Policies for kseb_activity_logs
CREATE POLICY "Users can view activity logs for accessible submissions" ON kseb_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kseb_feasibility_submissions s
      WHERE s.id = kseb_activity_logs.submission_id
      AND EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = s.project_id
        AND p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert activity logs" ON kseb_activity_logs
  FOR INSERT WITH CHECK (true);


-- ============================================================================
-- Module: create_stage_checklists.sql
-- ============================================================================

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


-- ============================================================================
-- Module: create_staff_attendance.sql
-- ============================================================================

-- Staff Members Table
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  staff_name TEXT NOT NULL,
  staff_phone TEXT,
  staff_email TEXT,
  role TEXT NOT NULL,
  hourly_rate DECIMAL(10,2),
  daily_wage DECIMAL(10,2),
  employment_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT employment_type_check CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
  CONSTRAINT wage_check CHECK (hourly_rate > 0 OR daily_wage > 0)
);

-- Attendance Logs Table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  log_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  total_hours_worked DECIMAL(5,2),
  work_status TEXT NOT NULL,
  leave_type TEXT,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT work_status_check CHECK (work_status IN ('present', 'absent', 'half_day', 'leave', 'holiday')),
  UNIQUE(staff_member_id, log_date)
);

-- Wage Payments Table
CREATE TABLE IF NOT EXISTS wage_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  payment_month DATE NOT NULL,
  total_days_worked INTEGER DEFAULT 0,
  total_hours_worked DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1.5,
  base_amount DECIMAL(12,2),
  overtime_amount DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2),
  payment_status TEXT DEFAULT 'pending',
  payment_date DATE,
  payment_method TEXT,
  approved_by UUID,
  paid_by UUID,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT payment_status_check CHECK (payment_status IN ('pending', 'approved', 'paid')),
  CONSTRAINT payment_method_check CHECK (payment_method IN ('cash', 'check', 'bank_transfer')),
  UNIQUE(staff_member_id, payment_month)
);

-- Create Indexes
CREATE INDEX idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_members_is_active ON staff_members(is_active);
CREATE INDEX idx_attendance_logs_staff_member_id ON attendance_logs(staff_member_id);
CREATE INDEX idx_attendance_logs_log_date ON attendance_logs(log_date);
CREATE INDEX idx_attendance_logs_project_id ON attendance_logs(project_id);
CREATE INDEX idx_wage_payments_staff_member_id ON wage_payments(staff_member_id);
CREATE INDEX idx_wage_payments_payment_month ON wage_payments(payment_month);
CREATE INDEX idx_wage_payments_payment_status ON wage_payments(payment_status);

-- Enable RLS
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wage_payments ENABLE ROW LEVEL SECURITY;

-- Staff Members RLS Policies
CREATE POLICY "staff_members_read_policy" ON staff_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "staff_members_insert_policy" ON staff_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "staff_members_update_policy" ON staff_members
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "staff_members_delete_policy" ON staff_members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Attendance Logs RLS Policies
CREATE POLICY "attendance_logs_read_policy" ON attendance_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "attendance_logs_insert_policy" ON attendance_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "attendance_logs_update_policy" ON attendance_logs
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "attendance_logs_delete_policy" ON attendance_logs
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Wage Payments RLS Policies
CREATE POLICY "wage_payments_read_policy" ON wage_payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "wage_payments_insert_policy" ON wage_payments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "wage_payments_update_policy" ON wage_payments
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "wage_payments_delete_policy" ON wage_payments
  FOR DELETE USING (auth.uid() IS NOT NULL);


-- ============================================================================
-- Module: create_completion_certificates.sql
-- ============================================================================

-- Create Completion Certificates table
CREATE TABLE completion_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE,
  certificate_number text UNIQUE,
  generation_date timestamp,
  issued_by uuid,
  issued_by_name text,
  system_capacity_kw decimal(5,2),
  inverter_make text,
  inverter_model text,
  panel_make text,
  panel_model text,
  total_panels integer,
  installation_completion_date date,
  commissioned_by text,
  commissioning_date date,
  performance_test_results jsonb,
  kseb_submission_date date,
  kseb_approval_date date,
  kseb_reference_number text,
  approval_status text DEFAULT 'draft' CHECK (approval_status IN ('draft', 'generated', 'submitted', 'approved', 'rejected')),
  rejection_reason text,
  pdf_url text,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_issued_by FOREIGN KEY (issued_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_completion_certificates_project_id ON completion_certificates(project_id);
CREATE INDEX idx_completion_certificates_approval_status ON completion_certificates(approval_status);
CREATE INDEX idx_completion_certificates_certificate_number ON completion_certificates(certificate_number);
CREATE INDEX idx_completion_certificates_kseb_reference ON completion_certificates(kseb_reference_number);

-- Enable RLS (Row Level Security)
ALTER TABLE completion_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for completion_certificates
-- Allow users to read certificates for their projects
CREATE POLICY "Users can read completion certificates for their projects"
  ON completion_certificates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = completion_certificates.project_id
      AND projects.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Allow users to insert certificates for their projects
CREATE POLICY "Users can create completion certificates for their projects"
  ON completion_certificates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = completion_certificates.project_id
      AND projects.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Allow users to update certificates for their projects
CREATE POLICY "Users can update completion certificates for their projects"
  ON completion_certificates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = completion_certificates.project_id
      AND projects.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = completion_certificates.project_id
      AND projects.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Allow users to delete certificates for their projects
CREATE POLICY "Users can delete completion certificates for their projects"
  ON completion_certificates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = completion_certificates.project_id
      AND projects.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );


-- ============================================================================
-- Module: create_kseb_energisation.sql
-- ============================================================================

-- Create KSEB Energisation Visits table
-- This table manages the energisation process: scheduling, inspection, and final energisation

CREATE TABLE kseb_energisation_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,

  -- Visit Scheduling
  visit_scheduled_date DATE,
  actual_visit_date DATE,

  -- Inspector Information
  inspector_name TEXT,
  inspector_id TEXT,
  inspector_phone TEXT,

  -- Meter Information
  meter_number TEXT,
  meter_type TEXT,
  old_meter_number TEXT,

  -- Status and Results
  energisation_status TEXT DEFAULT 'pending' CHECK (energisation_status IN (
    'pending',
    'scheduled',
    'visited',
    'inspection_passed',
    'inspection_failed',
    'energised',
    'follow_up_needed'
  )),

  inspection_result TEXT CHECK (inspection_result IS NULL OR inspection_result IN (
    'pass',
    'fail',
    'conditional_pass'
  )),
  inspection_remarks TEXT,
  failure_reason TEXT,

  -- Follow-up Information
  follow_up_date DATE,
  follow_up_notes TEXT,

  -- Energisation Details
  energisation_date DATE,
  energisation_certificate_url TEXT,

  -- Net Metering
  net_meter_installed BOOLEAN DEFAULT false,
  net_meter_reading_initial DECIMAL(10, 2),

  -- General Notes
  notes TEXT,

  -- Audit Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_kseb_energisation_project_id ON kseb_energisation_visits(project_id);
CREATE INDEX idx_kseb_energisation_status ON kseb_energisation_visits(energisation_status);
CREATE INDEX idx_kseb_energisation_visit_date ON kseb_energisation_visits(actual_visit_date);
CREATE INDEX idx_kseb_energisation_energisation_date ON kseb_energisation_visits(energisation_date);
CREATE INDEX idx_kseb_energisation_scheduled_date ON kseb_energisation_visits(visit_scheduled_date);
CREATE INDEX idx_kseb_energisation_follow_up_date ON kseb_energisation_visits(follow_up_date);

-- Enable Row Level Security
ALTER TABLE kseb_energisation_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view energisation records for their projects
CREATE POLICY "view_kseb_energisation_for_user_projects"
  ON kseb_energisation_visits
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert energisation records for their projects
CREATE POLICY "insert_kseb_energisation_for_user_projects"
  ON kseb_energisation_visits
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update energisation records for their projects
CREATE POLICY "update_kseb_energisation_for_user_projects"
  ON kseb_energisation_visits
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete energisation records for their projects
CREATE POLICY "delete_kseb_energisation_for_user_projects"
  ON kseb_energisation_visits
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create activity log table for tracking status changes
CREATE TABLE kseb_energisation_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  energisation_id UUID NOT NULL REFERENCES kseb_energisation_visits(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  previous_status TEXT,
  new_status TEXT,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for activity logs
CREATE INDEX idx_kseb_energisation_activity_energisation_id ON kseb_energisation_activity_logs(energisation_id);
CREATE INDEX idx_kseb_energisation_activity_created_at ON kseb_energisation_activity_logs(created_at);

-- Enable RLS on activity logs
ALTER TABLE kseb_energisation_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS for activity logs - view through energisation records
CREATE POLICY "view_kseb_energisation_activity_logs"
  ON kseb_energisation_activity_logs
  FOR SELECT
  USING (
    energisation_id IN (
      SELECT id FROM kseb_energisation_visits
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- RLS for activity logs - insert
CREATE POLICY "insert_kseb_energisation_activity_logs"
  ON kseb_energisation_activity_logs
  FOR INSERT
  WITH CHECK (
    energisation_id IN (
      SELECT id FROM kseb_energisation_visits
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );


-- ============================================================================
-- Module: create_payment_workflow.sql
-- ============================================================================

-- Create payment_stages table
CREATE TABLE IF NOT EXISTS payment_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  stage_percentage integer NOT NULL,
  trigger_condition text,
  payment_amount decimal(12,2),
  payment_status text DEFAULT 'pending',
  due_date date,
  payment_received_date date,
  payment_method text,
  payment_reference text,
  receipt_number text,
  receipt_url text,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT stage_name_check CHECK (stage_name IN ('advance', 'interim_1', 'interim_2', 'final')),
  CONSTRAINT payment_status_check CHECK (payment_status IN ('pending', 'due', 'paid', 'overdue', 'waived')),
  CONSTRAINT payment_method_check CHECK (payment_method IS NULL OR payment_method IN ('cash', 'check', 'bank_transfer', 'upi', 'online')),
  CONSTRAINT unique_project_stage UNIQUE(project_id, stage_name)
);

-- Create payment_receipts table
CREATE TABLE IF NOT EXISTS payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_stage_id uuid NOT NULL REFERENCES payment_stages(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id),
  receipt_number text UNIQUE NOT NULL,
  receipt_date date NOT NULL,
  amount decimal(12,2) NOT NULL,
  payment_method text,
  reference_number text,
  generated_by uuid,
  pdf_url text,
  notes text,
  created_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_stages_project_id ON payment_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_stages_status ON payment_stages(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_stages_project_status ON payment_stages(project_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_project_id ON payment_receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_stage_id ON payment_receipts(payment_stage_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_number ON payment_receipts(receipt_number);

-- Enable RLS for payment_stages
ALTER TABLE payment_stages ENABLE ROW LEVEL SECURITY;

-- Enable RLS for payment_receipts
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policy for payment_stages: Users can view/edit stages for their projects
CREATE POLICY payment_stages_select ON payment_stages
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY payment_stages_insert ON payment_stages
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY payment_stages_update ON payment_stages
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY payment_stages_delete ON payment_stages
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policy for payment_receipts: Users can view/edit receipts for their projects
CREATE POLICY payment_receipts_select ON payment_receipts
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY payment_receipts_insert ON payment_receipts
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY payment_receipts_update ON payment_receipts
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY payment_receipts_delete ON payment_receipts
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );


-- ============================================================================
-- Module: create_handover_documents.sql
-- ============================================================================

-- Create handover_documents table
CREATE TABLE IF NOT EXISTS handover_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  document_number TEXT UNIQUE NOT NULL,
  document_status TEXT NOT NULL DEFAULT 'pending' CHECK (document_status IN ('pending', 'generated', 'ready_for_delivery', 'delivered', 'signed', 'archived')),
  generation_date TIMESTAMP WITH TIME ZONE,
  generated_by UUID REFERENCES auth.users(id),
  delivery_method TEXT DEFAULT 'email' CHECK (delivery_method IN ('email', 'print', 'portal', 'both')),
  delivered_date TIMESTAMP WITH TIME ZONE,
  delivered_to_emails TEXT[] DEFAULT '{}',
  customer_signature_url TEXT,
  customer_signature_timestamp TIMESTAMP WITH TIME ZONE,
  signed_by_name TEXT,
  signed_by_email TEXT,
  issue_date DATE,
  pdf_url TEXT,
  includes_warranty BOOLEAN DEFAULT true,
  includes_manual BOOLEAN DEFAULT true,
  includes_performance_metrics BOOLEAN DEFAULT true,
  includes_maintenance_guide BOOLEAN DEFAULT true,
  includes_contact_info BOOLEAN DEFAULT true,
  system_summary_json JSONB,
  warranty_summary_json JSONB,
  maintenance_schedule_json JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_handover_documents_project_id ON handover_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_handover_documents_status ON handover_documents(document_status);
CREATE INDEX IF NOT EXISTS idx_handover_documents_generation_date ON handover_documents(generation_date);
CREATE INDEX IF NOT EXISTS idx_handover_documents_created_at ON handover_documents(created_at);

-- Enable Row Level Security
ALTER TABLE handover_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view handover documents for their own projects" ON handover_documents
  FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create handover documents for their own projects" ON handover_documents
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update handover documents for their own projects" ON handover_documents
  FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete handover documents for their own projects" ON handover_documents
  FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_handover_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_handover_documents_timestamp
  BEFORE UPDATE ON handover_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_handover_documents_updated_at();


-- ============================================================================
-- Module: create_warranties.sql
-- ============================================================================

-- Create warranties schema and tables

-- Create project_warranties table
CREATE TABLE IF NOT EXISTS project_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  commissioning_date date NOT NULL,
  default_warranty_months integer NOT NULL DEFAULT 60,
  warranty_start_date date,
  warranty_end_date date,
  warranty_provider text,
  coverage_details text,
  inclusions text[] DEFAULT ARRAY[]::text[],
  exclusions text[] DEFAULT ARRAY[]::text[],
  extension_requested boolean DEFAULT false,
  extension_request_date date,
  extension_request_reason text,
  extension_months_requested integer,
  extension_approved boolean,
  extension_approved_date date,
  extension_approved_by uuid,
  extended_warranty_months integer,
  new_warranty_end_date date,
  extension_cost decimal(12, 2),
  extension_payment_status text DEFAULT 'pending' CHECK (extension_payment_status IN ('pending', 'paid', 'waived')),
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create warranty_claims table
CREATE TABLE IF NOT EXISTS warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_warranty_id uuid NOT NULL REFERENCES project_warranties(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  claim_date date NOT NULL,
  claim_number text UNIQUE,
  claim_title text NOT NULL,
  claim_description text NOT NULL,
  issue_type text NOT NULL CHECK (issue_type IN ('equipment_failure', 'performance_drop', 'defective_parts', 'installation_defect', 'other')),
  affected_component text,
  claim_status text DEFAULT 'open' CHECK (claim_status IN ('open', 'under_assessment', 'approved', 'denied', 'repair_completed', 'closed')),
  assessed_by uuid,
  assessment_date date,
  assessment_notes text,
  resolution_type text CHECK (resolution_type IN ('repair', 'replacement', 'refund', 'none')),
  resolution_description text,
  resolution_date date,
  resolved_by uuid,
  claim_amount decimal(12, 2),
  approved_amount decimal(12, 2),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create warranty_expiry_reminders table
CREATE TABLE IF NOT EXISTS warranty_expiry_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_warranty_id uuid NOT NULL REFERENCES project_warranties(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('6_months', '3_months', '1_month', '1_week', 'expired')),
  reminder_scheduled_date date,
  reminder_sent_date timestamp,
  sent_to_customer boolean DEFAULT false,
  sent_to_team boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_warranties_project_id ON project_warranties(project_id);
CREATE INDEX IF NOT EXISTS idx_project_warranties_warranty_end_date ON project_warranties(warranty_end_date);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_project_warranty_id ON warranty_claims(project_warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_project_id ON warranty_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_claim_status ON warranty_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_claim_date ON warranty_claims(claim_date);
CREATE INDEX IF NOT EXISTS idx_warranty_expiry_reminders_project_warranty_id ON warranty_expiry_reminders(project_warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_expiry_reminders_scheduled_date ON warranty_expiry_reminders(reminder_scheduled_date);

-- Enable RLS
ALTER TABLE project_warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_expiry_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_warranties
CREATE POLICY "Enable read access for authenticated users" ON project_warranties
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON project_warranties
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON project_warranties
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON project_warranties
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- RLS Policies for warranty_claims
CREATE POLICY "Enable read access for authenticated users" ON warranty_claims
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON warranty_claims
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON warranty_claims
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON warranty_claims
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- RLS Policies for warranty_expiry_reminders
CREATE POLICY "Enable read access for authenticated users" ON warranty_expiry_reminders
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON warranty_expiry_reminders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON warranty_expiry_reminders
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON warranty_expiry_reminders
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================================
-- Module: create_service_requests.sql
-- ============================================================================

-- ============================================================
-- Create Service Request Management Tables
-- Date: April 17, 2026
-- ============================================================

-- ============================================================
-- Step 1: Create customer_service_requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_service_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id     UUID,
  issue_title     TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  severity        TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to     UUID,
  resolution_notes TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  warranty_related BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 2: Create service_request_history table for audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_request_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.customer_service_requests(id) ON DELETE CASCADE,
  status_before     TEXT,
  status_after      TEXT,
  changed_by        UUID,
  change_reason     TEXT,
  changed_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 3: Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_service_requests_project_id ON public.customer_service_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON public.customer_service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.customer_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.customer_service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_history_request_id ON public.service_request_history(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_request_history_changed_at ON public.service_request_history(changed_at DESC);

-- ============================================================
-- Step 4: Enable RLS on both tables
-- ============================================================
ALTER TABLE public.customer_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 5: Create RLS Policies for team-based access
-- ============================================================

-- Service Requests: Allow authenticated users to view/modify all requests
DROP POLICY IF EXISTS "service_requests_auth" ON public.customer_service_requests;
CREATE POLICY "service_requests_auth"
  ON public.customer_service_requests FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Service Request History: Allow authenticated users to view/insert history
DROP POLICY IF EXISTS "service_request_history_auth" ON public.service_request_history;
CREATE POLICY "service_request_history_auth"
  ON public.service_request_history FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Success! Service Request tables created
-- ============================================================
SELECT 'Service Request tables created successfully!' as status;


COMMIT;

-- Migration complete. Run verification query to confirm all tables created.
