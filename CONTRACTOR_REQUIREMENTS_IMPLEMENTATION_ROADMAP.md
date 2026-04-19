# Contractor Requirements Implementation Roadmap
**Integration with Phase 3 & Phase 4**

**Analysis Date:** April 16, 2026  
**Status:** Implementation Planning Complete  
**Total Items:** 18 requirements mapped to phases

---

## Executive Summary

The 18 contractor requirements have been analyzed and mapped to a phased implementation strategy:

| Phase | Focus | Items | Timeline | Priority |
|-------|-------|-------|----------|----------|
| **Phase 3** (Current) | Core Phase 3 + Critical Contractor Modules | 4 features + 4 contractor modules | Apr 21 - Jul 5 | HIGH |
| **Phase 4** (Next) | Advanced Contractor Modules + Enhancements | 3 modules + 8 enhancements | Jul 6 - Sep 30 | MEDIUM |
| **Phase 5+** | Optimization & Advanced Features | Automation, integrations | Oct+ | LOW |

---

## Phase 3 (April 21 - July 5, 2026) - REVISED ROADMAP

### Track 1: Customer Portal (4 FTE) ✅
**Phase 3 Features + Contractor Item #18 (Service Log)**

**User Stories:**
- Customer portal login and dashboard
- Service request submission (Contractor #18 - SERVICE LOG)
- Invoice viewing and payment tracking
- Project progress tracking
- Notification preferences management
- 8 total stories (3 + 2 contractor, + 3 other portal features)

**New Database Tables:**
```sql
CREATE TABLE customer_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  customer_id uuid REFERENCES customers(id),
  issue_title text NOT NULL,
  issue_description text NOT NULL,
  severity enum ('low', 'medium', 'high', 'critical'),
  status enum ('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  assigned_to uuid REFERENCES users(id),
  resolution_notes text,
  satisfaction_rating integer,
  warranty_related boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  resolved_at timestamp,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE service_request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid REFERENCES customer_service_requests(id),
  status_before enum,
  status_after enum,
  changed_by uuid REFERENCES users(id),
  change_reason text,
  changed_at timestamp DEFAULT now()
);
```

**API Endpoints:**
- POST /api/service-requests - Create new service request
- GET /api/service-requests/:id - Get service request details
- GET /api/projects/:projectId/service-requests - List requests for project
- PATCH /api/service-requests/:id - Update service request
- GET /api/service-requests/:id/history - Get resolution history
- POST /api/service-requests/:id/resolve - Mark as resolved

---

### Track 2: Mobile App (3 FTE) ✅
**Phase 3 Features - No contractor items (mobile-specific)**

**User Stories:**
- React Native/Expo mobile app setup
- Projects and tasks dashboard
- Daily updates mobile view
- Photo upload and GPS tagging
- Offline support
- Push notifications
- 8 total stories

---

### Track 3: Advanced Reporting (3 FTE) ✅
**Phase 3 Features + Contractor Item #8 Enhancement (Construction Progress Metrics)**

**User Stories:**
- Custom report builder
- Pre-built solar project reports
- Revenue and profitability analysis
- Construction stage metrics tracking (Contractor #8 enhancement)
- Team productivity metrics
- Export to PDF/Excel
- Scheduled report delivery
- 8 total stories

**New Database Tables:**
```sql
CREATE TABLE construction_stage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  stage_name text NOT NULL,
  stage_sequence integer,
  planned_start_date date,
  actual_start_date date,
  planned_end_date date,
  actual_end_date date,
  completion_percentage integer DEFAULT 0,
  time_spent_hours decimal(10, 2),
  team_members_assigned integer,
  materials_used text[],
  photos_count integer DEFAULT 0,
  checklist_items_total integer,
  checklist_items_completed integer,
  issues_identified text[],
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE stage_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_stage_id uuid,
  checklist_item_number integer,
  item_description text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_by uuid REFERENCES users(id),
  completed_at timestamp,
  notes text,
  created_at timestamp DEFAULT now()
);
```

---

### Track 4: Batch Operations (2 FTE) ✅
**Phase 3 Features - No contractor items (admin tools)**

**User Stories:**
- Bulk invoice creation
- Bulk project status updates
- Batch email sending
- Import customers from CSV
- Export projects to Excel
- 8 total stories

---

### Phase 3 Summary
- **Total Stories:** 32 (all Phase 3 + 2 contractor items)
- **Contractor Items Included:** 
  - #18: Service Log/Customer Service Requests ✅
  - #8: Construction Stage Metrics (enhanced) ✅
- **New Modules:** 1 (Service Requests)
- **Enhanced Modules:** 1 (Construction Stage)
- **Timeline:** 12 weeks (Apr 21 - Jul 5, 2026)
- **Team Size:** 12 FTE (4 tracks)

---

## Phase 4 (July 6 - September 30, 2026) - NEW PHASE

### Critical Path Modules (High Priority)

#### Module 1: Staff Attendance Log (Contractor #9)
**Status:** NOT INCLUDED → NEW MODULE

**Purpose:** Track employee attendance for wage payment and productivity analysis

**Database Schema:**
```sql
CREATE TABLE staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id),
  user_id uuid REFERENCES users(id),
  role text,
  hourly_rate decimal(10, 2),
  daily_wage decimal(10, 2),
  employment_type enum ('full_time', 'part_time', 'contract'),
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

CREATE TABLE attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id uuid REFERENCES staff_members(id),
  project_id uuid REFERENCES projects(id),
  log_date date NOT NULL,
  check_in_time timestamp,
  check_out_time timestamp,
  total_hours_worked decimal(5, 2),
  work_status enum ('present', 'absent', 'half_day', 'leave'),
  verified_by uuid REFERENCES users(id),
  notes text,
  created_at timestamp DEFAULT now(),
  UNIQUE(staff_member_id, log_date)
);

CREATE TABLE wage_payments (
  id uuid PRIMARYKey DEFAULT gen_random_uuid(),
  staff_member_id uuid REFERENCES staff_members(id),
  payment_month date NOT NULL,
  total_hours_worked decimal(10, 2),
  hourly_rate decimal(10, 2),
  daily_rate decimal(10, 2),
  total_amount decimal(12, 2),
  payment_status enum ('pending', 'approved', 'paid') DEFAULT 'pending',
  payment_date date,
  payment_method enum ('cash', 'check', 'bank_transfer'),
  approved_by uuid REFERENCES users(id),
  paid_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  UNIQUE(staff_member_id, payment_month)
);
```

**API Endpoints:**
- POST /api/staff-members - Add staff member
- GET /api/teams/:teamId/staff - List team staff
- POST /api/attendance/check-in - Clock in
- POST /api/attendance/check-out - Clock out
- GET /api/attendance/logs/:staffMemberId - Get attendance history
- POST /api/wages/generate-payroll - Generate monthly payroll
- GET /api/wages/staff/:staffMemberId - Get wage history

**Features:**
- Clock in/out functionality
- GPS location verification for field work
- Daily/monthly attendance summary
- Wage calculation with overtime tracking
- Payroll report generation
- Attendance verification by supervisor

**UI Components:**
- AttendanceCheckIn.jsx
- AttendanceLog.jsx
- WagePaymentTracker.jsx
- PayrollReport.jsx

---

#### Module 2: KSEB Feasibility Submission (Contractor #6)
**Status:** NOT INCLUDED → NEW MODULE

**Purpose:** Track KSEB (Kerala State Electricity Board) feasibility application for solar installations

**Database Schema:**
```sql
CREATE TABLE kseb_feasibility_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) UNIQUE,
  submission_date date,
  reference_number text UNIQUE,
  site_plan_file_url text,
  electrical_drawings_file_url text,
  customer_details_json jsonb,
  capacity_kw decimal(5, 2),
  inverter_make text,
  panel_make text,
  submission_status enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_requested'),
  reviewer_comments text,
  approval_date date,
  approved_by text,
  revision_count integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE kseb_feasibility_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feasibility_submission_id uuid REFERENCES kseb_feasibility_submissions(id),
  document_type enum ('site_plan', 'electrical_drawings', 'customer_details', 'sanction_letter', 'other'),
  file_url text NOT NULL,
  file_name text,
  uploaded_at timestamp DEFAULT now(),
  uploaded_by uuid REFERENCES users(id)
);

CREATE TABLE kseb_feasibility_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feasibility_submission_id uuid REFERENCES kseb_feasibility_submissions(id),
  revision_number integer,
  revision_reason text,
  revised_by uuid REFERENCES users(id),
  revision_date timestamp DEFAULT now(),
  revised_site_plan_url text,
  revised_drawings_url text,
  approval_after_revision date
);
```

**API Endpoints:**
- POST /api/kseb/feasibility - Create feasibility submission
- GET /api/projects/:projectId/kseb/feasibility - Get feasibility details
- PATCH /api/kseb/feasibility/:id - Update submission
- POST /api/kseb/feasibility/:id/submit - Submit to KSEB
- POST /api/kseb/feasibility/:id/upload-document - Upload document
- POST /api/kseb/feasibility/:id/revise - Submit revision
- GET /api/kseb/feasibility/:id/status - Get approval status

**Features:**
- Document upload and management
- Application status tracking
- Revision request handling
- Approval timeline tracking
- Reference number management
- Integration with project workflow

---

#### Module 3: Handover Document Generation (Contractor #15)
**Status:** NOT INCLUDED → NEW MODULE

**Purpose:** Auto-generate and manage project handover documents for customer delivery

**Database Schema:**
```sql
CREATE TABLE handover_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) UNIQUE,
  document_status enum ('draft', 'ready', 'signed', 'delivered'),
  generation_date timestamp,
  delivered_date timestamp,
  delivery_method enum ('email', 'print', 'portal', 'both'),
  customer_signature_url text,
  signed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE handover_document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE,
  template_content text,
  sections text[],
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE handover_document_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handover_document_id uuid REFERENCES handover_documents(id),
  section_name text,
  section_content text,
  include_warranty boolean DEFAULT true,
  include_manual boolean DEFAULT true,
  include_performance_metrics boolean DEFAULT true,
  include_maintenance_guide boolean DEFAULT true
);
```

**API Endpoints:**
- POST /api/handover/generate - Generate handover document
- GET /api/projects/:projectId/handover - Get handover document
- PATCH /api/handover/:id - Update document
- POST /api/handover/:id/deliver - Mark as delivered
- POST /api/handover/:id/sign - Submit digital signature
- GET /api/handover/templates - List available templates

**Features:**
- Auto-generate from project data
- Customizable templates
- Digital signature capture
- PDF export
- Email delivery to customer
- Versioning and tracking
- Performance baseline documentation

---

#### Module 4: Warranty Extension Management (Contractor #17)
**Status:** NOT INCLUDED → NEW MODULE

**Purpose:** Track warranty periods and manage extension requests

**Database Schema:**
```sql
CREATE TABLE project_warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) UNIQUE,
  commissioning_date date,
  default_warranty_months integer DEFAULT 60,
  warranty_start_date date,
  warranty_end_date date,
  warranty_provider text,
  coverage_details text,
  extension_requested boolean DEFAULT false,
  extension_request_date date,
  extension_granted boolean,
  extended_warranty_months integer,
  new_warranty_end_date date,
  extension_cost decimal(12, 2),
  extension_approved_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_warranty_id uuid REFERENCES project_warranties(id),
  claim_date date NOT NULL,
  claim_description text NOT NULL,
  claim_status enum ('open', 'in_progress', 'approved', 'denied'),
  claim_amount decimal(12, 2),
  resolution_date date,
  resolution_notes text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE warranty_expiry_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_warranty_id uuid REFERENCES project_warranties(id),
  reminder_type enum ('30_days', '14_days', '7_days', 'expired'),
  reminder_sent_date timestamp,
  sent_to_customer boolean DEFAULT false,
  sent_to_team boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
```

**API Endpoints:**
- POST /api/warranties - Create warranty record
- GET /api/projects/:projectId/warranty - Get warranty details
- POST /api/warranties/:id/extend - Request extension
- GET /api/warranties/:id/claims - Get warranty claims
- POST /api/warranties/:id/claim - Submit warranty claim
- GET /api/warranties/expiring - Get expiring warranties
- POST /api/warranties/:id/send-reminder - Send expiry reminder

**Features:**
- Automatic warranty period calculation
- Extension request workflow
- Claim tracking and resolution
- Expiry reminders (automated)
- Customer notification
- Warranty period configuration
- Cost analysis for extensions

---

### Enhancement Modules (Medium Priority)

#### Enhancement 1: Project Secure Status (Contractor #5)
**Current:** No explicit "secured" status  
**Enhancement:** Add status and workflow to confirm order commitment

**Implementation:**
```sql
ALTER TABLE projects ADD COLUMN secure_status enum ('lead', 'quoted', 'secured', 'cancelled');
ALTER TABLE projects ADD COLUMN secured_date timestamp;
ALTER TABLE projects ADD COLUMN secure_documents jsonb;

CREATE TABLE project_security_requirements (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  requirement_type enum ('signed_quote', 'advance_payment', 'written_confirmation', 'customer_signature'),
  is_completed boolean DEFAULT false,
  completed_date timestamp,
  proof_document_url text
);
```

**API Changes:**
- POST /api/projects/:id/secure - Mark project as secured
- GET /api/projects/:id/security-requirements - Get requirements status
- PATCH /api/projects/:id/security-requirement - Update requirement status

---

#### Enhancement 2: Enhanced Site Survey (Contractor #2)
**Current:** Basic photo upload and location  
**Enhancement:** Structured survey form with solar-specific parameters

**Implementation:**
```sql
CREATE TABLE site_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) UNIQUE,
  survey_date date,
  surveyor_name text,
  roof_area_sqft decimal(8, 2),
  roof_orientation enum ('north', 'south', 'east', 'west', 'mixed'),
  roof_pitch_degrees decimal(5, 2),
  shading_percentage integer,
  soil_condition text,
  elevation_meters integer,
  weather_conditions text,
  photos_url text[],
  sketches_url text[],
  notes text,
  created_at timestamp DEFAULT now()
);
```

---

#### Enhancement 3: KSEB Energisation Tracking (Contractor #12)
**Current:** Not tracked  
**Enhancement:** Separate module for KSEB visit and energisation status

**Implementation:**
```sql
CREATE TABLE kseb_energisation_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  certification_id uuid REFERENCES kseb_feasibility_submissions(id),
  visit_scheduled_date date,
  actual_visit_date date,
  inspector_name text,
  inspector_id text,
  meter_number text,
  energisation_status enum ('scheduled', 'visited', 'energised', 'failed', 'pending'),
  failure_reason text,
  energisation_date date,
  follow_up_date date,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

---

#### Enhancement 4: Completion Certificate (Contractor #11)
**Current:** Project completion status only  
**Enhancement:** Auto-generate and track completion certificates for KSEB

**Implementation:**
```sql
CREATE TABLE completion_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) UNIQUE,
  certificate_number text UNIQUE,
  generation_date timestamp,
  issued_by uuid REFERENCES users(id),
  commissioned_by text,
  system_capacity_kw decimal(5, 2),
  inverter_make text,
  panel_make text,
  installation_completion_date date,
  performance_test_results jsonb,
  kseb_submission_date date,
  kseb_approval_date date,
  approval_status enum ('draft', 'ready', 'submitted', 'approved', 'rejected'),
  approval_reference_number text,
  pdf_url text,
  created_at timestamp DEFAULT now()
);
```

---

#### Enhancement 5: Followup Tracker (Contractor #4)
**Current:** Uses Tasks system  
**Enhancement:** Dedicated followup with auto-scheduling and history

**Implementation:**
```sql
CREATE TABLE followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  followup_type enum ('quote', 'proposal', 'customer', 'site', 'payment'),
  scheduled_date timestamp NOT NULL,
  status enum ('pending', 'completed', 'rescheduled', 'cancelled'),
  assigned_to uuid REFERENCES users(id),
  communication_method enum ('phone', 'email', 'visit', 'message'),
  notes text,
  outcome text,
  completed_date timestamp,
  created_at timestamp DEFAULT now()
);

CREATE TABLE followup_history (
  id uuid PRIMARY KEY,
  followup_id uuid REFERENCES followups(id),
  previous_status enum,
  new_status enum,
  status_change_date timestamp,
  changed_by uuid REFERENCES users(id)
);
```

**Auto-Scheduling Rules:**
- 3 days after quote sent → Customer followup
- 7 days after no response → Team reminder
- Before site survey → Confirmation call
- After installation stage → Site inspection followup

---

#### Enhancement 6: Payment Workflow (Contractor #14, #16)
**Current:** Invoice status only  
**Enhancement:** Conditional holds and staged payments

**Implementation:**
```sql
ALTER TABLE project_invoices ADD COLUMN invoice_stage enum ('advance', 'interim', 'final') DEFAULT 'interim';
ALTER TABLE project_invoices ADD COLUMN payment_condition text;
ALTER TABLE project_invoices ADD COLUMN conditional_hold_reason text;

CREATE TABLE payment_stages (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  stage_name text,
  stage_percentage integer,
  trigger_condition text,
  payment_amount decimal(12, 2),
  payment_status enum ('pending', 'due', 'paid', 'overdue'),
  due_date date,
  payment_received_date date
);
```

---

#### Enhancement 7: Price Database Versioning (Contractor #7)
**Current:** Basic materials list  
**Enhancement:** Versioning with effective dates and supplier tracking

**Implementation:**
```sql
ALTER TABLE materials ADD COLUMN supplier_id uuid REFERENCES suppliers(id);
ALTER TABLE materials ADD COLUMN effective_date date DEFAULT CURRENT_DATE;

CREATE TABLE material_price_versions (
  id uuid PRIMARY KEY,
  material_id uuid REFERENCES materials(id),
  version_number integer,
  cost_price decimal(10, 2),
  selling_price decimal(10, 2),
  effective_from date,
  effective_until date,
  created_at timestamp DEFAULT now()
);

CREATE TABLE suppliers (
  id uuid PRIMARY KEY,
  supplier_name text UNIQUE NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  city text,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);
```

---

### Phase 4 Summary
- **Critical Modules:** 4 (Staff Attendance, KSEB Feasibility, Handover Document, Warranty)
- **Enhancements:** 7 (Project Secure, Site Survey, KSEB Energisation, Completion Certificate, Followup, Payment Workflow, Price Versioning)
- **New Database Tables:** 20+
- **New API Endpoints:** 40+
- **Timeline:** 12 weeks (Jul 6 - Sep 30, 2026)
- **Estimated Team:** 8-10 FTE
- **Priority:** HIGH (regulatory + customer retention)

---

## Phase 5+ (October 2026+) - Future Enhancements

### Automation Features
- Automatic KSEB feasibility submission API integration
- Automatic warranty expiry reminders
- Automatic followup scheduling based on rules
- Automatic payroll calculation and bank transfers

### Integration Features
- KSEB online portal integration for real-time status
- Bank API integration for payment verification
- GST/Tax compliance automation
- Government subsidy tracking

### Advanced Features
- Predictive maintenance for solar systems
- Customer satisfaction surveys
- Revenue forecasting
- Team utilization analytics

---

## Implementation Decision Matrix

| Item | Phase 3 | Phase 4 | Phase 5 | Reasoning |
|------|---------|---------|---------|-----------|
| Service Requests | ✅ | | | High user demand, needed for Phase 3 Portal |
| Staff Attendance | | ✅ | | Critical for wage payment, blocks other processes |
| KSEB Feasibility | | ✅ | | Regulatory requirement, blocks project progression |
| Handover Document | | ✅ | | Essential for project closure, customer satisfaction |
| Warranty Extension | | ✅ | | Customer retention, recurring revenue |
| Project Secure | | ✅ | | Sales pipeline management |
| Enhanced Site Survey | | ✅ | | Improves quote accuracy |
| KSEB Energisation | | ✅ | | Regulatory tracking |
| Completion Certificate | | ✅ | | KSEB requirement |
| Followup Tracker | | ✅ | | Sales efficiency |
| Payment Workflow | | ✅ | | Financial control |
| Price Versioning | | ✅ | | Historical quote accuracy |
| Automation APIs | | | ✅ | Complex external integrations |

---

## Resource Allocation

### Phase 3 (12 weeks, 12 FTE)
- Track 1 (Portal + Service): 4 FTE
- Track 2 (Mobile): 3 FTE
- Track 3 (Reporting): 3 FTE
- Track 4 (Batch): 2 FTE

### Phase 4 (12 weeks, 8-10 FTE) - PROPOSED
- Critical Modules Team: 4-5 FTE (Attendance, KSEB, Handover, Warranty)
- Enhancement Team: 3-4 FTE (Secure, Survey, Energisation, Certificate, Followup, Payment, Pricing)
- Product/QA/DevOps: 1-2 FTE

### Parallel Execution
- Phase 3 and Phase 4 can run in parallel if team expansion is approved
- Phase 4 start: July 6, 2026 (while Phase 3 final testing in weeks 11-12)

---

## Success Metrics

### Phase 3
- 32 user stories completed
- 96%+ code coverage
- Zero P0 bugs in production
- 60%+ user adoption (contractors)
- 4.5+/5 satisfaction rating

### Phase 4
- 12 modules/enhancements completed
- 85%+ code coverage
- Zero P0 bugs
- 80%+ feature adoption
- Regulatory compliance achieved (KSEB)
- Customer retention improved 15%+

### Combined (Phase 3 + 4)
- Complete feature parity with contractor requirements
- Mobile app + Web app + Portal (3 interfaces)
- Full regulatory compliance (KSEB workflows)
- 90%+ team efficiency
- Production grade stability (99.9%+ uptime)

---

## Clarifications Needed Before Phase 4 Planning

1. **Staff Attendance:**
   - Do you need payroll integration with bank transfers?
   - Do you need different wage rates for different roles?
   - Should overtime be tracked automatically?
   - Is GPS verification required for field staff?

2. **KSEB Modules:**
   - Should we integrate with KSEB online portal (API)?
   - Are both feasibility and energisation modules required?
   - What are the specific document requirements?
   - Should we manage multiple KSEB zones/divisions?

3. **Warranty & Service:**
   - What is the standard warranty period (months)?
   - Should warranty be configurable per project?
   - What level of customer self-service for service requests?
   - Should we track recurring issues?

4. **Phase 4 Timeline:**
   - Can Phase 4 start before Phase 3 completes (parallel)?
   - Is July 6 start date acceptable?
   - What team expansion budget is approved?

5. **Integration Scope:**
   - Should KSEB integration be Phase 4 or later?
   - Do you need bank/GST integration?
   - Should we prioritize automation over manual workflows?

---

## Next Steps

1. **Immediate (This Week):**
   - Review this roadmap
   - Confirm Phase 4 timeline and resource allocation
   - Provide answers to clarification questions above

2. **Before Phase 3 Kickoff (April 21):**
   - Team reviews Phase 3 + Service Request module
   - Service Request module design finalized
   - Database schema approved

3. **Phase 3 Execution (Apr 21 - Jul 5):**
   - Complete Phase 3 features (4 tracks)
   - Implement Service Requests + Stage Metrics
   - Monthly progress reviews

4. **Phase 4 Planning (Jun 1 - Jun 30):**
   - Detailed design for 4 critical modules
   - Team recruitment for Phase 4 (if parallel)
   - Stakeholder approval for Phase 4 scope

5. **Phase 4 Execution (Jul 6 - Sep 30):**
   - 4 critical modules development
   - 7 enhancements to existing systems
   - Regulatory compliance validation

---

**Status: Ready for Stakeholder Review and Decision**

This roadmap integrates all 18 contractor requirements into a cohesive multi-phase plan while maintaining momentum with Phase 3. The phased approach balances critical path items (KSEB, Attendance, Warranty) with customer-facing features (Service Portal, Handover) and operational enhancements.
