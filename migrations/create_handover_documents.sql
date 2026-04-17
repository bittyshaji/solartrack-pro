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
