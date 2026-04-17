# Database Schema Mismatch - ROOT CAUSE & FIX

## Problem Identified

The project creation was failing with the error:
```
new row for relation "projects" violates check constraint "projects_status_check"
```

Even though the form was sending valid status values (`'Planning'`, `'In Progress'`, etc.)

## Root Causes

After checking the actual Supabase database schema, I identified **three critical issues**:

### 1. **Missing `user_id` in Insert**
- The projects table has a `user_id` column (required for RLS policy)
- The `createProject` function was NOT including `user_id`
- This caused the database operation to fail or insert with incorrect user context

### 2. **Missing `project_state` Initialization**
- The database has a `project_state` column (separate from `status`)
- Projects must have a workflow state: `'Estimation'`, `'Negotiation'`, or `'Execution'`
- New projects weren't being assigned the initial state of `'Estimation'`

### 3. **Incomplete Field Mapping**
- The database has 22 columns total, including:
  - `client_name`, `location`, `notes` (were in form but not being inserted)
  - `capacity_kw`, `start_date`, `end_date` (conversion issues)
  - `project_code`, `site_address`, `district`, `project_type`, etc. (optional but available)

## Database Schema (22 columns)

```
Projects Table Columns:
├── Core Fields
│   ├── id (uuid) - Primary Key
│   ├── user_id (uuid) - Foreign Key, RLS Policy
│   ├── name (text) - REQUIRED
│   └── created_at, updated_at (timestamp)
├── Project Identification
│   ├── project_code (text)
│   ├── project_type (text)
│   ├── project_state (text) - Workflow state: 'Estimation'|'Negotiation'|'Execution'
│   └── stage (integer) - Technical stage
├── Client Information
│   ├── client_name (text)
│   ├── customer_phone (text)
│   ├── customer_email (text)
│   └── site_address, district (text)
├── Project Details
│   ├── location (text)
│   ├── capacity_kw (numeric)
│   ├── start_date, end_date (date)
│   ├── status (text) - Status: 'Planning'|'In Progress'|'On Hold'|'Completed'|'Cancelled'
│   └── notes (text)
├── Technical Details
│   ├── dist_panel_to_elec (numeric)
│   ├── dist_elec_to_kseb (numeric)
│   ├── dist_arrester_to_earth (numeric)
└── Assignment
    └── assigned_to (uuid)
```

## Solution Implemented

### Updated `createProject()` function in `projectService.js`:

```javascript
export async function createProject(projectData) {
  try {
    // Step 1: Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Step 2: Build complete insert data
    const insertData = {
      user_id: user.id,                                    // ✅ NOW INCLUDED
      name: projectData.name,
      status: projectData.status || 'Planning',
      stage: projectData.stage || 1,
      project_state: 'Estimation',                         // ✅ NOW SET FOR NEW PROJECTS
      client_name: projectData.client_name || null,        // ✅ NOW INCLUDED
      location: projectData.location || null,              // ✅ NOW INCLUDED
      capacity_kw: projectData.capacity_kw ? parseFloat(...) : null,
      start_date: projectData.start_date || null,
      end_date: projectData.end_date || null,
      notes: projectData.notes || null                     // ✅ NOW INCLUDED
    }

    // Step 3: Insert to database
    const { data, error } = await supabase
      .from('projects')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error creating project:', err)
    return { success: false, error: err.message }
  }
}
```

## Key Changes

| Issue | Before | After |
|-------|--------|-------|
| User authentication | Not checked | ✅ Gets current user |
| user_id field | Missing | ✅ Included from auth.getUser() |
| project_state | Not set | ✅ Set to 'Estimation' |
| Form fields | Partial | ✅ All form fields included |
| capacity_kw | Raw value | ✅ Parsed as float |
| created_at | Explicitly set | ✅ Let DB default (NOW()) |

## Testing the Fix

1. Go to `/projects/create`
2. Fill in the form:
   - **Project Name** (required) - e.g., "Solar System - Mumbai"
   - **Client Name** - e.g., "John Doe"
   - **Location** - e.g., "Bangalore"
   - **Status** - Select from dropdown (should show: Planning, In Progress, On Hold, Completed, Cancelled)
   - **Capacity (kW)** - e.g., 5.5
   - **Dates** - Optional

3. Click "Create Project"
4. Expected result:
   - ✅ Project created successfully
   - ✅ Redirected to project detail page
   - ✅ Project state starts as "Estimation"
   - ✅ Status is set to what you selected

## What Happens Next

Once a project is created:
- It starts in the **"Estimation"** workflow state
- You can create multiple estimation proposals
- You can transition to "Negotiation" → "Execution" states
- Each state can have proposals with unique tracking numbers
