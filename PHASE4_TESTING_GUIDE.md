# Phase 4: Comprehensive Testing Guide
**Date**: March 27, 2026
**Purpose**: Verify all features work correctly before moving to new development

---

## 🧪 TEST PLAN OVERVIEW

This guide provides step-by-step instructions for testing the most critical features before proceeding with new development.

### Test Coverage Map
```
Material Delivery Testing
├── Add Material (EST → NEG → EXE)
├── Edit Material (across states)
├── Delete Material (with confirmation)
└── Cost Calculations

Full Workflow Testing
├── EST Phase (project → proposal → PDF)
├── NEG Phase (edit → proposal → PDF)
├── EXE Phase (finalize → proposal)
├── Invoice Phase (create → link → PDF → payment)
└── State Transitions (data persistence)

PDF Download Testing
├── EST Proposal PDF
├── NEG Proposal PDF
├── EXE Proposal PDF
└── Invoice PDF

Additional Testing
├── Mobile Responsiveness
├── Data Persistence
├── Error Handling
└── Edge Cases
```

---

## 📋 TEST 1: MATERIAL DELIVERY - ADD, EDIT, DELETE

### Prerequisites
- ✅ App running (`npm run dev`)
- ✅ Logged in to SolarTrack Pro
- ✅ Browser: Chrome/Firefox with DevTools open
- ✅ Console: No errors before testing

### Test Case 1.1: Add Material in EST State

**Setup**:
1. Create new project or open existing project in EST state
2. Scroll to "Material Delivery Entry" section

**Steps**:
```
1. Click "Add Material" button
2. Fill form:
   - Material Name: "Solar Panels - 500W"
   - Quantity: 10
   - Unit Cost: ₹50,000
   - Category: "Panels"
3. Click "Save Material"
4. Check for toast notification "Material added successfully"
```

**Expected Results**:
- ✅ Material appears in list below form
- ✅ Total cost displays: 10 × ₹50,000 = ₹500,000
- ✅ Form clears after save
- ✅ No console errors

**Pass/Fail**: _____

**Notes**:
```
[Space for test notes]
```

---

### Test Case 1.2: Add Multiple Materials

**Setup**: Materials already exist from Test 1.1

**Steps**:
```
1. Click "Add Material" again
2. Fill form:
   - Material Name: "Inverter - 10kW"
   - Quantity: 2
   - Unit Cost: ₹150,000
   - Category: "Inverter"
3. Click "Save Material"
4. Add third material:
   - Material Name: "Mounting Structure"
   - Quantity: 1
   - Unit Cost: ₹80,000
   - Category: "Mounting"
5. Click "Save Material"
```

**Expected Results**:
- ✅ All three materials listed
- ✅ Total cost = ₹500,000 + ₹300,000 + ₹80,000 = ₹880,000
- ✅ Each material shows individual cost

**Pass/Fail**: _____

---

### Test Case 1.3: Edit Material in EST State

**Setup**: Materials from Test 1.2 exist

**Steps**:
```
1. Click "Edit" button next to "Solar Panels" material
2. Verify form populates with existing data
3. Change Quantity from 10 to 12
4. Click "Update Material"
5. Check toast: "Material updated successfully"
```

**Expected Results**:
- ✅ Material list updates with new quantity
- ✅ Total cost recalculates: 12 × ₹50,000 = ₹600,000
- ✅ Overall total updates: ₹880,000 → ₹980,000
- ✅ Form clears

**Pass/Fail**: _____

---

### Test Case 1.4: Delete Material

**Setup**: Materials exist with 3 items

**Steps**:
```
1. Click "Delete" button next to "Mounting Structure"
2. Confirm deletion in dialog
3. Check toast: "Material deleted successfully"
```

**Expected Results**:
- ✅ Material removed from list
- ✅ Total cost recalculates: ₹980,000 - ₹80,000 = ₹900,000
- ✅ Confirmation dialog shown before deletion
- ✅ No console errors

**Pass/Fail**: _____

---

### Test Case 1.5: Material Persistence - EST → NEG

**Setup**: Materials exist in EST state
- 1. Solar Panels: 12 × ₹50,000 = ₹600,000
- 2. Inverter: 2 × ₹150,000 = ₹300,000
- **Total**: ₹900,000

**Steps**:
```
1. Scroll to top of page
2. Click "Move to Negotiation" button
3. Wait for state transition (toast: "Project moved to Negotiation")
4. Scroll down to Material Delivery section
5. Verify materials still visible
6. Check total cost is still ₹900,000
```

**Expected Results**:
- ✅ All materials persisted
- ✅ Quantities unchanged
- ✅ Costs unchanged
- ✅ Total still ₹900,000

**Pass/Fail**: _____

---

### Test Case 1.6: Edit Material in NEG State

**Setup**: In NEG state with materials

**Steps**:
```
1. Click "Edit" next to "Inverter"
2. Change Quantity from 2 to 3
3. Click "Update Material"
4. Verify total updates: ₹900,000 → ₹1,050,000
```

**Expected Results**:
- ✅ Material edits in NEG state
- ✅ Cost recalculates correctly
- ✅ No errors

**Pass/Fail**: _____

---

### Test Case 1.7: Material Persistence - NEG → EXE

**Setup**: In NEG with edited materials (new total: ₹1,050,000)

**Steps**:
```
1. Scroll to top
2. Click "Move to Execution" button
3. Wait for state transition
4. Scroll to Material Delivery section
5. Verify all materials present with updated quantities
6. Check total is ₹1,050,000
```

**Expected Results**:
- ✅ Updated material quantities persisted
- ✅ Total cost is ₹1,050,000
- ✅ All edits preserved across state transitions

**Pass/Fail**: _____

---

### Test Case 1.8: Delete Material in EXE State

**Setup**: In EXE state with materials

**Steps**:
```
1. Delete one material
2. Verify total cost updates
3. Refresh page (Ctrl+R)
4. Verify deletion persisted after refresh
```

**Expected Results**:
- ✅ Material deletes correctly
- ✅ Cost recalculates
- ✅ Deletion persists after page refresh

**Pass/Fail**: _____

**Material Delivery Section Complete**: _____/8 tests passed

---

## 🔄 TEST 2: FULL WORKFLOW - EST → NEG → EXE → INVOICE

### Test Case 2.1: EST Phase - Create & Download Proposal

**Setup**:
1. Create NEW project (better for clean test)
   - Name: "Test Solar Project 001"
   - Capacity: 10 kW
   - Location: "Bangalore"
2. You're now in EST state

**Steps**:
```
1. Expand at least 3 project stages by clicking them
2. Enter quantities for tasks:
   - Stage 1 (Site Survey): Set at least 2 task quantities
   - Stage 2 (KSEB Application): Set at least 2 task quantities
   - Stage 3 (Installation): Set at least 2 task quantities
3. Scroll to bottom of EST section
4. Verify "Create Proposal" button is visible
5. Click "Create Proposal"
6. Check toast: "Proposal created successfully"
7. Scroll down to "Proposal Download" section
8. Click "Download PDF" button
9. Verify file downloads as PDF

**Note**: Proposal PDF file should be:
- Filename: `Proposal_EST-XXXXXX_YYYYMMDD.pdf`
- Contains: Project info, selected stages, tasks, costs, grand total
```

**Expected Results**:
- ✅ Proposal creates without error
- ✅ PDF downloads with correct filename
- ✅ PDF opens and displays proposal data
- ✅ PDF shows only selected stages (not all stages)
- ✅ All selected tasks visible with quantities and costs

**Pass/Fail**: _____

**PDF Content Check**:
- ✅ Header with proposal number and date
- ✅ Project name and code
- ✅ Stage names with tasks
- ✅ Task quantities × unit costs = totals
- ✅ Grand total at bottom

**Pass/Fail**: _____

---

### Test Case 2.2: NEG Phase - Edit & Download Proposal

**Setup**: In NEG state from Test 2.1

**Steps**:
```
1. Click "Move to Negotiation" button
2. Wait for transition (should show "Project moved to Negotiation")
3. Scroll down to NEG section
4. Click on a stage to expand it
5. Click "Edit" button next to a task quantity
6. Change quantity (e.g., from 1 to 2)
7. Click "Save Changes"
8. Verify toast: "Task updated successfully"
9. Scroll to NEG proposal section
10. Click "Create Proposal" (new NEG proposal)
11. Scroll down to "Proposal Download" section
12. Click "Download PDF"
13. Verify file downloads as PDF
```

**Expected Results**:
- ✅ Task quantities update correctly
- ✅ New NEG proposal creates
- ✅ PDF downloads with filename: `Proposal_NEG-XXXXXX_YYYYMMDD.pdf`
- ✅ PDF shows ALL stages (not just selected ones)
- ✅ Updated quantities visible in PDF
- ✅ New grand total reflects changes

**Pass/Fail**: _____

**Comparison**: EST vs NEG PDF
- EST should have fewer stages (only selected ones)
- NEG should have ALL stages with tasks
- Quantities should match what was edited

**Pass/Fail**: _____

---

### Test Case 2.3: EXE Phase - Finalize & Download

**Setup**: In NEG from Test 2.2

**Steps**:
```
1. Click "Move to Execution" button
2. Wait for transition
3. Scroll to EXE section
4. Click "Create Proposal" to create EXE proposal
5. Scroll to "Proposal Download"
6. Click "Download PDF"
7. Verify file downloads: `Proposal_EXE-XXXXXX_YYYYMMDD.pdf`
8. Verify PDF shows all stages with current quantities
```

**Expected Results**:
- ✅ EXE proposal creates
- ✅ PDF downloads with correct filename
- ✅ PDF shows all stages
- ✅ Quantities match NEG phase
- ✅ Grand total visible

**Pass/Fail**: _____

---

### Test Case 2.4: Invoice Creation & Linking

**Setup**: In EXE state from Test 2.3

**Steps**:
```
1. Scroll down in EXE section
2. Look for "Invoice Generation" section
3. Look for dropdown labeled "Select EXE Proposal"
4. Click dropdown to see available proposals
5. Select the EXE proposal created in Test 2.3
6. Verify "Generate Invoice" button is now enabled (blue)
7. Click "Generate Invoice"
8. Check toast: "Invoice generated successfully"
9. Scroll down to "Invoices" section
10. Verify invoice appears with:
    - Invoice number (e.g., INV-20260327-0001)
    - Linked proposal (should show selected proposal number)
    - Total amount (matches proposal)
    - Paid: ₹0
    - Outstanding: [Total amount]
```

**Expected Results**:
- ✅ Dropdown shows EXE proposals
- ✅ Invoice generates after selection
- ✅ Invoice appears in list
- ✅ Shows correct linking to proposal
- ✅ Shows correct amounts

**Pass/Fail**: _____

---

### Test Case 2.5: Invoice PDF Download & Format

**Setup**: Invoice created from Test 2.4

**Steps**:
```
1. In "Invoices" section, find the created invoice
2. Look for blue "Download" button
3. Click "Download" button
4. Verify file downloads: `Invoice_INV-20260327-XXXX_YYYYMMDD.pdf`
5. Open the PDF
6. Check for these sections:
   - Header (Invoice title, number, date)
   - Project Information (name, code, capacity, location, description)
   - Bill To (customer name, contact, email)
   - Project Stages & Services (all stages with tasks)
   - Each task shows: quantity × unit_cost = total
   - Each stage shows subtotal
   - Payment Summary (total, paid, outstanding)
   - Payment Terms & Conditions
   - Footer with company info and generation date
```

**Expected Results**:
- ✅ Invoice PDF downloads
- ✅ All sections present
- ✅ Project specs visible
- ✅ All stages listed
- ✅ All tasks with correct quantities and costs
- ✅ Stage subtotals correct
- ✅ Payment summary accurate
- ✅ Professional formatting

**Pass/Fail**: _____

**Invoice Content Verification**:
- ✅ Header: Blue background, white text
- ✅ Project info: Shows actual project details
- ✅ Customer info: Shows customer billing info
- ✅ Stage breakdown: All stages visible
- ✅ Task details: Qty × Cost = Total format
- ✅ Stage totals: Correct calculations
- ✅ Payment summary: Correct amounts
- ✅ Terms section: Visible with conditions

**Pass/Fail**: _____

---

### Test Case 2.6: Payment Recording

**Setup**: Invoice created from Test 2.4

**Steps**:
```
1. Find the invoice in "Invoices" section
2. Look for "Record Payment" button
3. Click "Record Payment"
4. In dialog that appears:
   - Enter amount: ₹[50% of total]
   - Click "Record Payment"
5. Verify toast: "Payment recorded successfully"
6. Check invoice details update to show:
   - Paid: ₹[50% of total]
   - Outstanding: ₹[50% of total]
7. Click "Record Payment" again
8. Enter remaining amount
9. Verify Outstanding becomes ₹0
```

**Expected Results**:
- ✅ Payment dialog appears
- ✅ Payment records successfully
- ✅ Paid amount updates correctly
- ✅ Outstanding updates correctly
- ✅ Can pay partial and full amounts
- ✅ Full payment shows Outstanding = ₹0

**Pass/Fail**: _____

---

### Test Case 2.7: Multiple Invoices for Different Proposals

**Setup**: In EXE state

**Steps**:
```
1. Create 2-3 more EXE proposals:
   - Edit some task quantities
   - Click "Create Proposal"
   - This creates additional EXE proposal versions
2. For each proposal:
   - Select from dropdown
   - Click "Generate Invoice"
3. Verify multiple invoices in list
4. Each invoice should show different proposal link
5. Download each invoice PDF
6. Verify each shows correct data for its proposal
```

**Expected Results**:
- ✅ Can create multiple invoices
- ✅ Each linked to different proposal
- ✅ PDFs show different data
- ✅ All totals and details correct

**Pass/Fail**: _____

**Full Workflow Section Complete**: _____/7 tests passed

---

## 📱 TEST 3: MOBILE RESPONSIVENESS

### Test Case 3.1: Mobile View - Material Delivery

**Setup**: Resize browser to 375px width (iPhone SE) or use Chrome DevTools mobile view

**Steps**:
```
1. Open project in EST state on mobile view
2. Scroll to Material Delivery section
3. Test adding material:
   - Inputs should be full width
   - Button should be easy to tap (48px+ height)
4. Edit material on mobile
5. Delete material on mobile
6. Check form is usable on small screen
```

**Expected Results**:
- ✅ All inputs full width on mobile
- ✅ Buttons large enough to tap
- ✅ Text readable (not tiny)
- ✅ No horizontal scrolling needed
- ✅ Form works same as desktop

**Pass/Fail**: _____

---

### Test Case 3.2: Mobile View - Proposal Panel

**Setup**: Mobile view (375px)

**Steps**:
```
1. Open project in EST state
2. Try to expand stages on mobile
3. Try to edit task quantities
4. Try to create proposal
5. Verify all buttons clickable on mobile
6. Check state transition buttons (NEG, EXE)
7. Try downloading PDF on mobile
```

**Expected Results**:
- ✅ All elements accessible on mobile
- ✅ No overlapping text or buttons
- ✅ Download works on mobile
- ✅ PDF opens properly

**Pass/Fail**: _____

---

## 🐛 TEST 4: ERROR HANDLING & EDGE CASES

### Test Case 4.1: Invalid Material Input

**Steps**:
```
1. Try to add material with empty name
2. Try to add material with negative quantity
3. Try to add material with negative cost
4. Try to add material with quantity = 0
5. Note error messages shown
```

**Expected Results**:
- ✅ Error message for empty name
- ✅ Negative values rejected or corrected
- ✅ Clear error messages to user
- ✅ Form doesn't submit with invalid data

**Pass/Fail**: _____

---

### Test Case 4.2: Network Error Simulation

**Setup**: Open DevTools Network tab

**Steps**:
```
1. Set Network to "Offline"
2. Try to add material
3. Note behavior (queued, error, etc.)
4. Set Network back to "Online"
5. Try operation again
```

**Expected Results**:
- ✅ Clear error message when offline
- ✅ Retry works when online
- ✅ No app crashes

**Pass/Fail**: _____

---

### Test Case 4.3: Rapid Clicking (Double Submit)

**Steps**:
```
1. Click "Create Proposal" button twice rapidly
2. Click "Generate Invoice" button twice rapidly
3. Check if duplicate proposals/invoices created
```

**Expected Results**:
- ✅ Button disables after click
- ✅ No duplicate proposals
- ✅ No duplicate invoices
- ✅ User receives feedback (loading state)

**Pass/Fail**: _____

---

## 📊 TEST RESULTS SUMMARY

| Test Category | Tests Passed | Tests Failed | Pass Rate |
|---------------|-------------|------------|-----------|
| Material Delivery | ___/8 | ___ | __% |
| Full Workflow | ___/7 | ___ | __% |
| Mobile Testing | ___/2 | ___ | __% |
| Error Handling | ___/3 | ___ | __% |
| **TOTAL** | ___/20 | ___ | __% |

---

## 📝 ISSUES FOUND

| # | Issue | Severity | Steps to Reproduce | Expected | Actual | Status |
|---|-------|----------|-------------------|----------|--------|--------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

---

## ✅ TEST SIGN-OFF

**Tested By**: _______________
**Date**: _______________
**Environment**: Chrome/Firefox on Windows/Mac
**Result**: PASS / FAIL
**Notes**:

---

## 🎯 NEXT STEPS

- [ ] All tests passed → Proceed to Priority 2 (Customer Banner)
- [ ] Some tests failed → Create bug fix tickets
- [ ] Critical failures → Escalate for immediate fixes

