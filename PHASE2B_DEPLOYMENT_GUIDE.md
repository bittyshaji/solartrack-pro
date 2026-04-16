# Phase 2B: Email & Notifications Deployment Guide
## SolarTrack Pro + Resend.dev Integration

**Version**: 2.0  
**Last Updated**: April 2026  
**Status**: Ready for Deployment  
**Estimated Time**: 45-60 minutes

---

## Table of Contents

1. [Resend Account Setup](#resend-account-setup)
2. [Environment Configuration](#environment-configuration)
3. [File Deployment Checklist](#file-deployment-checklist)
4. [Code Integration Steps](#code-integration-steps)
5. [Testing Checklist](#testing-checklist)
6. [Email Template Customization](#email-template-customization)
7. [Resend Dashboard Settings](#resend-dashboard-settings)
8. [Background Job Setup](#background-job-setup)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Monitoring & Analytics](#monitoring--analytics)

---

## Resend Account Setup
**Time Estimate: 5 minutes**

### Step 1: Create Resend Account

1. Navigate to https://resend.com
2. Click "Sign Up" button
3. Enter your email address
4. Create a strong password (min 8 characters, include uppercase, lowercase, number, special char)
5. Click "Create Account"

### Step 2: Email Verification

1. Check your email inbox for verification link from Resend
2. Click the verification link
3. You'll be redirected to Resend dashboard
4. Dashboard will show: "Email verified ✓"

### Step 3: Get API Key

1. In Resend dashboard, click "Settings" (gear icon, top right)
2. Navigate to "API Keys" tab
3. Click "Create New API Key" button
4. Give it a name: "SolarTrack Pro Phase 2B"
5. Select scope: "Full Access" (or "Emails" only if available)
6. Click "Create"
7. Copy the API key (starts with `re_`)
8. **Save this key securely** - you won't be able to view it again

### Step 4: Verify Sender Email

1. In Settings, go to "Sender Identities"
2. Click "Add New Sender"
3. Enter: "noreply@solartrack.com" (or your domain)
4. Check your email for verification
5. Click verification link
6. Status will change to "Verified ✓"

**Note**: For production, consider setting up a custom domain with SPF/DKIM records (see Resend Dashboard Settings section).

---

## Environment Configuration
**Time Estimate: 2 minutes**

### Step 1: Locate .env.local File

```bash
# From project root
ls -la .env.local
```

If file doesn't exist, create it:

```bash
touch .env.local
```

### Step 2: Add Configuration Variables

Open `.env.local` and add the following:

```env
# Phase 2B - Email & Notifications (Resend.dev)
VITE_RESEND_API_KEY=re_paste_your_api_key_here
VITE_EMAIL_FROM=noreply@solartrack.com
VITE_EMAIL_BATCH_SIZE=10
VITE_MAX_EMAIL_RETRIES=3
VITE_EMAIL_RETRY_DELAY_MS=3600000
VITE_EMAIL_CLEANUP_DAYS=90
```

### Step 3: Configuration Explanation

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_RESEND_API_KEY` | Authentication for Resend API | `re_abc123def456...` |
| `VITE_EMAIL_FROM` | Sender email address | `noreply@solartrack.com` |
| `VITE_EMAIL_BATCH_SIZE` | Emails sent per batch | `10` |
| `VITE_MAX_EMAIL_RETRIES` | Failed email retry attempts | `3` |
| `VITE_EMAIL_RETRY_DELAY_MS` | Delay between retries (milliseconds) | `3600000` (1 hour) |
| `VITE_EMAIL_CLEANUP_DAYS` | Delete old logs after X days | `90` |

### Step 4: Verify Configuration

1. Restart dev server: `npm run dev`
2. Open browser console (F12)
3. Type: `import.meta.env.VITE_RESEND_API_KEY`
4. Should output your API key (first 10 chars visible)

**Security Note**: Never commit `.env.local` to version control. Add to `.gitignore`:

```bash
echo ".env.local" >> .gitignore
```

---

## File Deployment Checklist
**Time Estimate: 5 minutes**

Copy the following files from your backup/Phase2B folder to the SolarTrack Pro project:

### Core Service Files

- [ ] **src/lib/emailService.js**
  - Main email queueing and sending logic
  - Functions: `queueInvoiceEmail`, `queueTaskReminder`, `queueStatusUpdate`
  - Handles retry logic and scheduling

- [ ] **src/lib/notificationService.js**
  - In-app notification management
  - Functions: `createNotification`, `getNotifications`, `markAsRead`
  - Integrates with email service

- [ ] **src/lib/emailJobRunner.js** (NEW - see Background Job Setup)
  - Processes email queue
  - Runs retry logic
  - Cleans up old records

### Component Files

- [ ] **src/components/EmailLog.jsx**
  - Admin-only page showing all sent emails
  - Features: Filter by project, status, date
  - Export to CSV capability

- [ ] **src/components/NotificationQueue.jsx**
  - Displays email queue status
  - Shows pending/sent/failed emails
  - Real-time updates

- [ ] **src/components/EmailPreferences.jsx**
  - Customer email preference management
  - Toggle: "Receive email updates"
  - Integrates into customer settings panel

### Verification Commands

```bash
# Verify all files copied successfully
ls -la src/lib/emailService.js
ls -la src/lib/notificationService.js
ls -la src/lib/emailJobRunner.js
ls -la src/components/EmailLog.jsx
ls -la src/components/NotificationQueue.jsx
ls -la src/components/EmailPreferences.jsx

# Check file sizes (should not be 0)
wc -l src/lib/email*.js
```

---

## Code Integration Steps

### Integration A: Hook into Invoice Creation
**Location**: UnifiedProposalPanel.jsx  
**Time Estimate**: 5 minutes

#### Step 1: Import Email Service

Find the top of `UnifiedProposalPanel.jsx` and add:

```javascript
import { queueInvoiceEmail } from '../lib/emailService'
```

#### Step 2: Find Invoice Creation Function

Search for the function that creates/submits invoices (usually named `handleCreateInvoice`, `submitInvoice`, or similar).

Locate the success callback where the invoice is confirmed as created:

```javascript
// BEFORE (original code)
const response = await createInvoice({
  projectId,
  amount,
  description
})
// Success - invoice created
setInvoiceCreated(true)
```

#### Step 3: Add Email Queue Call

Modify the success handler to queue the email:

```javascript
// AFTER (with email integration)
const response = await createInvoice({
  projectId,
  amount,
  description
})

// Success - invoice created
setInvoiceCreated(true)

// Queue invoice email notification
try {
  await queueInvoiceEmail(
    response.invoiceId,
    customerEmail,  // Get from project or customer context
    {
      projectName: project.name,
      amount: response.amount,
      dueDate: response.due_date
    }
  )
  console.log('Invoice email queued successfully')
} catch (error) {
  console.error('Failed to queue invoice email:', error)
  // Email failure should not block invoice creation
}
```

#### Step 4: Test

1. Navigate to a project in EXE state
2. Create an invoice
3. Check browser console for "Invoice email queued successfully"
4. Verify email_notifications table has new entry

---

### Integration B: Hook into Task Creation/Update
**Location**: ProjectUpdates.jsx or taskService.js  
**Time Estimate**: 5 minutes

#### Step 1: Import Email Service

Add to taskService.js or ProjectUpdates.jsx:

```javascript
import { queueTaskReminder } from '../lib/emailService'
```

#### Step 2: Find Task Creation Logic

Search for task creation/update function:

```javascript
// Original task creation
const newTask = await createTask({
  projectId,
  title,
  description,
  dueDate,
  assignedUser,
  send_reminder  // This field should exist
})
```

#### Step 3: Add Task Reminder Email

After successful task creation, add:

```javascript
// After task created successfully
const newTask = await createTask({
  projectId,
  title,
  description,
  dueDate,
  assignedUser,
  send_reminder
})

// Queue task reminder email if enabled
if (newTask.send_reminder && newTask.due_date && assignedUser?.email) {
  try {
    await queueTaskReminder(
      newTask.id,
      [assignedUser.email],
      {
        taskTitle: newTask.title,
        projectName: project.name,
        dueDate: newTask.due_date,
        assignedTo: assignedUser.name
      }
    )
    console.log('Task reminder queued successfully')
  } catch (error) {
    console.error('Failed to queue task reminder:', error)
  }
}
```

#### Step 4: Handle Task Updates

For task updates (if due date or assignment changes):

```javascript
// In task update handler
const updatedTask = await updateTask(taskId, updates)

// If due date or assignment changed, requeue reminder
if (
  (updates.due_date || updates.assigned_user) &&
  updatedTask.send_reminder &&
  newAssignedUser?.email
) {
  await queueTaskReminder(
    updatedTask.id,
    [newAssignedUser.email],
    { taskTitle: updatedTask.title, dueDate: updatedTask.due_date }
  )
}
```

#### Step 5: Test

1. Go to Projects → Select project → Daily Updates
2. Create new task with "Send Reminder" checkbox enabled
3. Set due date to tomorrow
4. Check email_notifications table → Should have task reminder entry
5. Verify assignee email in notification record

---

### Integration C: Hook into Project State Change
**Location**: Project state update logic (likely in ProjectUpdates.jsx or projectService.js)  
**Time Estimate**: 5 minutes

#### Step 1: Import Email Service

```javascript
import { queueStatusUpdate } from '../lib/emailService'
```

#### Step 2: Find Project State Change Function

Search for state change logic:

```javascript
// Original state update
const updated = await updateProjectState(projectId, {
  state: newState,  // EST -> NEG, NEG -> EXE, etc.
})
```

#### Step 3: Add Status Update Email

After state change succeeds:

```javascript
// After project state updated successfully
const updated = await updateProjectState(projectId, {
  state: newState,
})

// Queue status update email for all project stakeholders
try {
  const customerEmails = project.contacts.map(c => c.email)
  const stateLabel = {
    'EST': 'Estimate',
    'NEG': 'Negotiation',
    'EXE': 'Execution',
    'CMP': 'Completed'
  }[newState]

  await queueStatusUpdate(
    projectId,
    customerEmails,
    `Project "${project.name}" has moved to ${stateLabel} state`,
    {
      previousState: project.state,
      newState: newState,
      stateLabel: stateLabel,
      projectName: project.name,
      updatedBy: currentUser.name
    }
  )
  console.log('Status update email queued')
} catch (error) {
  console.error('Failed to queue status update:', error)
}
```

#### Step 4: Test

1. Open a project
2. Change project state (EST → NEG, NEG → EXE, etc.)
3. Check email_notifications table for new entry
4. Verify all customer emails are in the notification
5. Check Resend dashboard → Should show email sent

---

### Integration D: Add Email Routes (Admin Only)
**Location**: App.jsx or main router configuration  
**Time Estimate**: 3 minutes

#### Step 1: Import Email Components

Add to your router file:

```javascript
import EmailLog from './components/EmailLog'
import ProtectedRoute from './components/ProtectedRoute'  // Already exists
```

#### Step 2: Add Route

Find your route configuration and add:

```javascript
<Routes>
  {/* Existing routes... */}
  
  {/* Admin Routes */}
  <Route 
    path="/admin/emails" 
    element={
      <ProtectedRoute requiredRole="admin">
        <EmailLog />
      </ProtectedRoute>
    } 
  />
  
  {/* ...rest of routes */}
</Routes>
```

#### Step 3: Add to Admin Menu

Find your admin navigation menu and add:

```javascript
// In admin sidebar/menu component
<NavItem 
  to="/admin/emails" 
  label="Email Log" 
  icon="mail"
/>
```

Or if using dropdown:

```javascript
<DropdownItem to="/admin/emails">
  <MailIcon /> Email Log
</DropdownItem>
```

#### Step 4: Test

1. Login as admin user
2. Navigate to /admin/emails
3. Should see empty state (no emails sent yet) or list of sent emails
4. Verify filtering/search works
5. Verify export to CSV button exists

---

### Integration E: Add Email Preferences (Customer)
**Location**: Customer settings panel or project details  
**Time Estimate**: 3 minutes

#### Step 1: Import Email Preferences Component

```javascript
import EmailPreferences from './components/EmailPreferences'
```

#### Step 2: Add Component to Customer Settings

In your customer/project settings view:

```javascript
<TabPanel label="Notification Settings">
  <EmailPreferences 
    projectId={projectId}
    customerId={customerId}
    onSave={handlePreferencesSave}
  />
</TabPanel>
```

Or in a customer contact card:

```javascript
<CustomerContactCard customer={customer}>
  <EmailPreferences 
    customerId={customer.id}
  />
</CustomerContactCard>
```

#### Step 3: Test

1. Go to project settings
2. Find "Email Preferences" section
3. Should show toggle: "Receive email updates"
4. Toggle OFF
5. Create invoice → Should NOT send email
6. Toggle back ON
7. Create invoice → Should send email

---

## Testing Checklist
**Time Estimate: 15-20 minutes**

### Pre-Testing Setup

- [ ] .env.local has valid VITE_RESEND_API_KEY
- [ ] All service files copied to src/lib/
- [ ] All component files copied to src/components/
- [ ] Development server running: `npm run dev`
- [ ] Resend account verified and API key confirmed
- [ ] Database migrations have run (email_notifications table exists)

### Test 1: Service Import & Initialization

```javascript
// In browser console, test imports:
import { queueInvoiceEmail } from './lib/emailService'
// Should return function without errors
```

- [ ] No import errors in console
- [ ] No undefined errors
- [ ] Function available in scope

### Test 2: Create Test Invoice & Verify Email

1. [ ] Navigate to Projects → Select project in EXE state
2. [ ] Go to Proposals → Create new proposal
3. [ ] Fill in proposal details
4. [ ] Move to "EXE" state
5. [ ] Create invoice
6. [ ] Open browser DevTools → Console tab
7. [ ] Should see: "Invoice email queued successfully"
8. [ ] Open database query tool or admin panel
9. [ ] Run: `SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 1`
10. [ ] Verify entry has:
    - `type = 'invoice'`
    - `recipient_email = customer email`
    - `status = 'pending'` or `'sent'`
    - `scheduled_at` is set to current time or near future

### Test 3: Verify Email Sent (Resend Dashboard)

1. [ ] Log into Resend dashboard: https://resend.com
2. [ ] Click "Emails" tab
3. [ ] Should see email with subject containing "Invoice"
4. [ ] Status should show "Delivered" (may take 30 seconds)
5. [ ] Click email to see delivery details
6. [ ] Verify recipient email matches customer
7. [ ] Check email preview → Should contain invoice details

### Test 4: Verify Email in Customer Inbox

1. [ ] Access test email account (or create temporary test email)
2. [ ] Wait 30-60 seconds
3. [ ] Check inbox for email from noreply@solartrack.com
4. [ ] Subject should reference project name and invoice
5. [ ] Email should contain:
   - Invoice amount
   - Project name
   - Due date
   - Company branding/logo
   - Professional formatting

### Test 5: Check EmailLog Admin Page

1. [ ] Navigate to /admin/emails
2. [ ] Should see list of sent emails
3. [ ] Click on invoice email entry
4. [ ] Should display:
   - Recipient email
   - Email type
   - Sent timestamp
   - Project name
   - Status badge
5. [ ] Test filter by project
6. [ ] Test filter by status
7. [ ] Test export to CSV button

### Test 6: Create Task with Reminder

1. [ ] Go to Projects → Select project → Daily Updates
2. [ ] Click "New Task"
3. [ ] Fill in title, description
4. [ ] Check "Send Reminder" checkbox
5. [ ] Set due date to tomorrow
6. [ ] Assign to team member (ensure they have email)
7. [ ] Click Save
8. [ ] Check console → "Task reminder queued successfully"
9. [ ] Query database: `SELECT * FROM email_notifications WHERE type='task_reminder' ORDER BY created_at DESC LIMIT 1`
10. [ ] Verify entry created with correct task details

### Test 7: Update Project State

1. [ ] Open any project
2. [ ] Change state (EST → NEG)
3. [ ] Check console → "Status update email queued"
4. [ ] Query: `SELECT * FROM email_notifications WHERE type='status_update' ORDER BY created_at DESC LIMIT 1`
5. [ ] Verify all customer emails in notification
6. [ ] Check Resend dashboard → Email delivered

### Test 8: Email Preferences Toggle

1. [ ] Go to project → Customer contact info
2. [ ] Click "Email Preferences"
3. [ ] Toggle "Receive email updates" OFF
4. [ ] Create invoice
5. [ ] Check email_notifications table → No new entry OR status='skipped'
6. [ ] Toggle preference back ON
7. [ ] Create another invoice
8. [ ] Verify email IS queued this time

### Test 9: Mobile Responsiveness

- [ ] Open /admin/emails on mobile device or responsive view
- [ ] Layout should be readable
- [ ] Filters should be accessible
- [ ] Export button should be functional
- [ ] Email preview should be readable

### Test 10: Performance Check

- [ ] Load EmailLog page with 50+ email entries
- [ ] Page should load in < 3 seconds
- [ ] Filtering should be instant
- [ ] No console errors or warnings

---

## Email Template Customization

### Location of Templates

Email templates are defined in `src/lib/emailService.js` in the following functions:

```javascript
// Invoice email template
function getInvoiceEmailTemplate(data) { ... }

// Task reminder template
function getTaskReminderTemplate(data) { ... }

// Status update template
function getStatusUpdateTemplate(data) { ... }
```

### Customization Steps

#### Step 1: Open emailService.js

```bash
code src/lib/emailService.js
```

#### Step 2: Find and Edit Invoice Template

Search for `getInvoiceEmailTemplate`:

```javascript
function getInvoiceEmailTemplate(data) {
  return {
    subject: `Invoice for ${data.projectName}`,
    html: `
      <h1>Invoice Notification</h1>
      <p>Hi ${data.customerName},</p>
      <p>We have created an invoice for your project.</p>
      ...
    `
  }
}
```

Customize:
- **Subject line**: Change "Invoice for" to your preferred format
- **Company name**: Replace "SolarTrack" with your company name
- **Logo URL**: Update image src to your logo URL
- **Colors**: Update hex colors (#007AFF, #FF9500, etc.)
- **Footer text**: Update company info, address, phone
- **CTA button**: Update button color and text

#### Step 3: Customize Task Reminder Template

Find `getTaskReminderTemplate`:

```javascript
function getTaskReminderTemplate(data) {
  return {
    subject: `Reminder: Task "${data.taskTitle}" due ${data.dueDate}`,
    html: `
      <h1>Task Reminder</h1>
      ...
    `
  }
}
```

Update similarly to invoice template.

#### Step 4: Customize Status Update Template

Find `getStatusUpdateTemplate`:

```javascript
function getStatusUpdateTemplate(data) {
  return {
    subject: `Project Update: ${data.projectName}`,
    html: `...`
  }
}
```

### Common Customizations

#### Change Company Branding

```javascript
// BEFORE
const COMPANY_NAME = "SolarTrack Pro"
const LOGO_URL = "https://default-logo.png"

// AFTER
const COMPANY_NAME = "Your Company Name"
const LOGO_URL = "https://your-domain.com/logo.png"
```

#### Change Color Scheme

```javascript
// BEFORE
const PRIMARY_COLOR = "#007AFF"    // Blue
const SECONDARY_COLOR = "#FF9500"  // Orange
const TEXT_COLOR = "#333333"       // Dark gray

// AFTER
const PRIMARY_COLOR = "#1E40AF"    // Your brand blue
const SECONDARY_COLOR = "#EA580C"  // Your brand orange
const TEXT_COLOR = "#1F2937"       // Your brand gray
```

#### Update Footer

```javascript
// In all email templates, find the footer section:
const footer = `
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #666; font-size: 12px;">
    <strong>SolarTrack Pro</strong><br>
    123 Main St, City, State 12345<br>
    Phone: (555) 123-4567<br>
    Email: support@solartrack.com
  </p>
`

// Replace with your company info
```

#### Test Template Changes

1. After editing template, save file
2. Dev server should hot-reload
3. Create test invoice
4. Check Resend dashboard for new email
5. Verify customizations appear in email preview

---

## Resend Dashboard Settings

### Step 1: Access Sender Identities

1. Log into Resend dashboard
2. Click "Settings" (gear icon)
3. Navigate to "Sender Identities"
4. You should see "noreply@solartrack.com" (or your email)

### Step 2: Add Custom Domain (Optional)

For production, add your custom domain:

1. Click "Add Sender Domain"
2. Enter your domain: "noreply@yourcompany.com"
3. Resend will provide DNS records:
   - **SPF record**: `v=spf1 include:sendingdomain.resend.com ~all`
   - **DKIM record**: (provided by Resend)
   - **MX record**: (if needed)

4. Add these records to your domain registrar (GoDaddy, Cloudflare, etc.)
5. Verify domain in Resend → should show "Verified ✓"

### Step 3: Monitor Deliverability

1. Go to "Emails" tab
2. Check delivery stats:
   - **Delivered**: Successfully sent
   - **Bounced**: Invalid email address
   - **Complained**: Marked as spam
   - **Failed**: API error

3. Target metrics:
   - Bounce rate: < 2%
   - Complaint rate: < 0.1%
   - Delivery rate: > 98%

### Step 4: Review Rate Limits

1. In Settings, check "Plan"
2. Free tier allows:
   - **100 emails/day**
   - **5,000/month**
   - 5 verified senders

3. For production (if exceeding limits), upgrade to Pro plan:
   - **Unlimited emails**
   - **Advanced analytics**
   - **Priority support**

4. Check current usage in dashboard

---

## Background Job Setup
**Time Estimate: 10 minutes**

### What are Background Jobs?

Background jobs process emails asynchronously:
- **Email Queue Processor**: Sends pending emails every 5 minutes
- **Retry Handler**: Retries failed emails every 30 minutes
- **Cleanup Task**: Deletes old email logs daily

### Step 1: Create emailJobRunner.js

Create file: `src/lib/emailJobRunner.js`

```javascript
/**
 * Email Job Runner - Background Tasks for Email Processing
 * Handles: Queue processing, retries, cleanup
 */

import { Resend } from 'resend'
import { supabase } from './supabaseClient'

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY)

// Job tracking to prevent duplicate runs
let processQueueRunning = false
let retryRunning = false
let cleanupRunning = false

/**
 * Process email queue
 * Runs every 5 minutes
 * Sends pending emails from email_notifications table
 */
export async function processEmailQueue() {
  if (processQueueRunning) return
  processQueueRunning = true

  try {
    // Get pending emails
    const { data: pendingEmails, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date())
      .limit(parseInt(import.meta.env.VITE_EMAIL_BATCH_SIZE || 10))

    if (error) throw error

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('[EmailJob] No pending emails to process')
      return
    }

    console.log(`[EmailJob] Processing ${pendingEmails.length} pending emails`)

    // Send each email
    for (const notification of pendingEmails) {
      try {
        const result = await resend.emails.send({
          from: import.meta.env.VITE_EMAIL_FROM,
          to: notification.recipient_email,
          subject: notification.subject,
          html: notification.html_content
        })

        // Update status to sent
        await supabase
          .from('email_notifications')
          .update({
            status: 'sent',
            sent_at: new Date(),
            resend_message_id: result.id
          })
          .eq('id', notification.id)

        console.log(`[EmailJob] Email sent: ${notification.id}`)
      } catch (sendError) {
        console.error(`[EmailJob] Error sending email ${notification.id}:`, sendError)

        // Update status to failed
        await supabase
          .from('email_notifications')
          .update({
            status: 'failed',
            last_error: sendError.message
          })
          .eq('id', notification.id)
      }
    }
  } catch (error) {
    console.error('[EmailJob] Queue processing error:', error)
  } finally {
    processQueueRunning = false
  }
}

/**
 * Retry failed emails
 * Runs every 30 minutes
 * Retries emails that failed, up to MAX_EMAIL_RETRIES times
 */
export async function retryFailedEmails() {
  if (retryRunning) return
  retryRunning = true

  try {
    const maxRetries = parseInt(import.meta.env.VITE_MAX_EMAIL_RETRIES || 3)

    // Get failed emails (retry count < max)
    const { data: failedEmails, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', maxRetries)

    if (error) throw error

    if (!failedEmails || failedEmails.length === 0) {
      console.log('[EmailJob] No failed emails to retry')
      return
    }

    console.log(`[EmailJob] Retrying ${failedEmails.length} failed emails`)

    const retryDelay = parseInt(import.meta.env.VITE_EMAIL_RETRY_DELAY_MS || 3600000)

    for (const notification of failedEmails) {
      const timeSinceFail = Date.now() - new Date(notification.updated_at).getTime()

      // Only retry if enough time has passed
      if (timeSinceFail < retryDelay) continue

      try {
        const result = await resend.emails.send({
          from: import.meta.env.VITE_EMAIL_FROM,
          to: notification.recipient_email,
          subject: notification.subject,
          html: notification.html_content
        })

        // Update to sent
        await supabase
          .from('email_notifications')
          .update({
            status: 'sent',
            sent_at: new Date(),
            resend_message_id: result.id,
            retry_count: (notification.retry_count || 0) + 1
          })
          .eq('id', notification.id)

        console.log(`[EmailJob] Retry successful: ${notification.id}`)
      } catch (retryError) {
        console.error(`[EmailJob] Retry failed: ${notification.id}`, retryError)

        // Increment retry count
        await supabase
          .from('email_notifications')
          .update({
            retry_count: (notification.retry_count || 0) + 1,
            last_error: retryError.message
          })
          .eq('id', notification.id)
      }
    }
  } catch (error) {
    console.error('[EmailJob] Retry processing error:', error)
  } finally {
    retryRunning = false
  }
}

/**
 * Cleanup old emails
 * Runs daily at midnight
 * Deletes email logs older than VITE_EMAIL_CLEANUP_DAYS
 */
export async function cleanupOldEmails() {
  if (cleanupRunning) return
  cleanupRunning = true

  try {
    const cleanupDays = parseInt(import.meta.env.VITE_EMAIL_CLEANUP_DAYS || 90)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays)

    // Delete old emails
    const { data, error } = await supabase
      .from('email_notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) throw error

    console.log(`[EmailJob] Cleaned up old emails (older than ${cleanupDays} days)`)
  } catch (error) {
    console.error('[EmailJob] Cleanup error:', error)
  } finally {
    cleanupRunning = false
  }
}

/**
 * Initialize background jobs
 * Call this in your app initialization (e.g., useEffect in App.jsx)
 */
export function initializeEmailJobs() {
  console.log('[EmailJob] Initializing email background jobs')

  // Process queue every 5 minutes
  setInterval(processEmailQueue, 5 * 60 * 1000)

  // Retry failed emails every 30 minutes
  setInterval(retryFailedEmails, 30 * 60 * 1000)

  // Cleanup old emails daily (at midnight)
  scheduleCleanupAtMidnight()

  // Run jobs immediately on startup (optional)
  processEmailQueue()
}

/**
 * Schedule cleanup to run at midnight
 */
function scheduleCleanupAtMidnight() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const timeUntilMidnight = tomorrow.getTime() - now.getTime()

  setTimeout(() => {
    cleanupOldEmails()
    // Then repeat daily
    setInterval(cleanupOldEmails, 24 * 60 * 60 * 1000)
  }, timeUntilMidnight)
}

/**
 * Manually process queue (for testing)
 */
export async function manualProcessQueue() {
  console.log('[EmailJob] Manual queue processing triggered')
  await processEmailQueue()
}
```

### Step 2: Initialize Jobs in App.jsx

```javascript
import { initializeEmailJobs } from './lib/emailJobRunner'

function App() {
  useEffect(() => {
    // Initialize email background jobs on app startup
    initializeEmailJobs()
  }, [])

  return (
    // ... rest of your app
  )
}

export default App
```

### Step 3: Database Table Migration

Ensure your Supabase `email_notifications` table has these columns:

```sql
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  recipient_email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'invoice', 'task_reminder', 'status_update'
  subject VARCHAR(255),
  html_content TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'sent', 'failed'
  scheduled_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  retry_count INT DEFAULT 0,
  last_error TEXT,
  resend_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_status ON email_notifications(status);
CREATE INDEX idx_email_scheduled ON email_notifications(scheduled_at);
CREATE INDEX idx_email_project ON email_notifications(project_id);
```

### Step 4: Test Job Runner

In browser console:

```javascript
import { manualProcessQueue } from './lib/emailJobRunner'

// Manually trigger queue processing
await manualProcessQueue()
// Check console for: [EmailJob] Processing X pending emails
```

---

## Troubleshooting Guide

### Issue: "Email not sending"

**Symptom**: Email queued but never sent, status stays 'pending'

**Solutions**:
1. Check .env.local for valid VITE_RESEND_API_KEY
2. Verify API key is not expired in Resend dashboard
3. Check browser console for errors
4. Verify email_notifications table has entries
5. Check Resend dashboard → Emails tab for delivery status
6. Run: `SELECT * FROM email_notifications WHERE status='pending'` → Check if any entries exist

**Fix**:
```javascript
// Check API key format
const apiKey = import.meta.env.VITE_RESEND_API_KEY
console.log('API Key starts with re_:', apiKey.startsWith('re_'))
console.log('API Key length:', apiKey.length)  // Should be 40+ chars
```

---

### Issue: "email_notifications table doesn't exist"

**Symptom**: Error: "relation email_notifications does not exist"

**Solution**:
1. Check Supabase dashboard → SQL Editor
2. Copy migration SQL from "Background Job Setup" section
3. Run migration: Click "Execute" in SQL Editor
4. Verify table created: `SELECT * FROM email_notifications LIMIT 1`

---

### Issue: "Resend API error 401 Unauthorized"

**Symptom**: Email sending fails with 401 error

**Solutions**:
1. Verify API key is copied correctly (no extra spaces)
2. Check API key hasn't been revoked in Resend dashboard
3. Regenerate API key if needed:
   - Resend dashboard → Settings → API Keys
   - Delete old key
   - Create new key
   - Update .env.local
   - Restart dev server

---

### Issue: "Email rate limit exceeded"

**Symptom**: Emails fail with "rate limit" error

**Solution**:
1. Check Resend dashboard → Plan
2. Free tier: 100 emails/day, 5,000/month
3. If hitting limit:
   - Upgrade to Pro plan ($20/month)
   - Or reduce email frequency
   - Or implement email throttling

**Throttling Example**:
```javascript
// In emailService.js, batch emails
async function batchSendEmails(emails, delayMs = 1000) {
  for (let i = 0; i < emails.length; i++) {
    await sendEmail(emails[i])
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}
```

---

### Issue: "Customer not receiving emails"

**Symptom**: Email marked as "sent" in Resend but not in customer inbox

**Solutions**:
1. Check spam/junk folder
2. Verify email address is correct in database
3. Check Resend dashboard → Email preview for rendering issues
4. Verify "From" address is verified in Resend
5. Check email content for spam triggers (too many links, suspicious words)

**Verification**:
```javascript
// Check email address in database
SELECT recipient_email, status, created_at 
FROM email_notifications 
WHERE recipient_email = 'customer@example.com'
ORDER BY created_at DESC LIMIT 5
```

---

### Issue: "Missing imports or undefined functions"

**Symptom**: Console error: "Cannot find module 'emailService'"

**Solution**:
1. Verify files copied to correct location:
   ```bash
   ls -la src/lib/emailService.js
   ```
2. Check for typos in import statements
3. Verify file extensions (.js not .jsx for services)
4. Restart dev server: `npm run dev`

---

### Issue: "Database migration errors"

**Symptom**: SQL syntax error when creating table

**Solution**:
1. Check Supabase SQL dialect (should be PostgreSQL)
2. Copy exact migration SQL from this guide
3. Run in Supabase → SQL Editor
4. Check for missing semicolons or quotes
5. Verify table created: `\dt email_notifications`

---

## Monitoring & Analytics

### Monitoring Email Delivery

#### Resend Dashboard Metrics

1. Log into Resend dashboard
2. Click "Analytics"
3. View key metrics:
   - **Total Emails**: Sent this month
   - **Delivery Rate**: Percentage delivered
   - **Bounce Rate**: Invalid addresses
   - **Complaint Rate**: Marked as spam

**Targets**:
- Delivery rate: > 98%
- Bounce rate: < 2%
- Complaint rate: < 0.1%

#### Real-time Status

1. Go to "Emails" tab
2. Click on email to see:
   - Delivery timestamp
   - Recipient confirmation
   - Email preview
   - Event timeline

### Database Monitoring

#### Query Email Stats

```sql
-- Total emails sent
SELECT COUNT(*) as total_sent FROM email_notifications WHERE status='sent'

-- Failed emails
SELECT COUNT(*) as failed FROM email_notifications WHERE status='failed'

-- Emails by type
SELECT type, COUNT(*) as count FROM email_notifications GROUP BY type

-- Emails by project
SELECT p.name, COUNT(e.id) as email_count 
FROM email_notifications e
JOIN projects p ON e.project_id = p.id
GROUP BY p.name
ORDER BY email_count DESC

-- Average time to send
SELECT 
  AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_seconds
FROM email_notifications 
WHERE status='sent'
```

#### Set Up Alerts

Create Supabase alerts:

1. Go to Supabase dashboard
2. Create function to check for failures:

```sql
CREATE FUNCTION check_email_failures() RETURNS void AS $$
BEGIN
  IF (SELECT COUNT(*) FROM email_notifications WHERE status='failed' AND created_at > NOW() - INTERVAL '1 hour') > 10 THEN
    -- Send alert (webhook, email, etc.)
    RAISE WARNING 'Multiple email failures detected in last hour'
  END IF
END
$$ LANGUAGE plpgsql
```

### Performance Monitoring

#### Track Queue Processing Time

In emailJobRunner.js:

```javascript
export async function processEmailQueue() {
  const startTime = Date.now()
  
  // ... processing code ...
  
  const duration = Date.now() - startTime
  console.log(`[EmailJob] Queue processed in ${duration}ms`)
  
  // Log to analytics
  logMetric({
    event: 'email_queue_processed',
    duration,
    timestamp: new Date()
  })
}
```

#### Monitor EmailLog Performance

```javascript
// In EmailLog.jsx
const [loadTime, setLoadTime] = useState(0)

useEffect(() => {
  const start = Date.now()
  fetchEmails().then(() => {
    setLoadTime(Date.now() - start)
  })
}, [])

// Display load time in footer
console.log(`Loaded in ${loadTime}ms`)
```

### Monthly Review Checklist

Every month, review:

- [ ] Resend dashboard usage (emails sent, bounce rate)
- [ ] Failed email count (should be < 5% of total)
- [ ] Email delivery latency (should be < 1 minute avg)
- [ ] Database growth (email_notifications table size)
- [ ] Customer complaints about emails (should be 0)
- [ ] Email template engagement (clicks, opens - if tracking enabled)
- [ ] Upgrade plan if nearing rate limits
- [ ] Review email preferences opt-out rate

### Cost Optimization

**Free Tier**: 100 emails/day, 5,000/month
- Suitable for: Small projects, testing
- Cost: $0

**Pro Plan**: Unlimited emails
- Suitable for: Production, high volume
- Cost: $20/month
- Includes: Analytics, priority support

**Estimate**: 
- Average project: 5 emails/month
- 10 projects: 50 emails/month (Free tier OK)
- 100 projects: 500 emails/month (Free tier OK)
- 500+ projects: Consider Pro plan

---

## Appendix: Quick Reference

### API Functions

```javascript
// Queue invoice email
await queueInvoiceEmail(invoiceId, customerEmail, data)

// Queue task reminder
await queueTaskReminder(taskId, [emails], data)

// Queue status update
await queueStatusUpdate(projectId, [emails], message, data)

// Get notification history
const history = await getNotificationHistory(projectId)

// Export emails
await exportEmailsToCSV(filters)
```

### Database Queries

```sql
-- Check pending emails
SELECT * FROM email_notifications WHERE status='pending' ORDER BY scheduled_at

-- View emails for project
SELECT * FROM email_notifications WHERE project_id='abc123'

-- Get delivery stats
SELECT status, COUNT(*) FROM email_notifications GROUP BY status

-- Find failed emails
SELECT * FROM email_notifications WHERE status='failed' LIMIT 10
```

### Environment Variables

```env
VITE_RESEND_API_KEY=re_...        # Required
VITE_EMAIL_FROM=noreply@...       # Required
VITE_EMAIL_BATCH_SIZE=10          # Optional, default 10
VITE_MAX_EMAIL_RETRIES=3          # Optional, default 3
VITE_EMAIL_RETRY_DELAY_MS=3600000 # Optional, default 1 hour
VITE_EMAIL_CLEANUP_DAYS=90        # Optional, default 90
```

### Useful Links

- Resend Documentation: https://resend.com/docs
- Resend Dashboard: https://resend.com
- API Reference: https://resend.com/docs/api-reference
- Status Page: https://status.resend.com

---

**End of Phase 2B Deployment Guide**

Version 2.0 | Last Updated: April 2026 | Status: Production Ready
