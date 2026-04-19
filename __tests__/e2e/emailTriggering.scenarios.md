# End-to-End Test Scenarios - Manual Email Triggering

## Test Environment Setup
- Database: Supabase (test project)
- Email Provider: Resend.dev
- User Role: Admin/Project Manager

---

## Scenario 1: Complete Invoice Email Workflow

### Steps
1. Create a new project
2. Create an invoice for the project
3. Verify no automatic email is sent
4. Navigate to invoice details
5. Click "Send Invoice Email" button
6. Verify email is queued in email_notifications table
7. Verify recipient received email notification

### Expected Results
- Invoice created successfully with status "Pending"
- No email sent on creation
- Invoice email button is visible and enabled (when customer email exists)
- Clicking button shows "Sending..." state
- Success toast appears: "Invoice email queued successfully"
- email_notifications table has new entry with:
  - status: "pending"
  - email_type: "invoice"
  - recipient_email: customer email
  - metadata.invoiceId: invoice ID
- Email contains all invoice details (number, amount, due date)

### Failure Points to Test
- Missing customer email: Button disabled, error message shown
- Invalid email format: Error toast displayed
- Resend API failure: Error logged, user notified
- Network timeout: Request retried, error shown

---

## Scenario 2: Complete Task Reminder Workflow

### Steps
1. Create a new project
2. Create a task within a stage
3. Assign task to team member with email
4. Verify no automatic reminder is sent
5. Navigate to task details
6. Click "Send Reminder" button
7. Verify reminder is queued in email_notifications table
8. Verify assignee received reminder notification

### Expected Results
- Task created successfully
- No reminder email sent on creation
- Task reminder button is visible and enabled (when assignee email exists)
- Clicking button shows "Sending..." state
- Success toast appears: "Task reminder email queued successfully"
- email_notifications table has new entry with:
  - status: "pending"
  - email_type: "reminder"
  - recipient_email: assignee email
  - metadata.taskId: task ID
- Email contains all task details (title, priority, due date, project)

### Failure Points to Test
- Missing assignee email: Button disabled, error message shown
- Invalid email format: Error toast displayed
- Resend API failure: Error logged, user notified
- Network timeout: Request retried, error shown

---

## Scenario 3: Multiple Emails for Same Invoice

### Steps
1. Create invoice
2. Send invoice email to customer 1
3. Verify first email sent and logged
4. Send same invoice email to customer 2
5. Send same invoice email again to customer 1
6. Verify all three emails are logged separately

### Expected Results
- First email: Notification ID notif_1, status pending
- Second email: Notification ID notif_2, status pending
- Third email: Notification ID notif_3, status pending
- All three entries in email_notifications table
- No "already sent" errors or blocking

---

## Scenario 4: Invalid Email Address Handling

### Steps
1. Create invoice with customer email = "invalid-email"
2. Try to send invoice email
3. Verify error handling

### Expected Results
- Button click triggers email service
- Email service validates format
- Error toast: "Email format invalid" OR email rejected by Resend
- email_notifications table may have entry with status "failed"
- User can retry after fixing email address

---

## Scenario 5: Network Failure Recovery

### Steps
1. Create invoice
2. Temporarily disconnect network
3. Click "Send Invoice Email"
4. Reconnect network
5. Verify retry mechanism
6. Check email status

### Expected Results
- Loading state shows while attempting send
- Error toast appears: "Network error" or "Failed to queue invoice email"
- User can click button again to retry
- On retry (after reconnect), email is sent successfully
- Only one entry in email_notifications if retry succeeds

---

## Scenario 6: Resend API Timeout

### Steps
1. Create invoice
2. Simulate Resend API timeout (no response within timeout window)
3. Click "Send Invoice Email"
4. Verify timeout handling

### Expected Results
- Loading state shows initial request
- After timeout, error toast appears
- email_notifications has entry with status "failed" and error message
- User can retry
- Retry logic respects MAX_RETRIES setting (default 3)

---

## Scenario 7: Email Log Verification

### Steps
1. Create invoice and send email
2. Create task and send reminder
3. Send same invoice email again
4. Navigate to Email Log page
5. Verify all emails are logged correctly

### Expected Results
- Email Log shows all three emails
- Each entry shows:
  - Email type (invoice, reminder)
  - Recipient address
  - Subject
  - Sent timestamp
  - Status (pending, sent, failed)
- Can filter by type, recipient, date range
- Can search by email address or subject

---

## Scenario 8: Toast Notifications Behavior

### Steps
1. Create invoice
2. Click "Send Invoice Email" button
3. Observe toast notification
4. Verify toast appears and disappears

### Expected Results
- Success toast appears immediately after queue
- Toast shows message: "Invoice email queued successfully"
- Toast auto-dismisses after 3-4 seconds
- On error, error toast appears instead
- User can dismiss toast manually
- Multiple toasts don't overlap (queued properly)

---

## Scenario 9: Button State Management

### Steps
1. Create invoice with customer email
2. Verify button is enabled
3. Click button
4. Verify button shows "Sending..."
5. Wait for completion
6. Verify button returns to normal state

### Expected Results
- Initial state: Button enabled, text "Send Invoice Email", Mail icon visible
- While loading: Button disabled, text "Sending...", Loader icon spinning
- After success: Button enabled again, text "Send Invoice Email"
- After error: Button enabled again, text "Send Invoice Email"
- No button state stuck in loading

---

## Scenario 10: Missing Email Address Graceful Handling

### Steps
1. Create invoice without customer email
2. Navigate to invoice details
3. Verify button state

### Expected Results
- Button is disabled with gray styling
- Button shows message in tooltip: "No customer email available"
- Button click does nothing
- Error toast does not appear (button prevents action)
- Button becomes enabled after updating customer email

---

## Scenario 11: Concurrent Email Sends

### Steps
1. Create invoice 1 with customer A
2. Create invoice 2 with customer B
3. Click "Send Invoice Email" for invoice 1
4. While sending (before completion), click "Send Invoice Email" for invoice 2
5. Verify both emails are sent

### Expected Results
- First button shows "Sending...", second button enabled
- Both requests are processed independently
- Two separate entries in email_notifications
- Both emails are sent successfully
- No race conditions or data corruption

---

## Scenario 12: Email Content Verification

### Steps
1. Create invoice with amount 50,000 INR
2. Send invoice email
3. Check email template rendering
4. Verify placeholders replaced correctly

### Expected Results
- Email subject: "Invoice #INV-20260416-0001 - Project Name"
- Email body contains:
  - Invoice number: INV-20260416-0001
  - Project name: Correctly filled
  - Amount: ₹50,000 (formatted with locale)
  - Invoice date: DD/MM/YYYY format
  - Due date: DD/MM/YYYY format
  - View link: Correct URL to invoice page
  - No placeholder values like [INVOICE_NUMBER]

---

## Regression Tests

### Test: Existing Features Still Work
- Invoice creation without email trigger
- Task creation without reminder trigger
- Welcome email on signup (not affected)
- Status update emails (not affected)
- Other notifications unchanged

### Test: Database Integrity
- email_notifications table populated correctly
- No duplicate entries for single send
- Metadata preserved accurately
- Status transitions working (pending -> sent)

### Test: UI Integration
- Buttons appear in correct locations
- Toast notifications use correct styling
- Loading states are visible
- Error messages are clear

---

## Performance Tests

### Test: Email Queue Performance
- Sending 10 emails sequentially: Should complete in <10 seconds
- Sending 5 concurrent emails: Should complete without errors

### Test: Database Logging
- Each email logged within <500ms
- No database locks or timeouts
- Query response times <100ms

---

## Security Tests

### Test: No Email Leakage
- Emails not sent to wrong recipients
- Email addresses properly validated
- No emails in console logs (except user.id)

### Test: Rate Limiting
- Single invoice can be sent multiple times (expected)
- No rate limiting on manual send
- Resend API respects rate limits

---

## Accessibility Tests

### Test: Screen Reader Support
- Button text is meaningful
- Disabled state communicated
- Toast notifications announced

### Test: Keyboard Navigation
- Button focusable
- Can activate with Enter key
- Tab navigation works

---

## Summary
- Total Test Scenarios: 12 Main + Regression + Performance + Security + Accessibility
- Priority: High (Manual email triggering is core feature)
- Success Criteria: All scenarios pass without errors
- Regression: All existing features continue to work as before
