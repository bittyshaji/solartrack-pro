# 🧪 Live Testing Checklist - Strategy B

**Start Time**: Now
**Expected Duration**: 15-20 minutes
**Status**: IN PROGRESS ⏱️

---

## Pre-Flight Check

### ✅ Before you start:
- [ ] Terminal ready with `npm run dev` command
- [ ] Browser open to http://localhost:3173 (or your port)
- [ ] DevTools open (F12)
- [ ] Console tab visible
- [ ] Have a test project name ready

**Test Project Name**: Solar-Test-[YOUR CHOICE]

---

## Test 1: Validation (Issue #3)

### Setup
1. Create a new project with any details
2. Navigate to Estimation panel
3. **DO NOT add any tasks yet**

### Action
Click "Create Estimation Proposal" button WITHOUT adding tasks

### Expected Result ✅
- [ ] Toast error appears: "Cannot create proposal without tasks..."
- [ ] No proposal is created
- [ ] Console shows: `[INFO] Task validation failed`

### What to Report If It Fails ❌
- Does the button still work?
- What error do you see?
- Check console for any red errors

---

## Test 2: Add Task + Create Proposal

### Setup
1. In Estimation panel, expand **Stage 1**
2. Click "Add Task"

### Fill in:
```
Task Name: Site Assessment
Description: Full site evaluation
Quantity: 1
Unit Cost: 5000
```

3. Click "Add Task"

### Expected Result ✅
- [ ] Task appears in Stage 1
- [ ] Stage 1 shows "1 tasks"
- [ ] Stage total shows: ₹5,000
- [ ] Grand total at bottom updates

### Repeat for a few more tasks:
Add 2-3 more tasks to different stages to get grand total ~₹30,000

### Create Estimation Proposal
Click "Create Estimation Proposal" button

### Expected Result ✅
- [ ] Toast: "✅ Proposal EST-YYYYMMDD-0001 created"
- [ ] "Download EST-..." button appears
- [ ] No console errors
- [ ] Proposal number displays

---

## Test 3: Duplicate Prevention (Issue #6)

### Action
1. Still in Estimation panel
2. Look at "Create Estimation Proposal" button
3. Click it once
4. **Immediately click again** (within 1-2 seconds)

### Expected Result ✅
- [ ] Button becomes GRAY/DISABLED after first click
- [ ] Button text changes to "Creating..."
- [ ] Spinning animation visible in button
- [ ] Second click does NOTHING
- [ ] Only ONE proposal created total

### What to Look For ❌
- Is button still clickable?
- Does it create 2 proposals?
- Check console for duplicate creation logs

---

## Test 4: Performance Optimization (Issue #4)

### Setup
1. Move to Negotiation phase
2. Click "Move to Negotiation" button
3. **Watch the loading spinner**
4. **Watch the Console**

### Expected Result ✅
- [ ] Page loads FAST (< 1 second)
- [ ] Loading spinner disappears quickly
- [ ] Console shows: `[Performance] Batch loaded all stage tasks in single query`
- [ ] All 5 stages visible with their tasks
- [ ] Parent proposal info shows EST number
- [ ] NO console errors

### Performance Comparison
- **Good**: Page loads and becomes interactive in < 1 second
- **Bad**: Takes 3-5+ seconds
- **Excellent**: < 500ms

**What was your load time?** _____ seconds

### Console Message Check
Open browser console and look for:
```
✅ [Performance] Batch loaded all stage tasks in single query
```

If you see 5 separate `getStageTasksByStage` logs = Old code (not optimized)
If you see 1 batch load message = New code (optimized) ✅

---

## Test 5: Error Recovery UI (Issue #10)

### Setup
1. Open browser DevTools Network tab
2. Look for a way to simulate offline (or turn off wifi if testing on mobile)

### Action - Method 1: DevTools Network Throttle
1. DevTools → Network tab
2. Click "Throttling" dropdown (usually says "No throttling")
3. Select "Offline"
4. Try to click "Move to Execution" or reload page
5. Watch what happens

### Expected Result ✅
- [ ] Error screen appears (red box)
- [ ] Error says something about network/connection
- [ ] "Try Again" button visible
- [ ] Button is clickable

### Recovery Test
1. Turn internet back on (or change Network to "No throttling")
2. Click "Try Again" button
3. Page should load successfully

### Expected Result ✅
- [ ] Data loads
- [ ] Error screen disappears
- [ ] Normal content appears

---

## Test 6: Complete Workflow (Comprehensive)

If all above tests pass, run the full workflow:

### Phase 1: Estimation
- [ ] Create new project "Solar-Full-Test"
- [ ] Add tasks to Stage 1, 3, 4 (total ~₹50,000)
- [ ] Create EST proposal
- [ ] Note EST number: ________________

### Phase 2: Negotiation
- [ ] Click "Move to Negotiation"
- [ ] ⏱️ Time how long it takes to load: _____ seconds
- [ ] Verify parent EST shows: ________________
- [ ] Edit one task (e.g., change cost)
- [ ] Create NEG proposal
- [ ] Note NEG number: ________________

### Phase 3: Execution
- [ ] Click "Move to Execution"
- [ ] ⏱️ Time: _____ seconds
- [ ] Verify parent NEG shows: ________________
- [ ] Verify modified task shows new cost
- [ ] Create EXE proposal
- [ ] Note EXE number: ________________

### Download Test
- [ ] Download EST PDF - works? ✅ / ❌
- [ ] Download NEG PDF - works? ✅ / ❌
- [ ] Download EXE PDF - works? ✅ / ❌

---

## Console Health Check

At the end, look at Console for any RED errors.

**Copy-paste this and report**:
```
Total errors in console: _____
Total warnings: _____
Any red messages about: _______________
```

---

## Results Summary

### All Tests Passed? ✅
```
Test 1 (Validation): ✅ / ❌
Test 2 (Add & Create): ✅ / ❌
Test 3 (Duplicates): ✅ / ❌
Test 4 (Performance): ✅ / ❌
Test 5 (Error Recovery): ✅ / ❌
Test 6 (Full Workflow): ✅ / ❌
```

### Performance Metrics
```
EST creation time: _____ seconds
NEG load time: _____ seconds (target: < 1 second)
EXE load time: _____ seconds (target: < 1 second)
Console performance logs: _____ (should see 2)
```

### Issues Found
```
List any problems here:
1. _______________________
2. _______________________
3. _______________________
```

---

## What to Do If Tests Fail

### If Validation Test Fails
- Can you create proposal without tasks?
- What error appears?
- **Check**: Did you add the validation code to NegotiationPanel?

### If Performance is Slow
- Are you seeing 5 individual queries in console?
- Is the batch loading function being called?
- **Check**: Did getAllStageTasksGrouped import work?

### If Error Recovery Doesn't Work
- Did you add the error state?
- Is loadData being called on "Try Again"?
- **Check**: Are error screens in both panels?

### If Any Unexpected Errors
- Copy the full error message from console
- Tell me what action triggered it
- I'll debug with you!

---

## Next Steps After Testing

- ✅ All tests pass? → You're done! System is ready
- ⚠️ Some tests fail? → Tell me which ones, I'll help fix
- 🚀 Ready for Phase 2? → We can implement more improvements

---

## Communication

**During testing**:
- Report results here
- If stuck, just say which test failed
- If error messages appear, copy them exactly

**After testing**:
- Let me know overall results
- We can debug any issues together
- Or move on to Phase 2!

---

**You've got this! 💪**
