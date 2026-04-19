# Database Migration Guide
## Customer-First Workflow Implementation

**Status:** ✅ Ready to Execute  
**Date:** April 19, 2026

---

## ⚠️ PROBLEM ENCOUNTERED

When attempting to apply the original schema, this error occurred:

```
ERROR: 23502: column "customer_id" of relation "projects" contains null values
```

**Root Cause:** Existing projects in the database do not have a `customer_id` value (NULL), but the NOT NULL constraint cannot be applied while NULL values exist.

**Solution:** Migrate existing projects before applying the constraint.

---

## ✅ SOLUTION PROVIDED

Two migration scripts have been created:

### Option 1: Quick Migration (Recommended)
**File:** `CUSTOMER_FIRST_WORKFLOW_SCHEMA_COMPLETE.sql`

**What it does:**
1. ✅ Creates a "Legacy" customer for existing projects
2. ✅ Assigns all orphaned projects to the legacy customer
3. ✅ Applies the NOT NULL constraint
4. ✅ Creates all triggers, views, and indexes
5. ✅ Runs verification queries

**Duration:** ~5 minutes  
**Risk:** Low (all data preserved)

### Option 2: Manual Step-by-Step Migration
**File:** `MIGRATE_EXISTING_PROJECTS.sql`

Use this if you want to see each step separately before committing.

---

## 🚀 EXECUTION STEPS

### Step 1: Choose Your Migration Script

**Use COMPLETE Script (Recommended):**
```sql
File: CUSTOMER_FIRST_WORKFLOW_SCHEMA_COMPLETE.sql
Why: Handles everything in one go
Time: ~5 minutes
```

**OR Manual Step-by-Step:**
```sql
File: MIGRATE_EXISTING_PROJECTS.sql
Why: More control, see each step
Time: ~10 minutes
```

### Step 2: Execute in Supabase

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**
5. Copy & paste the entire script content
6. Click **"Run"**

### Step 3: Verify the Results

At the end of the script, verification queries run automatically. You should see:

```
VERIFICATION RESULTS:
✅ Step 1: NOT NULL Constraint - is_nullable = false
✅ Step 2: Triggers - Should see 2 triggers listed
✅ Step 3: Views - Should see 2 views listed
✅ Step 4: Legacy Customer - CUST-LEGACY-0000 created
✅ Step 5: Projects in Legacy - Count of migrated projects
✅ Step 6: Orphaned Projects - 0 (no more NULL values)
✅ Step 7: Indexes - Multiple indexes listed
✅ Step 8: Monitoring Function - Statistics displayed
```

---

## 📊 WHAT HAPPENS

### Before Migration
```
Database State:
  • 123 projects (example)
    - 100 with customer_id
    - 23 with NULL (orphaned)
  
  • Status: Cannot apply NOT NULL constraint
    Error: 23502 - contains null values
```

### After Migration
```
Database State:
  • 123 projects
    - 100 with original customer_id
    - 23 assigned to CUST-LEGACY-0000
    - 0 with NULL
  
  • Status: Fully migrated to customer-first workflow
    Error: None - constraint applied successfully
```

### New Resources Created
```
✅ Legacy Customer
   ID: CUST-LEGACY-0000
   Name: Legacy/Unassigned Projects
   Email: legacy@solartrack.local
   Purpose: Default customer for existing projects

✅ Constraints
   NOT NULL on projects.customer_id
   All existing projects now have valid customer_id

✅ Triggers
   projects_customer_validation - Validates new projects
   prevent_customer_deletion - Prevents deleting customers with projects

✅ Views
   customer_project_summary - Statistics per customer
   projects_with_customers - Projects with customer details

✅ Indexes
   idx_projects_customer_id
   idx_projects_customer_status
   idx_project_customers_is_active
   idx_project_customers_active_name
```

---

## ✨ LEGACY CUSTOMER EXPLANATION

### Why Create a Legacy Customer?

Existing projects in your database don't have a customer_id. Instead of:
- ❌ Deleting the projects (data loss)
- ❌ Leaving NULL values (violates constraint)
- ❌ Failing the migration (no solution)

We:
- ✅ Create a "Legacy" customer as a default
- ✅ Assign all existing projects to it
- ✅ Apply the constraint successfully
- ✅ Preserve all data

### What Is CUST-LEGACY-0000?

```
Customer ID:     CUST-LEGACY-0000
Name:            Legacy/Unassigned Projects
Email:           legacy@solartrack.local
Company:         System Default
Created:         At migration time
Purpose:         Holds all pre-migration projects

Contains:        All projects that existed before customer-first workflow
Status:          Active (can be edited/deleted later if needed)

User Visible:    YES - Shows in customer dropdown
Assignable:      YES - New projects can be assigned to it
Moveable:        YES - Projects can be reassigned to real customers later
```

### What Happens After Migration?

You can:

1. **Edit the Legacy Customer**
   - Change name to "Misc Projects" or whatever you prefer
   - Add email, company info, etc.

2. **Reassign Projects**
   - Open each project and change customer
   - Move them from Legacy to real customers

3. **Delete/Archive**
   - Once projects are reassigned, can deactivate/delete the legacy customer
   - Only possible when no projects remain

---

## 🔄 ROLLBACK PROCEDURE

If something goes wrong, you can rollback:

### Option 1: Restore from Backup
```sql
-- If Supabase backup is available
-- Contact Supabase support to restore snapshot
```

### Option 2: Manual Rollback
```sql
-- 1. Delete the legacy customer (if no projects assigned)
DELETE FROM project_customers WHERE customer_id = 'CUST-LEGACY-0000';

-- 2. Remove NOT NULL constraint (if needed)
ALTER TABLE projects ALTER COLUMN customer_id DROP NOT NULL;

-- 3. Drop triggers (if needed)
DROP TRIGGER projects_customer_validation ON projects;
DROP TRIGGER prevent_customer_deletion ON project_customers;
```

---

## ⚠️ IMPORTANT NOTES

1. **Backup First**
   - Recommended: Take a Supabase backup before running
   - Dashboard → Database → Backups → Create backup

2. **Test First**
   - Run in development environment first
   - Verify all verification queries pass
   - Then run in production

3. **No Data Loss**
   - All projects are preserved
   - No data is deleted
   - All projects get a valid customer_id

4. **Reversible**
   - You can always reassign projects later
   - Legacy customer can be edited/deleted when empty
   - No irreversible changes

---

## 📋 EXECUTION CHECKLIST

- [ ] I have backed up my Supabase database
- [ ] I understand the legacy customer concept
- [ ] I chose my migration script (COMPLETE recommended)
- [ ] I copied the entire script
- [ ] I pasted it into Supabase SQL Editor
- [ ] I clicked "Run"
- [ ] I saw all verification queries pass
- [ ] I reviewed the legacy customer creation
- [ ] I confirmed all projects were migrated
- [ ] I verified no NULL customer_ids remain
- [ ] I'm ready to test the application

---

## 🎯 NEXT STEPS AFTER MIGRATION

1. ✅ **Database migrated** (you are here)
2. ⏳ **Test in development**
   - Navigate to /customers (should see legacy customer)
   - Navigate to /projects (should load without errors)
   - Create a new customer
   - Create a new project (should require customer selection)

3. ⏳ **Deploy code changes**
   - All code has been deployed (completed earlier)
   - Just need this database migration

4. ⏳ **Reassign projects (Optional)**
   - Move projects from legacy to real customers
   - Edit legacy customer name/details
   - Delete/archive when empty

---

## 📊 TIMELINE

```
Before Migration:     ~5 min (choose script, copy, paste)
During Migration:     ~3-5 min (database processing)
Verification:        ~1 min (review results)
Total Time:          ~10 min

Total Downtime:      ~5 minutes (while SQL runs)
Risk Level:          LOW (all data preserved)
Reversibility:       YES (can rollback if needed)
```

---

## ✅ SUCCESS CRITERIA

Migration is successful when:

- ✅ Script runs without errors
- ✅ All 8 verification checks pass
- ✅ Legacy customer is created
- ✅ All projects have customer_id (none NULL)
- ✅ NOT NULL constraint applied
- ✅ Triggers exist and working
- ✅ Views exist and queryable
- ✅ Indexes exist for performance

---

## 📞 TROUBLESHOOTING

### Error: "customer_id already exists"
**Cause:** Legacy customer already created from previous run  
**Solution:** Safe to ignore, script uses ON CONFLICT DO NOTHING

### Error: "Cannot apply constraint - still has NULL values"
**Cause:** Not all projects were migrated  
**Solution:** Check step 5 of verification - should show all projects migrated

### Error: "View already exists"
**Cause:** Script run twice  
**Solution:** Safe to ignore, script drops and recreates views

### Verification queries fail
**Cause:** Partial execution  
**Solution:** Check each step individually, then run complete script again

---

## 🎓 SUMMARY

**Problem:** Existing projects without customer_id block NOT NULL constraint  
**Solution:** Create legacy customer, migrate projects, then apply constraint  
**Result:** Database ready for customer-first workflow  
**Time:** ~10 minutes  
**Risk:** Low  
**Reversibility:** Yes

---

## 📖 FILES CREATED

```
✅ CUSTOMER_FIRST_WORKFLOW_SCHEMA_COMPLETE.sql
   Complete migration + schema setup (RECOMMENDED)

✅ MIGRATE_EXISTING_PROJECTS.sql
   Manual step-by-step migration (Optional)

✅ DATABASE_MIGRATION_GUIDE.md
   This guide
```

---

**Ready to proceed?** Execute `CUSTOMER_FIRST_WORKFLOW_SCHEMA_COMPLETE.sql` in Supabase now!

**Need more info?** Review the verification section above or the complete script comments.
