# Testing Examples - SolarTrack Pro

This document provides real-world testing examples based on SolarTrack Pro's actual services and components.

## Table of Contents

1. [Service Testing](#service-testing)
2. [Hook Testing](#hook-testing)
3. [Mocking Strategies](#mocking-strategies)
4. [Advanced Patterns](#advanced-patterns)

## Service Testing

### Testing CustomerService

The customer service provides CRUD operations for managing customers. Here's how to test it:

#### Basic Create Operation

```javascript
// src/lib/__tests__/customerService.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as customerService from '../customerService'
import * as supabaseModule from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('customerService.createCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a customer with all fields', async () => {
    const mockResponse = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          customer_id: 'CUST-20260418-0001',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '9876543210',
          address: '123 Main St',
          city: 'Bangalore',
          state: 'Karnataka',
          postal_code: '560001',
          company: 'ABC Corp',
          notes: 'Premium customer',
          is_active: true,
        },
        error: null,
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await customerService.createCustomer({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      address: '123 Main St',
      city: 'Bangalore',
      state: 'Karnataka',
      postal_code: '560001',
      company: 'ABC Corp',
      notes: 'Premium customer',
    })

    expect(result.success).toBe(true)
    expect(result.customerId).toMatch(/^CUST-\d{8}-\d{4}$/)
    expect(result.data.name).toBe('John Doe')
    expect(result.data.company).toBe('ABC Corp')
  })

  it('should generate unique customer IDs', async () => {
    const ids = new Set()
    
    // Generate multiple customer IDs
    for (let i = 0; i < 10; i++) {
      const mockResponse = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            customer_id: `CUST-20260418-000${i}`,
            name: `Customer ${i}`,
          },
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

      const result = await customerService.createCustomer({
        name: `Customer ${i}`,
      })

      ids.add(result.customerId)
    }

    // All IDs should be unique
    expect(ids.size).toBe(10)
  })

  it('should reject creation without name', async () => {
    const result = await customerService.createCustomer({
      email: 'test@example.com',
      phone: '1234567890',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Customer name is required')
  })

  it('should handle Supabase insert errors', async () => {
    const mockResponse = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Unique constraint violation'),
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await customerService.createCustomer({
      name: 'Duplicate Customer',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should set is_active to true for new customers', async () => {
    let insertedData = null

    const mockResponse = {
      insert: vi.fn((data) => {
        insertedData = data[0]
        return mockResponse
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...insertedData },
        error: null,
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    await customerService.createCustomer({
      name: 'New Customer',
    })

    expect(insertedData.is_active).toBe(true)
    expect(insertedData).toHaveProperty('created_at')
  })
})
```

#### Testing Retrieval Operations

```javascript
describe('customerService.getAllCustomers', () => {
  it('should fetch only active customers', async () => {
    const mockCustomers = [
      { customer_id: 'CUST-001', name: 'Active 1', is_active: true },
      { customer_id: 'CUST-002', name: 'Active 2', is_active: true },
    ]

    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockCustomers,
        error: null,
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await customerService.getAllCustomers()

    expect(result).toHaveLength(2)
    expect(result.every(c => c.is_active === true)).toBe(true)
  })

  it('should order customers by name', async () => {
    const mockCustomers = [
      { customer_id: 'CUST-001', name: 'Alice', is_active: true },
      { customer_id: 'CUST-002', name: 'Bob', is_active: true },
    ]

    const orderSpy = vi.fn().mockResolvedValue({
      data: mockCustomers,
      error: null,
    })

    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: orderSpy,
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    await customerService.getAllCustomers()

    expect(orderSpy).toHaveBeenCalledWith('name', { ascending: true })
  })

  it('should handle empty results', async () => {
    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await customerService.getAllCustomers()

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })
})

describe('customerService.getCustomerById', () => {
  it('should retrieve a specific customer', async () => {
    const mockCustomer = {
      customer_id: 'CUST-20260418-0001',
      name: 'John Doe',
      email: 'john@example.com',
    }

    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCustomer,
        error: null,
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await customerService.getCustomerById('CUST-20260418-0001')

    expect(result).toEqual(mockCustomer)
    expect(result.customer_id).toBe('CUST-20260418-0001')
  })

  it('should return null when customer not found', async () => {
    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('No rows returned'),
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await customerService.getCustomerById('NON-EXISTENT')

    expect(result).toBeNull()
  })
})
```

### Testing ProjectService

Testing project service with filtering and status management:

```javascript
describe('projectService.getProjects', () => {
  it('should fetch projects with multiple filters', async () => {
    const mockProjects = [
      {
        id: 1,
        name: 'Solar Installation - Residential',
        status: 'In Progress',
        stage: 5,
        customer_id: 'CUST-001',
      },
    ]

    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockReturnValueOnce(mockResponse) // First eq for status
        .mockReturnValueOnce(mockResponse), // Second eq for stage
      order: vi.fn().mockResolvedValue({
        data: mockProjects,
        error: null,
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await projectService.getProjects({
      status: 'In Progress',
      stage: 5,
    })

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('In Progress')
    expect(result[0].stage).toBe(5)
  })

  it('should perform client-side search filtering', async () => {
    const mockProjects = [
      { id: 1, name: 'Solar Panel Installation', status: 'In Progress' },
      { id: 2, name: 'Wind Turbine Setup', status: 'Planning' },
      { id: 3, name: 'Solar Farm Project', status: 'Completed' },
    ]

    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockProjects,
        error: null,
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await projectService.getProjects({
      searchTerm: 'Solar',
    })

    expect(result).toHaveLength(2)
    expect(result.every(p => p.name.toLowerCase().includes('solar'))).toBe(true)
  })

  it('should be case-insensitive for search', async () => {
    const mockProjects = [
      { id: 1, name: 'SOLAR INSTALLATION', status: 'In Progress' },
      { id: 2, name: 'Wind Project', status: 'Planning' },
    ]

    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockProjects,
        error: null,
      }),
    }

    vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

    const result = await projectService.getProjects({
      searchTerm: 'solar',
    })

    expect(result).toHaveLength(1)
    expect(result[0].name).toContain('SOLAR')
  })
})
```

## Hook Testing

### Testing useMobileDetect Hook

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobileDetect } from '../useMobileDetect'

describe('useMobileDetect', () => {
  beforeEach(() => {
    // Set up initial window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('device detection', () => {
    it('should detect mobile devices (< 640px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375,
      })

      const { result } = renderHook(() => useMobileDetect())

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(false)
    })

    it('should detect tablets (640px - 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 800,
      })

      const { result } = renderHook(() => useMobileDetect())

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(true)
      expect(result.current.isDesktop).toBe(false)
    })

    it('should detect desktop devices (> 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1920,
      })

      const { result } = renderHook(() => useMobileDetect())

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(true)
    })
  })

  describe('screen width tracking', () => {
    it('should provide current screen width', () => {
      const { result } = renderHook(() => useMobileDetect())

      expect(typeof result.current.screenWidth).toBe('number')
      expect(result.current.screenWidth).toBeGreaterThan(0)
    })

    it('should update screen width on window resize', () => {
      const { result } = renderHook(() => useMobileDetect())

      const initialWidth = result.current.screenWidth

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: 500,
        })
        // Trigger resize event
        window.dispatchEvent(new Event('resize'))
      })

      // Width should be different after resize
      expect(result.current.screenWidth).not.toBe(initialWidth)
    })
  })

  describe('touch device detection', () => {
    it('should provide isTouchDevice function', () => {
      const { result } = renderHook(() => useMobileDetect())

      expect(typeof result.current.isTouchDevice).toBe('function')
      expect(typeof result.current.isTouchDevice()).toBe('boolean')
    })

    it('should detect touch devices', () => {
      const { result } = renderHook(() => useMobileDetect())

      // Mock touch capability
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: true,
      })

      expect(result.current.isTouchDevice()).toBe(true)
    })
  })

  describe('event listener cleanup', () => {
    it('should add resize listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      renderHook(() => useMobileDetect())

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })

    it('should remove resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useMobileDetect())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
    })
  })
})
```

## Mocking Strategies

### Mocking Supabase Queries

```javascript
// Pattern 1: Chain mock pattern
const createChainMock = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: mockData,
    error: null,
  }),
})

// Pattern 2: Individual spy pattern
const mockData = { id: 1, name: 'Test' }
const mockResponse = {
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: mockData,
    error: null,
  }),
}

vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

// Pattern 3: Error response
const errorResponse = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: null,
    error: new Error('Not found'),
  }),
}
```

### Mocking Network Delays

```javascript
it('should handle slow network responses', async () => {
  const mockResponse = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(
      () => new Promise(resolve =>
        setTimeout(() => {
          resolve({
            data: mockData,
            error: null,
          })
        }, 100)
      )
    ),
  }

  vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

  const start = Date.now()
  const result = await customerService.getCustomerById('id')
  const duration = Date.now() - start

  expect(result).toBeDefined()
  expect(duration).toBeGreaterThanOrEqual(100)
})
```

## Advanced Patterns

### Testing Cascading Failures

```javascript
it('should handle service failures gracefully', async () => {
  const mockResponse = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockRejectedValue(
      new Error('Service unavailable')
    ),
  }

  vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

  const result = await projectService.getProjects()

  expect(Array.isArray(result)).toBe(true)
  expect(result).toHaveLength(0)
})
```

### Testing Data Transformations

```javascript
it('should transform raw data correctly', async () => {
  const rawData = {
    customer_id: 'CUST-001',
    name: 'John Doe',
    email: '  john@example.com  ', // Extra whitespace
    phone: null,
  }

  const mockResponse = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: rawData,
      error: null,
    }),
  }

  vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

  const result = await customerService.getCustomerById('CUST-001')

  expect(result.email).toBe(rawData.email) // Service should handle trimming if needed
  expect(result.phone).toBeNull()
})
```

## Summary

- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies (Supabase, network calls)
- Test both success and error paths
- Cover edge cases and boundary conditions
- Keep tests focused and independent
- Use beforeEach/afterEach for setup/cleanup
