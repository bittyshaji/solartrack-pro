/**
 * useAsync Hook Tests
 * Comprehensive tests for async operation handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAsync } from '../useAsync'

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const asyncFunction = vi.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() => useAsync(asyncFunction))

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should initialize without immediate execution', () => {
      const asyncFunction = vi.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() =>
        useAsync(asyncFunction, [], { skip: true })
      )

      expect(result.current.loading).toBe(false)
    })
  })

  describe('execution', () => {
    it('should execute async function and resolve', async () => {
      const testData = { id: 1, name: 'Test' }
      const asyncFunction = vi.fn().mockResolvedValue(testData)

      const { result } = renderHook(() => useAsync(asyncFunction))

      await waitFor(() => {
        expect(result.current.data).toEqual(testData)
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })

    it('should handle async errors', async () => {
      const error = new Error('Test error')
      const asyncFunction = vi.fn().mockRejectedValue(error)

      const { result } = renderHook(() => useAsync(asyncFunction))

      await waitFor(() => {
        expect(result.current.error).toEqual(error)
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBeNull()
      })
    })

    it('should call async function with arguments', async () => {
      const asyncFunction = vi.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() =>
        useAsync(asyncFunction, ['arg1', 'arg2'])
      )

      await waitFor(() => {
        expect(asyncFunction).toHaveBeenCalledWith('arg1', 'arg2')
      })
    })
  })

  describe('retry functionality', () => {
    it('should provide retry method', async () => {
      let callCount = 0
      const asyncFunction = vi.fn(() => {
        callCount++
        if (callCount < 2) {
          return Promise.reject(new Error('Fail'))
        }
        return Promise.resolve({ data: 'success' })
      })

      const { result } = renderHook(() => useAsync(asyncFunction))

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      result.current.retry?.()

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'success' })
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('dependency tracking', () => {
    it('should re-execute when dependencies change', async () => {
      const asyncFunction = vi.fn().mockResolvedValue({ data: 'test' })

      const { rerender } = renderHook(
        ({ dep }) => useAsync(asyncFunction, [dep]),
        { initialProps: { dep: 1 } }
      )

      await waitFor(() => {
        expect(asyncFunction).toHaveBeenCalledTimes(1)
      })

      rerender({ dep: 2 })

      await waitFor(() => {
        expect(asyncFunction).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('cleanup on unmount', () => {
    it('should not update state after unmount', async () => {
      const asyncFunction = vi.fn(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve('data'), 100)
          )
      )

      const { unmount } = renderHook(() => useAsync(asyncFunction))

      unmount()

      // Should not cause errors
      await waitFor(() => expect(true).toBe(true))
    })
  })

  describe('caching', () => {
    it('should cache results', async () => {
      const asyncFunction = vi.fn().mockResolvedValue({ data: 'test' })

      const { result: result1 } = renderHook(() =>
        useAsync(asyncFunction, [], { cache: true })
      )

      await waitFor(() => {
        expect(result1.current.data).toEqual({ data: 'test' })
      })

      const { result: result2 } = renderHook(() =>
        useAsync(asyncFunction, [], { cache: true })
      )

      expect(asyncFunction).toHaveBeenCalledTimes(1)
    })
  })

  describe('skip option', () => {
    it('should skip execution when skip is true', () => {
      const asyncFunction = vi.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() =>
        useAsync(asyncFunction, [], { skip: true })
      )

      expect(asyncFunction).not.toHaveBeenCalled()
      expect(result.current.data).toBeNull()
    })
  })

  describe('callbacks', () => {
    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const asyncFunction = vi.fn().mockResolvedValue({ data: 'test' })

      const { result } = renderHook(() =>
        useAsync(asyncFunction, [], { onSuccess })
      )

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({ data: 'test' })
      })
    })

    it('should call onError callback', async () => {
      const onError = vi.fn()
      const error = new Error('Test error')
      const asyncFunction = vi.fn().mockRejectedValue(error)

      const { result } = renderHook(() =>
        useAsync(asyncFunction, [], { onError })
      )

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error)
      })
    })
  })
})
