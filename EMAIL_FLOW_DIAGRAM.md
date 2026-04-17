# Email Flow Diagram - Before & After

## BEFORE (Auto-triggering) ❌

### Invoice Creation Flow
```
User creates invoice
         ↓
   createInvoice()
         ↓
   Insert to database
         ↓
   AUTO: queueInvoiceEmail() ← Email triggered automatically!
         ↓
   Email queued in email_notifications table
         ↓
   User sees email in Email Log (no control)
```

### Task Creation Flow
```
User creates task with assignee
         ↓
   createStageTask()
         ↓
   Insert to database
         ↓
   AUTO: queueTaskReminder() ← Email triggered automatically!
         ↓
   Email queued in email_notifications table
         ↓
   Assignee receives email (no user control)
```

---

## AFTER (Manual button-based) ✅

### Invoice Workflow
```
┌─────────────────────────────────────────────┐
│  INVOICE DETAIL VIEW                        │
├─────────────────────────────────────────────┤
│                                             │
│  Invoice #INV-20260416-1234                │
│  Customer: Acme Corp                       │
│  Amount: ₹50,000                           │
│  Status: Pending                           │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ [✉ Send Invoice Email]  [Download]   │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
           ↓ (User clicks button)
      sendInvoiceEmail(invoiceId, email)
           ↓
   queueInvoiceEmail() → database
           ↓
   Email queued in email_notifications
           ↓
   User can see in Email Log
           ↓
   Email sent via Resend API

Timeline Control:
├─ Invoice created: T=0 (no email)
├─ User does verification: T=5 mins
├─ User clicks "Send Email": T=10 mins ← Full user control!
└─ Email sent: T=11 mins
```

### Task Workflow
```
┌─────────────────────────────────────────────┐
│  TASK DETAIL VIEW                           │
├─────────────────────────────────────────────┤
│                                             │
│  Task: Install solar panels                │
│  Project: Acme Corp Site 1                 │
│  Assigned To: John (john@example.com)      │
│  Status: Pending                           │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ [✉ Send Reminder] [Update Status]    │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
           ↓ (User clicks button)
   sendTaskReminder(taskId, [emails])
           ↓
   queueTaskReminder() → database
           ↓
   Email queued in email_notifications
           ↓
   User can see in Email Log
           ↓
   Email sent via Resend API

Timeline Control:
├─ Task created: T=0 (no email)
├─ Task assigned: T=5 mins
├─ Assignee needs nudge: T=2 days
├─ User clicks "Send Reminder": T=2 days ← Full user control!
└─ Email sent: T=2 days + 1 min
```

---

## Component Architecture

### InvoiceEmailButton Component
```
┌──────────────────────────────────┐
│  InvoiceEmailButton              │
├──────────────────────────────────┤
│ Props:                           │
│  • invoiceId (string)            │
│  • customerEmail (string)        │
│  • invoiceNumber (string)        │
│                                  │
│ State:                           │
│  • loading (boolean)             │
│                                  │
│ Handlers:                        │
│  • handleSendEmail()             │
│    - Validates email exists      │
│    - Calls sendInvoiceEmail()   │
│    - Shows toast notifications  │
│    - Handles errors             │
│                                  │
│ UI:                              │
│ [✉ Send Invoice Email]          │
│ (Blue button with icon)         │
│ (Disabled if no email)          │
└──────────────────────────────────┘
           ↓
  imports from invoiceService
           ↓
    sendInvoiceEmail()
           ↓
   queueInvoiceEmail()
           ↓
   Supabase API
```

### TaskReminderEmailButton Component
```
┌──────────────────────────────────┐
│  TaskReminderEmailButton         │
├──────────────────────────────────┤
│ Props:                           │
│  • taskId (string)               │
│  • assignedToEmail (string)      │
│  • taskTitle (string)            │
│                                  │
│ State:                           │
│  • loading (boolean)             │
│                                  │
│ Handlers:                        │
│  • handleSendReminder()          │
│    - Validates email exists      │
│    - Calls sendTaskReminder()   │
│    - Shows toast notifications  │
│    - Handles errors             │
│                                  │
│ UI:                              │
│ [✉ Send Reminder]               │
│ (Purple button with icon)       │
│ (Disabled if no email)          │
└──────────────────────────────────┘
           ↓
  imports from stageTaskService
           ↓
   sendTaskReminder()
           ↓
   queueTaskReminder()
           ↓
   Supabase API
```

---

## Service Layer Changes

### invoiceService.js
```
BEFORE:
createInvoice(projectId, proposalId, totalAmount)
  ├─ Create invoice in DB
  └─ AUTO: Send email ❌
  
AFTER:
createInvoice(projectId, proposalId, totalAmount)
  └─ Create invoice in DB (that's it!)

PLUS NEW FUNCTION:
sendInvoiceEmail(invoiceId, recipientEmail)
  └─ Send email on demand ✅
```

### stageTaskService.js
```
BEFORE:
createStageTask(taskData)
  ├─ Create task in DB
  └─ AUTO: Send reminder if assigned ❌
  
AFTER:
createStageTask(taskData)
  └─ Create task in DB (that's it!)

PLUS NEW FUNCTION:
sendTaskReminder(taskId, recipientEmails)
  └─ Send reminder on demand ✅
```

---

## Data Flow - User Journey

### Scenario 1: Create Invoice → Review → Send Email

```
1. Invoice Creation
   └─ createInvoice()
      └─ ✓ Invoice stored in DB
      └─ ✗ NO automatic email
      └─ User sees: "Invoice created"

2. User Reviews Details
   └─ Verifies customer email
   └─ Checks amount/dates
   └─ Takes ~10 minutes

3. User Clicks "Send Invoice Email"
   └─ InvoiceEmailButton.handleSendEmail()
      └─ Validates customer email exists
      └─ Calls sendInvoiceEmail(invoiceId, email)
         └─ Calls queueInvoiceEmail()
            └─ Inserts into email_notifications table
            └─ Status: "pending"
      └─ Shows toast: "Invoice email queued successfully"
      └─ Button shows loading spinner
      └─ User can see email in Email Log

4. Resend API Processes Email
   └─ Background job picks up email
   └─ Sends via Resend API
   └─ Updates status to "sent"
   └─ Customer receives email
```

### Scenario 2: Create Task → Assign → Send Reminder Days Later

```
1. Task Creation
   └─ createStageTask()
      └─ ✓ Task stored in DB
      └─ ✗ NO automatic reminder
      └─ User sees: "Task created"

2. Task Assignment
   └─ Assignee is set in task
   └─ No email sent yet
   └─ Team member doesn't know yet

3. Days Pass...
   └─ Task deadline approaching
   └─ Manager wants to remind assignee

4. Manager Clicks "Send Reminder"
   └─ TaskReminderEmailButton.handleSendReminder()
      └─ Validates assignee email exists
      └─ Calls sendTaskReminder(taskId, [email])
         └─ Calls queueTaskReminder()
            └─ Inserts into email_notifications table
            └─ Status: "pending"
      └─ Shows toast: "Task reminder email queued successfully"
      └─ Button shows loading spinner
      └─ Manager sees email in Email Log

5. Resend API Processes Email
   └─ Background job picks up email
   └─ Sends via Resend API
   └─ Updates status to "sent"
   └─ Assignee receives reminder
```

---

## Benefits of Manual Triggering

✅ **Full Control**
   - Decide exactly when to send emails
   - Don't accidentally send to wrong addresses
   - Batch send multiple emails at once

✅ **Verification**
   - Review details before sending
   - Catch errors before customer sees them
   - Ensure correct recipient

✅ **Timing Control**
   - Don't send late at night
   - Wait for review/approval
   - Send reminders strategically

✅ **Professional**
   - No accidental duplicate emails
   - Organized communication flow
   - Better customer experience

---

## Integration Checklist

To add these buttons to your views:

### For Invoice Detail View
```jsx
import InvoiceEmailButton from '../components/InvoiceEmailButton'

function InvoiceDetail({ invoice, customer }) {
  return (
    <div>
      <h1>{invoice.invoice_number}</h1>
      <p>Amount: {invoice.total_amount}</p>
      
      {/* Add the button */}
      <InvoiceEmailButton 
        invoiceId={invoice.id}
        customerEmail={customer?.email}
        invoiceNumber={invoice.invoice_number}
      />
    </div>
  )
}
```

### For Task Detail View
```jsx
import TaskReminderEmailButton from '../components/TaskReminderEmailButton'

function TaskDetail({ task, assignee }) {
  return (
    <div>
      <h1>{task.task_title}</h1>
      <p>Assigned to: {assignee?.name}</p>
      
      {/* Add the button */}
      <TaskReminderEmailButton 
        taskId={task.id}
        assignedToEmail={assignee?.email}
        taskTitle={task.task_title}
      />
    </div>
  )
}
```

---

## Summary

**Old Way:** Create invoice → Automatic email sent (no control)
**New Way:** Create invoice → Review → Click button → Email sent (full control)

This gives you the flexibility and control your team needs for professional communication.
