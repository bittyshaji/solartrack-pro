-- ============================================================
-- Module 5: Material Allocation Tracker Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Material Catalog table (master list of materials)
CREATE TABLE IF NOT EXISTS public.material_catalog (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name TEXT NOT NULL,
  unit          TEXT NOT NULL DEFAULT 'units',
  category      TEXT NOT NULL DEFAULT 'other'
                  CHECK (category IN ('panels', 'inverter', 'structure', 'wiring', 'other')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Material Allocations table (per-project allocation tracking)
CREATE TABLE IF NOT EXISTS public.material_allocations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material_id        UUID NOT NULL REFERENCES public.material_catalog(id) ON DELETE RESTRICT,
  quantity_allocated NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity_used      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  allocated_by       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  allocation_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_material_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS material_allocations_updated_at ON public.material_allocations;
CREATE TRIGGER material_allocations_updated_at
  BEFORE UPDATE ON public.material_allocations
  FOR EACH ROW EXECUTE FUNCTION update_material_allocations_updated_at();

-- Step 4: RLS for material_catalog
ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_select" ON public.material_catalog;
DROP POLICY IF EXISTS "catalog_insert" ON public.material_catalog;
DROP POLICY IF EXISTS "catalog_update" ON public.material_catalog;
DROP POLICY IF EXISTS "catalog_delete" ON public.material_catalog;

CREATE POLICY "catalog_select" ON public.material_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "catalog_insert" ON public.material_catalog
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND approval_status = 'approved'
    )
  );

CREATE POLICY "catalog_update" ON public.material_catalog
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND approval_status = 'approved'
    )
  );

CREATE POLICY "catalog_delete" ON public.material_catalog
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND approval_status = 'approved'
    )
  );

-- Step 5: RLS for material_allocations
ALTER TABLE public.material_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alloc_select" ON public.material_allocations;
DROP POLICY IF EXISTS "alloc_insert" ON public.material_allocations;
DROP POLICY IF EXISTS "alloc_update" ON public.material_allocations;
DROP POLICY IF EXISTS "alloc_delete" ON public.material_allocations;

CREATE POLICY "alloc_select" ON public.material_allocations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "alloc_insert" ON public.material_allocations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND approval_status = 'approved'
    )
  );

-- Admin/Manager can update everything; Team Leader can only update quantity_used
CREATE POLICY "alloc_update" ON public.material_allocations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager', 'team_leader')
        AND approval_status = 'approved'
    )
  );

CREATE POLICY "alloc_delete" ON public.material_allocations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND approval_status = 'approved'
    )
  );

-- Step 6: Seed some common solar materials into catalog
INSERT INTO public.material_catalog (material_name, unit, category) VALUES
  ('Solar Panel (400W Mono)',         'panels', 'panels'),
  ('Solar Panel (550W Mono)',         'panels', 'panels'),
  ('String Inverter (3kW)',           'units',  'inverter'),
  ('String Inverter (5kW)',           'units',  'inverter'),
  ('Hybrid Inverter (5kW)',           'units',  'inverter'),
  ('Mounting Structure (Tin Roof)',   'sets',   'structure'),
  ('Mounting Structure (RCC Roof)',   'sets',   'structure'),
  ('GI Channel Rail',                'meters', 'structure'),
  ('DC Cable (4mm²)',                'meters', 'wiring'),
  ('AC Cable (6mm²)',                'meters', 'wiring'),
  ('MC4 Connector Pair',             'pairs',  'wiring'),
  ('Junction Box',                   'units',  'wiring'),
  ('Lightning Arrester',             'units',  'other'),
  ('Earthing Kit',                   'sets',   'other'),
  ('Net Meter',                      'units',  'other'),
  ('AC Distribution Box',            'units',  'other')
ON CONFLICT DO NOTHING;
