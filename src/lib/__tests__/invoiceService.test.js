/**
 * Invoice Service Tests
 * Comprehensive tests for invoice CRUD operations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import * as invoiceService from '../invoiceService'
import * as apiClient from '../api/client'
import { createInvoice, createList } from '../../test/factories'

vi.mock('../api/client', () => ({
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: vi.fn(),
}))

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createInvoice', () => {
    it('should create invoice with all fields', async () => {
      const invoiceData = {
        project_id: 'proj-001',
        customer_id: 'cust-001',
        amount: 5000,
        tax: 500,
        status: 'Draft',
      }

      const mockInsert = vi
        .fn()
        .mockResolvedValue(createInvoice(invoiceData))

      apiClient.insert.mockImplementation(mockInsert)

      const result = await invoiceService.createInvoice(invoiceData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should validate required fields', async () => {
      const result = await invoiceService.createInvoice({
        project_id: 'proj-001',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should calculate total with tax', async () => {
      const invoiceData = {
        project_id: 'proj-001',
        customer_id: 'cust-001',
        amount: 1000,
        tax: 100,
      }

      const mockInsert = vi.fn()

      apiClient.insert.mockImplementation(mockInsert)

      await invoiceService.createInvoice(invoiceData)

      expect(mockInsert).toHaveBeenCalled()
      const callData = mockInsert.mock.calls[0][1]
      expect(callData.total).toBe(1100)
    })

    it('should handle negative amounts', async () => {
      const result = await invoiceService.createInvoice({
        project_id: 'proj-001',
        customer_id: 'cust-001',
        amount: -1000,
        tax: -100,
      })

      expect(result.success).toBe(false)
    })

    it('should set default status to Draft', async () => {
      const invoiceData = {
        project_id: 'proj-001',
        customer_id: 'cust-001',
        amount: 5000,
      }

      const mockInsert = vi.fn()

      apiClient.insert.mockImplementation(mockInsert)

      await invoiceService.createInvoice(invoiceData)

      const callData = mockInsert.mock.calls[0][1]
      expect(callData.status).toBe('Draft')
    })

    it('should set issued_date to current date', async () => {
      const invoiceData = {
        project_id: 'proj-001',
        customer_id: 'cust-001',
        amount: 5000,
      }

      const mockInsert = vi.fn()

      apiClient.insert.mockImplementation(mockInsert)

      await invoiceService.createInvoice(invoiceData)

      const callData = mockInsert.mock.calls[0][1]
      expect(callData.issued_date).toBeDefined()
    })
  })

  describe('getInvoiceById', () => {
    it('should fetch invoice by ID', async () => {
      const mockInvoice = createInvoice({ id: 'inv-001' })

      const mockSelect = vi.fn().mockResolvedValue({
        data: [mockInvoice],
        error: null,
      })

      apiClient.select.mockImplementation(mockSelect)

      const result = await invoiceService.getInvoiceById('inv-001')

      expect(result).toEqual(mockInvoice)
    })

    it('should return null if not found', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      apiClient.select.mockImplementation(mockSelect)

      const result = await invoiceService.getInvoiceById('nonexistent')

      expect(result).toBeNull()
    })

    it('should handle API errors', async () => {
      const mockSelect = vi
        .fn()
        .mockRejectedValue(new Error('API error'))

      apiClient.select.mockImplementation(mockSelect)

      const result = await invoiceService.getInvoiceById('inv-001')

      expect(result).toBeNull()
    })
  })

  describe('getInvoicesByProject', () => {
    it('should fetch all invoices for a project', async () => {
      const projectId = 'proj-001'
      const mockInvoices = createList(
        createInvoice,
        3,
        { project_id: projectId }
      )

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockInvoices),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await invoiceService.getInvoicesByProject(projectId)

      expect(result.length).toBe(3)
      expect(mockQueryBuilder.filter).toHaveBeenCalledWith(
        'project_id',
        'eq',
        projectId
      )
    })

    it('should return empty array if no invoices', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await invoiceService.getInvoicesByProject('proj-999')

      expect(result.length).toBe(0)
    })

    it('should handle query errors', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Query error')),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await invoiceService.getInvoicesByProject('proj-001')

      expect(result.length).toBe(0)
    })
  })

  describe('getInvoicesByCustomer', () => {
    it('should fetch all invoices for a customer', async () => {
      const customerId = 'cust-001'
      const mockInvoices = createList(
        createInvoice,
        2,
        { customer_id: customerId }
      )

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockInvoices),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await invoiceService.getInvoicesByCustomer(customerId)

      expect(result.length).toBe(2)
    })

    it('should return empty array for unknown customer', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await invoiceService.getInvoicesByCustomer('cust-999')

      expect(result.length).toBe(0)
    })
  })

  describe('updateInvoiceStatus', () => {
    it('should update invoice status to Sent', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: createInvoice({ status: 'Sent' }),
        error: null,
      })

      apiClient.update.mockImplementation(mockUpdate)

      const result = await invoiceService.updateInvoiceStatus('inv-001', 'Sent')

      expect(result.success).toBe(true)
    })

    it('should update invoice status to Paid', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: createInvoice({ status: 'Paid' }),
        error: null,
      })

      apiClient.update.mockImplementation(mockUpdate)

      const result = await invoiceService.updateInvoiceStatus('inv-001', 'Paid')

      expect(result.success).toBe(true)
    })

    it('should reject invalid status', async () => {
      const result = await invoiceService.updateInvoiceStatus(
        'inv-001',
        'InvalidStatus'
      )

      expect(result.success).toBe(false)
    })

    it('should handle update errors', async () => {
      const mockUpdate = vi
        .fn()
        .mockRejectedValue(new Error('Update failed'))

      apiClient.update.mockImplementation(mockUpdate)

      const result = await invoiceService.updateInvoiceStatus('inv-001', 'Paid')

      expect(result.success).toBe(false)
    })
  })

  describe('deleteInvoice', () => {
    it('should delete an invoice', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      apiClient.delete.mockImplementation(mockDelete)

      const result = await invoiceService.deleteInvoice('inv-001')

      expect(result.success).toBe(true)
    })

    it('should require invoice ID', async () => {
      const result = await invoiceService.deleteInvoice('')

      expect(result.success).toBe(false)
    })

    it('should handle deletion errors', async () => {
      const mockDelete = vi
        .fn()
        .mockRejectedValue(new Error('Deletion failed'))

      apiClient.delete.mockImplementation(mockDelete)

      const result = await invoiceService.deleteInvoice('inv-001')

      expect(result.success).toBe(false)
    })

    it('should not delete paid invoices', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [createInvoice({ status: 'Paid' })],
        error: null,
      })

      apiClient.select.mockImplementation(mockSelect)

      const result = await invoiceService.deleteInvoice('inv-001')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Paid invoices cannot be deleted')
    })
  })

  describe('getInvoiceTotals', () => {
    it('should calculate total revenue', async () => {
      const mockInvoices = [
        createInvoice({ amount: 1000, tax: 100 }),
        createInvoice({ amount: 2000, tax: 200 }),
      ]

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockInvoices),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await invoiceService.getInvoiceTotals('paid')

      expect(result.totalAmount).toBe(3000)
      expect(result.totalTax).toBe(300)
      expect(result.totalDue).toBe(3300)
    })

    it('should filter by status', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      await invoiceService.getInvoiceTotals('draft')

      expect(mockQueryBuilder.filter).toHaveBeenCalledWith(
        'status',
        'eq',
        'Draft'
      )
    })

    it('should handle empty invoice list', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await invoiceService.getInvoiceTotals('paid')

      expect(result.totalAmount).toBe(0)
      expect(result.totalTax).toBe(0)
      expect(result.totalDue).toBe(0)
    })
  })

  describe('validateInvoiceData', () => {
    it('should validate complete invoice data', () => {
      const valid = invoiceService.validateInvoiceData({
        project_id: 'proj-001',
        customer_id: 'cust-001',
        amount: 5000,
        tax: 500,
      })

      expect(valid).toBe(true)
    })

    it('should require project_id', () => {
      const valid = invoiceService.validateInvoiceData({
        customer_id: 'cust-001',
        amount: 5000,
      })

      expect(valid).toBe(false)
    })

    it('should require positive amount', () => {
      const valid = invoiceService.validateInvoiceData({
        project_id: 'proj-001',
        customer_id: 'cust-001',
        amount: 0,
      })

      expect(valid).toBe(false)
    })

    it('should reject invalid tax', () => {
      const valid = invoiceService.validateInvoiceData({
        project_id: 'proj-001',
        customer_id: 'cust-001',
        amount: 5000,
        tax: -500,
      })

      expect(valid).toBe(false)
    })
  })
})
