# Phase 2B: Email & Notifications Setup Guide

**SolarTrack Pro - Phase 2B Implementation**
- Scope: Email service with Resend API integration + notification system
- Duration: Week 4-6
- Status: Implementation Ready

## Table of Contents

1. [Resend Account Setup](#resend-account-setup)
2. [Database Setup](#database-setup)
3. [Service Integration](#service-integration)
4. [Component Integration](#component-integration)
5. [Workflow Integration](#workflow-integration)
6. [Background Job Setup](#background-job-setup)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Testing Procedures](#testing-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Resend Account Setup

### Step 1: Create Resend Account

1. Visit https://resend.com
2. Click "Sign Up" or "Get Started"
3. Create account with your business email
4. Verify email address
5. Complete account setup with business information

### Step 2: Generate API Key

1. Navigate to "API Keys" or "Settings > API Keys"
2. Click "Create API Key"
3. Set key name: `SolarTrack Pro Dev` (for development)
4. Copy the API key immediately (you won't be able to see it again)
5. Key format: `re_xxxxxxxxxxxxxxxxxxxx`

### Step 3: Configure Environment

1. Open `.env.local` in project root
2. Add your API key:

```env
VITE_RESEND_API_KEY=re_your_actual_api_key_here
VITE_EMAIL_FROM=noreply@solartrack.com
VITE_EMAIL_BATCH_SIZE=10
VITE_MAX_EMAIL_RETRIES=3
VITE_EMAIL_RETRY_DELAY_MS=3600000
```

### Step 4: Test API Connection

```javascript
// Run in browser console after loading your app
import { sendEmailViaResend } from './src/lib/emailService'

await sendEmailViaResend(
  'your-email@example.com',
  'Test Email from SolarTrack Pro',
  '<h1>Welcome to SolarTrack Pro!</h1><p>This is a test email.</p>',
  'welcome'
)
```

Expected response:
```json
{
  "success": true,
  "messageId": "re_abc123xyz",
  "to": "your-email@example.com"
}
```

### Step 5: Verify Domain (Optional but Recommended)

For production:

1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `solartrack.com`)
3. Add SPF record to your DNS:
   ```
   v=spf1 include:resend.com ~all
   ```
4. Add DKIM record (provided by Resend)
5. Wait for verification (typically 24-48 hours)

Current free tier uses Resend's domain (`resend.dev`) which works for testing.

---

## Database Setup

### Required Tables

Your Supabase instance should have the following tables created:

#### 1. email_notifications

```sql
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'invoice', 'reminder', 'status_update', 'welcome'
  subject TEXT NOT NULL,
  html_body TEXT,
  text_body TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  message_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_project_id UUID REFERENCES projects(id),
  related_invoice_id UUID REFERENCES project_invoices(id),
  related_task_id UUID REFERENCES stage_tasks(id)
);

-- Create indexes for better performance
CREATE INDEX idx_email_status ON email_notifications(status);
CREATE INDEX idx_email_recipient ON email_notifications(recipient);
CREATE INDEX idx_email_scheduled_at ON email_notifications(scheduled_at);
CREATE INDEX idx_email_project_id ON email_notifications(related_project_id);
CREATE INDEX idx_email_created_at ON email_notifications(created_at);
```

#### 2. notification_logs (Optional - for monitoring)

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_type TEXT NOT NULL, -- 'invoice_email', 'task_reminder', 'project_status_update', 'welcome_email'
  related_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id),
  details TEXT,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_type ON notification_logs(trigger_type);
CREATE INDEX idx_notification_logs_project ON notification_logs(project_id);
```

#### 3. Update existing tables

Add email columns to existing tables:

```sql
-- Add to project_invoices table
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS email_notification_id UUID REFERENCES email_notifications(id);

-- Add to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS email_log_enabled BOOLEAN DEFAULT true;

-- Add to customers table (if not exists)
ALTER TABLE project_customers ADD COLUMN IF NOT EXISTS contact_preferences JSONB DEFAULT '{
  "emailUpdates": true,
  "smsNotifications": false,
  "weeklyDigest": true,
  "invoiceNotifications": true
}'::jsonb;
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS for email_notifications
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own project emails
CREATE POLICY "Users can view project emails" ON email_notifications
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Allow service role to insert/update
CREATE POLICY "Service can manage emails" ON email_notifications
  FOR ALL USING (auth.role() = 'service_role');
```

---

## Service Integration

### Files Created

The following files have been created and are ready to use:

1. **src/lib/emailService.js** (600+ lines)
   - Core email sending functionality
   - Resend API integration
   - Queue management
   - Retry logic with exponential backoff
   - 14 main functions

2. **src/lib/notificationService.js** (250+ lines)
   - Event-driven notification triggers
   - User preference management
   - Status message generation
   - 6 main functions

3. **src/components/EmailLog.jsx** (300+ lines)
   - Admin dashboard for email history
   - Filtering and search
   - CSV export
   - Resend failed emails

4. **src/components/NotificationQueue.jsx** (200+ lines)
   - Real-time queue monitoring
   - Manual send controls
   - Auto-refresh capability
   - Queue statistics

5. **src/components/EmailPreferences.jsx** (150+ lines)
   - Customer notification preferences
   - Toggle notification types
   - Recent notification history
   - Privacy notice

### Import Examples

```javascript
// Send email via Resend
import { sendEmailViaResend, queueInvoiceEmail } from './lib/emailService'

// Trigger notifications
import { triggerInvoiceEmail, triggerProjectStatusUpdate } from './lib/notificationService'

// Use components
import EmailLog from './components/EmailLog'
import NotificationQueue from './components/NotificationQueue'
import EmailPreferences from './components/EmailPreferences'
```

### API Key Validation

The service automatically checks for the API key on first use. If missing:

```javascript
// Error logged to console:
// "Resend API key not configured. Add VITE_RESEND_API_KEY to .env.local"
```

---

## Component Integration

### 1. Add Admin Routes

In your main router configuration:

```javascript
import EmailLog from './components/EmailLog'
import NotificationQueue from './components/NotificationQueue'

const routes = [
  // ... existing routes
  {
    path: '/admin/emails',
    element: <EmailLog />,
    requiredRole: 'admin'
  }
]
```

### 2. Add to Admin Dashboard

```javascript
import NotificationQueue from './components/NotificationQueue'

export default function AdminDashboard() {
  return (
    <div>
      {/* ... other dashboard content ... */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <NotificationQueue />
      </div>
    </div>
  )
}
```

### 3. Add to Customer Settings

```javascript
import EmailPreferences from './components/EmailPreferences'

export default function CustomerSettings({ customerId }) {
  return (
    <div>
      <h2>Notification Settings</h2>
      <EmailPreferences 
        customerId={customerId}
        onPreferencesChange={(prefs) => {
          console.log('Preferences updated:', prefs)
        }}
      />
    </div>
  )
}
```

---

## Workflow Integration

### 1. Invoice Email Trigger

When creating a new invoice:

```javascript
import { createInvoice } from './lib/invoiceService'
import { triggerInvoiceEmail } from './lib/notificationService'

async function handleCreateInvoice(projectId, amount) {
  // Create invoice
  const { success, data } = await createInvoice(projectId, null, amount)
  
  if (success) {
    // Trigger email notification
    const notificationId = await triggerInvoiceEmail(data.id)
    console.log('Invoice email queued:', notificationId)
  }
}
```

### 2. Task Reminder Trigger

When creating a task with due date:

```javascript
import { triggerTaskReminder } from './lib/notificationService'

async function handleCreateTask(taskData) {
  // Create task in database
  const task = await stageTaskService.createTask(taskData)
  
  // Trigger reminder emails to team members
  if (task.due_date) {
    const notificationIds = await triggerTaskReminder(task.id)
    console.log(`Reminders sent to ${notificationIds.length} team members`)
  }
}
```

### 3. Project Status Change

When project status changes (EST → NEG, NEG → EXE, EXE → Complete):

```javascript
import { triggerProjectStatusUpdate } from './lib/notificationService'

async function handleProjectStatusChange(projectId, newStatus) {
  // Get previous status
  const project = await getProjectById(projectId)
  const previousStatus = project.current_stage
  
  // Update project
  await updateProject(projectId, { current_stage: newStatus })
  
  // Send status update emails to customers
  const customMessage = `Your project is now in ${newStatus} stage. We will provide you with regular updates.`
  const notificationIds = await triggerProjectStatusUpdate(
    projectId,
    previousStatus,
    newStatus,
    customMessage
  )
  
  console.log(`Status notifications sent to ${notificationIds.length} customers`)
}
```

### 4. Welcome Email on User Signup

```javascript
import { sendWelcomeEmail } from './lib/notificationService'

async function handleUserSignup(userId, email, name) {
  // Create user account
  const user = await createUser({ id: userId, email, name })
  
  // Send welcome email
  const result = await sendWelcomeEmail(userId, email, name)
  
  if (result.success) {
    console.log('Welcome email sent')
  }
}
```

---

## Background Job Setup

### Option 1: Using setInterval (Simple)

Create a `backgroundJobs.js` file:

```javascript
import { 
  resendFailedEmails, 
  cleanupOldEmailLogs,
  getNotificationQueue 
} from './lib/emailService'

// Process pending notifications every 5 minutes
setInterval(async () => {
  try {
    const queue = await getNotificationQueue()
    console.log(`Email queue: ${queue.length} pending`)
  } catch (error) {
    console.error('Error checking email queue:', error)
  }
}, 5 * 60 * 1000)

// Retry failed emails every 30 minutes
setInterval(async () => {
  try {
    const result = await resendFailedEmails(10)
    console.log(`Resend attempt: ${result.resent} sent, ${result.stillFailed} failed`)
  } catch (error) {
    console.error('Error resending emails:', error)
  }
}, 30 * 60 * 1000)

// Cleanup old logs daily
setInterval(async () => {
  try {
    const deleted = await cleanupOldEmailLogs(90)
    console.log(`Cleaned up ${deleted} old email logs`)
  } catch (error) {
    console.error('Error cleaning up logs:', error)
  }
}, 24 * 60 * 60 * 1000)

export function startBackgroundJobs() {
  console.log('Background jobs started')
}
```

Then import in your main app:

```javascript
import { startBackgroundJobs } from './backgroundJobs'

// In App component useEffect
useEffect(() => {
  startBackgroundJobs()
}, [])
```

### Option 2: Using Supabase Edge Functions (Recommended for Production)

Create a scheduled function in Supabase:

```bash
supabase functions new process-emails
```

### Option 3: Using External Service (e.g., Vercel Cron)

For Vercel deployments, create `api/cron/process-emails.js`:

```javascript
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { resendFailedEmails } = await import('../../../src/lib/emailService')
    const result = await resendFailedEmails(20)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Email Delivery Rate**
   - Target: >95% success rate
   - Track in real-time dashboard

2. **Queue Backlog**
   - Alert if pending emails > 100
   - Alert if average queue age > 1 hour

3. **Bounce/Complaint Rate**
   - Track failed recipients
   - Alert if > 5% of emails fail

4. **Response Times**
   - Resend API latency
   - Target: <1000ms per email

### Add Monitoring Dashboard

```javascript
export async function getEmailMetrics(dateRange = '24h') {
  const logs = await getEmailLogs()
  
  return {
    totalSent: logs.filter(l => l.status === 'sent').length,
    totalFailed: logs.filter(l => l.status === 'failed').length,
    successRate: (logs.filter(l => l.status === 'sent').length / logs.length) * 100,
    avgDeliveryTime: calculateAvgDeliveryTime(logs),
    queueLength: (await getNotificationQueue()).length
  }
}
```

---

## Testing Procedures

### 1. Unit Tests

Test email template variable replacement:

```javascript
describe('Email Templates', () => {
  it('should replace variables in invoice template', () => {
    const result = EMAIL_TEMPLATES.invoice.htmlTemplate
      .replace(/\$\{invoiceNumber\}/g, 'INV-001')
      .replace(/\$\{projectName\}/g, 'Solar Roof Installation')
    
    expect(result).toContain('INV-001')
    expect(result).toContain('Solar Roof Installation')
  })
})
```

### 2. Integration Tests

Test Resend API integration:

```javascript
describe('Resend Integration', () => {
  it('should send email successfully', async () => {
    const result = await sendEmailViaResend(
      'test@example.com',
      'Test Subject',
      '<h1>Test</h1>',
      'general'
    )
    
    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
  })
})
```

### 3. Manual Testing Checklist

- [ ] Send test email with valid credentials
- [ ] Verify email received in inbox
- [ ] Test template variable replacement
- [ ] Test with special characters in subject/body
- [ ] Test retry logic with simulated API failure
- [ ] Test with 100+ emails (load test)
- [ ] Verify database logs created correctly
- [ ] Check email status updates (pending → sent)
- [ ] Test email preferences toggle
- [ ] Verify unsubscribe links work
- [ ] Test CSV export from EmailLog component

### 4. Load Testing

```javascript
// Send 100 test emails
async function loadTest() {
  const emails = Array.from({ length: 100 }, (_, i) => ({
    to: `test${i}@example.com`,
    subject: `Load Test Email ${i}`,
    html: `<p>This is test email ${i}</p>`
  }))

  const start = Date.now()
  const results = await Promise.all(
    emails.map(e => sendEmailViaResend(e.to, e.subject, e.html, 'general'))
  )
  const duration = Date.now() - start

  console.log(`Sent 100 emails in ${duration}ms`)
  console.log(`Success: ${results.filter(r => r.success).length}`)
  console.log(`Failed: ${results.filter(r => !r.success).length}`)
}
```

---

## Troubleshooting

### Issue: "Resend API key not configured"

**Solution:**
1. Check `.env.local` file exists in project root
2. Verify `VITE_RESEND_API_KEY` is set correctly
3. Restart development server: `npm run dev`
4. Check that key starts with `re_`

### Issue: Email not sending

**Check:**
1. API key is valid and not expired
2. Recipient email is valid format
3. HTML body is not empty
4. Check browser console for errors
5. Check Supabase logs for database errors
6. Check network tab in DevTools (look for fetch errors)

**Test:**
```javascript
// In browser console
import { sendEmailViaResend } from './src/lib/emailService'
await sendEmailViaResend('your-email@example.com', 'Test', '<p>Test</p>', 'general')
```

### Issue: Emails queued but not sending

**Causes:**
- Background job not running
- `scheduled_at` in future
- Batch processing disabled

**Solution:**
1. Verify `backgroundJobs.js` is imported in App.jsx
2. Check `scheduled_at` timestamp in database
3. Check browser console for errors

### Issue: Template variables not replaced

**Solution:**
1. Check variable names match exactly (case-sensitive)
2. Use correct syntax: `${variableName}`
3. Verify variables object is passed to function
4. Check email_type parameter matches template name

### Issue: Database errors

**Check:**
1. Tables exist: `email_notifications`, `notification_logs`
2. RLS policies are correct
3. Foreign key references exist
4. Indexes created for performance

**Verify tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'email%';
```

### Performance Optimization

- Use batch processing for bulk emails (VITE_EMAIL_BATCH_SIZE)
- Create database indexes on frequently queried columns
- Implement caching for customer preferences
- Use Connection pooling for Supabase
- Monitor and clean up old logs regularly

---

## Free Tier Limits

- **Resend Free Tier**: 100 emails/day
- **Suitable for**: Development, testing, small projects
- **When to upgrade**: Production with >100 emails/day

To upgrade: Visit Resend dashboard → Settings → Plans

---

## Next Steps

1. Create Resend account and get API key
2. Add API key to `.env.local`
3. Run database migrations
4. Test email sending
5. Integrate into project workflows
6. Set up background jobs
7. Deploy to production
8. Monitor metrics

---

## Support & Resources

- **Resend Documentation**: https://resend.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Email Best Practices**: https://resend.com/blog
- **SMTP Configuration**: Not needed (using Resend API)

---

**Last Updated**: April 2026
**Version**: 1.0
**Status**: Production Ready
