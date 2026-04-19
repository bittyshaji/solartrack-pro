/**
 * Test Helpers
 * Utility functions for testing
 */

import { vi } from 'vitest'

/**
 * Create a mock logger
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  }
}

/**
 * Wait for async operations
 */
export function waitFor(callback, options = {}) {
  const timeout = options.timeout || 3000
  const interval = options.interval || 50
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const checkCondition = () => {
      try {
        callback()
        resolve()
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(
            new Error(`Timeout waiting for condition (${timeout}ms): ${error.message}`)
          )
        } else {
          setTimeout(checkCondition, interval)
        }
      }
    }

    checkCondition()
  })
}

/**
 * Create a mock fetch function
 */
export function createMockFetch(responseData = {}, options = {}) {
  const response = {
    ok: options.ok !== false,
    status: options.status || 200,
    json: vi.fn().mockResolvedValue(responseData),
    text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    clone: vi.fn(function () {
      return this
    }),
  }

  return vi.fn().mockResolvedValue(response)
}

/**
 * Assert multiple conditions
 */
export function expectAll(actual, expectations) {
  Object.entries(expectations).forEach(([key, expected]) => {
    expect(actual[key]).toEqual(expected)
  })
}

/**
 * Create mock date
 */
export function createMockDate(isoString) {
  const date = new Date(isoString)
  return {
    toISOString: () => isoString,
    getTime: () => date.getTime(),
    valueOf: () => date.getTime(),
    toString: () => date.toString(),
  }
}

/**
 * Resolve all pending promises
 */
export async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Create assertion helpers
 */
export const createAssertions = (expect) => ({
  toBeDateString(actual, expected) {
    const actualDate = new Date(actual)
    const expectedDate = new Date(expected)
    expect(actualDate.toDateString()).toBe(expectedDate.toDateString())
  },
  toBeWithinRange(actual, min, max) {
    expect(actual).toBeGreaterThanOrEqual(min)
    expect(actual).toBeLessThanOrEqual(max)
  },
  toHaveProperty(actual, property, value) {
    expect(actual).toHaveProperty(property)
    if (value !== undefined) {
      expect(actual[property]).toEqual(value)
    }
  },
})

/**
 * Mock timer utilities
 */
export const mockTimer = {
  install: () => vi.useFakeTimers(),
  uninstall: () => vi.useRealTimers(),
  advance: (ms) => vi.advanceTimersByTime(ms),
  advanceToNextTimer: () => vi.runOnlyPendingTimers(),
  runAll: () => vi.runAllTimers(),
}

/**
 * Create batch test data generator
 */
export function generateTestBatch(count, factory, baseOverrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    factory({
      ...baseOverrides,
      name: `${baseOverrides.name || 'Test Item'} ${i + 1}`,
    })
  )
}

/**
 * Assert error thrown
 */
export async function expectError(fn, errorMessage) {
  try {
    await fn()
    throw new Error('Expected function to throw an error')
  } catch (error) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage)
    }
  }
}

/**
 * Create mock localStorage with spy
 */
export function createMockStorageWithSpy() {
  const store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    key: vi.fn((index) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length
    },
  }
}
