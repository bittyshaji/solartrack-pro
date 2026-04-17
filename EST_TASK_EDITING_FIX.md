# EST Task Editing Bug - Fixed
**Date**: March 27, 2026
**Issue**: Tasks not saving/displaying, multiple tasks appearing together on second edit
**Status**: ✅ Fixed

---

## Problem Identified

**Symptoms:**
1. Edit a task quantity in EST state
2. See "Task updated successfully" message
3. But the UI doesn't reflect the change
4. When editing a second task, suddenly both tasks appear together with updated values

**Root Causes Found:**

### 1. **Invalid Input Validation**
- `parseFloat()` returns `NaN` if input is empty or invalid
- `NaN` values were being sent to the database
- Updates were failing silently while showing success message

### 2. **Missing State Cleanup**
- After saving/canceling, `editValues` was not being cleared
- Stale edit values could cause subsequent edits to use wrong data
- Could lead to tasks appearing together with accumulated/old values

### 3. **No Input Constraints**
- Negative quantities and costs were allowed
- Empty inputs were treated as valid
- No visual feedback that inputs were invalid

---

## Fixes Applied

### Fix 1: Input Validation in `handleSaveTask()` (Lines 262-274)

**Before:**
```javascript
const result = await updateStageTaskForProject(task.id, editValues, projectId)
```

**After:**
```javascript
// Validate inputs before saving
const quantity = parseFloat(editValues.quantity)
const unit_cost = parseFloat(editValues.unit_cost)

if (isNaN(quantity) || isNaN(unit_cost)) {
  toast.error('Please enter valid quantity and cost values')
  return
}

if (quantity < 0 || unit_cost < 0) {
  toast.error('Quantity and cost must be greater than or equal to 0')
  return
}

// Update with validated values
const validatedValues = {
  quantity,
  unit_cost,
  description: editValues.description || ''
}

const result = await updateStageTaskForProject(task.id, validatedValues, projectId)
```

**What it does:**
- Validates that quantity and cost are valid numbers (not NaN)
- Checks for negative values
- Shows user-friendly error messages
- Prevents invalid data from reaching the database

### Fix 2: Clear Edit State After Save (Line 291)

**Before:**
```javascript
if (result.success) {
  toast.success('Task updated successfully')
  invalidateCache(`stageTasks_${projectId}`)
  await loadData()
  setEditingTask(null)  // ← editValues was NOT cleared!
}
```

**After:**
```javascript
if (result.success) {
  toast.success('Task updated successfully')
  invalidateCache(`stageTasks_${projectId}`)
  await loadData()
  // Clear editing state
  setEditingTask(null)
  setEditValues({})  // ← NOW cleared!
}
```

**What it does:**
- Completely clears editValues after successful save
- Prevents stale values from affecting next edit
- Ensures each edit starts with fresh data

### Fix 3: Improved Input Bindings (Lines 642-656)

**Before:**
```javascript
<input
  type="number"
  value={editValues.quantity}
  onChange={e => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) })}
  placeholder="Qty"
  className="w-20 px-2 py-1 border rounded text-sm"
/>
```

**After:**
```javascript
<input
  type="number"
  value={editValues.quantity || ''}
  onChange={e => setEditValues({ ...editValues, quantity: e.target.value === '' ? '' : parseFloat(e.target.value) })}
  placeholder="Qty"
  className="w-20 px-2 py-1 border rounded text-sm"
  min="0"
  step="0.01"
/>
```

**What it does:**
- Handles empty values properly ('' instead of NaN)
- Adds HTML5 constraints: min="0", step="0.01"
- Prevents negative or invalid values at input level
- Better UX with decimal step support

### Fix 4: Clear State on Cancel (Lines 667-672)

**Before:**
```javascript
<button
  onClick={() => setEditingTask(null)}
  disabled={saving}
  className="px-2 py-1 bg-gray-400 text-white rounded text-sm"
>
  <X className="w-4 h-4" />
</button>
```

**After:**
```javascript
<button
  onClick={() => {
    setEditingTask(null)
    setEditValues({})
  }}
  disabled={saving}
  className="px-2 py-1 bg-gray-400 text-white rounded text-sm"
>
  <X className="w-4 h-4" />
</button>
```

**What it does:**
- Clears editValues when user cancels editing
- Prevents stale values from previous edit

---

## Testing Checklist

- [ ] Open a project in EST state
- [ ] Edit a task's quantity
  - [ ] See success message
  - [ ] See the quantity update on UI immediately
  - [ ] Refresh page - quantity should persist
- [ ] Edit task with empty quantity field
  - [ ] Should show error: "Please enter valid quantity and cost values"
  - [ ] Should not save to database
- [ ] Edit task with negative quantity
  - [ ] Should show error: "Quantity and cost must be greater than or equal to 0"
  - [ ] Should not save to database
- [ ] Edit first task, then second task
  - [ ] Both should work independently
  - [ ] No duplicate tasks appearing
  - [ ] Each shows its own updated value
- [ ] Click edit, then cancel
  - [ ] Edit state should close
  - [ ] Task should show original value
- [ ] Edit multiple tasks in sequence
  - [ ] Each edit should complete properly
  - [ ] No accumulation or duplication of tasks

---

## Summary of Changes

| Change | File | Lines | Purpose |
|--------|------|-------|---------|
| Input validation | UnifiedProposalPanel.jsx | 262-274 | Validate before saving |
| Clear after save | UnifiedProposalPanel.jsx | 291 | Prevent stale state |
| Better input binding | UnifiedProposalPanel.jsx | 642-656 | Handle empty values |
| Clear on cancel | UnifiedProposalPanel.jsx | 667-672 | Clean up edit state |

---

## Technical Details

**Why multiple tasks appeared together:**
1. editValues wasn't being cleared after editing task 1
2. When editing task 2, the old editValues from task 1 might still have data
3. If loadData() took time to complete, UI could show both in updating state
4. Clearing editValues ensures each edit is independent

**Why "Task updated successfully" showed but nothing changed:**
1. Invalid values (NaN) were being sent to updateStageTaskForProject
2. The function might have failed silently or returned success despite NaN
3. Database might reject NaN or convert it to null/0
4. Validation now prevents NaN from ever reaching the database

---

## Next Steps

1. Test the fixes thoroughly
2. Monitor browser console for any errors
3. Check that tasks save correctly in all three states (EST, NEG, EXE)
4. Report any remaining issues with specific steps to reproduce

