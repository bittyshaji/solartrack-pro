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
