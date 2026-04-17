# Testing Guide - Project Creation Fix

## Prerequisites
- Development server running (`npm run dev`)
- Authenticated user session in the app
- Browser console open (F12) for debugging

---

## Test Case 1: Basic Project Creation

### Steps:
1. **Navigate to Create Project Page**
   - Go to `/projects/create`
   - Should see form with fields: Project Name, Client Name, Location, Capacity, Status, Dates, Notes

2. **Fill Form (Minimal - Test Required Field)**
   ```
   Project Name: "Test Solar System - Mumbai"
   Status: "Planning" (default)
   All other fields: Leave blank or fill as desired
   ```

3. **Click "Create Project"**

### Expected Result: ✅ SUCCESS
```
✓ Toast notification: "Project created successfully!"
✓ Redirected to /projects/{projectId}
✓ Project detail page loads with your new project
✓ Console: No errors (check F12 Developer Tools)
```

### Expected Database Values:
```
- user_id: (Your authenticated user ID)
- name: "Test Solar System - Mumbai"
- status: "Planning"
- project_state: "Estimation"
- stage: 1
- client_name: null
- location: null
- capacity_kw: null
- All dates: null
```

---

## Test Case 2: Complete Project Creation

### Steps:
1. **Navigate to `/projects/create`**

2. **Fill Form Completely**
   ```
   Project Name: "Solar Installation - Bangalore"
   Client Name: "Raj Kumar"
   Location: "Indiranagar, Bangalore"
   Capacity (kW): "8.5"
   Status: "In Progress"
   Start Date: "2026-03-25"
   End Date: "2026-05-30"
   Notes: "Residential 8.5kW system with battery backup"
   ```

3. **Click "Create Project"**

### Expected Result: ✅ SUCCESS
```
✓ Project created with all data saved
✓ Status shows as "In Progress"
✓ Project is visible in Projects list
✓ Can view and edit all fields
```

### Verify Database Values:
In Supabase, query:
```sql
SELECT id, name, client_name, location, status, project_state, capacity_kw, created_at
FROM projects
WHERE name ILIKE '%Bangalore%'
LIMIT 1;
```

Should return:
```
id: (uuid)
name: "Solar Installation - Bangalore"
client_name: "Raj Kumar"
location: "Indiranagar, Bangalore"
status: "In Progress"
project_state: "Estimation"  ← KEY: Should be "Estimation"
capacity_kw: 8.50
created_at: (current timestamp)
```

---

## Test Case 3: Status Filtering Works

### Steps:
1. **Create 3 projects with different statuses:**
   - Project A: Status = "Planning"
   - Project B: Status = "In Progress"
   - Project C: Status = "Completed"

2. **Go to `/projects`**
3. **Click Status Filter Buttons**
   - Should see counts like: "Planning (1) | In Progress (1) | Completed (1)"
   - Each button should filter the project list

### Expected Result: ✅ SUCCESS
```
✓ All 3 projects visible by default
✓ Clicking "Planning" shows only Project A
✓ Clicking "In Progress" shows only Project B
✓ Clicking "Completed" shows only Project C
✓ Filter counts are accurate
```

---

## Test Case 4: Project Detail Page

### Steps:
1. **From Projects list, click on a newly created project**
2. **Verify Project Detail Page shows:**
   - Project name
   - Client name
   - Location
   - Status badge (colored)
   - Capacity
   - Dates
   - Notes
   - "Move to Negotiation" button (should be present)

### Expected Result: ✅ SUCCESS
```
✓ All project data displays correctly
✓ Status shows proper color badge
✓ State workflow button available
✓ Can edit project if needed
```

---

## Test Case 5: Workflow State Transition

### Steps:
1. **Open a project in "Estimation" state**
2. **Click "Move to Negotiation" button**

### Expected Result: ✅ SUCCESS
```
✓ Button click works
✓ Project state changes to "Negotiation"
✓ UI updates to show new state
✓ New buttons appear for next state
```

---

## Debugging Checklist

If you encounter errors, check:

### Error: "User not authenticated"
- [ ] You are logged into the app
- [ ] Session is still valid (check browser console for auth errors)
- [ ] Try logging out and back in

### Error: "new row for relation 'projects' violates check constraint"
- [ ] Status value is one of: Planning, In Progress, On Hold, Completed, Cancelled
- [ ] No other status value is being sent
- [ ] Check browser Network tab → POST to projects → Request body

### Error: "user_id is null or invalid"
- [ ] User authentication is working
- [ ] Supabase client is configured correctly
- [ ] Check supabase.js configuration

### Console Errors to Look For:
```javascript
// GOOD - No errors
console: (empty)

// BAD - Authentication errors
console: "User not authenticated"
console: "Error creating project: Error: User not authenticated"

// BAD - Database constraint errors
console: "Error creating project: Object"
// Check Network tab for full error details

// BAD - Missing fields
console: "Invalid status value"
```

---

## Network Request Inspection

### To verify the request being sent:

1. **Open Browser DevTools** (F12)
2. **Go to Network Tab**
3. **Create a project**
4. **Look for POST request to:**
   - URL: `...supabase.co/rest/v1/projects?...`
   - Method: POST
   - Status: Should be 201 (Created) or 200 (OK)

5. **Check Request Body:**
   - Should include: `user_id`, `name`, `status`, `project_state`, etc.
   - Should NOT have errors like "column does not exist"

6. **Check Response:**
   - Should return the created project object with all fields
   - Should include the generated `id`, `created_at`, etc.

---

## Success Indicators

✅ **All these should be true:**
- [ ] Projects are created without errors
- [ ] All form data is saved to database
- [ ] New projects start in "Estimation" state
- [ ] Status filtering works correctly
- [ ] Project detail page loads
- [ ] Workflow transitions work
- [ ] Browser console has no errors related to project creation
- [ ] No "constraint violation" errors
- [ ] No "column does not exist" errors
- [ ] No authentication errors

---

## Next Steps After Successful Testing

Once project creation is working:
1. Create some test projects with different statuses
2. Test the "Move to Negotiation" workflow
3. Create estimation proposals (EstimationPanel)
4. Download proposals as PDF
5. Test multi-proposal scenario

---

## Reporting Issues

If you encounter any errors, please share:
1. **Console error message** (from F12 Developer Tools)
2. **Network request details** (POST body and response)
3. **Form values** that were being submitted
4. **Steps to reproduce**
