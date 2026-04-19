/**
 * Customer Service Tests
 * Comprehensive tests for customer CRUD operations and validations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import * as customerService from '../customerService'
import * as apiClient from '../api/client'
import { createCustomer, createList } from '../../test/factories'
import { mockSuccessResponse, mockErrorResponse } from '../../test/mocks/api'

// Mock the API client
vi.mock('../api/client', () => ({
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  query: vi.fn(),
}))

describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCustomer', () => {
    it('should create a customer with required data', async () => {
      const mockCustomerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
      }

      const mockInsertResponse = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            customer_id: 'CUST-20260418-0000',
            ...mockCustomerData,
          },
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockInsertResponse
      )

      const result = await customerService.createCustomer(mockCustomerData)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe(mockCustomerData.name)
      expect(result.data.email).toBe(mockCustomerData.email)
      expect(result.customerId).toMatch(/^CUST-\d{8}-\d{4}$/)
    })

    it('should fail without customer name', async () => {
      const result = await customerService.createCustomer({
        email: 'test@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Customer name is required')
    })

    it('should handle database errors', async () => {
      const mockInsertResponse = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockInsertResponse
      )

      const result = await customerService.createCustomer({
        name: 'Test Customer',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getAllCustomers', () => {
    it('should return all active customers', async () => {
      const mockCustomers = [
        {
          customer_id: 'CUST-20260418-0001',
          name: 'John Doe',
          email: 'john@example.com',
          is_active: true,
        },
        {
          customer_id: 'CUST-20260418-0002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          is_active: true,
        },
      ]

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCustomers,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await customerService.getAllCustomers()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)
      expect(result[0].name).toBe('John Doe')
    })

    it('should return empty array on error', async () => {
      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await customerService.getAllCustomers()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
  })

  describe('getCustomerById', () => {
    it('should return customer by ID', async () => {
      const mockCustomer = {
        customer_id: 'CUST-20260418-0001',
        name: 'John Doe',
        email: 'john@example.com',
      }

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCustomer,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await customerService.getCustomerById(
        'CUST-20260418-0001'
      )

      expect(result.customer_id).toBe('CUST-20260418-0001')
      expect(result.name).toBe('John Doe')
    })

    it('should return null if customer not found', async () => {
      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await customerService.getCustomerById('INVALID-ID')

      expect(result).toBeNull()
    })
  })

  describe('updateCustomer', () => {
    it('should update customer information', async () => {
      const mockUpdatedCustomer = {
        customer_id: 'CUST-20260418-0001',
        name: 'John Updated',
        email: 'john.updated@example.com',
      }

      const mockUpdateResponse = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedCustomer,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockUpdateResponse
      )

      const result = await customerService.updateCustomer(
        'CUST-20260418-0001',
        { name: 'John Updated', email: 'john.updated@example.com' }
      )

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('John Updated')
    })

    it('should handle update errors', async () => {
      const mockUpdateResponse = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockUpdateResponse
      )

      const result = await customerService.updateCustomer(
        'CUST-20260418-0001',
        { name: 'Updated' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('deactivateCustomer', () => {
    it('should deactivate a customer', async () => {
      const mockUpdateResponse = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockUpdateResponse
      )

      const result = await customerService.deactivateCustomer(
        'CUST-20260418-0001'
      )

      expect(result.success).toBe(true)
    })

    it('should handle deactivation errors', async () => {
      const mockUpdateResponse = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Deactivation failed' },
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockUpdateResponse
      )

      const result = await customerService.deactivateCustomer(
        'CUST-20260418-0001'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('searchCustomers', () => {
    it('should search customers by name', async () => {
      const mockSearchResults = [
        {
          customer_id: 'CUST-20260418-0001',
          name: 'John Doe',
          email: 'john@example.com',
        },
      ]

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockSearchResults,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await customerService.searchCustomers('John')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      expect(result[0].name).toContain('John')
    })

    it('should return empty array if no matches', async () => {
      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await customerService.searchCustomers('NonExistent')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
  })

  describe('getCustomerCount', () => {
    it('should return customer count', async () => {
      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await customerService.getCustomerCount()

      expect(typeof result).toBe('number')
      expect(result).toBe(5)
    })

    it('should return 0 on error', async () => {
      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: 'Error' },
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await customerService.getCustomerCount()

      expect(result).toBe(0)
    })
  })
})
