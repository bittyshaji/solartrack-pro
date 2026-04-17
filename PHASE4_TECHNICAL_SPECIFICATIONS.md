# Phase 4 Technical Specifications
**Critical Modules Database & API Design**

**Document Version:** 1.0  
**Date:** April 16, 2026  
**Status:** Ready for Implementation  
**Target Timeline:** July 6 - September 30, 2026

---

## Overview

This document provides complete technical specifications for the 4 critical Phase 4 modules:
1. Staff Attendance Log (Wage Payment)
2. KSEB Feasibility Submission
3. Handover Document Generation
4. Warranty Extension Management

Each module includes:
- Complete database schema (PostgreSQL)
- API endpoints with request/response specs
- Security & RLS policies
- Error handling
- Integration points

---

## 1. STAFF ATTENDANCE LOG MODULE

### 1.1 Database Schema

```sql
-- Teams (existing, referenced)
-- Already in place from Phase 1

-- Staff Members Table
CREATE TABLE staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  staff_name text NOT NULL,
  staff_phone text,
  staff_email text,
  role text NOT NULL, -- e.g., "Electrician", "Mason", "Supervisor"
  hourly_rate decimal(10, 2),
  daily_wage decimal(10, 2),
  employment_type text NOT NULL, -- 'full_time', 'part_time', 'contract'
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  CONSTRAINT valid_rates CHECK (hourly_rate > 0 OR daily_wage > 0),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Attendance Logs Table
CREATE TABLE attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  log_date date NOT NULL,
  check_in_time timestamp,
  check_out_time timestamp,
  check_in_location point, -- GPS coordinates
  check_out_location point,
  total_hours_worked decimal(5, 2),
  work_status text NOT NULL, -- 'present', 'absent', 'half_day', 'leave', 'holiday'
  leave_type text, -- 'sick', 'casual', 'earned', 'unpaid'
  verified_by uuid REFERENCES users(id),
  verified_at timestamp,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  -- Composite unique constraint: one attendance per staff per day
  UNIQUE(staff_member_id, log_date),
  CONSTRAINT valid_times CHECK (check_out_time IS NULL OR check_out_time > check_in_time)
);

-- Wage Payments Table
CREATE TABLE wage_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id uuid NOT NULL REFERENCES staff_members(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  payment_month date NOT NULL, -- First day of month (YYYY-MM-01)
  
  -- Calculations
  total_days_worked integer DEFAULT 0,
  total_hours_worked decimal(10, 2) DEFAULT 0,
  regular_hours decimal(10, 2) DEFAULT 0,
  overtime_hours decimal(10, 2) DEFAULT 0,
  
  -- Rates and amounts
  hourly_rate decimal(10, 2),
  daily_rate decimal(10, 2),
  overtime_rate_multiplier decimal(3, 2) DEFAULT 1.5,
  base_amount decimal(12, 2), -- hourly * hours or daily * days
  overtime_amount decimal(12, 2) DEFAULT 0,
  deductions decimal(12, 2) DEFAULT 0,
  total_amount decimal(12, 2),
  
  -- Status tracking
  payment_status text DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  approval_status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  payment_date date,
  payment_method text, -- 'cash', 'check', 'bank_transfer'
  bank_reference_number text,
  
  -- Approvals
  calculated_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  paid_by uuid REFERENCES users(id),
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(staff_member_id, payment_month),
  CONSTRAINT valid_amounts CHECK (total_amount >= 0)
);

-- Attendance Adjustments (for manual corrections)
CREATE TABLE attendance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_log_id uuid NOT NULL REFERENCES attendance_logs(id) ON DELETE CASCADE,
  adjustment_type text NOT NULL, -- 'hours_add', 'hours_subtract', 'status_change'
  original_value text,
  adjusted_value text,
  reason text NOT NULL,
  requested_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_attendance_staff_date ON attendance_logs(staff_member_id, log_date);
CREATE INDEX idx_attendance_team_date ON attendance_logs(team_id, log_date);
CREATE INDEX idx_wages_staff_month ON wage_payments(staff_member_id, payment_month);
CREATE INDEX idx_wages_team_month ON wage_payments(team_id, payment_month);
CREATE INDEX idx_staff_team_active ON staff_members(team_id, is_active);
```

### 1.2 Row-Level Security (RLS) Policies

```sql
-- Staff Members RLS
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

-- Only team members can view staff
CREATE POLICY staff_view_policy ON staff_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Only admins and supervisors can insert
CREATE POLICY staff_insert_policy ON staff_members
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'supervisor'
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Attendance Logs RLS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Users can see attendance for their team
CREATE POLICY attendance_view_policy ON attendance_logs
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Users can insert their own attendance, others can't
CREATE POLICY attendance_insert_policy ON attendance_logs
  FOR INSERT
  WITH CHECK (
    staff_member_id IN (
      SELECT id FROM staff_members 
      WHERE user_id = auth.uid()
    ) OR
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'supervisor'
    )
  );

-- Wage Payments RLS
ALTER TABLE wage_payments ENABLE ROW LEVEL SECURITY;

-- Only team members can view, only supervisors/admins can modify
CREATE POLICY wages_view_policy ON wage_payments
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY wages_update_policy ON wage_payments
  FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('supervisor', 'finance')
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );
```

### 1.3 API Endpoints

#### Attendance Check-In/Out
```
POST /api/attendance/check-in
Content-Type: application/json

Request:
{
  "staffMemberId": "uuid",
  "projectId": "uuid", // optional
  "checkInTime": "2026-04-16T09:00:00Z",
  "checkInLocation": {
    "latitude": 8.5241,
    "longitude": 76.9366
  }
}

Response (201):
{
  "success": true,
  "attendanceLogId": "uuid",
  "message": "Checked in successfully",
  "data": {
    "id": "uuid",
    "staffMemberId": "uuid",
    "checkInTime": "2026-04-16T09:00:00Z",
    "checkInLocation": { "lat": 8.5241, "lng": 76.9366 }
  }
}

---

POST /api/attendance/check-out
Content-Type: application/json

Request:
{
  "attendanceLogId": "uuid",
  "checkOutTime": "2026-04-16T17:30:00Z",
  "checkOutLocation": {
    "latitude": 8.5241,
    "longitude": 76.9366
  }
}

Response (200):
{
  "success": true,
  "totalHoursWorked": 8.5,
  "data": {
    "id": "uuid",
    "checkOutTime": "2026-04-16T17:30:00Z",
    "totalHoursWorked": 8.5,
    "workStatus": "present"
  }
}
```

#### Attendance Management
```
GET /api/staff/:staffMemberId/attendance
Query Parameters:
  - month: "2026-04" (required)
  - projectId: "uuid" (optional)

Response (200):
{
  "success": true,
  "staffMemberId": "uuid",
  "month": "2026-04",
  "data": [
    {
      "id": "uuid",
      "logDate": "2026-04-01",
      "checkInTime": "2026-04-01T09:00:00Z",
      "checkOutTime": "2026-04-01T17:30:00Z",
      "totalHoursWorked": 8.5,
      "workStatus": "present",
      "verifiedBy": "uuid",
      "verifiedAt": "2026-04-01T18:00:00Z"
    }
  ],
  "summary": {
    "totalPresent": 20,
    "totalAbsent": 2,
    "totalHalfDays": 1,
    "totalHoursWorked": 170.5
  }
}

---

PATCH /api/attendance/:attendanceLogId
Content-Type: application/json

Request:
{
  "workStatus": "half_day",
  "totalHoursWorked": 4.0,
  "notes": "Left early for medical appointment"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "workStatus": "half_day",
    "totalHoursWorked": 4.0
  }
}

---

POST /api/attendance/:attendanceLogId/adjust
Content-Type: application/json

Request:
{
  "adjustmentType": "hours_add",
  "adjustmentValue": 2,
  "reason": "Additional work on weekend"
}

Response (201):
{
  "success": true,
  "adjustmentId": "uuid",
  "status": "pending",
  "message": "Adjustment submitted for approval"
}
```

#### Wage Calculation & Payment
```
POST /api/wages/generate-payroll
Content-Type: application/json

Request:
{
  "teamId": "uuid",
  "paymentMonth": "2026-04-01",
  "overtimeMultiplier": 1.5
}

Response (201):
{
  "success": true,
  "paymentMonth": "2026-04-01",
  "generatedCount": 15,
  "totalAmount": 125000.00,
  "data": [
    {
      "id": "uuid",
      "staffMemberId": "uuid",
      "staffName": "John Doe",
      "daysWorked": 22,
      "hoursWorked": 176,
      "dailyRate": 500,
      "baseAmount": 11000,
      "overtimeHours": 6,
      "overtimeAmount": 600,
      "totalAmount": 11600,
      "paymentStatus": "pending",
      "approvalStatus": "pending"
    }
  ]
}

---

GET /api/wages/staff/:staffMemberId
Query Parameters:
  - month: "2026-04" (optional, defaults to current)
  - yearMonth: "2026-04" (alternative format)

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "staffMemberId": "uuid",
    "staffName": "John Doe",
    "paymentMonth": "2026-04-01",
    "daysWorked": 22,
    "hoursWorked": 176,
    "regularHours": 170,
    "overtimeHours": 6,
    "hourlyRate": 65.91,
    "dailyRate": 500,
    "baseAmount": 11200,
    "overtimeAmount": 585,
    "deductions": 100,
    "totalAmount": 11685,
    "paymentStatus": "pending",
    "approvalStatus": "pending",
    "paymentDate": null,
    "paymentMethod": null
  }
}

---

PATCH /api/wages/:wagePaymentId/approve
Content-Type: application/json

Request:
{
  "approvalStatus": "approved"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "approvalStatus": "approved",
    "approvedBy": "uuid",
    "approvedAt": "2026-04-20T10:00:00Z"
  }
}

---

POST /api/wages/:wagePaymentId/pay
Content-Type: application/json

Request:
{
  "paymentMethod": "bank_transfer",
  "bankReferenceNumber": "TXN20260420001",
  "paymentDate": "2026-04-20"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "paymentStatus": "paid",
    "paymentDate": "2026-04-20",
    "paymentMethod": "bank_transfer",
    "bankReferenceNumber": "TXN20260420001"
  }
}
```

#### Reports
```
GET /api/attendance/reports/monthly
Query Parameters:
  - teamId: "uuid" (required)
  - month: "2026-04" (required)

Response (200):
{
  "success": true,
  "month": "2026-04",
  "teamId": "uuid",
  "data": {
    "totalStaff": 15,
    "attendanceSummary": {
      "totalPresent": 285,
      "totalAbsent": 15,
      "totalHalfDays": 10,
      "averageAttendancePercentage": 94.3
    },
    "hoursWorked": {
      "regularHours": 2720,
      "overtimeHours": 95,
      "totalHours": 2815
    },
    "wageSummary": {
      "totalPayroll": 145000.00,
      "averageWage": 9666.67,
      "overtimeExpense": 6237.50
    },
    "staffDetails": [
      {
        "staffId": "uuid",
        "staffName": "John Doe",
        "presentDays": 20,
        "absentDays": 1,
        "hoursWorked": 160,
        "totalWage": 10400,
        "paymentStatus": "paid"
      }
    ]
  }
}
```

### 1.4 Error Handling

```javascript
// Common error responses:

// Invalid staff member
{
  "success": false,
  "error": "STAFF_NOT_FOUND",
  "message": "Staff member not found",
  "statusCode": 404
}

// Duplicate check-in
{
  "success": false,
  "error": "ALREADY_CHECKED_IN",
  "message": "Staff member already checked in today",
  "statusCode": 400
}

// Check-out without check-in
{
  "success": false,
  "error": "NO_ACTIVE_CHECKIN",
  "message": "No active check-in found for this date",
  "statusCode": 400
}

// Insufficient permissions
{
  "success": false,
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "You do not have permission to approve wages",
  "statusCode": 403
}
```

---

## 2. KSEB FEASIBILITY SUBMISSION MODULE

### 2.1 Database Schema

```sql
-- KSEB Feasibility Submissions
CREATE TABLE kseb_feasibility_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id),
  
  -- Submission details
  submission_date date,
  reference_number text UNIQUE,
  kseb_division text, -- Kerala KSEB division (optional, multi-division support)
  
  -- System specifications
  capacity_kw decimal(5, 2) NOT NULL,
  system_type text, -- 'residential', 'commercial', 'industrial'
  inverter_make text NOT NULL,
  inverter_model text,
  panel_make text NOT NULL,
  panel_model text,
  mounting_type text, -- 'roof', 'ground', 'hybrid'
  
  -- Submission status
  submission_status text DEFAULT 'draft', 
    -- 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_requested', 'resubmitted'
  
  -- Review information
  reviewer_name text,
  reviewer_id text, -- KSEB reviewer ID
  reviewer_comments text,
  approval_date date,
  approved_by text, -- KSEB approver name
  sanction_letter_file_url text,
  
  -- Revisions
  revision_count integer DEFAULT 0,
  revision_reason text,
  last_revision_date date,
  
  -- Files and documents
  site_plan_file_url text,
  electrical_drawings_file_url text,
  customer_details_json jsonb, -- Structured customer data
  property_documents_url text,
  
  -- Tracking
  created_by uuid REFERENCES users(id),
  submitted_by uuid REFERENCES users(id),
  submitted_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  CONSTRAINT valid_capacity CHECK (capacity_kw > 0)
);

-- KSEB Documents (versioning)
CREATE TABLE kseb_feasibility_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feasibility_submission_id uuid NOT NULL REFERENCES kseb_feasibility_submissions(id) ON DELETE CASCADE,
  
  document_type text NOT NULL,
    -- 'site_plan', 'electrical_drawings', 'customer_details', 'property_docs', 
    -- 'sanction_letter', 'test_report', 'other'
  
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes integer,
  file_hash text, -- SHA-256 hash for integrity
  mime_type text,
  version_number integer DEFAULT 1,
  
  document_status text DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  reviewer_feedback text,
  
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamp DEFAULT now(),
  verified_by uuid REFERENCES users(id),
  verified_at timestamp,
  
  UNIQUE(feasibility_submission_id, document_type, version_number)
);

-- KSEB Revision History
CREATE TABLE kseb_feasibility_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feasibility_submission_id uuid NOT NULL REFERENCES kseb_feasibility_submissions(id) ON DELETE CASCADE,
  
  revision_number integer NOT NULL,
  revision_requested_date timestamp,
  revision_reason text NOT NULL,
  revision_deadline date,
  
  revised_site_plan_url text,
  revised_drawings_url text,
  revised_other_documents jsonb,
  
  revised_by uuid REFERENCES users(id),
  revision_date timestamp,
  
  approval_status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approval_date date,
  approved_by uuid REFERENCES users(id),
  approval_comments text,
  
  created_at timestamp DEFAULT now(),
  
  UNIQUE(feasibility_submission_id, revision_number)
);

-- KSEB Activity Logs (audit trail)
CREATE TABLE kseb_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feasibility_submission_id uuid NOT NULL REFERENCES kseb_feasibility_submissions(id) ON DELETE CASCADE,
  
  activity_type text NOT NULL,
    -- 'created', 'submitted', 'status_changed', 'document_added', 'revision_requested', 'approved', 'rejected'
  
  activity_description text,
  performed_by uuid REFERENCES users(id),
  previous_status text,
  new_status text,
  timestamp timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_feasibility_project ON kseb_feasibility_submissions(project_id);
CREATE INDEX idx_feasibility_status ON kseb_feasibility_submissions(submission_status);
CREATE INDEX idx_feasibility_team_status ON kseb_feasibility_submissions(team_id, submission_status);
CREATE INDEX idx_documents_submission ON kseb_feasibility_documents(feasibility_submission_id);
CREATE INDEX idx_revisions_submission ON kseb_feasibility_revisions(feasibility_submission_id);
```

### 2.2 RLS Policies

```sql
-- KSEB Feasibility RLS
ALTER TABLE kseb_feasibility_submissions ENABLE ROW LEVEL SECURITY;

-- Team members can view their team's submissions
CREATE POLICY feasibility_view_policy ON kseb_feasibility_submissions
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Only authorized users can create
CREATE POLICY feasibility_insert_policy ON kseb_feasibility_submissions
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('supervisor', 'lead')
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- KSEB Documents RLS
ALTER TABLE kseb_feasibility_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_view_policy ON kseb_feasibility_documents
  FOR SELECT
  USING (
    feasibility_submission_id IN (
      SELECT id FROM kseb_feasibility_submissions 
      WHERE team_id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid()
      )
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );
```

### 2.3 API Endpoints

#### Create/Manage Feasibility
```
POST /api/kseb/feasibility
Content-Type: application/json

Request:
{
  "projectId": "uuid",
  "capacityKw": 5.0,
  "systemType": "residential",
  "inverterMake": "Growatt",
  "inverterModel": "MIC 5000TL-X",
  "panelMake": "JA Solar",
  "panelModel": "JAM72S20-540/MR",
  "mountingType": "roof",
  "kSEBDivision": "Thiruvananthapuram"
}

Response (201):
{
  "success": true,
  "feasibilityId": "uuid",
  "submissionStatus": "draft",
  "message": "Feasibility submission created in draft status"
}

---

GET /api/projects/:projectId/kseb/feasibility
Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "submissionStatus": "draft",
    "capacityKw": 5.0,
    "inverterMake": "Growatt",
    "panelMake": "JA Solar",
    "documents": [],
    "revisionCount": 0,
    "createdAt": "2026-04-16T10:00:00Z"
  }
}

---

PATCH /api/kseb/feasibility/:id
Content-Type: application/json

Request:
{
  "capacityKw": 5.5,
  "inverterMake": "Sunsynk"
}

Response (200):
{
  "success": true,
  "data": { /* updated feasibility data */ }
}
```

#### Document Management
```
POST /api/kseb/feasibility/:feasibilityId/upload-document
Content-Type: multipart/form-data

Request:
  - file: <binary file>
  - documentType: "site_plan"
  - fileName: "site_plan_project_001.pdf"

Response (201):
{
  "success": true,
  "documentId": "uuid",
  "message": "Document uploaded successfully",
  "data": {
    "id": "uuid",
    "documentType": "site_plan",
    "fileName": "site_plan_project_001.pdf",
    "uploadedAt": "2026-04-16T10:30:00Z"
  }
}

---

GET /api/kseb/feasibility/:feasibilityId/documents
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "documentType": "site_plan",
      "fileName": "site_plan_project_001.pdf",
      "fileUrl": "https://cdn.solartrack.com/...",
      "uploadedAt": "2026-04-16T10:30:00Z",
      "documentStatus": "pending"
    }
  ]
}

---

DELETE /api/kseb/feasibility/documents/:documentId
Response (200):
{
  "success": true,
  "message": "Document deleted successfully"
}
```

#### Submission Workflow
```
POST /api/kseb/feasibility/:feasibilityId/submit
Content-Type: application/json

Request:
{
  "submissionReason": "Initial feasibility application"
}

Response (200):
{
  "success": true,
  "submissionStatus": "submitted",
  "submittedAt": "2026-04-16T11:00:00Z",
  "message": "Feasibility submitted to KSEB"
}

---

POST /api/kseb/feasibility/:feasibilityId/request-revision
Content-Type: application/json
(Admin/supervisor only)

Request:
{
  "revisionReason": "Site plan needs clarification on boundary",
  "revisionDeadline": "2026-04-23"
}

Response (200):
{
  "success": true,
  "revisionNumber": 1,
  "revisionStatus": "pending",
  "message": "Revision requested"
}

---

POST /api/kseb/feasibility/:feasibilityId/resubmit-revision
Content-Type: application/json

Request:
{
  "revisionNumber": 1,
  "revisedDocuments": {
    "siteplanUrl": "https://...",
    "drawingsUrl": "https://..."
  }
}

Response (200):
{
  "success": true,
  "submissionStatus": "resubmitted",
  "message": "Revision resubmitted for review"
}

---

POST /api/kseb/feasibility/:feasibilityId/approve
Content-Type: application/json
(Admin/supervisor only)

Request:
{
  "approvalStatus": "approved",
  "sanctionLetterUrl": "https://...",
  "approvalDate": "2026-04-20"
}

Response (200):
{
  "success": true,
  "submissionStatus": "approved",
  "approvalDate": "2026-04-20",
  "message": "Feasibility approved"
}
```

#### Status and History
```
GET /api/kseb/feasibility/:feasibilityId/status
Response (200):
{
  "success": true,
  "data": {
    "submissionStatus": "approved",
    "revisionCount": 0,
    "approvalDate": "2026-04-20",
    "sanctionLetterUrl": "https://...",
    "currentRevision": null
  }
}

---

GET /api/kseb/feasibility/:feasibilityId/activity-log
Response (200):
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-04-16T10:00:00Z",
      "activityType": "created",
      "description": "Feasibility submission created",
      "performedBy": "John Supervisor"
    },
    {
      "timestamp": "2026-04-16T11:00:00Z",
      "activityType": "submitted",
      "description": "Submitted to KSEB",
      "performedBy": "John Supervisor"
    }
  ]
}
```

---

## 3. HANDOVER DOCUMENT MODULE

### 3.1 Database Schema

```sql
-- Handover Documents
CREATE TABLE handover_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id),
  
  -- Generation
  generation_status text DEFAULT 'pending',
    -- 'pending', 'generated', 'ready_for_delivery', 'delivered', 'archived'
  generation_date timestamp,
  generated_by uuid REFERENCES users(id),
  
  -- Template and customization
  template_id uuid REFERENCES handover_document_templates(id),
  template_version integer DEFAULT 1,
  
  -- Delivery
  delivery_method text DEFAULT 'email',
    -- 'email', 'print', 'portal', 'multi'
  delivered_date timestamp,
  delivered_to_emails text[],
  
  -- Signing
  signature_status text DEFAULT 'unsigned',
    -- 'unsigned', 'pending_signature', 'signed'
  customer_signature_url text,
  customer_signature_timestamp timestamp,
  signed_by_name text,
  signed_by_email text,
  
  -- Document content
  document_title text,
  document_number text UNIQUE,
  issue_date date,
  
  pdf_file_url text,
  pdf_file_hash text,
  
  -- Metadata
  includes_warranty boolean DEFAULT true,
  includes_manual boolean DEFAULT true,
  includes_performance_metrics boolean DEFAULT true,
  includes_maintenance_guide boolean DEFAULT true,
  includes_contact_info boolean DEFAULT true,
  
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Handover Document Templates
CREATE TABLE handover_document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  template_description text,
  
  -- Content structure
  section_order text[] NOT NULL,
    -- ['header', 'project_summary', 'system_specs', 'warranty', 'manual', 
    --  'performance_baseline', 'maintenance', 'contact_info', 'footer']
  
  html_template text, -- HTML template with [PLACEHOLDERS]
  
  -- Company customization
  company_logo_url text,
  company_footer_text text,
  
  -- Versioning
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  CONSTRAINT unique_active_template UNIQUE (template_name) WHERE is_active = true
);

-- Handover Document Content (generated)
CREATE TABLE handover_document_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handover_document_id uuid NOT NULL REFERENCES handover_documents(id) ON DELETE CASCADE,
  
  section_name text NOT NULL,
  section_order integer,
  
  -- Content
  section_html text,
  section_text text,
  
  -- Data backing this section
  data_json jsonb, -- Structured data used to generate content
  
  created_at timestamp DEFAULT now()
);

-- Handover Content Variables (what data to pull for generation)
CREATE TABLE handover_content_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES handover_document_templates(id),
  
  variable_name text NOT NULL, -- 'project_name', 'system_capacity', 'warranty_period', etc.
  variable_label text,
  source_table text, -- 'projects', 'project_specs', 'customers', etc.
  source_column text,
  data_type text, -- 'text', 'number', 'date', 'currency'
  
  default_value text,
  
  created_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_handover_project ON handover_documents(project_id);
CREATE INDEX idx_handover_status ON handover_documents(generation_status);
CREATE INDEX idx_handover_team ON handover_documents(team_id);
CREATE INDEX idx_templates_active ON handover_document_templates(is_active);
```

### 3.2 RLS Policies

```sql
-- Handover Documents RLS
ALTER TABLE handover_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY handover_view_policy ON handover_documents
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY handover_insert_policy ON handover_documents
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('supervisor', 'lead')
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );
```

### 3.3 API Endpoints

```
POST /api/handover/generate
Content-Type: application/json

Request:
{
  "projectId": "uuid",
  "templateId": "uuid", // optional, uses default if not provided
  "includeWarranty": true,
  "includeManual": true,
  "includePerformanceMetrics": true,
  "includeMaintenanceGuide": true
}

Response (201):
{
  "success": true,
  "handoverId": "uuid",
  "generationStatus": "generated",
  "message": "Handover document generated successfully",
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "documentNumber": "HO-2026-04-001",
    "issueDate": "2026-04-16",
    "pdfFileUrl": "https://...",
    "signatureStatus": "unsigned"
  }
}

---

GET /api/projects/:projectId/handover
Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "generationStatus": "ready_for_delivery",
    "deliveryMethod": "email",
    "documentNumber": "HO-2026-04-001",
    "issueDate": "2026-04-16",
    "pdfFileUrl": "https://...",
    "signatureStatus": "pending_signature"
  }
}

---

POST /api/handover/:handoverId/deliver
Content-Type: application/json

Request:
{
  "deliveryMethod": "email",
  "deliveryEmails": ["customer@example.com"],
  "includeSignatureRequest": true
}

Response (200):
{
  "success": true,
  "deliveryStatus": "delivered",
  "deliveredAt": "2026-04-16T14:00:00Z",
  "signatureLink": "https://solartrack.com/handover/sign/token123"
}

---

POST /api/handover/:handoverId/sign
Content-Type: application/json

Request:
{
  "signatureDataUrl": "data:image/png;base64,...",
  "signedByName": "Mr. Customer",
  "signedByEmail": "customer@example.com"
}

Response (200):
{
  "success": true,
  "signatureStatus": "signed",
  "signedAt": "2026-04-16T15:00:00Z"
}

---

GET /api/handover/templates
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "templateName": "Standard Residential Solar",
      "description": "Standard template for residential solar installations",
      "version": 1,
      "isActive": true,
      "sections": ["header", "project_summary", "system_specs", "warranty", ...]
    }
  ]
}
```

---

## 4. WARRANTY EXTENSION MODULE

### 4.1 Database Schema

```sql
-- Project Warranties
CREATE TABLE project_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id),
  
  -- Warranty period
  commissioning_date date NOT NULL,
  default_warranty_months integer NOT NULL DEFAULT 60, -- Standard 5 years
  warranty_start_date date GENERATED ALWAYS AS (commissioning_date) STORED,
  warranty_end_date date GENERATED ALWAYS AS 
    (commissioning_date + (default_warranty_months || ' months')::interval) STORED,
  
  -- Warranty provider
  warranty_provider text,
  coverage_details text,
  inclusions text[],
  exclusions text[],
  
  -- Extension request
  extension_requested boolean DEFAULT false,
  extension_request_date date,
  extension_request_reason text,
  extension_months_requested integer,
  
  -- Extension approval
  extension_approved boolean,
  extension_approved_date date,
  extension_approved_by uuid REFERENCES users(id),
  
  extended_warranty_months integer,
  new_warranty_end_date date,
  extension_cost decimal(12, 2),
  extension_payment_status text DEFAULT 'pending', 
    -- 'pending', 'paid', 'waived'
  
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  CONSTRAINT valid_months CHECK (default_warranty_months > 0 AND (extended_warranty_months IS NULL OR extended_warranty_months > 0))
);

-- Warranty Claims
CREATE TABLE warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_warranty_id uuid NOT NULL REFERENCES project_warranties(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id),
  
  claim_date date NOT NULL,
  claim_number text UNIQUE,
  claim_title text NOT NULL,
  claim_description text NOT NULL,
  
  -- Issue details
  issue_type text,
    -- 'equipment_failure', 'performance_drop', 'defective_parts', 'installation_defect', 'other'
  affected_component text, -- 'inverter', 'panels', 'wiring', 'monitoring', etc.
  performance_impact text,
  
  -- Claim status
  claim_status text DEFAULT 'open',
    -- 'open', 'under_assessment', 'approved', 'denied', 'repair_completed', 'closed'
  
  -- Assessment
  assessed_by uuid REFERENCES users(id),
  assessment_date date,
  assessment_notes text,
  
  -- Resolution
  resolution_type text, -- 'repair', 'replacement', 'refund', 'none'
  resolution_description text,
  resolution_date date,
  resolved_by uuid REFERENCES users(id),
  
  -- Cost
  claim_amount decimal(12, 2),
  approved_amount decimal(12, 2),
  payment_status text DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  payment_date date,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Warranty Expiry Reminders
CREATE TABLE warranty_expiry_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_warranty_id uuid NOT NULL REFERENCES project_warranties(id) ON DELETE CASCADE,
  
  reminder_type text NOT NULL,
    -- '6_months', '3_months', '1_month', '1_week', 'expired'
  
  days_before_expiry integer,
  reminder_scheduled_date date,
  reminder_sent_date timestamp,
  
  sent_to_customer boolean DEFAULT false,
  sent_to_team boolean DEFAULT false,
  customer_email text,
  team_email text[],
  
  created_at timestamp DEFAULT now()
);

-- Warranty Maintenance Records
CREATE TABLE warranty_maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_warranty_id uuid NOT NULL REFERENCES project_warranties(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  
  maintenance_date date NOT NULL,
  maintenance_type text,
    -- 'scheduled', 'preventive', 'corrective', 'inspection'
  
  description text,
  performed_by text, -- Name of technician or service provider
  service_provider_name text,
  
  work_done text,
  parts_replaced text[],
  cost decimal(12, 2),
  
  notes text,
  created_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_warranty_project ON project_warranties(project_id);
CREATE INDEX idx_warranty_end_date ON project_warranties(warranty_end_date);
CREATE INDEX idx_claims_warranty ON warranty_claims(project_warranty_id);
CREATE INDEX idx_claims_status ON warranty_claims(claim_status);
CREATE INDEX idx_reminders_scheduled ON warranty_expiry_reminders(reminder_scheduled_date);
CREATE INDEX idx_maintenance_project ON warranty_maintenance_records(project_id);
```

### 4.2 RLS Policies

```sql
-- Warranty RLS
ALTER TABLE project_warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY warranty_view_policy ON project_warranties
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );
```

### 4.3 API Endpoints

```
POST /api/warranties
Content-Type: application/json

Request:
{
  "projectId": "uuid",
  "commissioningDate": "2026-04-10",
  "defaultWarrantyMonths": 60,
  "warrantyProvider": "Growatt",
  "coverageDetails": "Manufacturing defect and equipment failure"
}

Response (201):
{
  "success": true,
  "warrantyId": "uuid",
  "warrantyEndDate": "2031-04-10",
  "message": "Warranty record created"
}

---

GET /api/projects/:projectId/warranty
Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "commissioningDate": "2026-04-10",
    "warrantyStartDate": "2026-04-10",
    "warrantyEndDate": "2031-04-10",
    "warrantyMonths": 60,
    "warrantyProvider": "Growatt",
    "daysRemaining": 1784,
    "extensionRequested": false
  }
}

---

POST /api/warranties/:warrantyId/request-extension
Content-Type: application/json

Request:
{
  "extensionMonths": 12,
  "extensionReason": "Extended coverage for peace of mind",
  "extensionCost": 500.00
}

Response (201):
{
  "success": true,
  "extensionStatus": "pending",
  "message": "Extension request submitted for approval",
  "data": {
    "warrantyId": "uuid",
    "extensionMonths": 12,
    "newWarrantyEndDate": "2032-04-10",
    "extensionCost": 500.00,
    "extensionPaymentStatus": "pending"
  }
}

---

POST /api/warranties/:warrantyId/approve-extension
Content-Type: application/json
(Admin/supervisor only)

Request:
{
  "extensionApproved": true,
  "approvalDate": "2026-04-16"
}

Response (200):
{
  "success": true,
  "extensionStatus": "approved",
  "newWarrantyEndDate": "2032-04-10"
}

---

GET /api/warranties/:warrantyId/claims
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "claimNumber": "WC-2026-001",
      "claimDate": "2026-05-01",
      "claimTitle": "Inverter malfunction",
      "claimStatus": "approved",
      "affectedComponent": "inverter",
      "approvedAmount": 1500.00,
      "paymentStatus": "paid"
    }
  ]
}

---

POST /api/warranties/:warrantyId/claim
Content-Type: application/json

Request:
{
  "claimTitle": "Inverter malfunction",
  "claimDescription": "Inverter stopped working after 2 years",
  "issueType": "equipment_failure",
  "affectedComponent": "inverter",
  "claimAmount": 1500.00
}

Response (201):
{
  "success": true,
  "claimId": "uuid",
  "claimNumber": "WC-2026-001",
  "claimStatus": "open",
  "message": "Warranty claim submitted"
}

---

GET /api/warranties/expiring
Query Parameters:
  - teamId: "uuid"
  - daysWithin: 90 (expiring within N days)

Response (200):
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "projectName": "Residential Project A",
      "warrantyEndDate": "2026-07-10",
      "daysRemaining": 85,
      "reminderStatus": "pending"
    }
  ]
}

---

POST /api/warranties/:warrantyId/send-reminder
Content-Type: application/json
(Scheduled or manual)

Request:
{
  "reminderType": "3_months",
  "sendToCustomer": true,
  "sendToTeam": true,
  "customMessage": "Your warranty is expiring soon. Consider extending your coverage."
}

Response (200):
{
  "success": true,
  "message": "Reminder sent successfully"
}
```

---

## Integration Points & Data Flow

### Cross-Module Data Flow

```
1. STAFF ATTENDANCE → WAGE PAYMENT
   - attendance_logs.total_hours_worked → wage_payments.total_hours_worked
   - attendance_logs.work_status → wage_payments calculation logic
   
2. PROJECT → KSEB FEASIBILITY
   - projects.capacity_kw → kseb_feasibility_submissions.capacity_kw
   - projects.customer_id → kseb_feasibility_submissions (for documents)
   
3. PROJECT → HANDOVER
   - projects.project_name, project_specs, customer_details → handover content
   - project_invoices (final payment) → triggers handover generation eligibility
   
4. PROJECT → WARRANTY
   - commissioning_stage completion date → project_warranties.commissioning_date
   - warranty.warranty_end_date used for project lifecycle status
   
5. KSEB FEASIBILITY → PROJECT WORKFLOW
   - feasibility approval → enables KSEB energisation module
   - feasibility status → project stage progression blocked/allowed

6. HANDOVER → PROJECT COMPLETION
   - handover.delivery_status → project completion eligibility
   - handover.signature_status → customer sign-off tracking
```

---

## Testing Checklist

### Unit Tests
- [ ] Database schema validation
- [ ] RLS policies enforcement
- [ ] Data validation constraints
- [ ] Index performance verification

### Integration Tests
- [ ] API endpoint functionality
- [ ] Data persistence
- [ ] Cross-module data flow
- [ ] Error handling
- [ ] Auth and permission enforcement

### E2E Tests
- [ ] Complete workflow (check-in → check-out → wage calculation)
- [ ] KSEB submission workflow (draft → submit → revision → approval)
- [ ] Handover generation and delivery
- [ ] Warranty claim lifecycle

---

**Status: Ready for Development Team**

All 4 Phase 4 critical modules have complete technical specifications with database schemas, RLS policies, API endpoints, and error handling. Development can begin immediately following Phase 3 kickoff.
