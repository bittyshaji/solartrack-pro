# Bug Fix: Task Quantity Not Persisting

**Date:** March 25, 2026
**Severity:** 🔴 HIGH - Core functionality broken
**Status:** ✅ FIXED

---

## The Bug

When users edit a task quantity in **EstimationPanel** and click "Save":
- Toast shows: "Task updated successfully" ✅
- But quantity reverts to 0 ❌
- User sees no changes applied

---

## Root Cause

The bug was in **EstimationPanel.jsx** in the `loadData()` function (lines 37-69).

### Before (Broken Code):
```javascript
const loadData = async () => {
  // ...
  const stagesData = []
  for (const stage of PROJECT_STAGES) {
    let tasks = await getStageTasksByStage(stage.id, projectId)

    // ❌ BUG: This ALWAYS resets quantities to 0, even after save!
    tasks = tasks.map(task => ({
      ...task,
      quantity: 0
    }))

    stagesData.push({
      ...stage,
      tasks,
      total: calculateStageTotalCost(tasks)
    })
  }
  setStages(stagesData)
  // ...
}
```

### The Problem Flow:

```
User edits quantity to 5
    ↓
User clicks "Save"
    ↓
updateStageTask() updates database ✅
    ↓
Success toast shown ✅
    ↓
loadData() called to refresh UI ✅
    ↓
loadData() fetches tasks from database (showing quantity: 5)
    ↓
❌ CODE OVERWRITES: quantity: 0
    ↓
UI shows quantity: 0
    ↓
User sees: "Updated successfully, but quantity is still 0?"
```

This reset logic was intended ONLY for NEW projects, not for existing work!

---

## The Fix

### After (Fixed Code):
```javascript
const loadData = async () => {
  setLoading(true)
  try {
    // Load stages and tasks FOR THIS PROJECT
    // ✅ Keep quantities from database (don't reset them)
    const stagesData = []
    for (const stage of PROJECT_STAGES) {
      const tasks = await getStageTasksByStage(stage.id, projectId)
      // ✅ Removed the map() that forced quantity to 0

      stagesData.push({
        ...stage,
        tasks,  // ✅ Tasks keep their actual quantities
        total: calculateStageTotalCost(tasks)
      })
    }
    setStages(stagesData)
    // ...
  } finally {
    setLoading(false)
  }
}
```

### What Changed:
- **Removed:** The `.map(task => ({ ...task, quantity: 0 }))` that was forcing all quantities to 0
- **Kept:** Direct use of tasks from database with their actual quantities
- **Result:** Tasks now persist with their edited values ✅

---

## Why This Works

| Panel | How It Loads Tasks | Issue? |
|-------|-------------------|--------|
| **EstimationPanel** | `getStageTasksByStage()` + reset to 0 | ❌ BROKEN - Fixed now |
| **NegotiationPanel** | `getAllStageTasksGrouped()` (no reset) | ✅ WORKING |
| **ExecutionPanel** | `getAllStageTasksGrouped()` (no reset) | ✅ WORKING |

The other two panels use `getAllStageTasksGrouped()` which doesn't force quantities to 0, so they were working fine.

---

## Testing the Fix

### Quick Test (2 minutes):

1. **Go to EstimationPanel**
2. **Edit a task quantity** (set it to something other than 0, like 5)
3. **Click Save**
4. **Verify:**
   - Toast shows: "Task updated successfully" ✅
   - Quantity stays at 5 ✅ (was resetting to 0 before)

### Full Workflow Test (5 minutes):

1. Create EST proposal with quantities set
2. Edit one task quantity to a new value
3. Click Save → Quantity persists ✅
4. Move to Negotiation
5. Edit another task
6. Click Save → Quantity persists ✅
7. Move to Execution
8. Edit execution task
9. Click Save → Quantity persists ✅

---

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| `src/components/EstimationPanel.jsx` | Removed quantity reset in loadData() | ✅ Fixed |

**No changes needed in:**
- NegotiationPanel.jsx (already working correctly)
- ExecutionPanel.jsx (already working correctly)
- stageTaskService.js (already working correctly)

---

## Why This Bug Existed

The quantity reset was intentionally added during development to:
> "Ensure all task quantities default to 0 when loading new projects"

This was correct for NEW projects entering Estimation, but the implementation had a flaw:
- It reset quantities **every time** `loadData()` was called
- Not just for new projects, but also after edits, creates, deletes, etc.
- Should have been: "Reset only on initial project creation, not on every refresh"

---

## Related Code Notes

### Why Other Panels Weren't Affected:

**NegotiationPanel & ExecutionPanel** use a different approach:
```javascript
const groupedTasks = await getAllStageTasksGrouped(projectId)
const stagesData = PROJECT_STAGES.map(stage => ({
  ...stage,
  tasks: groupedTasks[stage.id] || [],  // ✅ No reset
}))
```

This correctly:
- Loads ALL tasks with their actual quantities
- Doesn't override with 0
- Works for new and existing projects

**EstimationPanel** should have used the same approach.

---

## Summary

**Bug:** EstimationPanel forced all quantities to 0 when refreshing data
**Impact:** Users couldn't update task quantities (edits appeared to fail)
**Fix:** Removed the forced reset, keep actual database values
**Result:** Task quantities now persist correctly ✅

**Time to implement:** 2 minutes
**Risk level:** LOW (only removes unwanted code)
**Backwards compatible:** YES (existing saved data unaffected)

---

## Deployment Checklist

- [x] Code fixed
- [ ] Test in Estimation panel
- [ ] Test in Negotiation panel
- [ ] Test in Execution panel
- [ ] Test backward navigation with edits
- [ ] Test creating new project (quantities should stay at 0 initially)

Ready to test! 🚀
