# 🧪 Testing Guide - Corrected Data Model

**Date**: March 25, 2026
**Status**: Ready for testing
**Expected Duration**: 25-30 minutes

---

## Pre-Flight Checklist

Before starting tests:

- [ ] Terminal running `npm run dev`
- [ ] Browser open to http://localhost:3173
- [ ] DevTools open (F12)
- [ ] Console tab visible
- [ ] No errors in console at start

---

## Test 1: Verify All Stages Load

### Setup
1. Create new project: "Test-AllStages"
2. Navigate to Estimation panel
3. **Leave all tasks at quantity = 0**

### Action
Just observe the UI

### Expected Result ✅
- [ ] All 10 stages visible:
  - 1. Site Survey
  - 2. KSEB Application
  - 3. Mounting Work
  - 4. Panel Installation
  - 5. Wiring & Inverter
  - 6. Earthing & Safety
  - 7. KSEB Inspection
  - 8. Net Meter
  - 9. Commissioning
  - 10. Completed
- [ ] Each stage shows "0 tasks" (no tasks added yet)
- [ ] Grand total shows ₹0
- [ ] NO stage selection checkboxes visible
- [ ] "Generate Proposal" button is enabled (but should fail if no qty > 0)

### What to Report If It Fails ❌
- Are checkboxes still visible? (They should be gone)
- Are all 10 stages showing?
- What does console say?

---

## Test 2: Edit Task Quantities

### Setup
1. Still in Estimation for "Test-AllStages"
2. Expand **Stage 1**

### Action
1. Click Edit (pencil icon) on the first task
2. Change quantity from 0 to **2**
3. Keep unit_cost as-is (e.g., 5000)
4. Click Save (checkmark)
5. Expand **Stage 3**
6. Click Edit on a task
7. Change quantity to **1**
8. Click Save

### Expected Result ✅
- [ ] Stage 1 now shows "updated" task with qty=2
- [ ] Stage 1 total updates to show: 2 × ₹5000 = ₹10,000
- [ ] Stage 3 now shows qty=1 task
- [ ] Grand total updates to ₹10,000 + Stage3_total
- [ ] Summary shows "Stages with Tasks: 2"
- [ ] Console: No errors

### What to Report If It Fails ❌
- Do quantities update?
- Does grand total update?
- Any console errors?

---

## Test 3: Create Estimation Proposal

### Setup
From previous state (Stage 1 qty=2, Stage 3 qty=1)

### Action
1. Click "Generate Proposal"
2. Watch for toast notification

### Expected Result ✅
- [ ] Toast shows: "✅ Proposal EST-YYYYMMDD-0001 generated successfully!"
- [ ] "Download PDF" button becomes enabled
- [ ] Green box appears: "✅ Proposal EST-... generated and ready"
- [ ] Proposal shows in "Previous Proposals" list
- [ ] No console errors

### What to Report If It Fails ❌
- What error message appears?
- Check console for full error
- Does button get stuck in "Generating..." state?

---

## Test 4: Move to Negotiation

### Setup
From previous state (EST proposal created)

### Action
1. Click "Move to Negotiation →" button
2. Wait for page load (watch spinner)
3. Watch console

### Expected Result ✅
- [ ] Page loads in < 2 seconds
- [ ] Console shows: `[Performance] Batch loaded all stage tasks in single query`
- [ ] **All 10 stages visible** ✅ (This is the key test!)
- [ ] Stage 1 shows original task with qty=2
- [ ] Stage 3 shows original task with qty=1
- [ ] Stages 2, 4, 5, 6, 7, 8, 9, 10 show all their tasks with qty=0
- [ ] Parent EST proposal number displays (EST-YYYYMMDD-0001)
- [ ] No console errors

### What to Report If It Fails ❌
- How many stages show? (Should be 10)
- Are you missing any stages (especially 6, 7, 8, 9, 10)? ✅ Important!
- Do quantities match EST? (Stage 1 should be 2, Stage 3 should be 1)
- What console errors appear?

---

## Test 5: Modify Quantities in Negotiation

### Setup
From Negotiation panel (all stages visible)

### Action
1. Expand **Stage 1**
2. Edit the task: Change qty from 2 to **3**
3. Save
4. Expand **Stage 2**
5. **Click "Add Task"** (new task to Stage 2)
6. Fill in:
   ```
   Task Name: New NEG Task
   Description: Test task
   Quantity: 1
   Unit Cost: 1000
   ```
7. Click "Add Task"

### Expected Result ✅
- [ ] Stage 1 task updates to qty=3
- [ ] Stage 1 total recalculates
- [ ] New task appears in Stage 2
- [ ] New task shows qty=1, cost=1000
- [ ] Grand total updates to include new task
- [ ] No console errors

### What to Report If It Fails ❌
- Do quantities update?
- Can you add new tasks?
- Does total recalculate?
- Any errors in console?

---

## Test 6: Create Negotiation Proposal

### Setup
From previous state (Stage 1 qty=3, Stage 2 new task qty=1)

### Action
1. Scroll down to "Create Negotiation Proposal" button
2. Click it
3. Watch for toast

### Expected Result ✅
- [ ] Toast shows: "✅ Proposal NEG-YYYYMMDD-0001 created..."
- [ ] Parent EST number mentioned in toast: "...based on EST-YYYYMMDD-0001"
- [ ] "Download NEG..." button appears
- [ ] Green success box shows
- [ ] Proposal appears in history
- [ ] No console errors

### What to Report If It Fails ❌
- What error appears?
- Check console for validation error
- Does button get stuck?

---

## Test 7: Move to Execution

### Setup
From previous state (NEG proposal created)

### Action
1. Click "Move to Execution →"
2. Wait for page load
3. Observe all stages

### Expected Result ✅
- [ ] Page loads quickly
- [ ] **All 10 stages visible** ✅ (Key test again!)
- [ ] Stage 1 shows task with qty=3 ✅ (from NEG, not EST)
- [ ] Stage 2 shows NEW TASK with qty=1 ✅ (from NEG)
- [ ] Stage 3 shows task with qty=1 (unchanged from EST)
- [ ] Stages 4, 5, 6, 7, 8, 9, 10 show all tasks with qty=0
- [ ] Parent NEG number displays
- [ ] Grand total matches NEG grand total
- [ ] Console shows: Batch load message
- [ ] No errors

### What to Report If It Fails ❌
- Do you see all 10 stages?
- Does Stage 1 show qty=3 (from NEG) or qty=2 (from EST)?
- Is the new Stage 2 task there?
- Are stages 6-10 visible?
- Console errors?

---

## Test 8: Create Execution Proposal

### Setup
From Execution panel (all stages visible with correct quantities)

### Action
1. (Optional) Edit some quantities if desired
2. Click "Create Execution Proposal"
3. Watch for toast

### Expected Result ✅
- [ ] Toast shows: "✅ Proposal EXE-YYYYMMDD-0001 created..."
- [ ] Parent NEG number mentioned
- [ ] Proposal shows in history
- [ ] Download button appears
- [ ] No console errors

### What to Report If It Fails ❌
- What error message?
- Check console
- Button stuck in "Creating..."?

---

## Test 9: Multiple Proposals

### Setup
Can create from any state

### Action
1. Go back to Estimation panel (project still in EST state)
2. Edit another task (different from before)
3. Click "Generate Proposal" again
4. Watch what happens

### Expected Result ✅
- [ ] New proposal created: EST-YYYYMMDD-0002
- [ ] Both proposals show in "Previous Proposals" list
- [ ] Both numbers different (0001, 0002)
- [ ] Can download either one
- [ ] No errors

### What to Report If It Fails ❌
- Does second proposal create?
- Do both show in history?
- Any errors?

---

## Test 10: Verify Quantities Persist

### Setup
Complete workflow done (EST → NEG → EXE with modified quantities)

### Action
1. Stay in Execution (don't navigate away)
2. Expand Stage 1
3. Check the quantity shown

### Expected Result ✅
- [ ] Stage 1 task shows qty=3 (modified in NEG)
- [ ] Not qty=2 (original from EST)
- [ ] This proves quantities carried forward ✅

---

## Console Health Check

At the end, check console for messages:

### Good Signs ✅
```
✅ [Performance] Batch loaded all stage tasks in single query
✅ [INFO] Task validation passed
✅ [SUCCESS] NEG-YYYYMMDD-0001 created
✅ [INFO] Reloading stages with batch query
```

### Bad Signs ❌
- RED errors about database queries
- "Cannot find..." messages
- Duplicate query logs (should see only 1 batch log, not 5 individual logs)
- Network errors

---

## Summary Results

Fill in:

```
Test 1 (All Stages Load): ✅ / ❌
Test 2 (Edit Quantities): ✅ / ❌
Test 3 (Create EST): ✅ / ❌
Test 4 (Move to NEG): ✅ / ❌
Test 5 (Modify in NEG): ✅ / ❌
Test 6 (Create NEG): ✅ / ❌
Test 7 (Move to EXE): ✅ / ❌
Test 8 (Create EXE): ✅ / ❌
Test 9 (Multiple Proposals): ✅ / ❌
Test 10 (Quantities Persist): ✅ / ❌

Load time (EST→NEG): _____ seconds (target: < 2 sec)
Load time (NEG→EXE): _____ seconds (target: < 2 sec)

Issues found:
1. _____________________
2. _____________________
3. _____________________
```

---

## Key Changes Made

1. **All Stages Always Visible** - Removed filtering by `selectedStageIds`
2. **Quantity-Based Inclusion** - Proposals only include tasks with qty > 0
3. **Removed Stage Checkboxes** - No more manual selection
4. **Auto-Calculated Selected Stages** - Based on which have qty > 0 tasks
5. **Quantities Persist** - Database stores modified values

---

## If Tests Fail

### If Test 4 (All Stages Load) Fails
- Check NegotiationPanel.jsx loadData() - should load ALL stages
- Should see this code: `tasks: groupedTasks[stage.id] || []` (no filtering)
- Console should show batch load message

### If Test 6 (NEG Proposal Creation) Fails
- Check validation - are you setting qty > 0 for at least one task?
- Error message should say "Set quantity > 0"
- Check console for database errors

### If Test 7 (All Stages in Execution) Fails
- Same as Test 4 - check ExecutionPanel.jsx loadData()
- Should load ALL stages without filtering
- Quantities should be from NEG, not EST

### If Test 10 (Quantities Persist) Fails
- Check that stage_tasks table in database has updated quantity values
- When NEG modifies a task, it should call updateStageTask()
- When EXE loads, it should get the updated values

---

## Next Steps

- ✅ **All tests pass** → System is working correctly!
- ⚠️ **Some tests fail** → Report which ones and I'll debug
- 🚀 **Ready for production** → Time to deploy!

---

**Good luck! You've got this! 💪**
