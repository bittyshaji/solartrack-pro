# Testing Guide - Architectural Fixes
**Date**: March 26, 2026

---

## Quick Test Summary
Three architectural fixes have been implemented and are ready for testing:

1. **Material Delivery Entry** ✅ - Add/edit/delete materials with quantity & cost
2. **State Transition** ✅ - Move from EST → NEG → EXE with database persistence
3. **Project-Specific Updates** ✅ - Daily updates and photos now scoped to projects

---

## How to Test

### Prerequisites
1. Start the dev server: `npm run dev`
2. Open browser: `http://localhost:5173/`
3. Log in and navigate to a project
4. Open DevTools (F12) to check console for errors

---

## Test 1: Material Delivery Entry

### Step 1.1: Navigate to Project Detail
1. Go to Projects page
2. Click on any project
3. Scroll down to find **"📦 Material Delivery"** section
4. **Expected**: Section appears with "Add Material" button

### Step 1.2: Add a Material
1. Click **"Add Material"** button
2. Fill in the form:
   - Material Name: "Solar Panel 400W" (or any name)
   - Category: "Panels"
   - Quantity: 10
   - Unit Cost: 25000
   - Description: "High-efficiency monocrystalline" (optional)
3. Click **"Add"** button
4. **Expected**:
   - Material appears in list
   - Total cost shows: ₹250,000
   - Success toast appears

### Step 1.3: Edit the Material
1. Click **"Edit"** icon (pencil) on the material
2. Change quantity to 15
3. Click **"Update"**
4. **Expected**:
   - Total updates to ₹375,000
   - Success toast appears

### Step 1.4: Add Another Material
1. Click **"Add Material"** again
2. Add: "Inverter 5kW" with quantity 2, cost 80000
3. Click **"Add"**
4. **Expected**:
   - Both materials show in list
   - Total cost: ₹375,000 + ₹160,000 = ₹535,000

### Step 1.5: Delete Material
1. Click **"Delete"** (trash icon) on any material
2. Click **"OK"** on confirmation
3. **Expected**:
   - Material disappears
   - Total recalculates
   - Success toast

### ✅ Test 1 Complete
Material entry system is working if:
- ✅ Can add materials with name, quantity, unit cost
- ✅ Can edit materials
- ✅ Can delete materials
- ✅ Total cost calculates correctly
- ✅ Data persists (refresh page and materials still there)

---

## Test 2: State Transition (EST → NEG → EXE)

### Step 2.1: Check Current State
1. In ProjectDetail, look for **"Project Workflow"** section
2. **Expected**:
   - Three states shown: Estimation → Negotiation → Execution
   - Current state highlighted in blue
   - States after current in green
   - Future states in gray

### Step 2.2: Move from Estimation to Negotiation
1. If project is in **Estimation** state, find button: **"→ Move to Negotiation"**
2. Click the button
3. **Expected**:
   - State indicator updates (Estimation becomes green, Negotiation becomes blue)
   - Button changes (now shows "← Back to Estimation" and "→ Move to Execution")
   - Success toast: "Project moved to Negotiation"

### Step 2.3: Verify Database Persistence
1. Refresh the page (Ctrl+R or Cmd+R)
2. **Expected**:
   - Project is STILL in Negotiation state
   - Not back to Estimation
   - This proves data was saved to database

### Step 2.4: Move to Execution
1. Click **"→ Move to Execution"** button
2. **Expected**:
   - Negotiation becomes green
   - Execution becomes blue
   - Only "← Back to Negotiation" button appears
   - Success toast

### Step 2.5: Go Back to Negotiation
1. Click **"← Back to Negotiation"**
2. **Expected**:
   - Execution becomes gray
   - Negotiation becomes blue again
   - Buttons update accordingly

### ✅ Test 2 Complete
State transition is working if:
- ✅ Can move forward: EST → NEG → EXE
- ✅ Can move backward: EXE → NEG → EST
- ✅ Correct buttons show for each state
- ✅ State persists after refresh (database save)
- ✅ Visual indicator updates correctly

---

## Test 3: Project-Specific Daily Updates

### Step 3.1: Find Updates Section
1. In ProjectDetail, scroll up past Materials section
2. Look for **"📋 Daily Updates & Tasks"** section
3. **Expected**: Section with "New Task" button and kanban board

### Step 3.2: Create a Task
1. Click **"New Task"** button
2. Fill in form:
   - Title: "Install solar panels" (or any task)
   - Description: "Mount panels on roof" (optional)
   - Priority: "High"
   - Status: "To Do"
   - Due Date: (pick a future date)
3. Click **"Create Task"**
4. **Expected**:
   - Task appears in "TO DO" column
   - Success toast

### Step 3.3: Verify Project-Specific Tasks
1. In the task form, notice it says: **"Create Task for [ProjectName]"**
2. This confirms task is tied to this specific project
3. **Expected**: Tasks shown are only for THIS project

### Step 3.4: Switch to Another Project
1. Go back to Projects page
2. Open a DIFFERENT project
3. Scroll to "Daily Updates & Tasks"
4. **Expected**:
   - DIFFERENT tasks shown (or empty if no tasks)
   - The task you created in previous project is NOT here
   - This confirms project-specific scoping works

### Step 3.5: Test Photo Upload
1. Go back to first project
2. Scroll to bottom of "Daily Updates & Tasks"
3. Find **"📸 Upload Photos"** section
4. Click **"Take Photo"** or **"Choose File"**
5. Select/take a photo
6. **Expected**:
   - Preview shows
   - Status changes to "Queued"
   - Success toast
   - **Important**: Photo is tied to THIS project (check projectId in devtools)

### Step 3.6: Verify Photo is Project-Specific
1. Switch to different project
2. Take a photo from there
3. Go back to first project
4. **Expected**: First project's photo still there, but NOT second project's photo
5. This confirms photos are project-scoped

### ✅ Test 3 Complete
Project-specific updates working if:
- ✅ Tasks appear in kanban board
- ✅ Tasks are created for specific project
- ✅ Different projects show different tasks
- ✅ Can add multiple tasks and they appear in different columns
- ✅ Photos are tied to specific projects
- ✅ Switching projects shows project-specific data

---

## Browser Console Checks

While testing, check the browser console (F12) for:

### ✅ Good Signs
- No red error messages
- Network requests completing successfully
- Console shows API calls for correct project IDs

### ❌ Bad Signs
- Red error messages
- Failed network requests
- Wrong project IDs in API calls

---

## Testing Checklist

### Material Delivery Entry
- [ ] Section appears in ProjectDetail
- [ ] Can add material with all fields
- [ ] Can edit material
- [ ] Can delete material
- [ ] Total cost calculates correctly
- [ ] Material data persists after refresh
- [ ] Different projects have different materials

### State Transition
- [ ] Workflow indicator shows 3 states
- [ ] Current state highlighted in blue
- [ ] Can move EST → NEG
- [ ] Can move NEG → EXE
- [ ] Can move EXE → NEG
- [ ] Can move NEG → EST
- [ ] State persists after page refresh
- [ ] Correct buttons show for each state
- [ ] Toast notifications appear

### Project-Specific Updates
- [ ] Updates section appears in ProjectDetail
- [ ] Can create task for project
- [ ] Task appears in correct column
- [ ] Different projects show different tasks
- [ ] Can edit task
- [ ] Can delete task
- [ ] Photo upload section appears
- [ ] Can upload photo to project
- [ ] Photos are project-specific (different per project)

---

## Troubleshooting

### Material not saving
- Check console for errors
- Verify network request succeeds
- Check database connection

### State not changing
- Check console for updateProjectState errors
- Verify database project_state field exists
- Try refresh after clicking button

### Tasks not showing project-specific data
- Check console for projectId in API calls
- Verify getProjectTasks() returns correct data
- Check different projects' tasks

### Photos not uploading
- Check if projectId is being passed correctly
- Look for errors in console
- Verify IndexedDB in DevTools → Application → IndexedDB

---

## Success Criteria

All three fixes are working correctly when:

✅ Material Delivery Entry
- Users can add, edit, delete materials
- Total cost calculates automatically
- Data persists in database
- Different projects have separate materials

✅ State Transition
- Users can move between EST ↔ NEG ↔ EXE
- State shows visually in workflow indicator
- Changes persist after refresh
- Database records state change

✅ Project-Specific Updates
- Tasks are scoped to individual projects
- Different projects show different tasks/photos
- Photos upload and queue for specific projects
- Complete task management (CRUD) works

---

## What to Do When Testing

1. **Open this project in browser**
   - Dev server running: `npm run dev`
   - URL: `http://localhost:5173/`

2. **Follow tests in order** (Materials → State → Updates)

3. **Document any issues**
   - Screenshot errors from console
   - Note which steps failed
   - Record error messages exactly

4. **Check database** (if needed)
   - DevTools → Application → Storage
   - Or use Supabase dashboard directly

5. **Report findings**
   - Which tests passed
   - Which tests failed
   - Any error messages
   - Suggestions for improvements

---

## Next Steps After Testing

✅ **If all tests pass**:
1. Update testing results summary
2. Proceed with mobile device testing
3. Plan for production deployment

⚠️ **If some tests fail**:
1. Report the specific failures
2. Include console error messages
3. Note which features are affected
4. Fixes will be implemented based on findings

---

**Testing Status**: Ready ✅
**Estimated Time**: 15-20 minutes
**Difficulty**: Easy (clear UI, step-by-step)

Start testing now! 🎉
