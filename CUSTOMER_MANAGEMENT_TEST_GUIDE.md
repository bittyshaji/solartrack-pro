# Customer Management Restructuring - Test Guide

## Overview
This guide walks you through testing the complete customer management system restructuring where customers are created separately and linked to projects with automatic data propagation across all proposal states.

---

## Test Scenario: Complete Flow
**Goal**: Verify that customer data created separately flows automatically through all project states without manual re-entry.

---

## STEP 1: Navigate to Customer Management
1. Log in to the application
2. Click **"Customers"** in the left sidebar
3. You should see the Customer Management page with:
   - Search bar for finding customers
   - "Add Customer" button
   - List of existing customers (if any)

**Expected**: Page loads successfully with empty or populated customer list

---

## STEP 2: Create a Test Customer
1. Click **"Add Customer"** button
2. Fill in the form with:
   - **Customer Name**: "Rajesh Kumar" (required)
   - **Email**: "rajesh@example.com"
   - **Phone**: "9876543210"
   - **Company**: "Tech Solutions"
   - **Address**: "123 Solar Street"
   - **City**: "Mumbai"
   - **State**: "Maharashtra"
   - **Postal Code**: "400001"
   - **Notes**: "Residential solar installation"

3. Click **"Add Customer"** button

**Expected Results**:
- ✅ Toast message: "Customer created successfully!"
- ✅ Modal closes automatically
- ✅ New customer appears in the list with:
  - Display name: "Rajesh Kumar"
  - Unique ID: "CUST-YYYYMMDD-XXXX" format
  - Email, phone, city/state visible on card
  - Edit and Deactivate buttons
- ✅ Customer count updates to "1 active customers"

---

## STEP 3: Create a New Project Linked to Customer
1. Click **"Project Master"** in sidebar → Click **"New Project"** button
2. OR Navigate directly to **"/projects/create"**
3. Fill in the project form:
   - **Project Name**: "Solar Installation - Rajesh Kumar" (required)
   - **Customer**: Select "Rajesh Kumar (CUST-YYYYMMDD-XXXX)" from dropdown
   - **Status**: "Planning"
   - **Capacity (kW)**: "5.5"
   - **Start Date**: Today's date
   - **Notes**: "Rooftop solar installation"

4. Click **"Create Project"** button

**Expected Results**:
- ✅ Toast message: "Project created successfully!"
- ✅ Redirected to project detail page
- ✅ Page shows project with estimated customer info
- ✅ No "Customer Name" or "Contact Number" input fields (they should NOT exist)

---

## STEP 4: Verify Customer Data Auto-Loads in Estimation Panel
1. You should now be on the ProjectDetail page in **Estimation** state
2. Scroll down to view the **"Customer Information"** section (blue gradient box)
3. Verify the section displays:
   - **Customer Name**: "Rajesh Kumar" (auto-populated from linked customer)
   - **Contact Number**: "9876543210" (auto-populated)
   - **Email**: "rajesh@example.com" (auto-populated)
   - **Company**: "Tech Solutions" (auto-populated)

**Expected Results**:
- ✅ Customer information is READ-ONLY (not input fields)
- ✅ Data matches what was entered in Step 2
- ✅ No manual data entry required

---

## STEP 5: Add Tasks and Generate Estimation Proposal
1. Expand stages and add quantities to tasks (e.g., Site Survey = 1, Panel Installation = 5)
2. Click **"Generate Proposal"** button

**Expected Results**:
- ✅ Proposal generated with unique number (e.g., "EST-20260326-0001")
- ✅ Toast: "Proposal EST-XXXXXX generated successfully!"
- ✅ Proposal appears in "Previous Estimations" section
- ✅ "Download PDF" and "Move to Negotiation →" buttons become enabled

---

## STEP 6: Download PDF and Verify Customer Data
1. Click **"Download PDF"** button
2. Open the downloaded PDF

**Expected Results**:
- ✅ PDF header shows "SolarTrack Pro" with project information
- ✅ **Customer Name** field shows: "Rajesh Kumar"
- ✅ **Contact Number** field shows: "9876543210"
- ✅ Proposal number matches what was shown (EST-XXXXXX)
- ✅ All selected stages and tasks appear with costs
- ✅ Total price is calculated correctly
- ✅ Company name "Tech Solutions" visible in customer section

---

## STEP 7: Move to Negotiation Phase
1. Click **"Move to Negotiation →"** button

**Expected Results**:
- ✅ Toast: "Moved to Negotiation phase! ✅"
- ✅ Page refreshes and shows NegotiationPanel
- ✅ **Customer Information** section (orange gradient) displays:
  - Name: "Rajesh Kumar"
  - Contact: "9876543210"
  - Email: "rajesh@example.com"
  - Company: "Tech Solutions"
- ✅ All stages with inherited quantities loaded
- ✅ Still NO manual customer entry fields

---

## STEP 8: Create Negotiation Proposal
1. Modify any quantities if desired (e.g., change some costs)
2. Click **"Save Negotiated Proposal"** button

**Expected Results**:
- ✅ Proposal saved with type "Negotiation"
- ✅ Proposal appears in "Previous Proposals" section
- ✅ Customer data automatically included (no re-entry needed)

---

## STEP 9: Download Negotiation PDF
1. Click **"Download PDF"** button in Negotiation panel

**Expected Results**:
- ✅ PDF downloads successfully
- ✅ Proposal number updated to "NEG-XXXXXX"
- ✅ **Customer data persists**:
  - Name: "Rajesh Kumar"
  - Contact: "9876543210"
  - Email and company visible
- ✅ Negotiated costs shown in PDF
- ✅ All stages inherited from Estimation

---

## STEP 10: Move to Execution Phase
1. Click **"Move to Execution →"** button

**Expected Results**:
- ✅ Toast: "Project moved to Execution state"
- ✅ Page shows ExecutionPanel
- ✅ **Customer Information** section (green gradient) displays:
  - Name: "Rajesh Kumar"
  - Contact: "9876543210"
  - Email: "rajesh@example.com"
  - Company: "Tech Solutions"
- ✅ Stages and tasks inherited from Negotiation phase
- ✅ Still NO customer input fields

---

## STEP 11: Create Execution Proposal & Invoice
1. Modify any quantities as needed
2. Click **"Create Execution Proposal"** button

**Expected Results**:
- ✅ Proposal created with type "Execution"
- ✅ Customer data auto-included

3. Click **"Generate Final Invoice"** button

**Expected Results**:
- ✅ Invoice generated successfully
- ✅ Invoice references execution proposal
- ✅ Customer information included in invoice

---

## STEP 12: Download Execution PDF
1. Click **"Download PDF"** button in Execution panel

**Expected Results**:
- ✅ PDF downloads with proposal type "EXE-XXXXXX"
- ✅ **Customer data persists** across all three states:
  - Name: "Rajesh Kumar"
  - Contact: "9876543210"
  - Email: "rajesh@example.com"
  - Company: "Tech Solutions"
- ✅ Final execution quantities shown
- ✅ Invoice reference visible if invoice was generated

---

## VERIFICATION CHECKLIST

### Database
- [ ] `project_customers` table has customer records
- [ ] `projects` table has `customer_id_ref` column
- [ ] `customer_id_ref` correctly linked to customer data

### Customer Management Page
- [ ] Can create customers with unique IDs
- [ ] Can edit customer information
- [ ] Can deactivate customers
- [ ] Search functionality works
- [ ] Active customer count displays

### Project Creation
- [ ] Customer dropdown populated with all customers
- [ ] Customer selection is required
- [ ] Error shown if no customers exist
- [ ] Error shown if customer not selected

### Estimation Panel
- [ ] Customer info displays (read-only)
- [ ] NO customer input fields exist
- [ ] Proposal generation works
- [ ] PDF includes customer data
- [ ] Move to Negotiation button works

### Negotiation Panel
- [ ] Customer info persists (read-only)
- [ ] NO customer input fields exist
- [ ] Can modify costs
- [ ] PDF includes customer data
- [ ] Move to Execution button works

### Execution Panel
- [ ] Customer info persists (read-only)
- [ ] NO customer input fields exist
- [ ] Can modify work tracking
- [ ] Invoice generation works
- [ ] PDF includes customer data

---

## Common Issues & Solutions

### Issue: "No customers found" error in Project Form
**Solution**:
1. Go to Customers page
2. Create at least one customer
3. Refresh project creation page
4. Customer dropdown should now populate

### Issue: Customer data not showing in panels
**Solution**:
1. Verify `customer_id_ref` is saved in projects table
2. Check browser console for errors
3. Reload the page
4. Verify customer relationship query is working

### Issue: PDF missing customer information
**Solution**:
1. Verify customer is linked to project
2. Check proposalDownloadService is using customer data
3. Download PDF again after refresh

### Issue: "Move to" buttons greyed out
**Solution**:
1. Ensure you've created a proposal for current state
2. Refresh the page to reload proposal status
3. Try clicking after proposal generation completes

---

## Success Criteria

All items checked = ✅ **Customer Management Restructuring Complete**

1. ✅ Customers created separately with unique IDs
2. ✅ Projects linked to pre-existing customers
3. ✅ Customer data auto-loads in all proposal states
4. ✅ NO manual customer re-entry in any state
5. ✅ PDFs include correct customer information
6. ✅ Customer info persists across all three states
7. ✅ No orphaned or duplicate customers
8. ✅ Data consistency maintained throughout workflow

---

## Test Data Summary

| Field | Value |
|-------|-------|
| Customer Name | Rajesh Kumar |
| Customer ID | CUST-YYYYMMDD-XXXX |
| Email | rajesh@example.com |
| Phone | 9876543210 |
| Company | Tech Solutions |
| Address | 123 Solar Street |
| City | Mumbai |
| State | Maharashtra |
| Postal Code | 400001 |
| Project | Solar Installation - Rajesh Kumar |
| Capacity | 5.5 kW |

---

## Navigation Flow

```
Login
  ↓
Dashboard
  ↓
Customers (NEW!)
  → Create Customer: "Rajesh Kumar"
  ↓
Projects
  → Create Project: Select "Rajesh Kumar"
  ↓
ProjectDetail (Estimation State)
  → View auto-populated customer info
  → Generate Estimation proposal
  → Download PDF (verify customer in PDF)
  → Move to Negotiation
  ↓
NegotiationPanel
  → View auto-populated customer info
  → Save negotiation
  → Download PDF
  → Move to Execution
  ↓
ExecutionPanel
  → View auto-populated customer info
  → Create execution proposal
  → Generate invoice
  → Download final PDF
```

---

**Test Duration**: ~20-30 minutes
**Expected Outcome**: All customer data flows automatically without manual re-entry
