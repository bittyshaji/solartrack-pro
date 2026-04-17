# PHASE 2 IMPLEMENTATION PLAN - SOLARTRACK PRO

## Executive Summary

Phase 2 adds 5 critical features across **5 sub-phases over 14 weeks** (or 6 weeks for MVP):

1. **Phase 2A**: Advanced Search & Filtering (10 days) - HIGH PRIORITY
2. **Phase 2B**: Email & Notifications (11 days) - CRITICAL
3. **Phase 2C**: Enhanced Analytics (15 days) - VALUABLE
4. **Phase 2D**: Customer Portal (13 days) - STRATEGIC
5. **Phase 2E**: Batch Operations (11 days) - OPTIONAL

**Estimated Total**: 60 days for full Phase 2 | 42 days for MVP (2A+2B+2C)

---

## 1. ARCHITECTURE OVERVIEW

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages (new): Analytics Dashboard, Customer Portal Enhanced     │
│  Components (new): Analytics widgets, Email templates, Filters  │
│  Hooks (new): useSearch, useFilter, useAnalytics               │
└────────────┬──────────────────────────────────────────────────┬─┘
             │                                              │
  ┌──────────▼────────────┐                  ┌────────────▼──────────┐
  │   Service Layer (New) │                  │  Service Layer (Ext)  │
  ├──────────────────────┤                  ├──────────────────────┤
  │ searchService.js      │                  │ projectService.js     │
  │ filterService.js      │                  │ invoiceService.js     │
  │ analyticsService.js   │                  │ customerService.js    │
  │ emailService.js       │                  │ reportQueries.js      │
  │ notificationService.js│                  └──────────────────────┘
  └──────────┬────────────┘
             │
  ┌──────────▼──────────────────────────────────────────────┐
  │     Supabase Backend (PostgreSQL + Auth)                │
  ├───────────────────────────────────────────────────────────┤
  │ New Tables: search_logs, saved_filters,                 │
  │ email_notifications, analytics_cache,                   │
  │ batch_operations, customer_portal_access                │
  └──────────────────────────────────────────────────────────┘
    
  ┌───────────────────────────────────────────────────────────┐
  │     External Services (Phase 2)                           │
  ├───────────────────────────────────────────────────────────┤
  │ • Resend.dev (email service) - Recommended               │
  │ • Alternative: SendGrid API                              │
  └───────────────────────────────────────────────────────────┘
```

---

## 2. FEATURE PRIORITIZATION

### PHASE 2A: Advanced Search & Filtering (Weeks 1-3)
**Why First**: Improves usability, minimal dependencies, quick ROI

| Feature | Effort | Dependencies | Impact |
|---------|--------|--------------|--------|
| Full-text Search | 3d | PostgreSQL | High |
| Multi-field Filtering | 3d | Search Service | High |
| Saved Filters | 2d | Filter Service + DB | High |
| Search History | 2d | Search Logs | Medium |
| **Subtotal** | **10d** | **Low** | **High** |

### PHASE 2B: Email & Notifications (Weeks 4-6)
**Why Second**: Foundation for customer communication, enables Phase 2D

| Feature | Effort | Dependencies | Impact |
|---------|--------|--------------|--------|
| Email Service Integration | 2d | Resend API | Critical |
| Notification Queue | 2d | Email Service | Critical |
| Invoice Email Delivery | 2d | Email Service | High |
| Task Reminders | 2d | Email Service | High |
| Status Update Emails | 2d | Email Service | Medium |
| Email Logs | 1d | DB tables | Medium |
| **Subtotal** | **11d** | **External API** | **Critical** |

### PHASE 2C: Advanced Analytics (Weeks 7-9)
**Why Third**: Builds on Phase 2A filtering, leverages reports

| Feature | Effort | Dependencies | Impact |
|---------|--------|--------------|--------|
| Advanced Dashboard | 3d | Analytics Service | High |
| Revenue Tracking | 3d | Invoice Data | High |
| Customer Insights | 2d | Customer Data | Medium |
| Interactive Charts | 3d | Recharts | High |
| Performance Metrics | 2d | Aggregation | Medium |
| Export Reports | 2d | XLSX Service | Medium |
| **Subtotal** | **15d** | **Minimal** | **High** |

### PHASE 2D: Enhanced Customer Portal (Weeks 10-12)
**Why Fourth**: Leverages email, improves satisfaction

| Feature | Effort | Dependencies | Impact |
|---------|--------|--------------|--------|
| Public Portal Access | 3d | Auth redesign | High |
| Customer Accounts | 2d | Supabase Auth | High |
| Document Access | 2d | PDF downloads | Medium |
| Real-time Updates | 2d | WebSocket/polling | Medium |
| Communication Log | 2d | Notification DB | Medium |
| Feedback Forms | 2d | New DB table | Low |
| **Subtotal** | **13d** | **Auth + WebSocket** | **High** |

### PHASE 2E: Batch Operations (Weeks 13-14)
**Why Last**: Nice-to-have, lower impact initially

| Feature | Effort | Dependencies | Impact |
|---------|--------|--------------|--------|
| CSV Import | 3d | XLSX parsing | Medium |
| Bulk Project Creation | 2d | CSV Import | Medium |
| Batch Invoicing | 2d | Invoice Service | Medium |
| Bulk Export | 2d | XLSX Service | Medium |
| Error Reporting | 2d | Validation | Low |
| **Subtotal** | **11d** | **XLSX Service** | **Medium** |

---

## 3. DATABASE SCHEMA CHANGES

### New Tables (6 tables)

#### Table 1: search_logs
```sql
CREATE TABLE search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  search_type VARCHAR(50),
  result_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  search_vector TSVECTOR GENERATED ALWAYS AS 
    (to_tsvector('english', search_term)) STORED
);

CREATE INDEX idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_vector ON search_logs USING GIN(search_vector);

ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own search logs" ON search_logs
  FOR SELECT USING (user_id = auth.uid());
```

#### Table 2: saved_filters
```sql
CREATE TABLE saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_name VARCHAR(255) NOT NULL,
  filter_type VARCHAR(50) NOT NULL,
  filter_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, filter_name, filter_type)
);

CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_type ON saved_filters(filter_type);

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own filters" ON saved_filters
  FOR ALL USING (user_id = auth.uid());
```

#### Table 3: email_notifications
```sql
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  email_type VARCHAR(100) NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT,
  body_html TEXT,
  
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES project_invoices(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  status VARCHAR(50) DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_recipient ON email_notifications(recipient_email);
CREATE INDEX idx_email_notifications_project ON email_notifications(project_id);
CREATE INDEX idx_email_notifications_scheduled ON email_notifications(scheduled_at)
  WHERE status = 'pending';

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all emails" ON email_notifications
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

#### Table 4: analytics_cache
```sql
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  metric_period VARCHAR(50),
  period_start DATE,
  period_end DATE,
  metric_value NUMERIC(12, 2),
  metric_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_analytics_cache_metric ON analytics_cache(metric_type, period_start DESC);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
```

#### Table 5: batch_operations
```sql
CREATE TABLE batch_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'processing',
  
  total_records INT,
  processed_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  
  source_file_name VARCHAR(255),
  source_file_size INT,
  
  result_file_url TEXT,
  error_log JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_batch_operations_user ON batch_operations(user_id);
CREATE INDEX idx_batch_operations_status ON batch_operations(status);
CREATE INDEX idx_batch_operations_created ON batch_operations(created_at DESC);

ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own batch operations" ON batch_operations
  FOR SELECT USING (user_id = auth.uid());
```

#### Table 6: customer_portal_access
```sql
CREATE TABLE customer_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES project_customers(customer_id),
  
  access_token VARCHAR(500),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_password_reset_at TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_customer_portal_email ON customer_portal_access(customer_email);
CREATE UNIQUE INDEX idx_customer_portal_token ON customer_portal_access(access_token);

ALTER TABLE customer_portal_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers access own portal" ON customer_portal_access
  FOR SELECT USING (customer_email = current_user_email());
```

### Modified Tables

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_id_ref UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_searchable BOOLEAN DEFAULT TRUE;

ALTER TABLE project_customers ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE project_customers ADD COLUMN IF NOT EXISTS contact_preferences JSONB 
  DEFAULT '{"email_updates": true, "sms_notifications": false}';

ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS email_notification_id UUID;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS send_reminder BOOLEAN DEFAULT FALSE;
```

---

## 4. NEW SERVICES (6 services)

### 1. searchService.js (350 lines)
```javascript
Functions:
- performFullTextSearch(searchTerm, type)
- getSearchHistory(userId, limit=10)
- saveSearch(userId, searchTerm, searchType)
- clearSearchHistory(userId)
- getAutocompleteSuggestions(partial, type)

Features:
- PostgreSQL Full-Text Search (TSVECTOR)
- Search history tracking
- Autocomplete from previous searches
```

### 2. filterService.js (400 lines)
```javascript
Functions:
- createSavedFilter(userId, filterName, filterType, filterConfig)
- getSavedFilters(userId, filterType)
- updateSavedFilter(filterId, filterConfig)
- deleteSavedFilter(filterId)
- applyFilter(data, filterConfig)
- validateFilterConfig(filterConfig)

Features:
- Dynamic filter object building
- Multi-filter application
- Filter templates
```

### 3. analyticsService.js (600 lines)
```javascript
Functions:
- getRevenueMetrics(startDate, endDate, groupBy='monthly')
- getProjectMetrics(filters)
- getCustomerInsights(customerId)
- getConversionRates(period)
- getTeamPerformance()
- cacheAnalyticsMetrics(cacheKey, data, ttl)
- invalidateAnalyticsCache(pattern)

Features:
- Multi-table aggregation
- Pre-computed metrics with caching
- Time-based comparisons
- Customer Lifetime Value (LTV) calculations
```

### 4. emailService.js (550 lines)
```javascript
Functions:
- sendEmail(to, subject, htmlBody, emailType)
- scheduleEmailNotification(email, delayMs)
- getEmailTemplate(emailType)
- queueInvoiceEmail(invoiceId, recipientEmail)
- queueTaskReminder(taskId, recipientEmails)
- queueStatusUpdate(projectId, customerEmails)
- getEmailLogs(projectId, limit=50)
- resendFailedEmails()

Features:
- Queue-based sending with retry logic
- Resend.dev API integration
- Template management
- Logging and audit trail
```

### 5. notificationService.js (300 lines)
```javascript
Functions:
- createNotification(type, data, recipientId)
- queueNotification(email_notification_obj)
- getNotificationQueue()
- markNotificationSent(notificationId)
- markNotificationFailed(notificationId, error)
- cleanupOldNotifications(olderThanDays=90)

Features:
- In-app notification management
- Email queue integration
- Status tracking
- Auto-cleanup
```

### 6. batchOperationsService.js (500 lines)
```javascript
Functions:
- parseCSVFile(file)
- validateProjectImport(records)
- createBatchOperation(userId, operationType, totalRecords)
- importProjects(userId, csvData)
- importCustomers(userId, csvData)
- batchCreateInvoices(projectIds, parameters)
- exportProjects(filters)
- getBatchOperationStatus(batchId)

Features:
- CSV/XLSX parsing with validation
- Progress tracking
- Error handling and reporting
- Bulk export with formatting
```

---

## 5. NEW PAGES & COMPONENTS

### New Pages (5 pages)
1. **AdvancedAnalyticsDashboard.jsx** - Enhanced metrics with charts
2. **SearchPage.jsx** - Global search interface
3. **FilterManagerPage.jsx** - Manage saved filters
4. **BatchOperationsPage.jsx** - CSV import/export
5. **PublicCustomerPortalPage.jsx** - Public customer dashboard

### New Components (18 components)

**Analytics** (7):
- AdvancedMetricsCard
- RevenueChart
- ProjectCompletionFunnel
- CustomerLifetimeValue
- PipelineForecasting
- MetricComparison
- DateRangeSelector

**Search & Filter** (5):
- GlobalSearchBar
- AdvancedFilterPanel
- SavedFiltersList
- SearchResultsCard
- SearchSuggestions

**Email & Notifications** (3):
- EmailTemplateBuilder
- NotificationQueue
- EmailLog

**Batch Operations** (2):
- CSVImportWizard
- ImportPreview
- BatchOperationStatus

**Customer Portal** (3):
- PublicProjectStatus
- PublicDocumentAccess
- PublicPhotoGallery

---

## 6. TECHNICAL DECISIONS

### Email Service: Resend.dev (Recommended)
**Why**: Modern API, free tier (100 emails/day), developer-friendly

**Alternative**: SendGrid (more scalable, enterprise features, higher cost)

### Analytics Approach
- Server-side aggregation in analyticsService
- Client-side caching with React Context
- Pre-computed metrics in analytics_cache table

### Search Implementation
- PostgreSQL Full-Text Search (native, no extra cost)
- TSVECTOR index for performance
- Autocomplete from search history

### Customer Portal Auth
- Token-based authentication (no passwords)
- Unique long-random tokens
- Email-based magic links

---

## 7. IMPLEMENTATION TIMELINE

### PHASE 2A: Search & Filtering (Weeks 1-3, 10 days)
**Week 1**: Database setup, searchService, filterService
**Week 2**: GlobalSearchBar, AdvancedFilterPanel, SearchPage
**Week 3**: SavedFiltersList, performance testing

### PHASE 2B: Email & Notifications (Weeks 4-6, 11 days)
**Week 4**: Resend setup, email_notifications table, emailService
**Week 5**: Integrate with invoices, tasks, projects
**Week 6**: Background jobs, retry logic, EmailLog UI

### PHASE 2C: Advanced Analytics (Weeks 7-9, 15 days)
**Week 7**: analytics_cache table, analyticsService, metrics
**Week 8**: Dashboard components, RevenueChart, Funnels
**Week 9**: DateRangeSelector, drill-down, export functionality

### PHASE 2D: Customer Portal (Weeks 10-12, 13 days)
**Week 10**: Token auth, customer_portal_access table
**Week 11**: Portal components, PublicProjectStatus
**Week 12**: Integration with email, real-time updates

### PHASE 2E: Batch Operations (Weeks 13-14, 11 days)
**Week 13**: CSV parsing, validation, batchOperationsService
**Week 14**: Wizard UI, progress tracking, error reporting

---

## 8. PARALLEL WORK OPPORTUNITIES

```
Can compress from 14 weeks to 10 weeks:

Week 1-3:   Phase 2A (Search & Filtering)
            └─ Week 2: Start Phase 2B setup
            
Week 4-6:   Phase 2B (Email & Notifications)
            └─ Week 4-5: Start Phase 2C design
            
Week 7-9:   Phase 2C (Analytics)
            ├─ Week 8: Start Phase 2D setup
            └─ Can run parallel with Phase 2B
            
Week 10-12: Phase 2D (Customer Portal)
            └─ Can overlap with Phase 2C final week
            
Week 13-14: Phase 2E (Batch Operations) [Optional]
```

---

## 9. MINIMUM VIABLE PHASE 2 (6 weeks)

If time-constrained, prioritize:

1. **Weeks 1-2**: Phase 2A (Search & Filtering)
2. **Weeks 3-4**: Phase 2B (Emails: invoices + reminders only)
3. **Weeks 5-6**: Phase 2C (Basic Analytics: 3-4 key charts)

**Skip**: Customer Portal (2D) and Batch Operations (2E) → Phase 2.5

---

## 10. RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Email quota exceeded | Low | Medium | Rate limiting, SendGrid backup |
| Search performance degrades | Low | Medium | Index optimization, denormalization |
| Email deliverability issues | Medium | High | SPF/DKIM setup, domain auth |
| Customer portal token exposure | Low | High | HTTPS, rate limiting, long tokens |
| Analytics queries timeout | Medium | Medium | Caching, materialized views |
| CSV import data issues | Medium | Medium | Strict validation, dry-run preview |
| Email overload spike | Low | Medium | Queue system, rate limiting |

---

## 11. SUCCESS CRITERIA

Phase 2 is complete when:
- ✅ All 5 sub-phases delivered per timeline
- ✅ All features tested with real data
- ✅ Email service configured and working
- ✅ Analytics dashboard generating insights
- ✅ Search performing well (< 500ms)
- ✅ Customer portal accessible
- ✅ Error handling implemented
- ✅ Documentation complete

---

## NEXT STEPS

1. **Confirm** which features to prioritize (full Phase 2 vs. MVP)
2. **Set up** Resend.dev account for email service
3. **Create** SQL migrations for new tables
4. **Begin** Phase 2A (Search & Filtering)
5. **Establish** weekly review checkpoints

---

**Ready to begin Phase 2A? Let's build the foundation with Advanced Search & Filtering! 🚀**
