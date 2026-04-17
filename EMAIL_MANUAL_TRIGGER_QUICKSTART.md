# Manual Email Triggering - Quick Start Guide

## What Changed?

**Before:** Emails sent automatically when you create invoices/tasks
**After:** Emails only sent when YOU click a button (manual control)

---

## How to Use

### For Invoice Emails

**In ProjectDetail view:**
```jsx
import InvoiceEmailButton from './components/InvoiceEmailButton'

// In your JSX:
<InvoiceEmailButton 
  invoiceId={invoice.id}
  customerEmail={customer.email}
  invoiceNumber={invoice.invoice_number}
/>
```

**User Steps:**
1. ✅ Create invoice → Invoice appears in system
2. ⏳ Review the details
3. 🖱️ Click "Send Invoice Email" button
4. ✅ Email queued and logged

---

### For Task Reminder Emails

**In Task detail view:**
```jsx
import TaskReminderEmailButton from './components/TaskReminderEmailButton'

// In your JSX:
<TaskReminderEmailButton 
  taskId={task.id}
  assignedToEmail={assignee.email}
  taskTitle={task.task_title}
/>
```

**User Steps:**
1. ✅ Create task → Task appears in system
2. ⏳ Review the details
3. 🖱️ Click "Send Reminder" button (when ready)
4. ✅ Email queued and logged

---

## Code Examples

### Example 1: Add to Invoice View
```jsx
// pages/ProjectDetail.jsx or similar

import InvoiceEmailButton from '../components/InvoiceEmailButton'
import { getProjectInvoices } from '../lib/invoiceService'
import { getCustomerById } from '../lib/customerService'

export default function InvoiceView({ projectId }) {
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState({})

  useEffect(() => {
    loadInvoices()
  }, [projectId])

  const loadInvoices = async () => {
    const invoiceList = await getProjectInvoices(projectId)
    setInvoices(invoiceList)
    
    // Load customer data for each invoice
    for (const invoice of invoiceList) {
      const customer = await getCustomerById(invoice.customer_id)
      setCustomers(prev => ({
        ...prev,
        [invoice.id]: customer
      }))
    }
  }

  return (
    <div>
      {invoices.map(invoice => (
        <div key={invoice.id} className="border p-4 rounded">
          <h3>Invoice #{invoice.invoice_number}</h3>
          <p>Amount: ₹{invoice.total_amount}</p>
          
          {/* Add the email button */}
          <InvoiceEmailButton
            invoiceId={invoice.id}
            customerEmail={customers[invoice.id]?.email}
            invoiceNumber={invoice.invoice_number}
          />
        </div>
      ))}
    </div>
  )
}
```

### Example 2: Add to Task View
```jsx
// pages/Updates.jsx or components/TaskList.jsx

import TaskReminderEmailButton from '../components/TaskReminderEmailButton'
import { getStageTasksByStage } from '../lib/stageTaskService'
import { getUserById } from '../lib/userService'

export default function TaskList({ projectId, stageId }) {
  const [tasks, setTasks] = useState([])
  const [assignees, setAssignees] = useState({})

  useEffect(() => {
    loadTasks()
  }, [projectId, stageId])

  const loadTasks = async () => {
    const taskList = await getStageTasksByStage(stageId, projectId)
    setTasks(taskList)
    
    // Load assignee data for each task
    for (const task of taskList) {
      if (task.assigned_to) {
        const user = await getUserById(task.assigned_to)
        setAssignees(prev => ({
          ...prev,
          [task.id]: user
        }))
      }
    }
  }

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id} className="border p-4 rounded">
          <h3>{task.task_title}</h3>
          <p>Assigned to: {assignees[task.id]?.name}</p>
          <p>Status: {task.status}</p>
          
          {/* Add the reminder button */}
          {assignees[task.id]?.email && (
            <TaskReminderEmailButton
              taskId={task.id}
              assignedToEmail={assignees[task.id].email}
              taskTitle={task.task_title}
            />
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## Available Functions

### From invoiceService.js

```javascript
import { 
  sendInvoiceEmail,      // NEW: Manual invoice email
  createInvoice,         // Existing: Create invoice
  getProjectInvoices,    // Existing: Get invoices
  getInvoiceById,        // Existing: Get single invoice
  updateInvoicePayment   // Existing: Update payment
} from '../lib/invoiceService'

// Usage
const result = await sendInvoiceEmail(invoiceId, customerEmail)
```

### From stageTaskService.js

```javascript
import { 
  sendTaskReminder,        // NEW: Manual task reminder
  createStageTask,         // Existing: Create task
  getStageTasksByStage,    // Existing: Get tasks
  updateStageTask,         // Existing: Update task
  deleteStageTask          // Existing: Delete task
} from '../lib/stageTaskService'

// Usage
const result = await sendTaskReminder(taskId, [recipientEmail])
```

---

## Testing Manually

### Step 1: Create Invoice
```bash
# In your app UI:
1. Go to Projects → [Your Project]
2. Click "Create Invoice"
3. Fill in amount and dates
4. Click "Create"
```

### Step 2: Verify No Auto-Email
```bash
# Check Email Log
1. Navigate to Email Log (if visible in sidebar)
2. Should see NO entry for this invoice yet
```

### Step 3: Send Email Manually
```bash
# In the invoice view:
1. Find the invoice you just created
2. Click "Send Invoice Email" button
3. Should see: "Invoice email queued successfully"
```

### Step 4: Verify Email in Log
```bash
# Check Email Log again
1. Navigate to Email Log
2. Should see entry for the invoice
3. Status should be "pending" or "sent"
```

---

## Troubleshooting

### Button Not Appearing
**Problem:** "Send Invoice Email" button not visible
**Solution:**
1. Ensure you imported InvoiceEmailButton
2. Check that customerEmail prop is passed
3. Verify email is not null/undefined

### Email Not Sending
**Problem:** Clicked button but email didn't queue
**Solution:**
1. Check browser console for errors
2. Verify Resend API key is set in .env.local
3. Check Email Log for error status

### Button Disabled (Greyed Out)
**Problem:** Button appears but is disabled
**Solution:**
1. Hover over button - tooltip will explain why
2. Usually means no customer/assignee email found
3. Check that customer/assignee record has email field

---

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **When Email Sent** | On create | On button click |
| **User Control** | None | Full |
| **Timing** | Immediate | User decides |
| **Review Possible** | No | Yes |
| **Accidental Sends** | Possible | Prevented |
| **Multiple Sends** | No | Yes (user can resend) |

---

## Files You Need to Know

**Modified (service layer):**
- `src/lib/invoiceService.js` - Added `sendInvoiceEmail()`
- `src/lib/stageTaskService.js` - Added `sendTaskReminder()`

**New (UI components):**
- `src/components/InvoiceEmailButton.jsx` - Button for invoices
- `src/components/TaskReminderEmailButton.jsx` - Button for tasks

**Documentation:**
- `MANUAL_EMAIL_TRIGGERING.md` - Full guide
- `EMAIL_TRIGGERING_CHANGES_SUMMARY.md` - Detailed changes
- `EMAIL_FLOW_DIAGRAM.md` - Visual flows
- `FILES_CHANGED.md` - File reference
- `EMAIL_MANUAL_TRIGGER_QUICKSTART.md` - This file!

---

## Next Steps

1. ✅ **Test the feature** - Create invoice/task and send email manually
2. ✅ **Integrate buttons** - Add components to your views
3. ✅ **Train team** - Show them how to use manual buttons
4. ✅ **Monitor Email Log** - Verify emails are being sent

---

## Questions?

Refer to:
- `EMAIL_TRIGGERING_CHANGES_SUMMARY.md` for technical details
- `EMAIL_FLOW_DIAGRAM.md` for visual explanations
- Component code in `src/components/` for implementation

---

## Summary

✅ Automatic email triggering is DISABLED
✅ Manual button-based triggering is ENABLED
✅ Components are ready to integrate
✅ Full control over when emails are sent

You're all set! 🚀
