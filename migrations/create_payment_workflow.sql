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
