-- ============================================================
-- Create Service Request Management Tables
-- Date: April 17, 2026
-- ============================================================

-- ============================================================
-- Step 1: Create customer_service_requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer_service_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id     UUID,
  issue_title     TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  severity        TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to     UUID,
  resolution_notes TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  warranty_related BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 2: Create service_request_history table for audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_request_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.customer_service_requests(id) ON DELETE CASCADE,
  status_before     TEXT,
  status_after      TEXT,
  changed_by        UUID,
  change_reason     TEXT,
  changed_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 3: Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_service_requests_project_id ON public.customer_service_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON public.customer_service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.customer_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.customer_service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_history_request_id ON public.service_request_history(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_request_history_changed_at ON public.service_request_history(changed_at DESC);

-- ============================================================
-- Step 4: Enable RLS on both tables
-- ============================================================
ALTER TABLE public.customer_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 5: Create RLS Policies for team-based access
-- ============================================================

-- Service Requests: Allow authenticated users to view/modify all requests
DROP POLICY IF EXISTS "service_requests_auth" ON public.customer_service_requests;
CREATE POLICY "service_requests_auth"
  ON public.customer_service_requests FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Service Request History: Allow authenticated users to view/insert history
DROP POLICY IF EXISTS "service_request_history_auth" ON public.service_request_history;
CREATE POLICY "service_request_history_auth"
  ON public.service_request_history FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Success! Service Request tables created
-- ============================================================
SELECT 'Service Request tables created successfully!' as status;
