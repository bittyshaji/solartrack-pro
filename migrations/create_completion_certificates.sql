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
