# 🧪 Complete Workflow Testing Guide

## Overview

This guide walks through the complete three-state workflow (Estimation → Negotiation → Execution) with detailed verification steps at each phase. Follow these steps to ensure all features work correctly.

---

## Pre-Testing Setup

### 1. Database & Backend Ready
```bash
# Ensure Supabase is running and connected
# Check that migrations are complete:
# - projects table has project_state column
# - proposal_references table exists
# - project_estimates table has selected_stage_ids column
# - project_customers table created
```

### 2. Frontend Ready
```bash
# In your project root:
npm install
npm run dev
# Should start on http://localhost:3000 (or similar)
```

### 3. Test Environment
- Open browser DevTools (F12 or Ctrl+Shift+I)
- Go to Console tab to monitor errors
- Keep Console open during entire test

---

## Phase 1: Project Creation & Estimation

### Step 1.1: Create New Project
1. Click **"New Project"** button
2. Fill in form:
   - **Project Name**: "Solar-Mumbai-Test"
   - **Client Name**: "ABC Solar Ltd"
   - **Location**: "Mumbai, Maharashtra"
   - **Capacity (kW)**: "10"
   - **Notes**: "Complete rooftop installation"
   - **Status**: "Planning"
3. Click **"Create"**

**✅ Verify**:
- [ ] Project created successfully (no errors in console)
- [ ] Project appears in project list
- [ ] Project status shows "Planning"
- [ ] Project state shows "Estimation" (backend indicator)
- [ ] Redirects to project detail page

### Step 1.2: Check Estimation Panel
On the project detail page:
1. Locate **"Estimation Panel"** section
2. See all project stages listed

**✅ Verify**:
- [ ] At least 5 stages visible (Site Survey, Material Supply, Mounting Work, Electrical Work, Testing & Commissioning)
- [ ] Each stage shows 0 tasks initially
- [ ] Yellow/Orange "Estimation" header color
- [ ] Parent proposal info box is empty (no parent proposal yet)

### Step 1.3: Add Tasks to Stages
For **Stage 1 (Site Survey)**:
1. Click **"Add Task"** button
2. Fill in:
   - **Task Name**: "Site assessment"
   - **Description**: "Complete site survey and evaluation"
   - **Quantity**: "1"
   - **Unit Cost**: "5000"
3. Click **"Add Task"**
4. Repeat for 2-3 more tasks

**Expected tasks**:
```
Stage 1 (Site Survey):
  - Site assessment: 1 × ₹5,000 = ₹5,000
  - Roof inspection: 1 × ₹3,000 = ₹3,000
  - Measurement & mapping: 1 × ₹2,000 = ₹2,000
  Total: ₹10,000
```

For **Stage 3 (Mounting Work)**:
1. Add tasks:
```
Stage 3 (Mounting Work):
  - Rack installation: 10 × ₹1,500 = ₹15,000
  - Fastening & sealing: 1 × ₹5,000 = ₹5,000
  Total: ₹20,000
```

For **Stage 4 (Electrical Work)**:
1. Add tasks:
```
Stage 4 (Electrical Work):
  - Wiring installation: 1 × ₹8,000 = ₹8,000
  - Inverter setup: 1 × ₹12,000 = ₹12,000
  Total: ₹20,000
```

**✅ Verify at each stage**:
- [ ] Task added successfully with no errors
- [ ] Task appears in stage with correct amounts
- [ ] Stage total updates correctly (₹XX,XXX format)
- [ ] All tasks visible in expanded stage

### Step 1.4: Create Estimation Proposal
1. Scroll to bottom of Estimation section
2. Click **"Create Estimation Proposal"** button

**✅ Verify**:
- [ ] Blue notification: "✅ Proposal EST-YYYYMMDD-XXXX created..."
- [ ] Proposal number appears (e.g., EST-20260325-0001)
- [ ] "Download EST-..." button becomes available
- [ ] Parent proposal info box remains empty (EST is root)
- [ ] No console errors

### Step 1.5: Download Estimation PDF
1. Click **"Download EST-20260325-XXXX"** button

**✅ Verify**:
- [ ] PDF downloads successfully
- [ ] PDF contains:
  - [ ] Project name "Solar-Mumbai-Test"
  - [ ] Proposal number "EST-20260325-XXXX"
  - [ ] All stages with their tasks
  - [ ] Quantities and unit costs
  - [ ] Grand total calculation
  - [ ] Professional formatting

### Step 1.6: Check Proposal Download List
In the Proposal Download List section:
1. Look for EST-20260325-XXXX in the list

**✅ Verify**:
- [ ] EST proposal appears with blue badge/color
- [ ] Shows creation date
- [ ] Shows proposal type "Estimation"
- [ ] Individual download button available
- [ ] Can click download and get PDF

---

## Phase 2: Negotiation

### Step 2.1: Move to Negotiation State
1. On project detail, ensure you're at Estimation stage
2. Click **"Move to Negotiation"** button (should be enabled)

**✅ Verify**:
- [ ] Page updates (may show loading spinner)
- [ ] Negotiation Panel appears
- [ ] Estimation Panel is no longer visible
- [ ] URL may change or panel switches
- [ ] No console errors

### Step 2.2: Verify Parent Proposal Data Loaded
In **Negotiation Panel**, look for the parent proposal info box (blue background):
1. Should show:
   - **Based on**: EST-YYYYMMDD-XXXX
   - **Created**: [date]
   - **Info**: "All stages with quantities and values inherited and ready for modification"

**✅ Verify**:
- [ ] Parent proposal number matches EST proposal created
- [ ] Creation date is correct
- [ ] Info message shows "All stages with quantities and values inherited"
- [ ] Blue-colored info box visible

### Step 2.3: Verify ALL Stages Loaded
Check that all stages are loaded (not just those with tasks):
1. Scroll through all stages in Negotiation Panel
2. Count total stages

**✅ Verify**:
- [ ] All 5 project stages visible:
  - [ ] Stage 1: Site Survey (should have 3 inherited tasks)
  - [ ] Stage 2: Material Supply (0 tasks)
  - [ ] Stage 3: Mounting Work (should have 2 inherited tasks)
  - [ ] Stage 4: Electrical Work (should have 2 inherited tasks)
  - [ ] Stage 5: Testing & Commissioning (0 tasks)
- [ ] Inherited tasks show correct quantities and costs
- [ ] Stages with 0 tasks are still visible
- [ ] Stage totals match Estimation totals

**Grand Total Should Match Estimation**: ₹50,000

### Step 2.4: Modify a Task in Negotiation
In **Stage 1 (Site Survey)**:
1. Find "Site assessment" task
2. Click **"Edit"** button
3. Change:
   - **Quantity**: Change from 1 to 2
   - **Unit Cost**: Change from ₹5,000 to ₹4,500
4. Click **"Save"**

**Expected result**: Cost should update to 2 × ₹4,500 = ₹9,000

**✅ Verify**:
- [ ] Task edits successfully
- [ ] New cost calculation shows: 2 × ₹4,500 = ₹9,000
- [ ] Stage total updates to ₹11,000
- [ ] Grand total at bottom updates to ₹51,000
- [ ] Success toast message appears
- [ ] No console errors

### Step 2.5: Add New Task in Negotiation
In **Stage 3 (Mounting Work)**:
1. Click **"Add New Task"**
2. Fill in:
   - **Task Name**: "Grounding work"
   - **Description**: "Complete grounding installation"
   - **Quantity**: "1"
   - **Unit Cost**: "3000"
3. Click **"Add Task"**

**✅ Verify**:
- [ ] New task added successfully
- [ ] Appears in Stage 3 with other tasks
- [ ] Stage 3 total updates to ₹28,000
- [ ] Grand total updates to ₹54,000
- [ ] Success toast message

### Step 2.6: Create Negotiation Proposal
1. Scroll to Summary Card at bottom
2. Verify Negotiated Total shows: ₹54,000
3. Click **"Create Negotiation Proposal"** button

**✅ Verify**:
- [ ] Orange notification: "✅ Proposal NEG-YYYYMMDD-XXXX created (based on EST-...)"
- [ ] Proposal number appears (e.g., NEG-20260325-0001)
- [ ] "Download NEG-..." button becomes available
- [ ] Parent proposal info remains (shows EST as parent)
- [ ] No console errors

### Step 2.7: Download Negotiation PDF
1. Click **"Download NEG-20260325-XXXX"** button

**✅ Verify**:
- [ ] PDF downloads successfully
- [ ] PDF contains:
  - [ ] Proposal number "NEG-20260325-XXXX"
  - [ ] Parent reference "Based on EST-20260325-XXXX"
  - [ ] Modified task data (edited site assessment)
  - [ ] New task (grounding work)
  - [ ] Updated grand total (₹54,000)

### Step 2.8: Check Proposal Download List
In the Proposal Download List:
1. Should now see both EST and NEG proposals

**✅ Verify**:
- [ ] EST-20260325-XXXX appears (blue badge)
- [ ] NEG-20260325-XXXX appears (orange badge)
- [ ] Both have download buttons
- [ ] Both show correct creation dates
- [ ] Can download each independently

---

## Phase 3: Execution

### Step 3.1: Move to Execution State
1. In Negotiation Panel, scroll to bottom
2. Click **"Move to Execution →"** button

**✅ Verify**:
- [ ] Page updates to Execution Panel
- [ ] Negotiation Panel no longer visible
- [ ] No console errors
- [ ] Execution Panel displays "Work Tracking & Execution"

### Step 3.2: Verify Parent Proposal Data Loaded
In **Execution Panel**, look for the parent proposal info box (green background):
1. Should show:
   - **Based on**: NEG-YYYYMMDD-XXXX (not EST!)
   - **Created**: [date]
   - **Info**: "All stages with quantities and values inherited from Negotiation phase"

**✅ Verify**:
- [ ] Parent proposal number matches NEG proposal created
- [ ] Shows NEG as parent (not EST)
- [ ] Info message mentions "Negotiation phase"
- [ ] Green-colored info box visible (different from Negotiation's blue)

### Step 3.3: Verify ALL Stages with Modifications Loaded
Check that all stages are loaded with latest modifications:

**✅ Verify**:
- [ ] All 5 stages visible
- [ ] Stage 1: Shows modified task "Site assessment" (2 × ₹4,500 = ₹9,000)
- [ ] Stage 3: Shows new task "Grounding work" (1 × ₹3,000 = ₹3,000)
- [ ] All other tasks match Negotiation state
- [ ] Grand total shows ₹54,000 (matches Negotiation)
- [ ] No tasks from earlier stages are missing

### Step 3.4: Edit Task in Execution
In **Stage 4 (Electrical Work)**:
1. Find "Inverter setup" task
2. Click **"Edit"**
3. Change Unit Cost from ₹12,000 to ₹11,000
4. Click **"Save"**

**✅ Verify**:
- [ ] Task updates successfully
- [ ] Cost shows: 1 × ₹11,000 = ₹11,000
- [ ] Stage 4 total updates to ₹19,000
- [ ] Grand total updates to ₹53,000
- [ ] Success message appears

### Step 3.5: Create Execution Proposal
1. Scroll to Proposal Creation section
2. Click **"Create Execution Proposal"** button

**✅ Verify**:
- [ ] Green notification: "✅ Final proposal EXE-YYYYMMDD-XXXX created (based on NEG-...)"
- [ ] Proposal number appears (e.g., EXE-20260325-0001)
- [ ] "Download EXE-..." button becomes available
- [ ] Parent proposal info shows NEG as parent
- [ ] No console errors

### Step 3.6: Download Execution PDF
1. Click **"Download EXE-20260325-XXXX"** button

**✅ Verify**:
- [ ] PDF downloads successfully
- [ ] PDF contains:
  - [ ] Proposal number "EXE-20260325-XXXX"
  - [ ] Parent reference "Based on NEG-20260325-XXXX"
  - [ ] All final modifications
  - [ ] Final grand total (₹53,000)
  - [ ] All stages and tasks

### Step 3.7: Check Proposal Download List
In the Proposal Download List:
1. Should now see EST, NEG, and EXE proposals

**✅ Verify**:
- [ ] EST-20260325-XXXX appears (blue badge)
- [ ] NEG-20260325-XXXX appears (orange badge)
- [ ] EXE-20260325-XXXX appears (green badge)
- [ ] All three have download buttons
- [ ] All show correct creation dates
- [ ] All can be downloaded independently

---

## Complete Proposal Chain Verification

### Verify the Entire Chain
Download all three PDFs and verify the data flow:

```
EST-20260325-0001 (Original)
├─ Stage 1: ₹10,000 (3 tasks)
├─ Stage 3: ₹20,000 (2 tasks)
├─ Stage 4: ₹20,000 (2 tasks)
└─ Total: ₹50,000

     ↓ Modified in Negotiation

NEG-20260325-0001 (After Negotiation)
├─ Stage 1: ₹11,000 (3 tasks - modified)
├─ Stage 3: ₹28,000 (3 tasks - added grounding)
├─ Stage 4: ₹20,000 (2 tasks)
└─ Total: ₹54,000

     ↓ Modified in Execution

EXE-20260325-0001 (Final)
├─ Stage 1: ₹11,000 (3 tasks)
├─ Stage 3: ₹28,000 (3 tasks)
├─ Stage 4: ₹19,000 (2 tasks - updated inverter)
└─ Total: ₹53,000
```

**✅ Verify**:
- [ ] Each PDF shows correct data at that stage
- [ ] All modifications from previous stages are preserved
- [ ] Proposal numbers follow expected format (EST/NEG/EXE with dates)
- [ ] Parent-child relationships are clear

---

## Success Criteria Checklist

### ✅ Core Functionality
- [ ] Can create new projects
- [ ] Estimation Panel loads with all stages
- [ ] Can add tasks to stages
- [ ] Can create estimation proposal
- [ ] Can download estimation PDF

### ✅ Negotiation Phase
- [ ] Can move to negotiation state
- [ ] All stages load (including empty ones)
- [ ] Parent proposal info displays correctly
- [ ] Can modify task quantities and costs
- [ ] Can add new tasks
- [ ] Grand total updates correctly
- [ ] Can create negotiation proposal
- [ ] Can download negotiation PDF

### ✅ Execution Phase
- [ ] Can move to execution state
- [ ] All stages load with negotiation modifications
- [ ] Parent proposal info shows NEG as parent
- [ ] Can edit tasks
- [ ] Grand total reflects modifications
- [ ] Can create execution proposal
- [ ] Can download execution PDF

### ✅ Proposal Chain
- [ ] All three proposal types visible in download list
- [ ] Each proposal has correct parent reference
- [ ] PDFs show data at that workflow stage
- [ ] No data loss between states
- [ ] Modifications preserved through chain

### ✅ Customer Management
- [ ] Customer ID auto-created (check browser console)
- [ ] Customer appears in database
- [ ] Same customer used for all proposals of same project

### ✅ Error Handling
- [ ] No console errors during workflow
- [ ] Toast messages appear for all actions
- [ ] Error messages are clear and helpful
- [ ] Page recovers gracefully from errors

---

## Final Notes

- **Timing**: Complete test should take 15-20 minutes
- **Browser**: Test on Chrome, Firefox, and Safari if possible
- **Network**: Ensure stable internet connection during test
- **Data**: All test data can be deleted afterward; it's safe to test
- **Backup**: Previous test data won't interfere with new projects

**Ready to test?** Start from Phase 1 Step 1.1 and follow in order! 🚀
