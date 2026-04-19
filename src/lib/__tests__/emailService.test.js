/**
 * Email Service Tests
 * Tests for email sending, templating, and queue management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import * as emailService from '../emailService'
import * as apiClient from '../api/client'
import { createEmail } from '../../test/factories'

vi.mock('../api/client', () => ({
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: vi.fn(),
}))

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('sendEmail', () => {
    it('should send email with valid data', async () => {
      const emailData = {
        to: 'customer@example.com',
        subject: 'Project Update',
        body: 'Your project has been updated',
        project_id: 'proj-001',
      }

      const mockInsert = vi.fn().mockResolvedValue(createEmail(emailData))

      apiClient.insert.mockImplementation(mockInsert)

      const result = await emailService.sendEmail(emailData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should validate email recipient', async () => {
      const result = await emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('invalid email')
    })

    it('should require email subject', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        body: 'Test body',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('subject is required')
    })

    it('should require email body', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('body is required')
    })

    it('should handle API errors', async () => {
      const mockInsert = vi
        .fn()
        .mockRejectedValue(new Error('Email service error'))

      apiClient.insert.mockImplementation(mockInsert)

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
      })

      expect(result.success).toBe(false)
    })

    it('should support CC and BCC', async () => {
      const emailData = {
        to: 'primary@example.com',
        cc: 'copy@example.com',
        bcc: 'blind@example.com',
        subject: 'Test',
        body: 'Test',
      }

      const mockInsert = vi.fn().mockResolvedValue(createEmail(emailData))

      apiClient.insert.mockImplementation(mockInsert)

      const result = await emailService.sendEmail(emailData)

      expect(result.success).toBe(true)
    })

    it('should support multiple recipients', async () => {
      const emailData = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Broadcast',
        body: 'Broadcast message',
      }

      const mockInsert = vi.fn().mockResolvedValue(createEmail(emailData))

      apiClient.insert.mockImplementation(mockInsert)

      const result = await emailService.sendEmail(emailData)

      expect(result.success).toBe(true)
    })
  })

  describe('queueEmail', () => {
    it('should queue email for later sending', async () => {
      const emailData = {
        to: 'customer@example.com',
        subject: 'Delayed Email',
        body: 'This will be sent later',
        scheduleFor: new Date(Date.now() + 3600000).toISOString(),
      }

      const mockInsert = vi
        .fn()
        .mockResolvedValue(createEmail({ ...emailData, status: 'queued' }))

      apiClient.insert.mockImplementation(mockInsert)

      const result = await emailService.queueEmail(emailData)

      expect(result.success).toBe(true)
    })

    it('should validate scheduled time is in future', async () => {
      const pastTime = new Date(Date.now() - 3600000).toISOString()

      const result = await emailService.queueEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        scheduleFor: pastTime,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('future')
    })

    it('should set queued status', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        scheduleFor: new Date(Date.now() + 3600000).toISOString(),
      }

      const mockInsert = vi.fn()

      apiClient.insert.mockImplementation(mockInsert)

      await emailService.queueEmail(emailData)

      const callData = mockInsert.mock.calls[0][1]
      expect(callData.status).toBe('queued')
    })
  })

  describe('sendEmailWithTemplate', () => {
    it('should send email using template', async () => {
      const emailData = {
        to: 'customer@example.com',
        template: 'project_update',
        templateData: {
          projectName: 'Solar Installation',
          status: 'In Progress',
        },
        project_id: 'proj-001',
      }

      const mockInsert = vi.fn().mockResolvedValue(createEmail(emailData))

      apiClient.insert.mockImplementation(mockInsert)

      const result = await emailService.sendEmailWithTemplate(emailData)

      expect(result.success).toBe(true)
    })

    it('should validate template exists', async () => {
      const result = await emailService.sendEmailWithTemplate({
        to: 'test@example.com',
        template: 'nonexistent_template',
        templateData: {},
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('template')
    })

    it('should support multiple template types', async () => {
      const templates = [
        'project_update',
        'invoice_reminder',
        'completion_notice',
        'status_change',
      ]

      for (const template of templates) {
        const mockInsert = vi.fn().mockResolvedValue(createEmail({ template }))

        apiClient.insert.mockImplementation(mockInsert)

        const result = await emailService.sendEmailWithTemplate({
          to: 'test@example.com',
          template,
          templateData: {},
        })

        expect(result.success).toBe(true)
      }
    })

    it('should render template with data', async () => {
      const emailData = {
        to: 'customer@example.com',
        template: 'invoice_reminder',
        templateData: {
          invoiceNumber: 'INV-2026-001',
          amount: 5000,
          dueDate: '2026-05-18',
        },
      }

      const mockInsert = vi.fn()

      apiClient.insert.mockImplementation(mockInsert)

      await emailService.sendEmailWithTemplate(emailData)

      expect(mockInsert).toHaveBeenCalled()
    })
  })

  describe('getEmailQueue', () => {
    it('should retrieve pending emails', async () => {
      const mockQueuedEmails = [
        createEmail({ status: 'queued' }),
        createEmail({ status: 'queued' }),
      ]

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockQueuedEmails),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await emailService.getEmailQueue()

      expect(result.length).toBe(2)
      expect(mockQueryBuilder.filter).toHaveBeenCalledWith(
        'status',
        'eq',
        'queued'
      )
    })

    it('should return empty array if no queued emails', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await emailService.getEmailQueue()

      expect(result.length).toBe(0)
    })

    it('should sort by created date', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      await emailService.getEmailQueue()

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'created_at',
        'asc'
      )
    })
  })

  describe('resendEmail', () => {
    it('should resend failed email', async () => {
      const emailId = 'email-001'

      const mockUpdate = vi.fn().mockResolvedValue({
        data: createEmail({ id: emailId, status: 'sent' }),
        error: null,
      })

      apiClient.update.mockImplementation(mockUpdate)

      const result = await emailService.resendEmail(emailId)

      expect(result.success).toBe(true)
    })

    it('should increment retry count', async () => {
      const emailId = 'email-001'

      const mockUpdate = vi.fn()

      apiClient.update.mockImplementation(mockUpdate)

      await emailService.resendEmail(emailId)

      const callData = mockUpdate.mock.calls[0][1]
      expect(callData.retry_count).toBeDefined()
    })

    it('should limit retry attempts', async () => {
      const emailId = 'email-001'

      const result = await emailService.resendEmail(emailId, 5)

      expect(result.success).toBe(false)
      expect(result.error).toContain('max retries')
    })

    it('should handle resend errors', async () => {
      const mockUpdate = vi
        .fn()
        .mockRejectedValue(new Error('Resend failed'))

      apiClient.update.mockImplementation(mockUpdate)

      const result = await emailService.resendEmail('email-001')

      expect(result.success).toBe(false)
    })
  })

  describe('deleteEmail', () => {
    it('should delete email', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      apiClient.delete.mockImplementation(mockDelete)

      const result = await emailService.deleteEmail('email-001')

      expect(result.success).toBe(true)
    })

    it('should not delete sent emails', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [createEmail({ status: 'sent' })],
        error: null,
      })

      apiClient.select.mockImplementation(mockSelect)

      const result = await emailService.deleteEmail('email-001')

      expect(result.success).toBe(false)
      expect(result.error).toContain('sent')
    })

    it('should handle deletion errors', async () => {
      const mockDelete = vi
        .fn()
        .mockRejectedValue(new Error('Delete failed'))

      apiClient.delete.mockImplementation(mockDelete)

      const result = await emailService.deleteEmail('email-001')

      expect(result.success).toBe(false)
    })
  })

  describe('getEmailsByProject', () => {
    it('should fetch all emails for a project', async () => {
      const projectId = 'proj-001'

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([createEmail({ project_id: projectId })]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await emailService.getEmailsByProject(projectId)

      expect(result.length).toBe(1)
      expect(mockQueryBuilder.filter).toHaveBeenCalledWith(
        'project_id',
        'eq',
        projectId
      )
    })

    it('should return empty array for unknown project', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await emailService.getEmailsByProject('proj-999')

      expect(result.length).toBe(0)
    })
  })

  describe('validateEmailAddress', () => {
    it('should validate correct email', () => {
      const valid = emailService.validateEmailAddress('user@example.com')
      expect(valid).toBe(true)
    })

    it('should reject invalid email format', () => {
      const valid = emailService.validateEmailAddress('invalid-email')
      expect(valid).toBe(false)
    })

    it('should reject empty string', () => {
      const valid = emailService.validateEmailAddress('')
      expect(valid).toBe(false)
    })

    it('should accept various valid formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@example-domain.com',
      ]

      validEmails.forEach(email => {
        expect(emailService.validateEmailAddress(email)).toBe(true)
      })
    })
  })
})
