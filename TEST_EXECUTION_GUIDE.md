# 🎯 Guided Test Execution & Monitoring Guide

## Part 1: Starting the Test Environment

### Setup (5 minutes)

```bash
# Terminal 1: Navigate to project
cd /path/to/solar_backup

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

**Expected output**:
```
  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

### Open Test Environment
1. **Browser**: Open http://localhost:5173
2. **DevTools**: Press `F12` or `Ctrl+Shift+I`
3. **Console**: Click "Console" tab
4. **Layout**: Position browser on left, DevTools on right (or use separate window)

**Console should show**:
```
[READY] Supabase initialized
[READY] Authentication provider loaded
```

---

## Part 2: Phase 1 - Estimation (7 minutes)

### Test Checkpoint 1.1: Project Creation
**Action**: Click "New Project"
```
Fill:
  Name: "Solar-Test-[TODAY'S DATE]"
  Client: "Test Client"
  Location: "Test Location"
  Capacity: "10"
  Status: "Planning"
```

**Watch Console For**:
```
[INFO] Creating project: Solar-Test-...
[INFO] User authenticated: [user-id]
[SUCCESS] Project created with ID: [uuid]
[INFO] Customer creation initiated
[INFO] Customer ID generated: CUST-YYYYMMDD-XXXX
```

**Visual Check**:
- [ ] Form clears after submit
- [ ] Redirects to project detail page
- [ ] Project name appears at top
- [ ] "Estimation" panel visible

---

### Test Checkpoint 1.2: Add Tasks
**Action**: In Estimation Panel, expand Stage 1
```
Add Task 1:
  Name: "Survey"
  Qty: 1
  Cost: 5000

Add Task 2:
  Name: "Assessment"
  Qty: 1
  Cost: 3000
```

**Watch Console For**:
```
[INFO] Creating task: Survey
[SUCCESS] Task added to Stage 1
[INFO] Calculating stage total: 8000
[INFO] Updating grand total
```

**Visual Check**:
- [ ] Stage 1 shows "2 tasks"
- [ ] Stage total: ₹8,000
- [ ] Grand total updates at bottom

**Repeat For**:
- Stage 3: Add 2 tasks (₹20,000 total)
- Stage 4: Add 2 tasks (₹20,000 total)

**Final Status**: Grand Total = ₹48,000

---

### Test Checkpoint 1.3: Create Estimation Proposal
**Action**: Scroll to bottom → Click "Create Estimation Proposal"

**Watch Console For**:
```
[INFO] Ensuring customer exists
[INFO] Customer found: CUST-YYYYMMDD-XXXX
[INFO] Creating proposal reference
[INFO] Proposal type: Estimation
[SUCCESS] EST-YYYYMMDD-0001 created
[INFO] Creating estimate record
[SUCCESS] Estimate saved with grand_total: 48000
```

**Visual Check**:
- [ ] Toast: "✅ Proposal EST-YYYYMMDD-0001 created"
- [ ] "Download EST-..." button appears
- [ ] Proposal number displays

**PDF Download**:
- Click "Download EST-YYYYMMDD-0001"
- [ ] File downloads as PDF
- [ ] Contains all stages and tasks

---

## Part 3: Phase 2 - Negotiation (7 minutes)

### Test Checkpoint 2.1: Move to Negotiation
**Action**: Click "Move to Negotiation" button

**Watch Console For**:
```
[INFO] Updating project state: Estimation → Negotiation
[SUCCESS] Project state updated
[INFO] Loading Negotiation panel
[INFO] Loading parent proposal data
[INFO] Found parent EST: EST-YYYYMMDD-0001
[INFO] Loading all 5 stages
[INFO] Stage 1: Found 2 inherited tasks
[INFO] Stage 2: Found 0 tasks (empty stage)
[INFO] Stage 3: Found 2 inherited tasks
[INFO] Stage 4: Found 2 inherited tasks
[INFO] Stage 5: Found 0 tasks (empty stage)
[SUCCESS] All stages loaded for Negotiation
```

**Visual Check**:
- [ ] Panel switches to "Negotiate Proposal"
- [ ] Blue header color (vs yellow for Estimation)
- [ ] Parent info box shows: "Based on EST-YYYYMMDD-0001"
- [ ] All 5 stages visible
- [ ] Grand total: ₹48,000 (matches Estimation)

---

### Test Checkpoint 2.2: Modify a Task
**Action**: In Stage 1, click "Edit" on first task

```
Change:
  Quantity: 1 → 2
  Unit Cost: 5000 → 4500
```

**Watch Console For**:
```
[INFO] Saving task modification
[INFO] Old: qty=1, cost=5000
[INFO] New: qty=2, cost=4500
[INFO] Calculating new total: 9000
[SUCCESS] Task updated
[INFO] Reloading stage data
[INFO] Stage 1 new total: 12000
[INFO] Grand total recalculated: 49000
```

**Visual Check**:
- [ ] Task shows: 2 × ₹4,500 = ₹9,000
- [ ] Stage 1 total: ₹12,000
- [ ] Grand total: ₹49,000

---

### Test Checkpoint 2.3: Add New Task
**Action**: In Stage 3, click "Add New Task"

```
Fill:
  Name: "Extra work"
  Qty: 1
  Cost: 5000
```

**Watch Console For**:
```
[INFO] Creating new task for Stage 3
[INFO] Task: Extra work (qty=1, cost=5000)
[SUCCESS] New task created
[INFO] Stage 3 total updated: 25000
[INFO] Grand total: 54000
```

**Visual Check**:
- [ ] New task appears in Stage 3
- [ ] Stage 3 total: ₹25,000
- [ ] Grand total: ₹54,000

---

### Test Checkpoint 2.4: Create Negotiation Proposal
**Action**: Scroll to Summary → Click "Create Negotiation Proposal"

**Watch Console For**:
```
[INFO] Creating negotiation proposal
[INFO] Parent: EST-YYYYMMDD-0001
[INFO] Creating proposal reference: Negotiation
[SUCCESS] NEG-YYYYMMDD-0001 created
[INFO] Storing all stages: [1,2,3,4,5]
[INFO] Grand total: 54000
[SUCCESS] Negotiation estimate saved
```

**Visual Check**:
- [ ] Toast: "✅ Proposal NEG-YYYYMMDD-0001 created"
- [ ] "Download NEG-..." button appears
- [ ] Parent info still shows EST

**PDF Check**:
- Download NEG PDF
- [ ] Shows modified tasks
- [ ] Shows new task in Stage 3
- [ ] Grand total: ₹54,000

---

## Part 4: Phase 3 - Execution (7 minutes)

### Test Checkpoint 3.1: Move to Execution
**Action**: Click "Move to Execution →" button

**Watch Console For**:
```
[INFO] Updating project state: Negotiation → Execution
[SUCCESS] Project state updated
[INFO] Loading Execution panel
[INFO] Loading parent proposal: Negotiation
[INFO] Found parent NEG: NEG-YYYYMMDD-0001
[INFO] Loading all 5 stages with modifications
[INFO] Stage 1: Found 2 inherited tasks (modified)
[INFO] Stage 3: Found 3 inherited tasks (includes new)
[INFO] Grand total loaded: 54000
[SUCCESS] All stages with modifications loaded
```

**Visual Check**:
- [ ] Panel switches to "Work Tracking & Execution"
- [ ] Green header color (vs blue for Negotiation)
- [ ] Parent info box shows: "Based on NEG-YYYYMMDD-0001"
- [ ] Modified task visible: "Survey" (2 × ₹4,500)
- [ ] New task visible: "Extra work"
- [ ] Grand total: ₹54,000

---

### Test Checkpoint 3.2: Modify a Task
**Action**: In Stage 4, click "Edit" on "Inverter setup"

```
Change:
  Unit Cost: 12000 → 11000
```

**Watch Console For**:
```
[INFO] Saving execution task modification
[INFO] Task: Inverter setup
[INFO] New cost: 11000
[SUCCESS] Task updated
[INFO] Stage 4 new total: 19000
[INFO] Grand total: 53000
```

**Visual Check**:
- [ ] Cost shows: 1 × ₹11,000 = ₹11,000
- [ ] Stage 4 total: ₹19,000
- [ ] Grand total: ₹53,000

---

### Test Checkpoint 3.3: Create Execution Proposal
**Action**: Click "Create Execution Proposal"

**Watch Console For**:
```
[INFO] Creating final execution proposal
[INFO] Parent: NEG-YYYYMMDD-0001
[INFO] Creating proposal reference: Execution
[SUCCESS] EXE-YYYYMMDD-0001 created
[INFO] Storing all final stages: [1,2,3,4,5]
[INFO] Final grand total: 53000
[SUCCESS] Execution estimate saved
```

**Visual Check**:
- [ ] Toast: "✅ Final proposal EXE-YYYYMMDD-0001 created"
- [ ] "Download EXE-..." button appears

**PDF Check**:
- Download EXE PDF
- [ ] Shows all final modifications
- [ ] Grand total: ₹53,000

---

## Part 5: Complete Chain Verification (3 minutes)

### Check Proposal Download List
**Action**: Scroll to "Proposal Download List"

**Visual Check**:
- [ ] EST-YYYYMMDD-0001 visible (blue badge)
  - Created: [date]
  - Download button works
- [ ] NEG-YYYYMMDD-0001 visible (orange badge)
  - Created: [date]
  - Download button works
- [ ] EXE-YYYYMMDD-0001 visible (green badge)
  - Created: [date]
  - Download button works

**Console Check**:
```
Should show 3 proposals loaded:
[INFO] Fetching proposals for project: [uuid]
[SUCCESS] 3 proposals found
[INFO] Proposal 1: EST-YYYYMMDD-0001 (Estimation)
[INFO] Proposal 2: NEG-YYYYMMDD-0001 (Negotiation)
[INFO] Proposal 3: EXE-YYYYMMDD-0001 (Execution)
```

---

## Part 6: Data Chain Verification

### Cross-Check All PDFs

**EST PDF should show**:
```
Grand Total: ₹48,000
Stage 1: 2 tasks (Survey, Assessment)
Stage 3: 2 tasks
Stage 4: 2 tasks
```

**NEG PDF should show**:
```
Grand Total: ₹54,000
Stage 1: 2 tasks (Survey modified: 2×₹4,500)
Stage 3: 3 tasks (added Extra work)
Stage 4: 2 tasks
```

**EXE PDF should show**:
```
Grand Total: ₹53,000
Stage 1: 2 tasks (same as NEG)
Stage 3: 3 tasks (same as NEG)
Stage 4: 2 tasks (Inverter: 1×₹11,000)
```

---

## Expected Console Summary

By end of test, console should show:
```
[SUMMARY] Workflow Test Complete
  ✓ Project created
  ✓ Customer auto-generated: CUST-YYYYMMDD-XXXX
  ✓ 5 tasks added to Estimation
  ✓ EST-YYYYMMDD-0001 created (₹48,000)
  ✓ Moved to Negotiation
  ✓ Modified 1 task (Survey)
  ✓ Added 1 new task (Extra work)
  ✓ NEG-YYYYMMDD-0001 created (₹54,000)
  ✓ Moved to Execution
  ✓ Modified 1 task (Inverter)
  ✓ EXE-YYYYMMDD-0001 created (₹53,000)
  ✓ All 3 proposals available for download
  ✓ All data correctly carried forward
```

---

## Success Indicators

### ✅ If You See These, Everything Works:
1. All 3 proposals created (EST, NEG, EXE)
2. Grand totals flow correctly (₹48k → ₹54k → ₹53k)
3. All 5 stages visible in each workflow state
4. Modifications preserved between states
5. PDFs download successfully
6. Parent references shown correctly
7. No console errors (warnings are OK)
8. Toast messages appear for all actions

### ❌ If You See These, There's an Issue:
1. "Failed to load data" errors
2. Missing stages in Negotiation/Execution
3. Parent proposal not showing
4. Grand totals don't match
5. PDF downloads fail
6. Red error messages in console
7. Proposal numbers not appearing

---

## Troubleshooting During Test

| Issue | Check | Fix |
|-------|-------|-----|
| "Failed to load project" | Supabase connection | Refresh page, check network |
| Stages not loading | PROJECT_STAGES constant | Check if stages defined in projectService |
| Parent not showing | Parent proposal created | Verify proposal_references table |
| Grand totals wrong | Task calculations | Check calculateGrandTotal() function |
| PDF blank/empty | proposalDownloadService | Check jsPDF integration |
| Customer not created | customerService execution | Check console for customer logs |

---

## Time Estimates
- Setup: 5 min
- Phase 1 (Estimation): 7 min
- Phase 2 (Negotiation): 7 min
- Phase 3 (Execution): 7 min
- Verification: 3 min
- **Total: ~30 minutes**

**Ready to start? Follow the checkpoints above in order!** 🚀
