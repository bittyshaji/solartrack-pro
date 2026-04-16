-- ========================================
-- BLOCK 1: Create project_photos Table
-- ========================================

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


-- ========================================
-- BLOCK 2: Create project_customers Table
-- ========================================

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


-- ========================================
-- BLOCK 3: Create team_members Table
-- ========================================

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


-- ========================================
-- BLOCK 4: Fix tasks Table Relationship
-- ========================================

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
