# Testing Quick Start Guide

Get started with testing in SolarTrack Pro in 5 minutes.

## Installation

Testing dependencies are already installed. Verify:

```bash
npm install
```

## Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- src/lib/__tests__/customerService.test.js

# Run tests matching pattern
npm test -- --grep "customerService"
```

## File Structure

Test files go in `__tests__` directories next to the code:

```
src/
├── lib/
│   ├── customerService.js          ← Implementation
│   └── __tests__/
│       └── customerService.test.js ← Tests
├── hooks/
│   ├── useMobileDetect.js
│   └── __tests__/
│       └── useMobileDetect.test.js
```

## Writing Your First Test

Create `src/lib/__tests__/myService.test.js`:

```javascript
import { describe, it, expect, vi } from 'vitest'
import * as myService from '../myService'
import * as supabaseModule from '../supabase'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))

describe('myService', () => {
  it('should do something', async () => {
    // Setup
    const mockData = { id: 1, name: 'Test' }
    const mockResponse = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    }
    vi.spyOn(supabaseModule.supabase, 'from')
      .mockReturnValue(mockResponse)

    // Execute
    const result = await myService.getSomething()

    // Verify
    expect(result.id).toBe(1)
  })
})
```

## Common Patterns

### Service Test Template

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as service from '../service'
import * as supabaseModule from '../supabase'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))

describe('service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should perform operation', async () => {
    // Arrange
    const mock = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    }
    vi.spyOn(supabaseModule.supabase, 'from')
      .mockReturnValue(mock)

    // Act
    const result = await service.getItem(1)

    // Assert
    expect(result.id).toBe(1)
  })

  it('should handle errors', async () => {
    const mock = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      }),
    }
    vi.spyOn(supabaseModule.supabase, 'from')
      .mockReturnValue(mock)

    const result = await service.getItem(999)

    expect(result).toBeNull()
  })
})
```

### Hook Test Template

```javascript
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '../useMyHook'
import { vi } from 'vitest'

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook())

    expect(result.current.value).toBeDefined()
  })

  it('should update state', () => {
    const { result } = renderHook(() => useMyHook())

    act(() => {
      result.current.setValue(42)
    })

    expect(result.current.value).toBe(42)
  })
})
```

## Common Assertions

```javascript
// Basic checks
expect(value).toBe(5)
expect(value).toEqual({ id: 1 })
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Strings
expect(str).toContain('substring')
expect(str).toMatch(/pattern/)

// Arrays
expect(arr).toHaveLength(3)
expect(arr).toContain(item)
expect(arr).toEqual([1, 2, 3])

// Objects
expect(obj).toHaveProperty('name')
expect(obj).toEqual({ name: 'test' })

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(arg1, arg2)
expect(fn).toHaveBeenCalledTimes(2)

// Promises
expect(promise).resolves.toBe(value)
expect(promise).rejects.toThrow('message')
```

## Mocking Supabase

### Standard Query Mock

```javascript
vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))

// In test
const mock = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({
    data: [{ id: 1 }, { id: 2 }],
    error: null,
  }),
}

vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mock)
```

### Error Response

```javascript
const mock = {
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: null,
    error: new Error('Database error'),
  }),
}

vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mock)
```

## Real Example: Testing customerService

```javascript
// src/lib/__tests__/customerService.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as customerService from '../customerService'
import * as supabaseModule from '../supabase'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))

describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCustomer', () => {
    it('should create customer with name', async () => {
      const mock = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            customer_id: 'CUST-20260418-0001',
            name: 'John',
            email: 'john@example.com',
          },
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from')
        .mockReturnValue(mock)

      const result = await customerService.createCustomer({
        name: 'John',
        email: 'john@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('John')
      expect(result.customerId).toMatch(/^CUST-\d{8}-\d{4}$/)
    })

    it('should fail without name', async () => {
      const result = await customerService.createCustomer({
        email: 'test@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
    })
  })

  describe('getAllCustomers', () => {
    it('should return all active customers', async () => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { customer_id: 'CUST-001', name: 'John', is_active: true },
            { customer_id: 'CUST-002', name: 'Jane', is_active: true },
          ],
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from')
        .mockReturnValue(mock)

      const result = await customerService.getAllCustomers()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('John')
    })
  })

  describe('searchCustomers', () => {
    it('should find customers by name', async () => {
      const mock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { customer_id: 'CUST-001', name: 'John', is_active: true },
          ],
          error: null,
        }),
      }

      vi.spyOn(supabaseModule.supabase, 'from')
        .mockReturnValue(mock)

      const result = await customerService.searchCustomers('John')

      expect(result).toHaveLength(1)
      expect(result[0].name).toContain('John')
    })
  })
})
```

## Running Tests

```bash
# First time - install dependencies
npm install

# Run tests
npm test

# Watch mode (rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# View coverage HTML
open coverage/index.html
```

## Coverage Report

Check that tests cover your code:

```bash
npm run test:coverage
```

Required minimums:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Debugging Tips

### See what's being tested
```bash
npm test -- --reporter=verbose
```

### Run one test only
```bash
npm test -- --grep "should create customer"
```

### See console.log output
```javascript
it('should work', async () => {
  console.log('Debug:', data) // Shows in test output
  expect(data).toBeDefined()
})
```

### Use VS Code debugger
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["--inspect-brk", "--run"],
  "console": "integratedTerminal"
}
```

## Next Steps

1. Read [TESTING_SETUP.md](./TESTING_SETUP.md) for complete guide
2. Check [TESTING_EXAMPLES.md](./TESTING_EXAMPLES.md) for more patterns
3. Run existing tests: `npm test`
4. Write tests for new features
5. Keep coverage above 70%

## Common Issues

**Test hangs?**
- Check for missing `await`
- Make sure mocks are set up before import
- Increase timeout: `it('...', () => {...}, { timeout: 10000 })`

**Mock not working?**
- Must call `vi.mock()` before importing module
- Must call `vi.clearAllMocks()` in `beforeEach()`

**Can't find test?**
- Check file is in `__tests__` directory
- Check filename ends in `.test.js` or `.test.jsx`
- Run `npm test -- --grep "test name"`

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Matchers](https://jestjs.io/docs/expect)
