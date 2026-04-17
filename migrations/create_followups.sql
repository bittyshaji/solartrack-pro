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
