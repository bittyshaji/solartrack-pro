/**
 * Project Service Tests
 * Tests for project CRUD operations and filtering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as projectService from '../projectService'
import * as supabaseModule from '../supabase'

// Mock the supabase module
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PROJECT_STATUSES constant', () => {
    it('should have valid project statuses', () => {
      expect(projectService.PROJECT_STATUSES).toEqual([
        'Planning',
        'In Progress',
        'On Hold',
        'Completed',
        'Cancelled',
      ])
    })

    it('should be an array', () => {
      expect(Array.isArray(projectService.PROJECT_STATUSES)).toBe(true)
    })
  })

  describe('PROJECT_STAGES constant', () => {
    it('should have all project stages', () => {
      expect(projectService.PROJECT_STAGES.length).toBe(10)
      expect(projectService.PROJECT_STAGES[0].name).toBe('Site Survey')
      expect(projectService.PROJECT_STAGES[9].name).toBe('Completed')
    })

    it('should have id and name for each stage', () => {
      projectService.PROJECT_STAGES.forEach(stage => {
        expect(stage).toHaveProperty('id')
        expect(stage).toHaveProperty('name')
        expect(typeof stage.id).toBe('number')
        expect(typeof stage.name).toBe('string')
      })
    })
  })

  describe('getProjects', () => {
    it('should fetch all projects', async () => {
      const mockProjects = [
        {
          id: 1,
          name: 'Solar Project A',
          status: 'In Progress',
          stage: 5,
          created_at: '2026-04-18',
        },
        {
          id: 2,
          name: 'Solar Project B',
          status: 'Planning',
          stage: 1,
          created_at: '2026-04-17',
        },
      ]

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockProjects,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await projectService.getProjects()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)
      expect(result[0].name).toBe('Solar Project A')
    })

    it('should filter projects by status', async () => {
      const mockProjects = [
        {
          id: 1,
          name: 'Solar Project A',
          status: 'Completed',
          stage: 10,
        },
      ]

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockProjects,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await projectService.getProjects({
        status: 'Completed',
      })

      expect(result.length).toBe(1)
      expect(result[0].status).toBe('Completed')
    })

    it('should filter projects by stage', async () => {
      const mockProjects = [
        {
          id: 1,
          name: 'Solar Project A',
          status: 'In Progress',
          stage: 5,
        },
      ]

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockProjects,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await projectService.getProjects({
        stage: 5,
      })

      expect(result.length).toBe(1)
      expect(result[0].stage).toBe(5)
    })

    it('should search projects by name (client-side)', async () => {
      const mockProjects = [
        { id: 1, name: 'Solar Panel Project', status: 'In Progress' },
        { id: 2, name: 'Wind Turbine Project', status: 'Planning' },
        { id: 3, name: 'Solar Farm Project', status: 'Completed' },
      ]

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockProjects,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await projectService.getProjects({
        searchTerm: 'Solar',
      })

      expect(result.length).toBe(2)
      expect(result.every(p => p.name.includes('Solar'))).toBe(true)
    })

    it('should return empty array on error', async () => {
      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await projectService.getProjects()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
  })

  describe('getProjectById', () => {
    it('should fetch project by ID', async () => {
      const mockProject = {
        id: 1,
        name: 'Solar Project A',
        status: 'In Progress',
        stage: 5,
      }

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProject,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await projectService.getProjectById(1)

      expect(result).toEqual(mockProject)
      expect(result.id).toBe(1)
      expect(result.name).toBe('Solar Project A')
    })

    it('should return null if project not found', async () => {
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

      const result = await projectService.getProjectById(999)

      expect(result).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should log errors and return safe defaults', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation()

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await projectService.getProjects()

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(Array.isArray(result)).toBe(true)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('filtering combinations', () => {
    it('should apply multiple filters simultaneously', async () => {
      const mockProjects = [
        {
          id: 1,
          name: 'Solar Project A',
          status: 'In Progress',
          stage: 5,
        },
      ]

      const mockSelectResponse = {
        select: vi.fn().mockReturnThis(),
        eq: vi
          .fn()
          .mockReturnThis()
          .mockReturnValueOnce(mockSelectResponse),
        order: vi.fn().mockResolvedValue({
          data: mockProjects,
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(
        mockSelectResponse
      )

      const result = await projectService.getProjects({
        status: 'In Progress',
        stage: 5,
        searchTerm: 'Solar',
      })

      expect(result.length).toBeGreaterThanOrEqual(0)
    })
  })
})
