# SolarTrack Pro - Implementation & Troubleshooting Guide

**Last Updated**: March 24, 2026

---

## 🎯 CRITICAL PATH TO WORKING APP

Follow these steps in order. Each step must complete successfully before moving to the next.

---

## STEP 1️⃣: Database Schema Setup (15 minutes)

### 1.1 Create Migration Tables

**What to do**: Copy and run the SQL migration script in Supabase

**Location**: `/supabase_schema_migration.sql`

**Steps**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy entire content of `workflow_schema_migration.sql`
6. Paste into the SQL editor
7. Click "Run" button
8. Wait for success message

**Expected Output**:
```
Query executed successfully
Rows affected: 0
Duration: 1.2s
```

**Troubleshooting**:
- ❌ Error: "table already exists"
  - This is fine - the script uses `IF NOT EXISTS`
  - Just verify the columns were added

- ❌ Error: "permission denied"
  - You likely need to be logged in as admin
  - Check your Supabase account role

- ❌ Error: "syntax error at line X"
  - Copy the exact line and check for typos
  - Make sure you copied the entire script

---

### 1.2 Verify Tables Were Created

**In Supabase Dashboard**:
1. Click "Table Editor" in left sidebar
2. Look for these new tables:
   - `stage_tasks` ✓
   - `project_estimates` ✓
   - `project_invoices` ✓

3. Click on `projects` table
4. Verify these columns exist:
   - `project_code` ✓
   - `project_state` ✓
   - `stage` ✓

**If tables are missing**: Re-run the migration SQL and check for errors

---

## STEP 2️⃣: Seed Default Stage Tasks (5 minutes)

### 2.1 Populate Default Tasks

**What to do**: Load the 50 default solar installation tasks

**Location**: `/seed_default_stage_tasks.sql`

**Steps**:
1. In Supabase SQL Editor, click "New Query"
2. Copy entire content of `seed_default_stage_tasks.sql`
3. Paste into editor
4. Click "Run"

**Expected Output**:
```
50 rows inserted successfully
```

**Verification**:
1. Click "Table Editor"
2. Click on `stage_tasks` table
3. Scroll down - should see ~50 tasks
4. Check filter shows stage_id = 1, 2, 3, etc.

**Troubleshooting**:
- ❌ Error: "duplicate key value"
  - Tasks already exist - this is fine
  - Check if they're visible in Table Editor

- ❌ Error: "relation does not exist"
  - stage_tasks table wasn't created in Step 1
  - Go back and re-run migration

---

## STEP 3️⃣: Fix PDF Generation (10 minutes)

### 3.1 Update proposalDownloadService.js

**Problem**: The jsPDF-autotable plugin isn't initializing properly

**Current Error**:
```
TypeError: doc.autoTable is not a function
```

**Solution**: Update the file with proper error checking

**File**: `src/lib/proposalDownloadService.js`

**Changes Required**:

Replace this:
```javascript
doc.autoTable({
  startY: yPosition,
  head: [['Description', 'Qty', 'Unit Cost', 'Total']],
  body: tableData,
  // ... rest of config
})
```

With this:
```javascript
// Ensure autotable plugin is loaded
if (!doc.autoTable) {
  // Fallback: Create simple text-based table
  console.warn('jsPDF-autotable not available, using text fallback')
  let tempY = yPosition

  // Header
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.setFillColor(59, 130, 246)
  doc.text('Description', margin + 5, tempY + 5)
  doc.text('Qty', margin + 110, tempY + 5)
  doc.text('Unit Cost', margin + 130, tempY + 5)
  doc.text('Total', margin + 170, tempY + 5)
  tempY += 10

  // Rows
  doc.setTextColor(0, 0, 0)
  tableData.forEach((row) => {
    if (typeof row === 'string') {
      doc.text(row, margin, tempY)
    } else {
      doc.text(row[0] || '', margin + 5, tempY)
      doc.text(row[1] || '', margin + 110, tempY)
      doc.text(row[2] || '', margin + 130, tempY)
      doc.text(row[3] || '', margin + 170, tempY)
    }
    tempY += 5
  })

  yPosition = tempY
} else {
  // Use proper autotable if available
  doc.autoTable({
    startY: yPosition,
    head: [['Description', 'Qty', 'Unit Cost', 'Total']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
    }
  })

  yPosition = doc.lastAutoTable.finalY + 15
}
```

### 3.2 Verify PDF Download Works

**Test**:
1. Start your app: `npm run dev`
2. Login to app
3. Go to Projects → Select a project
4. Scroll to "Create Professional Proposal"
5. Check any stage checkboxes
6. Click "Generate Proposal" button
7. Click "Download PDF" button
8. PDF should download (check Downloads folder)

**Expected PDF Contents**:
- Header: "SOLAR PROJECT PROPOSAL"
- Project Information section
- Table of selected stages and tasks
- Grand Total
- Terms & Conditions
- Footer with timestamp

**Troubleshooting**:
- ❌ PDF downloads but is blank
  - Check browser console for errors
  - Verify data is being passed to function

- ❌ "Generate Proposal" doesn't work
  - Check console for estimate creation errors
  - Verify project_estimates table was created

- ❌ "Download PDF" button disabled
  - You need to select at least one stage checkbox
  - Try selecting multiple stages

---

## STEP 4️⃣: End-to-End Workflow Test (20 minutes)

### 4.1 Create a Test Project

1. **Login** to the app
2. **Go to Projects** page
3. **Click "New Project"**
4. **Fill in**:
   - Name: "Test Solar Installation"
   - Client: "John Doe"
   - Location: "123 Main St"
   - Capacity: "5"
   - Start Date: Today
   - Status: "Planning"
5. **Click Create**

### 4.2 Test Estimation Phase

1. **Navigate** to Project Detail page
2. **Scroll down** to "Create Professional Proposal"
3. **Select Stages**:
   - Check: Site Survey & Assessment
   - Check: Design & Planning
   - Check: Permits & Approvals
4. **Observe**:
   - Stage totals appear ✓
   - "Estimated Total" updates ✓
   - "Stages Selected: 3" shows ✓

5. **Edit a Task**:
   - Click ▼ on "Site Survey & Assessment"
   - Click "Edit" on first task
   - Change Quantity to 2
   - Change Unit Cost to 6000
   - Total should be 12000
   - Click "Save"

6. **Generate Proposal**:
   - Click "Generate Proposal" button
   - Should see: "Proposal generated successfully!"
   - Green checkmark: "✓ Proposal generated on [date]"

7. **Download PDF**:
   - Click "Download PDF"
   - Should see: "Proposal downloaded successfully!"
   - Check Downloads folder for PDF file
   - Open PDF and verify:
     - Project name appears
     - Selected stages and tasks listed
     - Totals are correct

### 4.3 Test Negotiation Phase

1. **Click "Move to Negotiation →"**
   - State indicator should change to blue "Negotiation"

2. **Modify Tasks**:
   - Open stage
   - Edit tasks as needed
   - Delete unnecessary tasks
   - Add new tasks if needed
   - Save changes

3. **View Summary**:
   - Original estimate vs. negotiated total
   - Payment terms display

4. **Move to Execution**:
   - Click "Move to Execution →"
   - State indicator should change to "Execution"

### 4.4 Test Execution Phase

1. **View Work Tracking**:
   - See all negotiated tasks
   - Mark tasks as "Completed"
   - Edit actual costs as work progresses

2. **Generate Invoice**:
   - Click "Generate Final Invoice"
   - Invoice number generates (format: INV-20260324-XXXX)
   - Displays total amount

3. **Record Payment**:
   - Enter amount received
   - Click "Record Payment"
   - Status updates: Pending → Partial → Paid
   - Verify balance calculation

4. **Verify**:
   - Open Supabase Table Editor
   - Check `project_invoices` table
   - Invoice should appear with status

---

## STEP 5️⃣: Verify Database Data (10 minutes)

### 5.1 Supabase Table Editor Checks

**projects table**:
- Your test project exists ✓
- `project_state` column shows "Execution" ✓
- `project_code` is set ✓
- `stage` = 3 (Execution) ✓

**stage_tasks table**:
- ~50 default tasks visible ✓
- stage_id ranges from 1-10 ✓
- Your edits appear ✓

**project_estimates table**:
- Test project estimate created ✓
- state shows "Estimation" or later ✓
- grand_total matches your calculation ✓

**project_invoices table**:
- Invoice generated with INV number ✓
- total_amount set correctly ✓
- paid_amount = 0 or your payment amount ✓
- payment_status is "Pending", "Partial", or "Paid" ✓

---

## 🔴 COMMON ERRORS & FIXES

### Error: "Cannot read property 'autoTable' of undefined"
**Cause**: jsPDF instance not created properly
**Fix**: Verify jsPDF import is: `import { jsPDF } from 'jspdf'`

---

### Error: "stage_tasks does not exist"
**Cause**: Migration SQL wasn't run
**Fix**: Run `workflow_schema_migration.sql` in Supabase
**Verify**: Check Supabase Table Editor for stage_tasks table

---

### Error: "Column 'project_state' does not exist"
**Cause**: Migration incomplete
**Fix**: Run the ALTER TABLE commands from migration SQL
**Verify**: In Table Editor, click projects → column list

---

### Error: "Proposal generated but Download PDF button stays disabled"
**Cause**: selectedStages Set is empty after state update
**Fix**: In EstimationPanel.jsx, check state management
```javascript
// Make sure selectedStages State persists
const [selectedStages, setSelectedStages] = useState(new Set())

// After generation, don't clear the selection
// Keep selectedStages for PDF download
```

---

### Error: "Invoice number not unique"
**Cause**: Invoice table has duplicates
**Fix**: The SQL uses UNIQUE constraint, so duplicates shouldn't happen
**Verify**: Check for duplicate INV numbers in table

---

### Error: "Can't move to Negotiation - button disabled"
**Cause**: Proposal not generated yet
**Fix**: Click "Generate Proposal" first
**Verify**: Green checkmark appears before button activates

---

## ✅ VERIFICATION CHECKLIST

Before considering the app complete, verify ALL of these:

- [ ] Database tables exist in Supabase
  - [ ] stage_tasks (50 rows)
  - [ ] project_estimates (at least 1 row)
  - [ ] project_invoices (at least 1 row)

- [ ] projects table has new columns
  - [ ] project_state
  - [ ] project_code
  - [ ] stage

- [ ] Workflow Visualization works
  - [ ] Three colored boxes show progress (Estimation → Negotiation → Execution)
  - [ ] Current state highlighted in blue
  - [ ] Completed states show green

- [ ] Estimation Phase ✓
  - [ ] Can select/deselect stages
  - [ ] Totals calculate correctly
  - [ ] Can edit task quantity and unit cost
  - [ ] Can generate proposal
  - [ ] Can download PDF
  - [ ] PDF displays correctly
  - [ ] Can move to Negotiation

- [ ] Negotiation Phase ✓
  - [ ] Can see all tasks
  - [ ] Can edit tasks
  - [ ] Can add new tasks
  - [ ] Can delete tasks
  - [ ] Totals update
  - [ ] Can move to Execution

- [ ] Execution Phase ✓
  - [ ] Can add actual work tasks
  - [ ] Can mark tasks complete
  - [ ] Can track actual costs
  - [ ] Can generate invoice
  - [ ] Can record payments
  - [ ] Payment status updates correctly

---

## 📊 DATA FLOW DIAGRAM

```
User Creates Project
        ↓
   ESTIMATION PHASE
   ├─ Select stages from 10 available
   ├─ Each stage has ~5 default tasks
   ├─ Edit quantity & unit cost
   ├─ Generate proposal (saves to project_estimates)
   ├─ Download PDF
   └─ Move to Negotiation → Updates project_state

        ↓
  NEGOTIATION PHASE
   ├─ View all negotiated tasks
   ├─ Modify based on customer feedback
   ├─ Add/delete tasks
   ├─ Track changes from original estimate
   └─ Move to Execution → Updates project_state

        ↓
   EXECUTION PHASE
   ├─ Track actual work performed
   ├─ Record actual costs
   ├─ Mark tasks complete
   ├─ Generate final invoice (saves to project_invoices)
   ├─ Record payment received
   └─ Update payment status

        ↓
    COMPLETED
```

---

## 🚀 PERFORMANCE OPTIMIZATION TIPS

Once everything is working, consider:

1. **Add Indexes**: Already included in migration SQL ✓

2. **Pagination**:
   - For projects with many tasks, load in batches
   - Implement "Show More" button

3. **Caching**:
   - Cache stage list since it doesn't change often
   - Use React Query or SWR for data management

4. **Real-time Updates**:
   - Implement Supabase real-time subscriptions
   - Multiple team members see updates instantly

5. **Offline Support**:
   - Use localStorage for draft data
   - Sync when connection returns

---

## 📞 QUICK REFERENCE

| Issue | Solution | Time |
|-------|----------|------|
| Tables missing | Run migration SQL | 2 min |
| PDF blank | Check console errors | 5 min |
| Can't move states | Generate proposal first | 1 min |
| No tasks showing | Seed default tasks | 2 min |
| Quantities not saving | Check updateStageTask function | 10 min |
| Totals wrong | Verify calculation formula | 5 min |

---

## 🎓 LEARNING RESOURCES

- [Supabase Documentation](https://supabase.com/docs)
- [React Hooks Guide](https://react.dev/reference/react)
- [jsPDF Documentation](http://jspdf.ch/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Need Help?** Review PROJECT_COMPLETION_GUIDE.md for architecture overview.
