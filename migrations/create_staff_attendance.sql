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
