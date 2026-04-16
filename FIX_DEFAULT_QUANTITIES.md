# 🔧 Fix: Reset All Task Quantities to 0

**Problem**: Tasks are showing with default quantities instead of 0
**Solution**: Reset database and verify loads correctly

---

## Step 1: Reset Database Quantities to 0

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this:

```sql
UPDATE stage_tasks
SET quantity = 0
WHERE quantity IS NOT NULL;
```

5. Click **Run**
6. You should see: "Success" message
7. Verify with this query:

```sql
SELECT COUNT(*) as total_tasks, 
       SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as tasks_with_zero_qty
FROM stage_tasks;
```

This should show all tasks now have quantity = 0

### Option B: Using Command Line (If you have Supabase CLI)

```bash
supabase db push
# Then run the SQL file
psql your_database_url < RESET_QUANTITIES_TO_ZERO.sql
```

---

## Step 2: Verify in Frontend

1. Stop your dev server (Ctrl+C)
2. Clear your browser cache:
   - DevTools → Application → Clear Storage → Clear All
3. Restart: `npm run dev`
4. Create a new test project
5. Go to Estimation panel

**Expected Result**: 
- ❌ All stages should show **₹0** (not ₹28,000, ₹33,000, etc.)
- ✅ Each task should have quantity = 0

---

## Step 3: If Still Showing Values

If quantities still show after reset, add this to EstimationPanel.jsx:

```javascript
const loadData = async () => {
  setLoading(true)
  try {
    const stagesData = []
    for (const stage of PROJECT_STAGES) {
      const tasks = await getStageTasksByStage(stage.id)
      
      // FORCE all quantities to 0 on load for Estimation
      const resetTasks = tasks.map(task => ({
        ...task,
        quantity: 0  // ← Reset to 0
      }))
      
      stagesData.push({
        ...stage,
        tasks: resetTasks,
        total: calculateStageTotalCost(resetTasks)
      })
    }
    setStages(stagesData)
    // ... rest of code
  }
}
```

---

## Step 4: Data Flow After Fix

### Estimation:
- All tasks load with **quantity = 0** ✅
- User edits quantities as needed
- Only tasks with qty > 0 go in EST proposal

### Negotiation:
- Tasks load with **quantities from EST** (not reset to 0)
- User can modify further
- Quantities persist to database

### Execution:
- Tasks load with **quantities from NEG**
- User can view/modify
- Quantities persist to database

---

## Quick Checklist

- [ ] Run the SQL UPDATE query in Supabase
- [ ] Verify with SELECT query (all qty = 0)
- [ ] Clear browser cache
- [ ] Restart `npm run dev`
- [ ] Create new project
- [ ] All stages show ₹0 in Estimation ✅

---

## If Database Reset Fails

Check if `quantity` column exists:

```sql
-- Check column info
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stage_tasks';
```

Should show a `quantity` column that's numeric.

If column doesn't exist, you may need to run a migration:

```sql
ALTER TABLE stage_tasks
ADD COLUMN quantity NUMERIC DEFAULT 0;
```

---

## Expected Result After Fix

When you open Estimation:

```
✅ Site Survey: ₹0 (0 tasks)
✅ KSEB Application: ₹0 (0 tasks)
✅ Mounting Work: ₹0 (0 tasks)
✅ Panel Installation: ₹0 (0 tasks)
✅ Wiring & Inverter: ₹0 (0 tasks)
✅ Earthing & Safety: ₹0 (0 tasks)
✅ KSEB Inspection: ₹0 (0 tasks)
✅ Net Meter: ₹0 (0 tasks)
✅ Commissioning: ₹0 (0 tasks)
✅ Completed: ₹0 (0 tasks)

Estimated Total: ₹0
```

---

**Do this first, then report back with results!**
