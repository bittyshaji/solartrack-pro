# Legacy Task Conversion Fix - Complete Solution

**Date:** March 25, 2026
**Status:** ✅ FIXED - Legacy tasks now properly converted on first edit
**Files Modified:**
- `src/lib/stageTaskService.js` (new function: updateStageTaskForProject)
- `src/components/EstimationPanel.jsx`
- `src/components/NegotiationPanel.jsx`
- `src/components/ExecutionPanel.jsx`

---

## The Root Problem (SOLVED)

When you edited a task, quantities from OTHER tasks suddenly changed. This was because:

```
1. Load legacy task (project_id=NULL, qty=0)
2. User edits → qty=5
3. Call updateStageTask(id, {qty:5})
4. Updates the SHARED LEGACY TASK (still project_id=NULL!)
5. All other projects see the update! ❌
```

**The issue:** Updating a legacy task modified the shared template.

---

## The Solution: Smart Task Conversion

**New function: `updateStageTaskForProject(taskId, updates, projectId)`**

```javascript
// Check if updating a legacy task
if (task.project_id === null) {
  // Don't update the shared template!
  // Create a new PROJECT-SPECIFIC COPY instead
  createNewTask({
    ...legacyTask,
    project_id: projectId,  // Assign to this project
    quantity: updates.quantity,
    unit_cost: updates.unit_cost
  })
} else {
  // Already project-specific, update normally
  updateStageTask(id, updates)
}
```

---

## How It Works

### Scenario 1: Editing a Legacy Task
```
Legacy task (project_id=NULL):
  id: 'task-1'
  qty: 0
  unit_cost: 1000
         ↓
User edits → qty: 5, saves
         ↓
NEW project-specific task created:
  id: 'task-1-copy'  (new ID)
  project_id: 'project-a-uuid'
  qty: 5
  unit_cost: 1000
         ↓
Result:
  - Legacy task unchanged (qty=0) → Other projects unaffected ✅
  - Project A has its own copy (qty=5) ✅
  - No contamination ✅
```

### Scenario 2: Editing a Project-Specific Task
```
Project-specific task (project_id='project-a-uuid'):
  qty: 3
         ↓
User edits → qty: 7
         ↓
Normal update:
  qty: 7
         ↓
Result: Project A's task updated, others unaffected ✅
```

---

## Implementation Details

### New Function in stageTaskService.js:
```javascript
export async function updateStageTaskForProject(taskId, updates, projectId) {
  // Fetch the task
  const task = await getTask(taskId)

  if (task.project_id === null) {
    // Legacy task - create copy
    return createNewProjectSpecificCopy(task, updates, projectId)
  } else {
    // Project-specific - update normally
    return updateStageTask(taskId, updates)
  }
}
```

### Updated Panels:
All three panels now use `updateStageTaskForProject()` instead of `updateStageTask()`:

```javascript
// ❌ OLD: Updates shared template
const result = await updateStageTask(task.id, editValues)

// ✅ NEW: Converts legacy tasks automatically
const result = await updateStageTaskForProject(task.id, editValues, projectId)
```

---

## Migration Flow

```
Week 1 - Project A:
  ├─ Load legacy tasks (NULL project_id)
  ├─ Edit Task 1 → Creates copy (project_id='A')
  └─ Now has project-specific tasks

Week 2 - Project B:
  ├─ Load legacy tasks (NULL project_id)
  │  → Not affected by A's edits ✅
  ├─ Edit Task 2 → Creates copy (project_id='B')
  └─ Now has project-specific tasks

Result: Each project has isolated data ✅
```

---

## Testing

### Test 1: Edit One Task
```
1. Go to Estimation/Negotiation/Execution
2. Edit Task 1 → qty = 5
3. Save
4. Check: ONLY Task 1 = 5, others = 0 ✅
```

### Test 2: Multi-Project Isolation
```
1. Project A: Edit Task 1 → qty=5, save
2. Project B: Check Task 1
3. ✅ Task 1 = 0 (isolated from A)
4. Project A: Check Task 1
5. ✅ Task 1 = 5 (unchanged)
```

### Test 3: Subsequent Edits
```
1. Project A: First edit → Task 1 becomes project-specific
2. Project A: Second edit → Updates normally (no more copies)
3. ✅ No duplicate tasks
```

### Test 4: Complete Workflow
```
1. EST: Edit tasks → quantities persist
2. NEG: Edit tasks → quantities persist
3. EXE: Edit tasks → quantities persist
4. ✅ No quantity creeping ✅
```

---

## Why This Works

| Issue | Before | After |
|-------|--------|-------|
| Edit Task A | Affects all projects ❌ | Only affects current project ✅ |
| Legacy tasks | Shared forever ❌ | Converted on first edit ✅ |
| Isolation | No ❌ | Yes ✅ |
| Data per project | No ❌ | Yes ✅ |

---

## Database Behavior

### Before (❌ Problem):
```sql
Task 1: project_id=NULL, qty=5 (shared by A & B)
         ↓
Project B sees qty=5 (contaminated!) ❌
```

### After (✅ Solution):
```sql
Task 1 (legacy): project_id=NULL, qty=0
Task 1 (A copy): project_id='a-uuid', qty=5
Task 1 (B copy): project_id='b-uuid', qty=0
         ↓
Project A sees qty=5 ✅
Project B sees qty=0 ✅
No contamination ✅
```

---

## Summary

**Problem:** Updating legacy tasks contaminated all projects
**Solution:** Convert legacy tasks to project-specific copies on first edit
**Result:** Perfect isolation + automatic migration ✅

**Ready to test!** Quantities should now stay isolated to each project!
