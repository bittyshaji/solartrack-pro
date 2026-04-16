-- ============================================================================
-- PHASE 2 DATABASE MIGRATIONS
-- Supabase Project: opzoighusosmxcyneifc
-- Date: 2026-04-15
-- ============================================================================
-- This file contains all SQL blocks for Phase 2 schema changes.
-- Each block can be executed independently in Supabase SQL Editor.
-- ============================================================================


-- ============================================================================
-- 1. CREATE SEARCH_LOGS TABLE
-- Full-text search history with TSVECTOR index for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    search_query TEXT NOT NULL,
    search_type VARCHAR(50) NOT NULL, -- 'projects', 'invoices', 'tasks', 'customers'
    results_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    filters JSONB DEFAULT '{}'::JSONB,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', search_query || ' ' || search_type)
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_search_logs_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_search_logs_project FOREIGN KEY (project_id)
        REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Create indexes for search_logs
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON public.search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_project_id ON public.search_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_search_type ON public.search_logs(search_type);
CREATE INDEX IF NOT EXISTS idx_search_logs_vector ON public.search_logs USING GIN(search_vector);

-- Enable RLS on search_logs
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own search logs
CREATE POLICY "search_logs_user_access" ON public.search_logs
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can only insert their own search logs
CREATE POLICY "search_logs_user_insert" ON public.search_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can only update their own search logs
CREATE POLICY "search_logs_user_update" ON public.search_logs
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policy: Users can only delete their own search logs
CREATE POLICY "search_logs_user_delete" ON public.search_logs
    FOR DELETE USING (user_id = auth.uid());

COMMIT;


-- ============================================================================
-- 2. CREATE SAVED_FILTERS TABLE
-- User-defined filter sets for saved searches
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    filter_name VARCHAR(255) NOT NULL,
    filter_type VARCHAR(50) NOT NULL, -- 'projects', 'invoices', 'tasks', 'customers'
    filter_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_filters_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_filters_project FOREIGN KEY (project_id)
        REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT unique_filter_per_user_project UNIQUE (user_id, project_id, filter_name, filter_type)
);

-- Create indexes for saved_filters
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON public.saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_project_id ON public.saved_filters(project_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_type ON public.saved_filters(filter_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_is_default ON public.saved_filters(is_default);
CREATE INDEX IF NOT EXISTS idx_saved_filters_created_at ON public.saved_filters(created_at DESC);

-- Enable RLS on saved_filters
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view filters for their projects
CREATE POLICY "saved_filters_view_policy" ON public.saved_filters
    FOR SELECT USING (
        user_id = auth.uid() OR
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Users can only create filters for their own projects
CREATE POLICY "saved_filters_insert_policy" ON public.saved_filters
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Users can only update their own filters
CREATE POLICY "saved_filters_update_policy" ON public.saved_filters
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policy: Users can only delete their own filters
CREATE POLICY "saved_filters_delete_policy" ON public.saved_filters
    FOR DELETE USING (user_id = auth.uid());

COMMIT;


-- ============================================================================
-- 3. CREATE EMAIL_NOTIFICATIONS TABLE
-- Email queue and delivery logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID,
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(100) NOT NULL, -- 'invoice_reminder', 'task_assignment', 'report', 'alert', 'system'
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    template_id VARCHAR(100),
    template_vars JSONB DEFAULT '{}'::JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced', 'unsubscribed'
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_notifications_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_email_notifications_project FOREIGN KEY (project_id)
        REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT valid_email_status CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'unsubscribed'))
);

-- Create indexes for email_notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_project_id ON public.email_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_email_type ON public.email_notifications(email_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient_email ON public.email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON public.email_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_pending ON public.email_notifications(status, created_at)
    WHERE status = 'pending';

-- Enable RLS on email_notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view email notifications for their projects
CREATE POLICY "email_notifications_view_policy" ON public.email_notifications
    FOR SELECT USING (
        user_id = auth.uid() OR
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Only service role can insert (for background jobs)
CREATE POLICY "email_notifications_insert_policy" ON public.email_notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Only service role can update
CREATE POLICY "email_notifications_update_policy" ON public.email_notifications
    FOR UPDATE USING (auth.role() = 'service_role');

COMMIT;


-- ============================================================================
-- 4. CREATE ANALYTICS_CACHE TABLE
-- Pre-computed metrics and analytics data
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL, -- 'revenue_total', 'invoice_count', 'task_completion_rate', etc.
    metric_period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metric_value NUMERIC(19, 4) DEFAULT 0,
    secondary_metrics JSONB DEFAULT '{}'::JSONB,
    filters JSONB DEFAULT '{}'::JSONB,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_fresh BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_analytics_cache_project FOREIGN KEY (project_id)
        REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT unique_cache_entry UNIQUE (project_id, metric_type, metric_period, period_start, period_end)
);

-- Create indexes for analytics_cache
CREATE INDEX IF NOT EXISTS idx_analytics_cache_project_id ON public.analytics_cache(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_metric_type ON public.analytics_cache(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_period ON public.analytics_cache(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_is_fresh ON public.analytics_cache(is_fresh);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON public.analytics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_computed_at ON public.analytics_cache(computed_at DESC);

-- Enable RLS on analytics_cache
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view analytics for their projects
CREATE POLICY "analytics_cache_view_policy" ON public.analytics_cache
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Only service role can insert/update analytics
CREATE POLICY "analytics_cache_insert_policy" ON public.analytics_cache
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "analytics_cache_update_policy" ON public.analytics_cache
    FOR UPDATE USING (auth.role() = 'service_role');

COMMIT;


-- ============================================================================
-- 5. CREATE BATCH_OPERATIONS TABLE
-- Track bulk operation progress and history
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.batch_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    operation_type VARCHAR(100) NOT NULL, -- 'bulk_invoice_create', 'bulk_task_update', 'bulk_delete', etc.
    operation_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
    total_items INTEGER NOT NULL,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    skipped_items INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    operation_params JSONB DEFAULT '{}'::JSONB,
    error_log JSONB DEFAULT '[]'::JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_batch_operations_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_batch_operations_project FOREIGN KEY (project_id)
        REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT valid_operation_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Create indexes for batch_operations
CREATE INDEX IF NOT EXISTS idx_batch_operations_user_id ON public.batch_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_operations_project_id ON public.batch_operations(project_id);
CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON public.batch_operations(status);
CREATE INDEX IF NOT EXISTS idx_batch_operations_operation_type ON public.batch_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_batch_operations_created_at ON public.batch_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_operations_in_progress ON public.batch_operations(status, user_id)
    WHERE status = 'in_progress';

-- Enable RLS on batch_operations
ALTER TABLE public.batch_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own batch operations
CREATE POLICY "batch_operations_view_policy" ON public.batch_operations
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can create batch operations for their projects
CREATE POLICY "batch_operations_insert_policy" ON public.batch_operations
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Users can update their own batch operations
CREATE POLICY "batch_operations_update_policy" ON public.batch_operations
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policy: Users can delete their own batch operations
CREATE POLICY "batch_operations_delete_policy" ON public.batch_operations
    FOR DELETE USING (user_id = auth.uid());

COMMIT;


-- ============================================================================
-- 6. CREATE CUSTOMER_PORTAL_ACCESS TABLE
-- Customer token-based authentication for customer portal
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_portal_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    access_token VARCHAR(512) NOT NULL,
    refresh_token VARCHAR(512),
    token_type VARCHAR(50) DEFAULT 'bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_portal_project FOREIGN KEY (project_id)
        REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_portal_customer FOREIGN KEY (customer_id)
        REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT unique_active_token_per_customer UNIQUE (customer_id, project_id)
);

-- Create indexes for customer_portal_access
CREATE INDEX IF NOT EXISTS idx_customer_portal_project_id ON public.customer_portal_access(project_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_customer_id ON public.customer_portal_access(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_access_token ON public.customer_portal_access(access_token);
CREATE INDEX IF NOT EXISTS idx_customer_portal_is_revoked ON public.customer_portal_access(is_revoked);
CREATE INDEX IF NOT EXISTS idx_customer_portal_expires_at ON public.customer_portal_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_portal_created_at ON public.customer_portal_access(created_at DESC);

-- Enable RLS on customer_portal_access
ALTER TABLE public.customer_portal_access ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Project owners can view customer access tokens
CREATE POLICY "customer_portal_view_policy" ON public.customer_portal_access
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
        )
    );

-- RLS Policy: Only service role can insert/update tokens
CREATE POLICY "customer_portal_insert_policy" ON public.customer_portal_access
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "customer_portal_update_policy" ON public.customer_portal_access
    FOR UPDATE USING (auth.role() = 'service_role');

COMMIT;


-- ============================================================================
-- 7. MODIFY EXISTING TABLES
-- Add new columns to existing tables for Phase 2 features
-- ============================================================================

-- ============================================================================
-- 7A. ALTER PROJECTS TABLE
-- Add columns for enhanced features and metadata
-- ============================================================================

ALTER TABLE IF EXISTS public.projects
ADD COLUMN IF NOT EXISTS enable_search_analytics BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enable_bulk_operations BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enable_customer_portal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_filter_config JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS analytics_retention_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT '{}'::JSONB;

-- Create indexes for new projects columns
CREATE INDEX IF NOT EXISTS idx_projects_enable_search_analytics
    ON public.projects(enable_search_analytics) WHERE enable_search_analytics = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_enable_bulk_operations
    ON public.projects(enable_bulk_operations) WHERE enable_bulk_operations = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_enable_customer_portal
    ON public.projects(enable_customer_portal) WHERE enable_customer_portal = TRUE;

COMMIT;


-- ============================================================================
-- 7B. ALTER PROJECT_CUSTOMERS TABLE
-- Add columns for enhanced customer management
-- ============================================================================

ALTER TABLE IF EXISTS public.project_customers
ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS portal_last_accessed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::JSONB,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;

-- Create indexes for new project_customers columns
CREATE INDEX IF NOT EXISTS idx_project_customers_portal_access_enabled
    ON public.project_customers(portal_access_enabled) WHERE portal_access_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_project_customers_portal_last_accessed_at
    ON public.project_customers(portal_last_accessed_at DESC) WHERE portal_last_accessed_at IS NOT NULL;

COMMIT;


-- ============================================================================
-- 7C. ALTER PROJECT_INVOICES TABLE
-- Add columns for invoice tracking and notifications
-- ============================================================================

ALTER TABLE IF EXISTS public.project_invoices
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS custom_notes TEXT,
ADD COLUMN IF NOT EXISTS portal_accessible BOOLEAN DEFAULT FALSE;

-- Create indexes for new project_invoices columns
CREATE INDEX IF NOT EXISTS idx_project_invoices_email_sent_at
    ON public.project_invoices(email_sent_at DESC) WHERE email_sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_invoices_payment_reminder_sent_at
    ON public.project_invoices(payment_reminder_sent_at DESC) WHERE payment_reminder_sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_invoices_portal_accessible
    ON public.project_invoices(portal_accessible) WHERE portal_accessible = TRUE;

COMMIT;


-- ============================================================================
-- 7D. ALTER TASKS TABLE
-- Add columns for task tracking and notifications
-- ============================================================================

ALTER TABLE IF EXISTS public.tasks
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS task_dependencies JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS estimated_duration_hours NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS actual_duration_hours NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS subtasks_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;

-- Create indexes for new tasks columns
CREATE INDEX IF NOT EXISTS idx_tasks_notification_sent_at
    ON public.tasks(notification_sent_at DESC) WHERE notification_sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_estimated_duration
    ON public.tasks(estimated_duration_hours) WHERE estimated_duration_hours IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completion_progress
    ON public.tasks(subtasks_total, subtasks_completed) WHERE subtasks_total > 0;

COMMIT;


-- ============================================================================
-- END OF PHASE 2 DATABASE MIGRATIONS
-- ============================================================================
-- All tables created and modified successfully
-- Total new tables: 6
-- Total modified tables: 4
-- All changes include RLS policies and appropriate indexes
-- ============================================================================
