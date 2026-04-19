# Complete Customer Workflow Architecture

## 🔄 System Overview

The application has three main user roles that interact with each other:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLARTRACK PRO SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   ADMIN      │    │   MANAGER    │    │   CUSTOMER   │       │
│  │  (Internal)  │    │  (Internal)  │    │  (External)  │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │                                    │
│                    Shared Database Layer                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Structure

```
┌─────────────────────────────────────────────────────────┐
│                   DATABASE TABLES                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  project_        │         │    projects      │     │
│  │  customers       │◄────────┤  (main table)    │     │
│  │  (Customer Info) │  FK     │                  │     │
│  └──────────────────┘         └──────────────────┘     │
│       ▲                               │                 │
│       │ Links via                     │ Tracks work    │
│       │ customer_id_ref               │                 │
│       │                               ▼                 │
│       │                        ┌──────────────────┐     │
│       │                        │  project_        │     │
│       │                        │  estimates       │     │
│       │                        │  (EST/NEG/EXE)   │     │
│       │                        └──────────────────┘     │
│       │                               │                 │
│       │                               ▼                 │
│       │                        ┌──────────────────┐     │
│       │                        │ proposal_        │     │
│       │                        │ references       │     │
│       │                        │ (Status tracking)│     │
│       │                        └──────────────────┘     │
│       │                               │                 │
│       └───────────┬────────────────────┘                │
│                   │                                     │
│           ┌───────▼────────┐                            │
│           │ daily_updates  │                            │
│           │ update_photos  │                            │
│           │ (Team updates) │                            │
│           └────────────────┘                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 User Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW SEQUENCE                                │
└─────────────────────────────────────────────────────────────────────────┘

PHASE 1: CUSTOMER & PROJECT SETUP
═════════════════════════════════════════════════════════════════════════

  Admin/Manager                          System                   Customer
  ─────────────                          ──────                   ────────
         │
         │ 1. Create Customer
         │────────────────────────────►┌──────────────────────┐
         │   (Name, Email, Phone)      │ project_customers    │
         │                             │ table                │
         │◄────────────────────────────│ Gets unique ID:      │
         │   Returns CUST-YYYYMMDD-XXX │ CUST-20260326-4167   │
         │                             └──────────────────────┘
         │
         │ 2. Create Project
         │────────────────────────────►┌──────────────────────┐
         │   Link to Customer          │ projects table       │
         │   Set Capacity, Location    │ + customer_id_ref    │
         │                             │ (Foreign Key)        │
         │◄────────────────────────────│ Projects created     │
         │   Project ID returned       └──────────────────────┘


PHASE 2: PROPOSAL WORKFLOW (Internal)
═════════════════════════════════════════════════════════════════════════

  Admin/Manager
  ─────────────
         │
         │ 3. ESTIMATION STATE
         │
         ├─► Add tasks & quantities
         │
         ├─► Generate EST Proposal
         │   ├─ Creates proposal reference: EST-20260326-4167
         │   ├─ Auto-populates CUSTOMER DATA (from linked customer)
         │   │  • Name: Rajesh Kumar
         │   │  • Phone: 9876543210
         │   │  • Email: rajesh@example.com
         │   │  • Company: Tech Solutions
         │   │
         │   └─ Status: DRAFT
         │
         ├─► Download PDF
         │   └─ PDF includes all customer info automatically
         │
         │ 4. NEGOTIATION STATE
         │
         ├─► Modify costs/quantities
         │
         ├─► Generate NEG Proposal
         │   ├─ Creates proposal reference: NEG-20260326-4069
         │   ├─ Auto-populates CUSTOMER DATA (persists from Estimation)
         │   │  • Same customer info as EST
         │   │
         │   └─ Status: DRAFT
         │
         ├─► Download PDF
         │   └─ PDF includes customer info
         │
         │ 5. EXECUTION STATE
         │
         ├─► Track actual work
         │
         ├─► Generate EXE Proposal
         │   ├─ Creates proposal reference: EXE-20260326-5001
         │   ├─ Auto-populates CUSTOMER DATA (persists throughout)
         │   │  • Same customer info as EST & NEG
         │   │
         │   └─ Status: DRAFT
         │
         └─► Generate Final Invoice
             └─ Uses EXE proposal + customer data


PHASE 3: WORK UPDATES & PHOTOS
═════════════════════════════════════════════════════════════════════════

  Team/Manager                    System                      Customer Portal
  ────────────                    ──────                      ───────────────
         │
         ├─► Post Daily Update
         │   ├─ Stage progress
         │   ├─ Work description
         │   └─ Photos
         │
         │────────────────────────────►┌──────────────────────┐
         │                             │ daily_updates        │
         │                             │ update_photos        │
         │                             └──────────────────────┘
         │                                    │
         │                                    │ Linked via project_id
         │                                    ▼
         │                            ┌──────────────────────┐
         │                            │ Customer Portal      │
         │                            │ (Real-time view)     │
         │                            └──────────────────────┘
         │                                    │
         │                                    │ Customer logs in with
         │                                    │ their email
         │                                    ▼
         │                            ┌──────────────────────┐
         │                            │ Shows:               │
         │                            │ ✓ Project progress   │
         │                            │ ✓ Current stage      │
         │                            │ ✓ Team leader info   │
         │                            │ ✓ Latest photos      │
         │                            │ ✓ Stage timeline     │
         │                            └──────────────────────┘
         │                                    ◄─────────── Customer views
         │                                        updates


PHASE 4: FINAL HANDOVER
═════════════════════════════════════════════════════════════════════════

  Admin/Manager                    System                    Customer
  ─────────────                    ──────                    ────────
         │
         │ Mark project complete
         │────────────────────────────►┌──────────────────────┐
         │                             │ projects.status      │
         │                             │ = "Completed"        │
         │                             └──────────────────────┘
         │                                    │
         │                                    ▼
         │                            ┌──────────────────────┐
         │                            │ Customer Portal      │
         │                            │ Shows "COMPLETED"    │
         │◄────────────────────────────│ + Installation team  │
         │ Project marked as complete │ + Final stage date   │
         │                             │ + Success message    │
         │                             └──────────────────────┘
```

---

## 🔗 Customer Portal Integration Points

### Current Implementation
**Location**: `src/pages/CustomerPortal.jsx`

The Customer Portal currently:

```
1. Customer logs in with email
   └─► System looks up projects using customer email
       └─► SELECT * FROM projects WHERE customer_email LIKE customer@email.com

2. Displays Project Information
   ├─ Project name, capacity, location
   ├─ Current stage & progress
   ├─ Expected completion date
   └─ Team leader contact info

3. Shows Work Updates
   ├─ Fetches from daily_updates table
   ├─ Displays latest photos
   └─ Shows stage timeline

4. Real-time Progress Tracking
   ├─ Installation progress bar
   ├─ Current stage status
   └─ Photo gallery
```

---

## ⚠️ Current Issue with New Customer Management

**Problem**: The CustomerPortal still uses the old approach:

```javascript
// Current (OLD) - Line 62 in CustomerPortal.jsx
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .ilike('customer_email', user.email)  // ← Uses email field, not customer_id
  .maybeSingle()
```

**Why it's a problem**:
- We now store customer info in `project_customers` table
- Projects are linked via `customer_id_ref` foreign key
- The `customer_email` field may not be populated with new projects
- New projects use the new customer management system

---

## ✅ Solution: Update CustomerPortal for New System

### Option 1: Update Portal to Use New Customer Linking
```javascript
// NEW APPROACH - Query through customer relationship
const { data: projectData } = await supabase
  .from('projects')
  .select(`
    *,
    customer:customer_id_ref(email)
  `)
  .eq('customer.email', user.email)  // Join through customer relationship
  .maybeSingle()
```

### Option 2: Hybrid Approach (Backward Compatible)
```javascript
// Support BOTH old and new approaches
const { data: projectData } = await supabase
  .from('projects')
  .select(`
    *,
    customer:customer_id_ref(email)
  `)
  .or(`customer.email.ilike.${user.email}, customer_email.ilike.${user.email}`)
  .maybeSingle()
```

---

## 📋 Complete Data Flow Example

```
STEP-BY-STEP: How Rajesh Kumar's Solar Project Flows Through System
════════════════════════════════════════════════════════════════════

Admin Creates Rajesh as Customer:
┌─────────────────────────────────────────────────┐
│ Customers Page                                  │
│ ✓ Name: Rajesh Kumar                            │
│ ✓ Email: rajesh@example.com                     │
│ ✓ Phone: 9876543210                             │
│ ✓ Company: Tech Solutions                       │
└─────────────────────────────────────────────────┘
           │
           │ Save to Database
           ▼
┌─────────────────────────────────────────────────┐
│ project_customers Table                         │
│ ├─ customer_id: CUST-20260326-4167              │
│ ├─ name: Rajesh Kumar                           │
│ ├─ email: rajesh@example.com                    │
│ ├─ phone: 9876543210                            │
│ └─ company: Tech Solutions                      │
└─────────────────────────────────────────────────┘


Admin Creates Project for Rajesh:
┌─────────────────────────────────────────────────┐
│ Create Project Page                             │
│ ✓ Project Name: Solar Installation - Rajesh    │
│ ✓ Customer: Rajesh Kumar (CUST-20260326-4167)  │
│ ✓ Capacity: 5.5 kW                              │
│ ✓ Location: Mumbai                              │
└─────────────────────────────────────────────────┘
           │
           │ Save to Database
           ▼
┌─────────────────────────────────────────────────┐
│ projects Table                                  │
│ ├─ id: proj-12345                               │
│ ├─ name: Solar Installation - Rajesh           │
│ ├─ customer_id_ref: CUST-20260326-4167 ◄─── FK │
│ ├─ capacity_kw: 5.5                             │
│ └─ location: Mumbai                             │
└─────────────────────────────────────────────────┘


Admin Generates EST Proposal:
┌─────────────────────────────────────────────────┐
│ Estimation Panel                                │
│ ✓ Add tasks & quantities                        │
│ ✓ Customer Info (AUTO-LOADED):                  │
│   ├─ Name: Rajesh Kumar                         │
│   ├─ Phone: 9876543210                          │
│   ├─ Email: rajesh@example.com                  │
│   └─ Company: Tech Solutions                    │
│ ✓ Generate Proposal                             │
└─────────────────────────────────────────────────┘
           │
           │ Saves two records
           ├──────────────────────┬──────────────────────┐
           ▼                      ▼                      ▼
   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
   │ proposal_       │  │ project_        │  │ Customer Info   │
   │ references      │  │ estimates       │  │ Retrieved from: │
   │ ├─ Number:      │  │ ├─ project_id   │  │ customer_id_ref │
   │ │ EST-2026...   │  │ ├─ grand_total  │  │ AUTO-INCLUDED   │
   │ ├─ Type:        │  │ ├─ customer_name│◄─┤ in PDF:         │
   │ │ Estimation    │  │ └─ customer_ph..│  │ • Name          │
   │ └─ Status: DRAFT│  └─────────────────┘  │ • Phone         │
   └─────────────────┘                        │ • Email         │
                                              │ • Company       │
                                              └─────────────────┘


Download PDF (For Rajesh):
┌─────────────────────────────────────────────────┐
│ PDF Header                                      │
│ ═══════════════════════════════════════════     │
│ SolarTrack Pro Proposal                         │
│ Proposal #: EST-20260326-4167                   │
│                                                 │
│ Customer Information:                           │
│ ├─ Name: Rajesh Kumar                           │◄─── Pulled from
│ ├─ Contact: 9876543210                          │     project.customer
│ ├─ Email: rajesh@example.com                    │     (AUTO)
│ └─ Company: Tech Solutions                      │
│                                                 │
│ Project: Solar Installation - Rajesh           │
│ Capacity: 5.5 kW                                │
│ Location: Mumbai                                │
│                                                 │
│ Stages & Tasks:                                 │
│ [List of all stages with costs]                 │
│                                                 │
│ Total: ₹XXX,XXX                                 │
│ ═══════════════════════════════════════════     │
└─────────────────────────────────────────────────┘


Rajesh Logs Into Customer Portal:
┌─────────────────────────────────────────────────┐
│ Customer Portal                                 │
│ (Rajesh logs in: rajesh@example.com)            │
│                                                 │
│ System finds his project using:                 │
│ SELECT * FROM projects                          │
│ JOIN project_customers                          │
│   ON projects.customer_id_ref = customers.id    │
│ WHERE customers.email = 'rajesh@example.com'    │
│                                                 │
│ Displays:                                       │
│ ✓ Project: Solar Installation - Rajesh         │
│ ✓ Progress: 10% (Stage 1 of 10)                 │
│ ✓ Capacity: 5.5 kW                              │
│ ✓ Installation Team: [Team Name]                │
│ ✓ Team Leader: [Name & Phone]                   │
│ ✓ Latest Photos from work                       │
│ ✓ Stage Timeline                                │
│ ✓ Expected Completion: [Date]                   │
└─────────────────────────────────────────────────┘
           │
           │ Each update posted by team
           │ automatically appears in real-time
           │
           └─► Customer sees live progress!
```

---

## 🎯 Benefits of Current Architecture

| Feature | Benefit |
|---------|---------|
| **Separate Customer Management** | Customers created once, reused across multiple projects |
| **Customer ID Linking** | Prevents duplicate customer entries (CUST-YYYYMMDD-XXXX) |
| **Auto-populated Data** | No manual re-entry in proposals, PDFs, or invoices |
| **Data Consistency** | Same customer info throughout EST → NEG → EXE workflow |
| **Real-time Portal** | Customers see updates immediately via daily_updates table |
| **Relationship-based Queries** | Database joins ensure data integrity |
| **Audit Trail** | All proposals track their customer reference |

---

## 📝 Next Steps

To fully integrate the new customer management with the Customer Portal:

1. ✅ **Update CustomerPortal.jsx** (Line 59-62)
   - Change from `customer_email` lookup
   - To customer relationship join via `customer_id_ref`

2. ✅ **Ensure Backward Compatibility**
   - Support both old and new approaches during transition
   - Gradually migrate old projects to use new customer linking

3. ✅ **Display Linked Customer Info**
   - Show which customer is linked to the project
   - Display customer ID and details in project view

4. ✅ **Optional: Add Customer Self-Service**
   - Let customers update their phone/address in portal
   - Auto-updates customer record for all linked projects

---

## 🔐 Security & Permissions

```
Role-based Access:
━━━━━━━━━━━━━━━━━

Admin/Manager:
├─ Create/Edit/Delete customers
├─ Create/Edit projects
├─ Generate all proposal types
├─ Post work updates
└─ Manage teams

Customer (via Portal):
├─ View own projects (by email)
├─ View work updates
├─ View photos
├─ View progress
└─ Contact team leader
   (Cannot edit project/proposals)
```

