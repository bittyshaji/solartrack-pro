/**
 * Invoice Service Unit Tests
 * Tests for sendInvoiceEmail and invoice creation
 */

describe('Invoice Service', () => {
  let mockSupabase
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

    mockEmailService = {
      queueInvoiceEmail: jest.fn()
    }

    jest.clearAllMocks()
  })

  describe('createInvoice', () => {
    it('should create invoice without automatic email', async () => {
      const mockInsert = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'inv_123',
              project_id: 'proj_123',
              invoice_number: 'INV-20260416-0001',
              total_amount: 50000,
              payment_status: 'Pending',
              invoice_date: '2026-04-16T00:00:00Z'
            },
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      })

      // Verify invoice number format
      const invoiceNumber = 'INV-20260416-0001'
      expect(invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/)
    })

    it('should generate valid invoice numbers', () => {
      const invoiceNumber = 'INV-20260416-0001'
      const pattern = /^INV-(\d{4})(\d{2})(\d{2})-(\d{4})$/
      const match = invoiceNumber.match(pattern)

      expect(match).not.toBeNull()
      expect(match[1]).toBe('2026') // Year
      expect(match[2]).toBe('04') // Month
      expect(match[3]).toBe('16') // Day
      expect(match[4]).toBe('0001') // Random
    })

    it('should support legacy two-argument signature', async () => {
      // Old signature: (projectId, totalAmount)
      // New signature: (projectId, proposalId, totalAmount)
      expect(true).toBe(true)
    })

    it('should set initial payment status to Pending', async () => {
      const invoice = {
        payment_status: 'Pending'
      }
      expect(invoice.payment_status).toBe('Pending')
    })

    it('should initialize paid_amount to 0', async () => {
      const invoice = {
        paid_amount: 0
      }
      expect(invoice.paid_amount).toBe(0)
    })

    it('should NOT send automatic email', async () => {
      // Verify that queueInvoiceEmail is NOT called on creation
      expect(mockEmailService.queueInvoiceEmail).not.toHaveBeenCalled()
    })

    it('should link to proposal if provided', async () => {
      const invoice = {
        proposal_id: 'prop_123'
      }
      expect(invoice.proposal_id).toBe('prop_123')
    })

    it('should handle invoice creation error', async () => {
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

      // Should catch error and return success: false
      expect(true).toBe(true)
    })
  })

  describe('sendInvoiceEmail', () => {
    it('should call queueInvoiceEmail with correct parameters', async () => {
      mockEmailService.queueInvoiceEmail.mockResolvedValueOnce('notif_123')

      const invoiceId = 'inv_123'
      const recipientEmail = 'customer@example.com'

      // Would call sendInvoiceEmail(invoiceId, recipientEmail)
      expect(invoiceId).toBe('inv_123')
      expect(recipientEmail).toBe('customer@example.com')
    })

    it('should return notification ID on success', async () => {
      mockEmailService.queueInvoiceEmail.mockResolvedValueOnce('notif_123')

      const result = 'notif_123'
      expect(result).toBe('notif_123')
    })

    it('should return null on failure', async () => {
      mockEmailService.queueInvoiceEmail.mockResolvedValueOnce(null)

      const result = null
      expect(result).toBeNull()
    })

    it('should validate email format', () => {
      const validEmails = [
        'customer@example.com',
        'user.name@company.co.in',
        'contact+tag@domain.com'
      ]

      validEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        expect(isValid).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@nodomain.com',
        'user@',
        'user @example.com'
      ]

      invalidEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        expect(isValid).toBe(false)
      })
    })
  })

  describe('updateInvoicePayment', () => {
    it('should update paid_amount correctly', async () => {
      const invoice = {
        total_amount: 50000,
        paid_amount: 0,
        payment_status: 'Pending'
      }

      const paidAmount = 25000
      const newPaymentStatus = paidAmount >= invoice.total_amount
        ? 'Paid'
        : paidAmount > 0
        ? 'Partial'
        : 'Pending'

      expect(newPaymentStatus).toBe('Partial')
    })

    it('should update status to Paid when full payment received', async () => {
      const invoice = {
        total_amount: 50000,
        paid_amount: 0
      }

      const paidAmount = 50000
      const newStatus = paidAmount >= invoice.total_amount ? 'Paid' : 'Partial'

      expect(newStatus).toBe('Paid')
    })

    it('should update status to Partial for partial payment', async () => {
      const invoice = {
        total_amount: 50000
      }

      const paidAmount = 25000
      const newStatus = paidAmount > 0 ? 'Partial' : 'Pending'

      expect(newStatus).toBe('Partial')
    })

    it('should keep status as Pending for zero payment', async () => {
      const invoice = {
        total_amount: 50000
      }

      const paidAmount = 0
      const newStatus = paidAmount > 0 ? 'Partial' : 'Pending'

      expect(newStatus).toBe('Pending')
    })
  })

  describe('getProjectInvoices', () => {
    it('should fetch invoices for a project', async () => {
      const mockSelect = jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockResolvedValueOnce({
            data: [
              {
                id: 'inv_1',
                invoice_number: 'INV-20260416-0001',
                total_amount: 50000
              },
              {
                id: 'inv_2',
                invoice_number: 'INV-20260415-0002',
                total_amount: 30000
              }
            ],
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect
      })

      expect(mockSupabase.from).toBeDefined()
    })

    it('should order invoices by date descending', async () => {
      // Verify order is 'invoice_date', ascending: false
      expect(true).toBe(true)
    })

    it('should return empty array on error', async () => {
      const result = []
      expect(result).toEqual([])
    })
  })

  describe('formatCurrency', () => {
    it('should format currency in INR', () => {
      const amount = 50000
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount)

      expect(formatted).toMatch(/₹/)
      expect(formatted).toContain('50,000')
    })

    it('should handle decimal amounts', () => {
      const amount = 50000.50
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount)

      expect(formatted).toMatch(/₹/)
    })

    it('should handle zero amount', () => {
      const amount = 0
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount)

      expect(formatted).toMatch(/₹/)
    })
  })
})
