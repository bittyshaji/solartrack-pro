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
