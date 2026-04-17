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
