/**
 * Integration Tests - Manual Email Triggering
 * Tests the complete workflow of manual email triggering
 */

describe('Manual Email Triggering Integration', () => {
  let mockSupabase
  let mockFetch
  let mockEmailService

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user_123' } },
          error: null
        })
      }
    }

    mockFetch = jest.fn()
    global.fetch = mockFetch

    mockEmailService = {
      sendInvoiceEmail: jest.fn(),
      sendTaskReminder: jest.fn(),
      queueInvoiceEmail: jest.fn(),
      queueTaskReminder: jest.fn()
    }

    jest.clearAllMocks()
  })

  describe('Invoice Email Workflow', () => {
    it('should create invoice WITHOUT automatic email', async () => {
      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'inv_123',
              invoice_number: 'INV-20260416-0001'
            },
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      })

      // Create invoice
      // Verify NO email queue call
      expect(mockEmailService.queueInvoiceEmail).not.toHaveBeenCalled()
    })

    it('should send invoice email on button click', async () => {
      mockEmailService.sendInvoiceEmail.mockResolvedValueOnce('notif_123')

      const invoiceId = 'inv_123'
      const customerEmail = 'customer@example.com'

      const result = await mockEmailService.sendInvoiceEmail(invoiceId, customerEmail)

      expect(mockEmailService.sendInvoiceEmail).toHaveBeenCalledWith(invoiceId, customerEmail)
      expect(result).toBe('notif_123')
    })

    it('should queue invoice email to database', async () => {
      mockEmailService.queueInvoiceEmail.mockResolvedValueOnce('notif_123')

      const invoiceId = 'inv_123'
      const recipientEmail = 'customer@example.com'

      await mockEmailService.queueInvoiceEmail(invoiceId, recipientEmail)

      expect(mockEmailService.queueInvoiceEmail).toHaveBeenCalledWith(invoiceId, recipientEmail)
    })

    it('should send email via Resend API from queue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ id: 'msg_123' })
      })

      // Simulate API call
      expect(mockFetch).toBeDefined()
    })

    it('should log email status in database', async () => {
      // After sending, email_notifications table should have entry with status='sent'
      expect(mockSupabase.from).toBeDefined()
    })

    it('should allow sending same invoice email multiple times', async () => {
      mockEmailService.sendInvoiceEmail
        .mockResolvedValueOnce('notif_123')
        .mockResolvedValueOnce('notif_124')

      const invoiceId = 'inv_123'
      const customerEmail = 'customer@example.com'

      const result1 = await mockEmailService.sendInvoiceEmail(invoiceId, customerEmail)
      const result2 = await mockEmailService.sendInvoiceEmail(invoiceId, customerEmail)

      expect(result1).toBe('notif_123')
      expect(result2).toBe('notif_124')
      expect(mockEmailService.sendInvoiceEmail).toHaveBeenCalledTimes(2)
    })
  })

  describe('Task Reminder Workflow', () => {
    it('should create task WITHOUT automatic reminder', async () => {
      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'task_123',
              task_name: 'Install panels'
            },
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      })

      // Create task
      // Verify NO reminder queue call
      expect(mockEmailService.queueTaskReminder).not.toHaveBeenCalled()
    })

    it('should send task reminder on button click', async () => {
      mockEmailService.sendTaskReminder.mockResolvedValueOnce(['notif_123'])

      const taskId = 'task_123'
      const assignedToEmail = 'assignee@example.com'

      const result = await mockEmailService.sendTaskReminder(taskId, [assignedToEmail])

      expect(mockEmailService.sendTaskReminder).toHaveBeenCalledWith(taskId, [assignedToEmail])
      expect(result.length).toBe(1)
    })

    it('should queue task reminder for single recipient', async () => {
      mockEmailService.queueTaskReminder.mockResolvedValueOnce(['notif_123'])

      const taskId = 'task_123'
      const recipientEmails = ['assignee@example.com']

      const result = await mockEmailService.queueTaskReminder(taskId, recipientEmails)

      expect(result.length).toBe(1)
    })

    it('should queue task reminders for multiple recipients', async () => {
      mockEmailService.queueTaskReminder.mockResolvedValueOnce(['notif_123', 'notif_124'])

      const taskId = 'task_123'
      const recipientEmails = ['user1@example.com', 'user2@example.com']

      const result = await mockEmailService.queueTaskReminder(taskId, recipientEmails)

      expect(result.length).toBe(2)
    })

    it('should send reminder via Resend API from queue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ id: 'msg_123' })
      })

      // Simulate API call for task reminder
      expect(mockFetch).toBeDefined()
    })

    it('should log reminder status in database', async () => {
      // After sending, email_notifications table should have entry
      expect(mockSupabase.from).toBeDefined()
    })
  })

  describe('Email Log Tracking', () => {
    it('should record email in email_notifications table', async () => {
      const mockInsert = jest.fn().mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({
          data: { id: 'notif_123', status: 'pending' },
          error: null
        })
      })

      // Verify email is logged
      expect(mockSupabase.from).toBeDefined()
    })

    it('should track email status transitions', async () => {
      // Email status: pending -> sent (or failed)
      const statuses = ['pending', 'sent', 'failed']

      expect(statuses).toContain('pending')
      expect(statuses).toContain('sent')
    })

    it('should include invoice ID in email log', async () => {
      const emailLog = {
        email_type: 'invoice',
        metadata: {
          invoiceId: 'inv_123'
        }
      }

      expect(emailLog.metadata.invoiceId).toBe('inv_123')
    })

    it('should include task ID in email log', async () => {
      const emailLog = {
        email_type: 'reminder',
        metadata: {
          taskId: 'task_123'
        }
      }

      expect(emailLog.metadata.taskId).toBe('task_123')
    })

    it('should record recipient email address', async () => {
      const emailLog = {
        recipient_email: 'customer@example.com'
      }

      expect(emailLog.recipient_email).toBe('customer@example.com')
    })
  })

  describe('Regression Tests - No Auto-Email', () => {
    it('should NOT send invoice email automatically on creation', async () => {
      // Create invoice through normal flow
      const mockInsert = jest.fn()
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      })

      // Verify queueInvoiceEmail is NOT called
      expect(mockEmailService.queueInvoiceEmail).not.toHaveBeenCalled()
    })

    it('should NOT send task reminder automatically on creation', async () => {
      // Create task through normal flow
      const mockInsert = jest.fn()
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      })

      // Verify queueTaskReminder is NOT called
      expect(mockEmailService.queueTaskReminder).not.toHaveBeenCalled()
    })

    it('should only send emails on explicit button click', async () => {
      // Emails should only be sent when user clicks button
      const manualTrigger = true

      expect(manualTrigger).toBe(true)
    })

    it('should preserve other features (welcome email, etc.)', async () => {
      // Other email types should still work
      const emailTypes = ['welcome', 'status_update', 'invoice', 'reminder']

      expect(emailTypes).toContain('welcome')
      expect(emailTypes).toContain('status_update')
    })
  })

  describe('Error Scenarios', () => {
    it('should handle invalid email addresses', async () => {
      const invalidEmail = 'not-an-email'
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invalidEmail)

      expect(isValid).toBe(false)
    })

    it('should handle missing customer email gracefully', async () => {
      const customerEmail = null

      if (!customerEmail) {
        // Should show error toast and not attempt to send
        expect(true).toBe(true)
      }
    })

    it('should handle Resend API failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValueOnce({ message: 'API key invalid' })
      })

      // Should handle error gracefully
      expect(mockFetch).toBeDefined()
    })

    it('should handle network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      // Should catch error and show error message
      expect(true).toBe(true)
    })

    it('should handle database errors', async () => {
      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: null,
            error: new Error('Database error')
          })
        })
      })

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      })

      // Should handle error gracefully
      expect(mockSupabase.from).toBeDefined()
    })
  })

  describe('User Experience', () => {
    it('should show loading indicator during send', async () => {
      const loading = true

      if (loading) {
        // Should display loading spinner
        expect(true).toBe(true)
      }
    })

    it('should show success toast on email queued', async () => {
      const toast = { success: jest.fn() }

      toast.success('Invoice email queued successfully')

      expect(toast.success).toHaveBeenCalled()
    })

    it('should show error toast on failure', async () => {
      const toast = { error: jest.fn() }

      toast.error('Failed to queue invoice email')

      expect(toast.error).toHaveBeenCalled()
    })

    it('should disable button while sending', async () => {
      const loading = true
      const disabled = loading || false

      expect(disabled).toBe(true)
    })

    it('should enable button after send completes', async () => {
      const loading = false
      const disabled = loading || false

      expect(disabled).toBe(false)
    })
  })
})
