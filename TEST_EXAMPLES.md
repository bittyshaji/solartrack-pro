# Test Examples & Reference Guide

## Quick Reference

### Running Tests

```bash
# All tests
npm run test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm run test -- customerService.test.js

# Tests matching pattern
npm run test -- --grep "Customer"

# UI mode (interactive)
npm run test:ui
```

## Example 1: Service Test

### File: `src/lib/__tests__/customerService.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as customerService from '../customerService'
import * as apiClient from '../api/client'

vi.mock('../api/client')

describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks() // Clean up after each test
  })

  describe('createCustomer', () => {
    // Happy path: Valid input
    it('should create customer with all fields', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0100',
      }

      const mockInsert = vi.fn().mockResolvedValue({
        success: true,
        customerId: 'CUST-20260418-0001',
      })

      apiClient.insert.mockImplementation(mockInsert)

      const result = await customerService.createCustomer(customerData)

      expect(result.success).toBe(true)
      expect(result.customerId).toMatch(/^CUST-\d{8}-\d{4}$/)
    })

    // Error case: Missing required field
    it('should reject customer without name', async () => {
      const result = await customerService.createCustomer({
        email: 'john@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('name is required')
    })

    // Edge case: Database error
    it('should handle database errors', async () => {
      const mockInsert = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))

      apiClient.insert.mockImplementation(mockInsert)

      const result = await customerService.createCustomer({
        name: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
```

## Example 2: Component Test

### File: `src/components/YourComponent/__tests__/YourComponent.test.jsx`

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import YourComponent from '../YourComponent'

describe('YourComponent', () => {
  // Rendering
  it('should render without crashing', () => {
    render(<YourComponent />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  // Props
  it('should render with custom title', () => {
    render(<YourComponent title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  // User interaction
  it('should handle button click', async () => {
    const handleClick = vi.fn()
    render(<YourComponent onClick={handleClick} />)

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(handleClick).toHaveBeenCalled()
  })

  // Loading state
  it('should show loading indicator', () => {
    render(<YourComponent isLoading={true} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  // Error state
  it('should display error message', () => {
    render(<YourComponent error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

## Example 3: Hook Test

### File: `src/hooks/__tests__/useCustomHook.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCustomHook } from '../useCustomHook'

describe('useCustomHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Initialization
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCustomHook())

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  // State updates
  it('should update state on data load', async () => {
    const { result } = renderHook(() => useCustomHook())

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 })
      expect(result.current.loading).toBe(false)
    })
  })

  // Error handling
  it('should set error on failure', async () => {
    const { result } = renderHook(() => useCustomHook())

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })

  // Cleanup
  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useCustomHook())

    unmount() // Should not cause errors

    expect(true).toBe(true)
  })
})
```

## Example 4: Using Factories

### Creating Test Data with Factories

```javascript
import { createCustomer, createProject, createList } from '../../test/factories'

// Single item with defaults
const customer = createCustomer()
// { id: 'cust-xxx', name: 'John Doe', email: 'customer-xxxx@example.com', ... }

// Single item with overrides
const vipCustomer = createCustomer({
  name: 'VIP Customer',
  company: 'Fortune 500 Inc',
})
// { id: 'cust-xxx', name: 'VIP Customer', company: 'Fortune 500 Inc', ... }

// Multiple items
const projects = createList(createProject, 5)
// Creates 5 projects with unique IDs

// Multiple items with custom data
const activeProjects = createList(createProject, 3, {
  status: 'In Progress',
})
// Creates 3 projects, all with status: 'In Progress'
```

## Example 5: Using Mocks

### Mocking Supabase

```javascript
import { createMockSupabaseClient } from '../../test/mocks/supabase'

const mockSupabase = createMockSupabaseClient()

// Mock a successful query
const mockQueryBuilder = {
  filter: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([
    { id: 1, name: 'Test' }
  ])
}

mockSupabase.from.mockReturnValue(mockQueryBuilder)

// Now your service using supabase will get the mocked data
```

### Mocking API Responses

```javascript
import { mockProjectResponses } from '../../test/mocks/api'

// Use pre-built mock responses
expect(mockProjectResponses.single).toEqual({
  id: 'proj-001',
  name: 'Solar Installation Project',
  // ...
})

// Or create custom mock
const mockResponse = {
  data: { id: 1, status: 'success' },
  error: null,
}
```

## Example 6: Integration Test

### Testing Complete Workflow

```javascript
import { describe, it, expect } from 'vitest'
import { createCustomer, createProject, createInvoice } from '../test/factories'

describe('Customer to Invoice Workflow', () => {
  it('should create customer, project, and invoice', () => {
    // Setup: Create customer
    const customer = createCustomer()

    // Setup: Create project for customer
    const project = createProject({
      customer_id: customer.id,
    })

    // Execute: Create invoice
    const invoice = createInvoice({
      project_id: project.id,
      customer_id: customer.id,
      amount: 5000,
    })

    // Verify: All relationships are correct
    expect(invoice.customer_id).toBe(customer.id)
    expect(invoice.project_id).toBe(project.id)
    expect(invoice.amount).toBe(5000)
  })
})
```

## Example 7: Testing Async Operations

```javascript
import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'

describe('Async Operations', () => {
  it('should wait for async result', async () => {
    const result = await fetchData()

    expect(result).toBeDefined()
  })

  it('should handle async errors', async () => {
    expect(async () => {
      await fetchData()
    }).rejects.toThrow()
  })

  it('should wait for condition with waitFor', async () => {
    const { result } = renderHook(() => useAsyncData())

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
  })
})
```

## Example 8: Testing Error Cases

```javascript
describe('Error Handling', () => {
  it('should validate email format', () => {
    const result = validateEmail('invalid-email')
    expect(result).toBe(false)
  })

  it('should reject negative amounts', () => {
    expect(() => {
      createInvoice({ amount: -100 })
    }).toThrow('Amount must be positive')
  })

  it('should handle network errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await serviceFunction()

    expect(result.error).toBeDefined()
  })
})
```

## Example 9: Testing State Management

```javascript
import { renderHook, act } from '@testing-library/react'
import { useState } from 'react'

describe('State Management', () => {
  it('should update state', () => {
    const { result } = renderHook(() => useState(0))

    expect(result.current[0]).toBe(0)

    act(() => {
      result.current[1](1)
    })

    expect(result.current[0]).toBe(1)
  })
})
```

## Example 10: Testing Edge Cases

```javascript
describe('Edge Cases', () => {
  // Empty data
  it('should handle empty array', () => {
    const result = processArray([])
    expect(result).toEqual([])
  })

  // Null/undefined
  it('should handle null values', () => {
    const result = processData(null)
    expect(result).toBeNull()
  })

  // Large numbers
  it('should handle large amounts', () => {
    const invoice = createInvoice({ amount: 999999999 })
    expect(invoice.amount).toBe(999999999)
  })

  // Special characters
  it('should handle special characters', () => {
    const customer = createCustomer({
      name: "O'Brien & Associates <test>",
    })
    expect(customer.name).toBe("O'Brien & Associates <test>")
  })
})
```

## Best Practices Summary

### Do
- ✅ Test behavior, not implementation
- ✅ Use semantic queries (getByRole, getByText)
- ✅ Keep tests focused
- ✅ Use factories for data
- ✅ Mock external dependencies
- ✅ Test happy path AND error paths
- ✅ Use meaningful names
- ✅ Clean up in afterEach

### Don't
- ❌ Test implementation details
- ❌ Use getByTestId unless necessary
- ❌ Test multiple concerns in one test
- ❌ Forget to mock external calls
- ❌ Skip error testing
- ❌ Use any or unknown types
- ❌ Create brittle snapshots
- ❌ Leave mocks after tests

## Coverage Check Commands

```bash
# Generate coverage report
npm run test:coverage

# View coverage summary
npm run test:coverage -- --reporter=text

# Generate HTML report
npm run test:coverage
open coverage/index.html

# Check specific file coverage
npm run test -- customerService.test.js --coverage
```

## Debugging

```javascript
// Print what's on screen
screen.debug()

// Print specific element
screen.debug(element)

// Find element info
screen.logTestingPlaygroundURL()

// Check rendered HTML
console.log(container.innerHTML)
```

## Resources

- [Vitest Docs](https://vitest.dev)
- [Testing Library React](https://testing-library.com/react)
- [Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
