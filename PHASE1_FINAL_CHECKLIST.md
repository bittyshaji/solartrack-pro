# Phase 1 Completion Checklist

## Status
**Phase 1 is ready to execute.** All database schema SQL scripts have been prepared. This checklist will guide you through the final steps.

---

## STEP 1: Execute SQL Scripts in Supabase (15 minutes)

Your Supabase project: **opzoighusosmxcyneifc**

### Instructions:

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/opzoighusosmxcyneifc/sql/new
2. Create a **new SQL query** by clicking "New Query"
3. Copy and paste **BLOCK 1** below into the SQL editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for success notification ✓
6. Repeat steps 2-5 for **BLOCK 2, BLOCK 3, and BLOCK 4**

---

## SQL BLOCK 1: Create project_photos Table
```sql
CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_project_photos_project
    FOREIGN KEY (project_id)
    REFERENCES public.projects(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_photos_project_id
  ON public.project_photos(project_id);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project photos"
  ON public.project_photos
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert project photos"
  ON public.project_photos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete project photos"
  ON public.project_photos
  FOR DELETE
  USING (true);

COMMIT;
```

---

## SQL BLOCK 2: Create project_customers Table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_customers_customer_id
  ON public.project_customers(customer_id);

CREATE INDEX IF NOT EXISTS idx_project_customers_name
  ON public.project_customers(name);

ALTER TABLE public.project_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers"
  ON public.project_customers
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert customers"
  ON public.project_customers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update customers"
  ON public.project_customers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMIT;
```

---

## SQL BLOCK 3: Create team_members Table
```sql
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_email
  ON public.team_members(email);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members"
  ON public.team_members
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert team members"
  ON public.team_members
  FOR INSERT
  WITH CHECK (true);

COMMIT;
```

---

## SQL BLOCK 4: Fix tasks Table Relationship
```sql
ALTER TABLE IF EXISTS public.tasks
DROP CONSTRAINT IF EXISTS tasks_team_members_fkey;

ALTER TABLE IF EXISTS public.tasks
ADD CONSTRAINT fk_tasks_team_members
FOREIGN KEY (assigned_to)
REFERENCES public.team_members(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
  ON public.tasks(assigned_to);

COMMIT;
```

---

## STEP 2: Restart Dev Server (5 minutes)

Once all 4 SQL blocks are executed successfully:

1. Open your terminal in the project directory
2. Run:
   ```bash
   npm run dev
   ```
3. Wait for the message: `Local: http://localhost:5173/`
4. The dev server is ready when you see the Vite startup message

---

## STEP 3: Hard Refresh Browser (2 minutes)

1. Navigate to http://localhost:5173 in your browser
2. Perform a **hard refresh** to clear cache:
   - **Windows/Linux**: Ctrl+Shift+R
   - **Mac**: Cmd+Shift+R
3. Wait for the page to load completely
4. You should see the login page

---

## STEP 4: Test All 11 Phase 1 Features

### Core Features (8 features):
1. ✓ **Projects** - View and manage projects list
2. ✓ **Materials** - Track project materials
3. ✓ **EST State** - Estimate workflow state
4. ✓ **NEG State** - Negotiation workflow state
5. ✓ **EXE State** - Execution workflow state
6. ✓ **Proposal PDF** - Generate and download PDF proposals
7. ✓ **Invoices** - Create and manage invoices
8. ✓ **Invoice PDF** - Generate and download invoice PDFs

### New Features (3 features):
9. ✓ **Customer Banner** - NEW: Display customer info in project detail
10. ✓ **Photo Upload** - NEW: Upload project photos with drag-and-drop
11. ✓ **Daily Updates** - NEW: Add task/update notes with Kanban status

---

## Testing Checklist

### Login & Navigation
- [ ] Log in with your account
- [ ] Verify dashboard loads without errors

### Core Features
- [ ] Click "Projects" → Verify list displays
- [ ] Click "Materials" → Verify materials page loads
- [ ] Open a project → Verify EST/NEG/EXE tabs visible
- [ ] Create/edit proposal in each state
- [ ] Generate proposal PDF (should download)
- [ ] Create invoice → Generate invoice PDF (should download)

### New Features (Phase 1 Additions)
- [ ] Open a project detail → Verify **Customer Banner** displays at top
  - Should show: Customer name, email, phone, location, company
- [ ] Scroll down → Find **Photo Upload Section**
  - Try uploading an image (drag-and-drop or click)
  - Verify photo appears in gallery
- [ ] Scroll further → Find **Daily Updates** section
  - Add a task with status (Backlog/In Progress/Done)
  - Verify Kanban-style display updates

### Error Handling
- [ ] If any errors appear, note them and check browser console (F12)
- [ ] Verify no "Cannot find table" errors appear
- [ ] Confirm all data persists after page refresh

---

## Common Issues & Solutions

### Issue: "Cannot find table" errors
**Solution**: Verify all 4 SQL blocks executed in Supabase
- Go to Supabase SQL Editor
- Run: `SELECT * FROM project_photos LIMIT 1;`
- If error occurs, re-run BLOCK 1

### Issue: Features not visible
**Solution**: Hard refresh browser cache
- Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear browser cache completely

### Issue: Dev server won't start
**Solution**: Clean npm and rebuild
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: Photos not uploading
**Solution**: Check Supabase project_photos table
- Verify table exists in Supabase
- Check RLS policies allow INSERT
- Check browser console for error messages (F12)

---

## Success Criteria

Phase 1 is **COMPLETE** when:
- ✓ All 4 SQL blocks executed successfully
- ✓ Dev server running without errors
- ✓ All 11 features are accessible and functional
- ✓ Data persists across page refreshes
- ✓ No "Cannot find table" errors in browser console

---

## Next Steps After Phase 1

Once Phase 1 is complete, Phase 2 will include:
- Advanced reporting and analytics
- Email notifications system
- Enhanced customer portal
- Batch operations and bulk imports
- Advanced search and filtering

---

## Support

If you encounter issues:
1. Check the error message in browser console (F12)
2. Verify SQL blocks executed in Supabase dashboard
3. Ensure dev server is running (`npm run dev`)
4. Try hard refresh (Ctrl+Shift+R)
5. Check that all 4 tables exist in Supabase

**Contact**: bittyshaji@gmail.com
