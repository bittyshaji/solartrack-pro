# Manual Email Triggering - Phase 2B Implementation

## Overview

As of this update, email notifications are **no longer automatically triggered** when invoices or tasks are created. Instead, emails must be sent manually using dedicated UI buttons at the appropriate time.

This gives you full control over when customer and team communications are sent.

## How It Works

### For Invoices

When you create an invoice:
1. The invoice is created in the system
2. **No automatic email is sent**
3. A **"Send Invoice Email"** button appears (when implemented in Invoice detail view)
4. Click the button to queue the email notification when ready

**Files Modified:**
- `src/lib/invoiceService.js` - Removed auto-triggering, added `sendInvoiceEmail()` helper
- `src/components/InvoiceEmailButton.jsx` - New UI button component

**Usage in Code:**
```javascript
import { sendInvoiceEmail } from '../lib/invoiceService'

// Manually trigger invoice email
const result = await sendInvoiceEmail(invoiceId, customerEmail)
```

### For Tasks

When you create a task:
1. The task is created in the system
2. **No automatic reminder email is sent**
3. A **"Send Reminder"** button appears (when implemented in Task detail view)
4. Click the button to queue the reminder email when ready

**Files Modified:**
- `src/lib/stageTaskService.js` - Removed auto-triggering, added `sendTaskReminder()` helper
- `src/components/TaskReminderEmailButton.jsx` - New UI button component

**Usage in Code:**
```javascript
import { sendTaskReminder } from '../lib/stageTaskService'

// Manually trigger task reminder email
const result = await sendTaskReminder(taskId, [recipientEmail])
```

## Components Available

### InvoiceEmailButton
A button component that handles invoice email sending.

```jsx
import InvoiceEmailButton from '../components/InvoiceEmailButton'

<InvoiceEmailButton 
  invoiceId={invoice.id}
  customerEmail={customer.email}
  invoiceNumber={invoice.invoice_number}
/>
```

**Props:**
- `invoiceId` (string): Invoice ID to send email for
- `customerEmail` (string): Recipient email address
- `invoiceNumber` (string): Invoice number (for display)

### TaskReminderEmailButton
A button component that handles task reminder email sending.

```jsx
import TaskReminderEmailButton from '../components/TaskReminderEmailButton'

<TaskReminderEmailButton 
  taskId={task.id}
  assignedToEmail={assignee.email}
  taskTitle={task.task_title}
/>
```

**Props:**
- `taskId` (string): Task ID to send reminder for
- `assignedToEmail` (string): Recipient email address
- `taskTitle` (string): Task title (for display)

## Database Changes

Email notifications are still logged to the `email_notifications` table when sent:
- `status`: "pending" (queued) or "sent" (successfully sent to Resend API)
- `email_type`: "invoice" or "reminder"
- `metadata`: Contains invoice/task IDs and other context

## Testing

To verify manual email triggering works:

1. Create an invoice for a project with a customer email
2. Verify no email is automatically sent (check Email Log)
3. Click "Send Invoice Email" button
4. Check Email Log - email should appear with status "pending" or "sent"
5. Repeat for tasks

## Next Steps

**To fully implement manual email buttons:**

1. Add `InvoiceEmailButton` to the Invoice detail page
2. Add `TaskReminderEmailButton` to the Task detail page
3. Test end-to-end with actual Resend API credentials
4. Train team on new manual email workflow

## Disabled Features

The following automatic email features have been disabled:

- ❌ Invoice email on invoice creation
- ❌ Task reminder email on task creation
- ❌ Project status update emails (commented out in emailService.js)

These can be re-enabled by uncommenting the code if needed in future phases.

## Configuration

No environment variable changes needed. The Resend API configuration remains the same:

```
VITE_RESEND_API_KEY=your_api_key
VITE_EMAIL_FROM=noreply@solartrack.com
```
