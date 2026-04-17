# ✅ Data Model - CORRECTED (March 25, 2026)

## What Changed?

The previous implementation was filtering stages based on which ones were "selected" in the parent proposal. **This was wrong.**

The correct model: **All stages visible in all states, with quantities determining inclusion.**

---

## Correct Data Flow

### Stage 1: Estimation
1. User sees all 10 PROJECT_STAGES:
   - Site Survey, KSEB Application, Mounting Work, Panel Installation, Wiring & Inverter
   - Earthing & Safety, KSEB Inspection, Net Meter, Commissioning, Completed
2. Each stage has all its default tasks
3. **Tasks default with quantity = 0**
4. User can edit task quantities and costs
5. When creating EST proposal:
   - **Only tasks with quantity > 0 are included**
   - Only stages with at least one task (quantity > 0) are saved to `selected_stage_ids`
   - Proposal shows grand total of only tasks with quantity > 0

```javascript
// Example: Stages stored in EST proposal
selected_stage_ids: [1, 3, 4]  // Only these stages have quantity > 0 tasks

// But when loading Negotiation/Execution:
// Load ALL stages (1, 2, 3, 4, 5, 6, 7, 8, 9, 10) with ALL their tasks
// Keep quantity values from EST proposal
```

### Stage 2: Negotiation
1. **Load ALL 10 stages** (not filtered)
2. Load ALL tasks from database for those stages
3. **Tasks keep their quantities from EST** (or 0 if no EST task)
4. User can:
   - Edit quantities and costs
   - Add new tasks to any stage
5. When creating NEG proposal:
   - **Only tasks with quantity > 0 are included**
   - Save stages with quantity > 0 tasks to `selected_stage_ids`
   - **All modified quantities persist** (stored in database)

### Stage 3: Execution
1. **Load ALL 10 stages** (not filtered)
2. Load ALL tasks with their **most recent quantities from NEG**
3. User can:
   - View quantities from NEG
   - Modify quantities further if needed
4. When creating EXE proposal:
   - **Only tasks with quantity > 0 are included**
   - Save to database

---

## Code Changes Made

### 1. NegotiationPanel.jsx - loadData()

**BEFORE (WRONG):**
```javascript
// Only load tasks for stages in selectedStageIds
const stagesData = PROJECT_STAGES.map(stage => ({
  ...stage,
  tasks: selectedStageIds.includes(stage.id)
    ? (groupedTasks[stage.id] || [])
    : [],  // ← WRONG: Empty for other stages
}))
```

**AFTER (CORRECT):**
```javascript
// Load ALL stages with ALL their tasks
const stagesData = PROJECT_STAGES.map(stage => ({
  ...stage,
  tasks: groupedTasks[stage.id] || [],  // ← Load all tasks
  isFromParent: (groupedTasks[stage.id]?.length || 0) > 0
}))
```

### 2. ExecutionPanel.jsx - loadData()

Same change as NegotiationPanel.

### 3. All Panels - Validation Logic

**BEFORE (WRONG):**
```javascript
// Checked if unit_cost > 0
const hasValidTasks = stages.some(stage =>
  stage.tasks.some(t => t.unit_cost > 0)  // ← Based on cost
)
```

**AFTER (CORRECT):**
```javascript
// Check if quantity > 0 (only these tasks go in proposal)
const tasksWithQuantity = stages.flatMap(stage =>
  stage.tasks?.filter(t => t.quantity > 0) || []
)
if (tasksWithQuantity.length === 0) {
  toast.error('Cannot create proposal without tasks. Set quantity > 0 for at least one task.')
  return
}
```

### 4. Proposal Creation

**BEFORE (WRONG):**
```javascript
// Saved all stages with any tasks
const stagesWithTasks = stages.filter(s => s.tasks && s.tasks.length > 0)
const stagesArray = stagesWithTasks.map(s => s.id)
```

**AFTER (CORRECT):**
```javascript
// Save only stages with tasks that have quantity > 0
const stagesWithValidTasks = stages.filter(s =>
  s.tasks && s.tasks.some(t => t.quantity > 0)
)
const stagesArray = stagesWithValidTasks.map(s => s.id)
```

---

## How Quantities Carry Forward

### Example Workflow:

**Estimation:**
- Stage 1: Task A (qty=2, cost=5000) = ₹10,000
- Stage 1: Task B (qty=0, cost=3000) = ₹0 (not included)
- Stage 3: Task C (qty=1, cost=2000) = ₹2,000
- **EST Proposal Total: ₹12,000**
- Stored: `selected_stage_ids: [1, 3]`

**Move to Negotiation:**
- Load all 10 stages with all tasks
- Stage 1 shows: Task A (qty=2), Task B (qty=0)
- Stage 3 shows: Task C (qty=1)
- Stages 2, 4, 5, 6, 7, 8, 9, 10 show: all their tasks with qty=0
- User modifies:
  - Stage 1: Task A qty=3 (now ₹15,000)
  - Stage 2: Task D qty=1 (₹1,000) - newly added
- **NEG Proposal Total: ₹18,000**
- Stored: `selected_stage_ids: [1, 2, 3]`
- **Quantities saved to database**

**Move to Execution:**
- Load all 10 stages with all tasks
- Stage 1 shows: Task A (qty=3) ✅ from NEG
- Stage 1 shows: Task B (qty=0)
- Stage 2 shows: Task D (qty=1) ✅ from NEG
- Stage 3 shows: Task C (qty=1) ✅ from NEG
- Stages 4, 5, 6, 7, 8, 9, 10: all tasks with qty=0
- User can further adjust quantities if needed
- **EXE Proposal Total: ₹18,000** (or modified total)

---

## Database Storage

### project_estimates table:
```
| id | project_id | proposal_type | grand_total | selected_stage_ids |
|----|------------|---------------|-------------|-------------------|
| 1  | proj_1     | Estimation    | 12000       | [1,3]              |  ← EST
| 2  | proj_1     | Negotiation   | 18000       | [1,2,3]            |  ← NEG
| 3  | proj_1     | Execution     | 18000       | [1,2,3]            |  ← EXE
```

### stage_tasks table:
```
| id | project_id | stage_id | task_name | quantity | unit_cost | created_at |
|----|------------|----------|-----------|----------|-----------|-----------|
| 1  | proj_1     | 1        | Task A    | 3        | 5000      | 2026-03-25 | ← Updated
| 2  | proj_1     | 1        | Task B    | 0        | 3000      | 2026-03-25 |
| 3  | proj_1     | 3        | Task C    | 1        | 2000      | 2026-03-25 |
| 4  | proj_1     | 2        | Task D    | 1        | 1000      | 2026-03-25 | ← New
```

**Key Point:** The database stores the most recent quantity/cost values. When NEG loads, it gets these updated values. When EXE loads, it gets NEG's updated values.

---

## Testing the New Model

### Test Case: Complete Workflow

#### Step 1: Estimation
1. Create new project "Test-123"
2. In Stage 1 (Site Survey): Add "Task A" with quantity=2, cost=5000
3. In Stage 3 (Mounting Work): Add "Task C" with quantity=1, cost=2000
4. Click "Create Estimation Proposal"
5. Verify: Proposal number shows (EST-20260325-0001)
6. Verify: Grand total = ₹12,000

#### Step 2: Move to Negotiation
1. Click "Move to Negotiation"
2. Wait for load...
3. **Verify all 10 stages visible** ✅
   - Site Survey, KSEB Application, Mounting Work, Panel Installation, Wiring & Inverter
   - Earthing & Safety, KSEB Inspection, Net Meter, Commissioning, Completed
4. Stage 1 (Site Survey): Task A shows qty=2 ✅
5. Stage 3 (Mounting Work): Task C shows qty=1 ✅
6. Stages 2, 4, 5, 6, 7, 8, 9, 10: Show with qty=0 for all tasks ✅
7. Edit Stage 1: Task A qty=3 (cost=5000)
8. Edit Stage 2 (KSEB Application): Add new "Task D", qty=1, cost=1000
9. Click "Create Negotiation Proposal"
10. Verify: Proposal number shows (NEG-20260325-0001)
11. Verify: Grand total = ₹16,000 (3×5000 + 1×1000 + 1×2000)

#### Step 3: Move to Execution
1. Click "Move to Execution"
2. Wait for load...
3. **Verify all 10 stages visible** ✅
   - All stages: Site Survey through Completed
4. Stage 1 (Site Survey): Task A shows qty=3 ✅ (from NEG)
5. Stage 2 (KSEB Application): Task D shows qty=1 ✅ (from NEG)
6. Stage 3 (Mounting Work): Task C shows qty=1 ✅ (from EST/NEG)
7. Stages 4, 5, 6, 7, 8, 9, 10: Show qty=0 ✅
8. Click "Create Execution Proposal"
9. Verify: Proposal number shows (EXE-20260325-0001)
10. Verify: Grand total = ₹16,000

#### Step 4: Return to any stage
1. Go back to Estimation (project still shows EST state)
2. Edit a task quantity
3. Create another EST proposal (EST-20260325-0002)
4. Verify: Multiple proposals can be created ✅

---

## Key Rules

1. **All stages always visible** - Don't filter by parent
2. **Only quantity > 0 in proposals** - Check `t.quantity > 0`
3. **Quantities persist** - Database stores the values
4. **Multiple proposals per state** - Users can create EST, NEG, EXE multiple times
5. **Parent tracking** - NEG points to EST, EXE points to NEG
6. **Grand total calculation** - Only sum tasks with quantity > 0

---

## Common Mistakes to Avoid

❌ **WRONG:** Filtering stages by `selectedStageIds.includes(stage.id)`
✅ **RIGHT:** Load all stages, all tasks

❌ **WRONG:** Checking `t.unit_cost > 0` for proposal inclusion
✅ **RIGHT:** Check `t.quantity > 0`

❌ **WRONG:** Only showing inherited stages in NEG/EXE
✅ **RIGHT:** Show all stages with empty tasks as qty=0

❌ **WRONG:** Recalculating grand total on load
✅ **RIGHT:** Use stored grand_total from proposal, but validate on proposal creation

---

## Files Modified

- ✅ `/src/components/NegotiationPanel.jsx` - Load all stages, validate by quantity
- ✅ `/src/components/ExecutionPanel.jsx` - Load all stages, validate by quantity
- ✅ `/src/components/EstimationPanel.jsx` - Validate by quantity, calculate correctly
- ✅ `/src/lib/stageTaskService.js` - No changes needed (already has `getAllStageTasksGrouped`)

---

## Next Steps

1. **Test the complete workflow** (see test case above)
2. **Verify quantities persist** through all 3 states
3. **Create multiple proposals** at each stage to verify
4. **Check console** for any errors
5. Report back with results!

---

**Status:** ✅ Ready for testing
**Complexity:** Medium (data model corrected)
**Testing time:** ~20 minutes for complete workflow
