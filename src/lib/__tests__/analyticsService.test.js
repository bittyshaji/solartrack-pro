/**
 * Analytics Service Tests
 * Tests for analytics calculations and aggregations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import * as analyticsService from '../analyticsService'
import * as apiClient from '../api/client'
import { createProject, createInvoice, createList } from '../../test/factories'

vi.mock('../api/client', () => ({
  query: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
}))

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getProjectStats', () => {
    it('should calculate project statistics', async () => {
      const mockProjects = [
        createProject({ status: 'Completed' }),
        createProject({ status: 'In Progress' }),
        createProject({ status: 'Planning' }),
      ]

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getProjectStats()

      expect(result.total).toBe(3)
      expect(result.completed).toBe(1)
      expect(result.inProgress).toBe(1)
      expect(result.planning).toBe(1)
    })

    it('should calculate completion rate', async () => {
      const mockProjects = [
        createProject({ status: 'Completed' }),
        createProject({ status: 'Completed' }),
        createProject({ status: 'In Progress' }),
        createProject({ status: 'Planning' }),
      ]

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getProjectStats()

      expect(result.completionRate).toBe(0.5)
    })

    it('should handle empty project list', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getProjectStats()

      expect(result.total).toBe(0)
      expect(result.completionRate).toBe(0)
    })

    it('should handle API errors gracefully', async () => {
      const mockQueryBuilder = {
        execute: vi
          .fn()
          .mockRejectedValue(new Error('API error')),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getProjectStats()

      expect(result.total).toBe(0)
      expect(result.error).toBeDefined()
    })
  })

  describe('getRevenueStats', () => {
    it('should calculate total revenue', async () => {
      const mockInvoices = [
        createInvoice({ amount: 1000, status: 'Paid' }),
        createInvoice({ amount: 2000, status: 'Paid' }),
        createInvoice({ amount: 1500, status: 'Sent' }),
      ]

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockInvoices),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getRevenueStats()

      expect(result.totalRevenue).toBe(4500)
    })

    it('should calculate average invoice amount', async () => {
      const mockInvoices = [
        createInvoice({ amount: 1000 }),
        createInvoice({ amount: 2000 }),
        createInvoice({ amount: 3000 }),
      ]

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockInvoices),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getRevenueStats()

      expect(result.averageInvoiceAmount).toBe(2000)
    })

    it('should separate paid and unpaid revenue', async () => {
      const mockInvoices = [
        createInvoice({ amount: 1000, status: 'Paid' }),
        createInvoice({ amount: 500, status: 'Paid' }),
        createInvoice({ amount: 800, status: 'Sent' }),
      ]

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockInvoices),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getRevenueStats()

      expect(result.paidRevenue).toBe(1500)
      expect(result.unpaidRevenue).toBe(800)
    })

    it('should calculate collection rate', async () => {
      const mockInvoices = [
        createInvoice({ amount: 1000, status: 'Paid' }),
        createInvoice({ amount: 1000, status: 'Paid' }),
        createInvoice({ amount: 1000, status: 'Sent' }),
      ]

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockInvoices),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getRevenueStats()

      expect(result.collectionRate).toBeCloseTo(0.667, 2)
    })

    it('should handle zero invoices', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getRevenueStats()

      expect(result.totalRevenue).toBe(0)
      expect(result.averageInvoiceAmount).toBe(0)
    })
  })

  describe('getCustomerStats', () => {
    it('should count total customers', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([
          { id: 'cust-1' },
          { id: 'cust-2' },
          { id: 'cust-3' },
        ]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getCustomerStats()

      expect(result.totalCustomers).toBe(3)
    })

    it('should calculate customer lifetime value', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([
          { customer_id: 'cust-1', amount: 5000 },
          { customer_id: 'cust-1', amount: 3000 },
          { customer_id: 'cust-2', amount: 4000 },
        ]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getCustomerStats()

      expect(result.avgCustomerValue).toBeGreaterThan(0)
    })

    it('should identify top customers', async () => {
      const mockQueryBuilder = {
        execute: vi
          .fn()
          .mockResolvedValueOnce([{ id: 'cust-1' }, { id: 'cust-2' }])
          .mockResolvedValueOnce([
            { customer_id: 'cust-1', total: 10000 },
            { customer_id: 'cust-2', total: 5000 },
          ]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getCustomerStats()

      expect(result.topCustomers).toBeDefined()
    })

    it('should handle empty customer list', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getCustomerStats()

      expect(result.totalCustomers).toBe(0)
    })
  })

  describe('getMonthlyTrends', () => {
    it('should calculate monthly project trends', async () => {
      const now = new Date()
      const mockProjects = [
        createProject({
          created_at: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        }),
        createProject({
          created_at: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
        }),
        createProject({
          created_at: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        }),
      ]

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getMonthlyTrends()

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('month')
      expect(result[0]).toHaveProperty('projects')
      expect(result[0]).toHaveProperty('revenue')
    })

    it('should aggregate by month', async () => {
      const mockProjects = createList(createProject, 12)

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getMonthlyTrends()

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return trends for specified period', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getMonthlyTrends(6)

      expect(result.length).toBeLessThanOrEqual(6)
    })
  })

  describe('getStageAnalysis', () => {
    it('should count projects by stage', async () => {
      const mockProjects = [
        createProject({ stage: 1 }),
        createProject({ stage: 1 }),
        createProject({ stage: 2 }),
        createProject({ stage: 3 }),
      ]

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getStageAnalysis()

      expect(result.stage1).toBe(2)
      expect(result.stage2).toBe(1)
      expect(result.stage3).toBe(1)
    })

    it('should calculate average days in stage', async () => {
      const mockProjects = createList(createProject, 5)

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getStageAnalysis()

      expect(result.avgDaysInStage).toBeDefined()
    })

    it('should identify bottlenecks', async () => {
      const mockProjects = [
        createProject({ stage: 3 }),
        createProject({ stage: 3 }),
        createProject({ stage: 3 }),
        createProject({ stage: 3 }),
        createProject({ stage: 1 }),
      ]

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getStageAnalysis()

      expect(result.bottleneck).toBe(3)
    })
  })

  describe('getPipelineForecast', () => {
    it('should forecast future revenue', async () => {
      const mockProjects = createList(createProject, 10, {
        estimated_cost: 5000,
        status: 'In Progress',
      })

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getPipelineForecast()

      expect(result.forecastedRevenue).toBeGreaterThan(0)
      expect(result.forecastedProjects).toBe(10)
    })

    it('should consider completion probability', async () => {
      const mockProjects = [
        createProject({ status: 'In Progress', stage: 8 }),
        createProject({ status: 'Planning', stage: 1 }),
      ]

      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getPipelineForecast()

      expect(result.confidenceScore).toBeDefined()
    })

    it('should project by timeframe', async () => {
      const mockQueryBuilder = {
        filter: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getPipelineForecast('30days')

      expect(result.timeframe).toBe('30days')
    })
  })

  describe('getTeamPerformance', () => {
    it('should calculate team productivity', async () => {
      const mockProjects = createList(createProject, 5, {
        assigned_to: 'team-member-1',
      })

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getTeamPerformance()

      expect(result.members).toBeDefined()
      expect(Array.isArray(result.members)).toBe(true)
    })

    it('should rank team members by output', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getTeamPerformance()

      expect(result.topPerformers).toBeDefined()
    })

    it('should calculate utilization rates', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getTeamPerformance()

      expect(result.avgUtilization).toBeDefined()
    })
  })

  describe('getCompletionFunnel', () => {
    it('should track projects through stages', async () => {
      const mockProjects = [
        createProject({ stage: 1 }),
        createProject({ stage: 1 }),
        createProject({ stage: 2 }),
        createProject({ stage: 10 }),
      ]

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getCompletionFunnel()

      expect(result.stages).toBeDefined()
      expect(result.dropoff).toBeDefined()
    })

    it('should calculate dropout rates', async () => {
      const mockProjects = createList(createProject, 100)

      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue(mockProjects),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getCompletionFunnel()

      expect(result.dropoff).toEqual(
        expect.arrayContaining([expect.any(Number)])
      )
    })
  })

  describe('getSummaryMetrics', () => {
    it('should aggregate all key metrics', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getSummaryMetrics()

      expect(result).toHaveProperty('projectStats')
      expect(result).toHaveProperty('revenueStats')
      expect(result).toHaveProperty('customerStats')
    })

    it('should calculate KPIs', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getSummaryMetrics()

      expect(result.kpis).toBeDefined()
    })

    it('should provide year-over-year comparison', async () => {
      const mockQueryBuilder = {
        execute: vi.fn().mockResolvedValue([]),
      }

      apiClient.query.mockReturnValue(mockQueryBuilder)

      const result = await analyticsService.getSummaryMetrics()

      expect(result.yoyComparison).toBeDefined()
    })
  })
})
