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
