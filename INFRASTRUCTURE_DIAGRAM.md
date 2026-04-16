# Email Service Infrastructure Diagram

---

## 1. OVERALL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              BROWSER / WEB APPLICATION                          │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ • InvoiceEmailButton Component                          │   │   │
│  │  │ • TaskReminderEmailButton Component                     │   │   │
│  │  │ • EmailLog Component (Admin)                            │   │   │
│  │  │ • EmailPreferences Component                            │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                          ↓                                      │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              EMAIL SERVICE CLIENT                       │   │   │
│  │  │ • sendInvoiceEmail()                                    │   │   │
│  │  │ • sendTaskReminder()                                    │   │   │
│  │  │ • queueEmailNotification()                              │   │   │
│  │  │ • getEmailLogs()                                        │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  HTTPS / TLS Encrypted                                                   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   VITE REACT APPLICATION                        │   │
│  │  (Node.js/Express server in production or static hosting)       │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ Router                                                    │  │   │
│  │  │  ├─ /invoices                                            │  │   │
│  │  │  ├─ /tasks                                               │  │   │
│  │  │  ├─ /admin/email-logs                                    │  │   │
│  │  │  ├─ /api/email/send                                      │  │   │
│  │  │  ├─ /api/email/logs                                      │  │   │
│  │  │  └─ /api/health                                          │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          ↓                    ↓                         │
│                   Authentication         API Requests                   │
│                    (Supabase Auth)           (REST)                     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                    ↓                                      ↓
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│    SUPABASE (Database)           │    │   RESEND.DEV (Email Service)     │
├──────────────────────────────────┤    ├──────────────────────────────────┤
│                                  │    │                                  │
│ ┌──────────────────────────────┐ │    │ ┌──────────────────────────────┐ │
│ │  PostgreSQL Database         │ │    │ │  REST API (https://api.      │ │
│ │                              │ │    │ │   resend.com/emails)         │ │
│ │ Tables:                      │ │    │ │                              │ │
│ │ • email_notifications        │ │    │ │ • Email Sending             │ │
│ │ • users (auth.users)         │ │    │ │ • SMTP Integration          │ │
│ │ • projects                   │ │    │ │ • Webhook Delivery          │ │
│ │ • project_invoices           │ │    │ │ • Rate Limiting             │ │
│ │ • stage_tasks                │ │    │ │                              │ │
│ │                              │ │    │ │ Status: noreply@solartrack │ │
│ │ Indexes:                     │ │    │ │ Rate: 100/day (free)        │ │
│ │ • idx_status                 │ │    │ │ Plan: Production            │ │
│ │ • idx_recipient              │ │    │ │                              │ │
│ │ • idx_user_id                │ │    │ └──────────────────────────────┘ │
│ │ • idx_created_at             │ │    │                                  │
│ │                              │ │    │ API Key: re_******* (stored in   │
│ │ Policies (RLS):              │ │    │           .env.production)       │
│ │ • Users see own records      │ │    │                                  │
│ │ • Read/Write authenticated   │ │    └──────────────────────────────────┘
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│ Configuration:                   │
│ • Connection pooling: pgbouncer  │
│ • SSL/TLS: Required              │
│ • Backups: Automatic daily       │
│ • RLS: Enabled                   │
│                                  │
└──────────────────────────────────┘
```

---

## 2. EMAIL FLOW DIAGRAM

```
USER ACTION (Frontend)
    ↓
    ├─ Click "Send Invoice Email" button
    │  InvoiceEmailButton.jsx
    │
    └─ Click "Send Task Reminder" button
       TaskReminderEmailButton.jsx

    ↓

SEND REQUEST
    ↓
    sendInvoiceEmail(invoiceId, customerEmail)
    or
    sendTaskReminder(taskId, recipientEmails)

    ↓

QUEUE EMAIL (src/lib/emailService.js)
    ├─ Validate inputs
    ├─ Get email template
    ├─ Replace template variables
    ├─ Insert into email_notifications table
    │  Status: 'pending'
    │  Retry count: 0
    │
    └─ Return queueing confirmation

    ↓

USER SEES TOAST NOTIFICATION
    "Email queued successfully"

    ↓

BACKGROUND PROCESSING
    ├─ Watch for pending emails
    ├─ For each pending email:
    │  ├─ Call Resend API
    │  │  POST https://api.resend.com/emails
    │  │  Headers: Authorization: Bearer {RESEND_API_KEY}
    │  │  Body: {
    │  │    from: "noreply@solartrack.com",
    │  │    to: "customer@example.com",
    │  │    subject: "Invoice #123",
    │  │    html: "<html>...</html>"
    │  │  }
    │  │
    │  └─ Resend responds: {id: "msg_xxxxx"}
    │
    ├─ Update email_notifications table
    │  Status: 'sent'
    │  Message ID: msg_xxxxx
    │  Sent at: NOW()
    │
    └─ Log success in admin panel

    ↓

RESEND SENDS EMAIL
    ├─ Validates sender domain (noreply@solartrack.com)
    ├─ Connects to recipient's mail server
    ├─ Delivers email
    ├─ Optionally sends webhook (if configured)
    │  POST /webhooks/resend
    │  Body: {type: "email.sent", data: {...}}
    │
    └─ Customer receives email in inbox

    ↓

ERROR HANDLING
    ├─ If send fails:
    │  ├─ Update status: 'pending' (retry)
    │  ├─ Increment retry_count
    │  ├─ Schedule retry in 1 hour (RETRY_DELAY_MS)
    │  ├─ Log error to email_notifications.error_message
    │  │
    │  └─ If retry_count >= MAX_RETRIES:
    │     ├─ Update status: 'failed'
    │     └─ Admin notified via alert
    │
    └─ If Resend API down:
       ├─ Immediate retry in 30 seconds
       ├─ Exponential backoff: 30s → 1m → 5m → 30m
       └─ Alert critical if down > 5 minutes

```

---

## 3. DATABASE SCHEMA

```
email_notifications TABLE
┌─────────────────────────────────────────────────────────────┐
│ id (UUID) - Primary Key                                     │
│ user_id (UUID) - Foreign Key (auth.users.id)               │
│ project_id (UUID) - Foreign Key (projects.id)              │
│ recipient_email (TEXT) - Email address                      │
│ email_type (TEXT) - invoice|reminder|status_update|welcome │
│ subject (TEXT) - Email subject                              │
│ body (TEXT) - Email HTML body                               │
│ template_vars (JSONB) - Template variables                 │
│ status (TEXT) - pending|sent|failed|bounced                │
│ message_id (TEXT) - Resend message ID                       │
│ error_message (TEXT) - Error details if failed             │
│ retry_count (INTEGER) - Number of retry attempts           │
│ scheduled_at (TIMESTAMP) - Scheduled send time             │
│ sent_at (TIMESTAMP) - When email was sent                  │
│ failed_at (TIMESTAMP) - When email failed                  │
│ created_at (TIMESTAMP) - Record creation time              │
│ updated_at (TIMESTAMP) - Last update time                  │
│ metadata (JSONB) - Additional data                          │
└─────────────────────────────────────────────────────────────┘

INDEXES
├─ PRIMARY KEY: id
├─ idx_user_id: (user_id)
├─ idx_project_id: (project_id)
├─ idx_status: (status)
├─ idx_recipient: (recipient_email)
├─ idx_created_at: (created_at DESC)
└─ idx_scheduled_at: (scheduled_at)

ROW LEVEL SECURITY (RLS)
├─ SELECT: auth.uid() = user_id
├─ INSERT: auth.uid() = user_id
└─ UPDATE: auth.uid() = user_id
```

---

## 4. DEPLOYMENT ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    CDN (CloudFlare)                          │ │
│  │  • Cache static assets (js, css, images)                     │ │
│  │  • DDoS protection                                           │ │
│  │  • SSL/TLS certificate                                       │ │
│  │  • Global edge network                                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              LOAD BALANCER / REVERSE PROXY                   │ │
│  │  • NGINX or HAProxy                                          │ │
│  │  • SSL/TLS termination                                       │ │
│  │  • Request routing                                           │ │
│  │  • Health checks                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│         ↙                      ↓                      ↘              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐  │
│  │   APP POD 1 │         │   APP POD 2 │         │   APP POD 3 │  │
│  │ (Node.js/   │         │ (Node.js/   │         │ (Node.js/   │  │
│  │  Express)   │         │  Express)   │         │  Express)   │  │
│  │             │         │             │         │             │  │
│  │ • Serve web │         │ • Serve web │         │ • Serve web │  │
│  │   assets    │         │   assets    │         │   assets    │  │
│  │ • Auth      │         │ • Auth      │         │ • Auth      │  │
│  │ • API proxy │         │ • API proxy │         │ • API proxy │  │
│  │             │         │             │         │             │  │
│  └─────────────┘         └─────────────┘         └─────────────┘  │
│         ↓                      ↓                      ↓              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │        KUBERNETES CLUSTER (Optional scaling)                 │  │
│  │  • Auto-scaling: 1-10 pods                                   │  │
│  │  • Rolling updates: 0 downtime                               │  │
│  │  • Health checks: HTTP /health                               │  │
│  │  • Resource limits: CPU, Memory                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         ↙            ↓            ↓            ↘                     │
│  SUPABASE            RESEND.DEV            MONITORING              │
│  PostgreSQL          Email Service         (Prometheus/Grafana)    │
│  Auth                Webhooks               AlertManager            │
│  Realtime                                   Sentry                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. EMAIL SERVICE COMPONENTS

```
EMAIL SERVICE ARCHITECTURE

┌─────────────────────────────────────────────────────────────┐
│                  emailService.js (Core)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FUNCTIONS:                                                 │
│  ├─ sendEmailViaResend()          → Direct Resend API call │
│  ├─ sendEmailWithTemplate()       → Template rendering     │
│  ├─ queueEmailNotification()      → DB insert              │
│  ├─ scheduleEmailNotification()   → Delayed sending        │
│  ├─ getEmailLogs()                → Query logs             │
│  ├─ markEmailSent()               → Update status          │
│  ├─ markEmailFailed()             → Error tracking         │
│  ├─ resendFailedEmails()          → Retry logic            │
│  └─ cleanupOldEmailLogs()         → Maintenance            │
│                                                             │
│  TEMPLATES:                                                 │
│  ├─ invoice                                                 │
│  ├─ reminder                                                │
│  ├─ status_update                                           │
│  └─ welcome                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              UI COMPONENTS (Frontend)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ├─ InvoiceEmailButton.jsx                                 │
│  │  └─ Trigger: Click to send invoice email               │
│  │                                                         │
│  ├─ TaskReminderEmailButton.jsx                            │
│  │  └─ Trigger: Click to send task reminder               │
│  │                                                         │
│  ├─ EmailLog.jsx                                           │
│  │  └─ Admin view of all sent/failed emails               │
│  │                                                         │
│  └─ EmailPreferences.jsx                                   │
│     └─ User controls for email subscriptions              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              API SERVICES (Backend)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  invoiceService.js                                          │
│  ├─ sendInvoiceEmail()     → Calls emailService           │
│  └─ getInvoiceEmailStatus()→ Query email logs             │
│                                                             │
│  stageTaskService.js                                        │
│  ├─ sendTaskReminder()     → Calls emailService           │
│  └─ getTaskEmailHistory()  → Query email logs             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. FLOW TIMING DIAGRAM

```
TIME: Email Triggering Sequence

T+0ms   User clicks "Send Invoice Email"
        ↓
T+50ms  InvoiceEmailButton.jsx calls sendInvoiceEmail()
        ↓
T+100ms sendInvoiceEmail() calls queueEmailNotification()
        ↓
T+150ms emailService inserts record into email_notifications table
        Status: 'pending'
        ↓
T+200ms Return success to UI
        ↓
T+250ms Toast notification shown: "Email queued successfully"
        ↓
        [Background Processing Begins - No user waiting]
        ↓
T+500ms Background job picks up pending email
        ↓
T+550ms Call Resend API: POST /emails
        ↓
T+1000ms Resend responds with message ID
        ↓
T+1050ms Update email_notifications
        Status: 'sent'
        Message ID: msg_xxxxx
        Sent at: timestamp
        ↓
T+1100ms Admin email log updated
        ↓
T+2-30s  Email delivered to recipient's inbox
        (depending on recipient's mail server)

ERROR FLOW:
T+500ms Background job tries to send
T+600ms Resend API returns error
T+650ms Update email_notifications
        Status: 'pending'
        Retry count: 1
        Scheduled retry in 1 hour
T+700ms Alert system notified of error
```

---

## 7. SECURITY & DATA FLOW

```
HTTPS/TLS ENCRYPTED CONNECTIONS

Client Browser
    ↓↑ (HTTPS - TLS 1.2+)
Web Server (solartrack.com)
    ↓↑ (HTTPS - TLS 1.2+)
Supabase API (auth + database)
    ↓↑ (HTTPS - TLS 1.2+)
PostgreSQL (encrypted connection string)

Separate Outbound:
    ↓↑ (HTTPS - TLS 1.2+)
Resend API (api.resend.com)

ENVIRONMENT VARIABLES (Never in git):
.env.production
├─ VITE_SUPABASE_URL              → Safe (public URL)
├─ VITE_SUPABASE_ANON_KEY         → Sensitive (anon key only)
├─ VITE_RESEND_API_KEY            → CRITICAL (API key)
├─ VITE_EMAIL_FROM                → Safe (public info)
└─ Other config variables         → Safe (non-sensitive)

KEY SECURITY MEASURES:
├─ Resend API key never logged
├─ API key not in error messages
├─ RLS policies enforce row access
├─ Auth required for email operations
├─ Resend API key rotated every 90 days
├─ Database secrets in vault (not git)
└─ Audit logging for all email operations
```

---

## 8. SCALING CONSIDERATIONS

```
HORIZONTAL SCALING

Baseline: 1 application instance
├─ Handles: ~1000 email sends/day
├─ CPU: 20% average usage
├─ Memory: 300MB average
├─ Response time: <200ms (P95)

Scale to 3 instances
├─ Load balancer distributes requests
├─ Database connection pooling (pgbouncer)
├─ Redis cache for email status (optional)
├─ Handles: ~10,000 email sends/day

Scale to 10 instances (Kubernetes)
├─ Auto-scaling based on load
├─ All 3 previous measures
├─ Distributed tracing (Jaeger)
├─ Handles: ~100,000 email sends/day

VERTICAL SCALING (Database)
├─ PostgreSQL: Increase connection pool
├─ Memory: Increase cache size
├─ CPU: Upgrade instance type
├─ Storage: Archival of old email logs (>90 days)
```

---

**Last Updated:** 2026-04-16
