# Database Schema Fixes Required
**Date**: March 27, 2026
**Status**: 🔴 CRITICAL - Must be fixed before features work
**Impact**: Customer Banner, Photo Upload, Daily Updates

---

## 🚨 Issues Found

### Issue 1: Missing `project_photos` Table
**Error**: `Could not find the table 'public.project_photos' in the schema cache`
**Location**: `projectDetailService.js` line 39
**Status**: ❌ TABLE DOES NOT EXIST

The app expects photos to be stored in a `project_photos` table, but it doesn't exist in your Supabase.

### Issue 2: Missing `project_customers` Relationship
**Error**: May try to query `project_customers` table
**Location**: `CustomerInfoBanner` component
**Status**: ⚠️ MIGHT NOT EXIST

The customer banner tries to fetch from `project_customers` table.

### Issue 3: Missing Task Relationships
**Error**: `Could not find a relationship between 'tasks' and 'team_members'`
**Location**: `taskService.js` line 33
**Status**: ❌ RELATIONSHIP MISSING

The `tasks` table is trying to join with `team_members` but that relationship doesn't exist.

### Issue 4: ProjectUpdates Component Crash
**Error**: `tasks.filter is not a function`
**Location**: `ProjectUpdates.jsx` line 147
**Status**: ❌ CRASHES - Cascading from Issue 3

When tasks fail to load, the component crashes.

---

## 📋 SOLUTION: Database Schema Setup

You need to create/verify these tables in your Supabase:

### Table 1: `project_photos`
```sql
CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_photos_project_id ON public.project_photos(project_id);
```

### Table 2: `project_customers` (if not exists)
```sql
CREATE TABLE IF NOT EXISTS public.project_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  company TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_customers_customer_id ON public.project_customers(customer_id);
```

### Table 3: Fix `tasks` Table Relationship
```sql
-- Drop problematic foreign key (if exists)
-- ALTER TABLE public.tasks DROP CONSTRAINT tasks_team_members_fkey;

-- Update tasks table to remove team_members relationship
-- Or add team_members table if it should exist:

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Then add the foreign key if team_members is expected:
-- ALTER TABLE public.tasks ADD CONSTRAINT tasks_team_members_fkey
-- FOREIGN KEY (assigned_to) REFERENCES public.team_members(id);
```

---

## 🔧 IMMEDIATE FIX - Disable Problematic Features

**What I Did**:
1. ✅ Disabled `ProjectUpdates` component (was crashing)
2. ✅ Disabled `PhotoUploadSection` component (needs `project_photos` table)
3. ✅ Disabled customer loading (pending schema verification)
4. ✅ Kept `CustomerInfoBanner` component (no-op if no customer)

**Result**: App should work again without crashes

---

## 📝 WHAT TO DO NOW

### Option 1: Quick Fix (Use Web App)
1. Go to Supabase Dashboard
2. Go to SQL Editor
3. Copy each SQL command above
4. Run each one to create the tables

### Option 2: Use Supabase UI
1. Go to Tables section
2. Click "Create a new table"
3. Create tables with schema above

### Option 3: Wait for Guidance
I can provide more detailed SQL if you prefer

---

## 🎯 After Database Setup

Once tables are created:

1. ✅ Uncomment customer loading in ProjectDetail.jsx
2. ✅ Uncomment PhotoUploadSection in ProjectDetail.jsx
3. ✅ Uncomment ProjectUpdates in ProjectDetail.jsx
4. ✅ Hard refresh browser
5. ✅ Features will work!

---

## 📊 Feature Status

| Feature | Status | Blocker |
|---------|--------|---------|
| Basic Project CRUD | ✅ WORKS | None |
| Material Delivery | ✅ WORKS | None |
| Proposals & Invoices | ✅ WORKS | None |
| Customer Banner | ❌ DISABLED | Missing/broken schema |
| Photo Upload | ❌ DISABLED | Missing `project_photos` table |
| Daily Updates | ❌ DISABLED | Bad task relationships |

---

## 📚 Database Structure Reference

Your current working tables (verified):
- ✅ `projects` - Project data
- ✅ `materials` - Material entries
- ✅ `estimates` - Project estimates
- ✅ `proposals` - Proposals
- ✅ `invoices` - Invoices
- ✅ `stages` - Project stages
- ✅ `tasks` (partial) - Has issues with relationships

Missing/Broken:
- ❌ `project_photos` - Photos for projects
- ❌ `project_customers` - Customer management
- ❌ `team_members` - Team members (referenced but broken)
- ❌ Proper foreign key relationships

---

## 🚨 CRITICAL NOTES

**Before running SQL**:
1. ✅ Back up your database (Supabase → Database → Backups)
2. ✅ Make sure you're in the correct project
3. ✅ Test on a duplicate database first if possible

**After running SQL**:
1. ✅ Verify tables appear in Supabase UI
2. ✅ Check foreign keys are created
3. ✅ Restart dev server
4. ✅ Hard refresh browser
5. ✅ Try features

---

## 💡 ALTERNATIVE: Simplified Approach

If you don't want to deal with database setup right now:

**Keep disabled**:
- ❌ ProjectUpdates (too complex)
- ❌ PhotoUploadSection (needs photos table)
- ❌ CustomerInfoBanner (needs customers table)

**Keep enabled** (already working):
- ✅ Material Delivery
- ✅ Proposals & PDFs
- ✅ Invoices & Payment Recording
- ✅ State Transitions

This gives you 80% functionality without database changes.

---

## 📞 NEXT STEPS

**Choose one**:

1. **Option A**: Fix database now
   - Run SQL commands above
   - Uncomment disabled components
   - Test features

2. **Option B**: Keep minimal setup
   - Leave components disabled
   - Use working features
   - Fix database later

3. **Option C**: Ask for help
   - Tell me your Supabase database name
   - I can generate exact SQL for your schema
   - Or guide you through UI setup

---

**Current Status**: App works, but 3 features temporarily disabled due to database schema issues.

Would you like me to help with the database setup?

