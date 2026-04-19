# SolarTrack Pro - Testing Setup Guide

This document provides comprehensive guidance on testing in SolarTrack Pro using Vitest and React Testing Library.

## Overview

The testing infrastructure uses:
- **Vitest** - Fast unit test runner compatible with Jest syntax
- **@testing-library/react** - React component testing utilities
- **jsdom** - DOM implementation for testing
- **@vitest/ui** - Visual test runner dashboard

## Quick Start

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- src/lib/__tests__/customerService.test.js

# Run tests matching a pattern
npm test -- --grep "customerService"
```

## Project Structure

```
src/
├── lib/
│   ├── customerService.js
│   ├── projectService.js
│   └── __tests__/
│       ├── customerService.test.js
│       └── projectService.test.js
├── hooks/
│   ├── useMobileDetect.js
│   └── __tests__/
│       └── useMobileDetect.test.js
└── test/
    └── setup.js
```

## Test File Naming Conventions

- Test files should be placed in a `__tests__` directory alongside the code they test
- Test files should use the `.test.js` or `.test.jsx` extension
- Pattern: `{filename}.test.js` where filename matches the file being tested

Examples:
- `src/lib/customerService.js` → `src/lib/__tests__/customerService.test.js`
- `src/hooks/useMobileDetect.js` → `src/hooks/__tests__/useMobileDetect.test.js`

## Writing Tests

### Basic Service Test Structure

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as myService from '../myService'
import * as supabaseModule from '../supabase'

// Mock external dependencies
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('myService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something expected', async () => {
    // Arrange
    const mockData = { id: 1, name: 'Test' }
    
    // Act
    const result = await myService.someFunction(mockData)
    
    // Assert
    expect(result.success).toBe(true)
  })
})
```

### Service Testing Patterns

#### Testing Async Functions with Success

```javascript
it('should create a customer successfully', async () => {
  const mockResponse = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { customer_id: 'CUST-20260418-0001', name: 'John' },
      error: null,
    }),
  }

  vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

  const result = await customerService.createCustomer({ name: 'John' })

  expect(result.success).toBe(true)
  expect(result.data.name).toBe('John')
})
```

#### Testing Error Handling

```javascript
it('should handle database errors gracefully', async () => {
  const mockResponse = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    }),
  }

  vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)

  const result = await customerService.getCustomerById('invalid-id')

  expect(result).toBeNull()
})
```

#### Testing Input Validation

```javascript
it('should validate required fields', async () => {
  const result = await customerService.createCustomer({
    email: 'test@example.com',
    // name is missing - required field
  })

  expect(result.success).toBe(false)
  expect(result.error).toContain('Customer name is required')
})
```

### React Hook Testing Patterns

```javascript
import { renderHook, act } from '@testing-library/react'
import { useMobileDetect } from '../useMobileDetect'

describe('useMobileDetect', () => {
  it('should detect mobile screen', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 400,
    })

    const { result } = renderHook(() => useMobileDetect())

    expect(result.current.isMobile).toBe(true)
    expect(result.current.screenWidth).toBe(400)
  })

  it('should update on window resize', () => {
    const { result } = renderHook(() => useMobileDetect())

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1200,
      })
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.isDesktop).toBe(true)
  })
})
```

### Component Testing Patterns

```javascript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render with props', () => {
    render(<MyComponent title="Test" onSubmit={() => {}} />)

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should call callback on button click', async () => {
    const handleClick = vi.fn()
    
    render(<MyComponent onSubmit={handleClick} />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    expect(handleClick).toHaveBeenCalled()
  })
})
```

## Common Testing Utilities

### Vitest Globals

```javascript
// Import these from 'vitest'
describe()     // Test suite
it() / test()  // Individual test
expect()       // Assertions
beforeEach()   // Setup before each test
afterEach()    // Cleanup after each test
beforeAll()    // Setup before all tests
afterAll()     // Cleanup after all tests
vi.fn()        // Create mock function
vi.mock()      // Mock module
vi.spyOn()     // Spy on function
```

### Common Assertions

```javascript
expect(value).toBe(expectedValue)
expect(array).toHaveLength(3)
expect(obj).toHaveProperty('name')
expect(string).toContain('substring')
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(arg1, arg2)
expect(promise).resolves.toBe(value)
expect(promise).rejects.toThrow()
```

### Testing Library Queries

```javascript
// For React components
import { render, screen } from '@testing-library/react'

screen.getByText('text')        // Get by exact text
screen.getByRole('button')      // Get by ARIA role
screen.getByPlaceholderText('') // Get by input placeholder
screen.queryBy...               // Returns null if not found
screen.findBy...                // Async query (waits for element)
```

## Mocking Supabase

Since SolarTrack Pro uses Supabase, here's how to mock it:

```javascript
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// In test
const mockResponse = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({
    data: [/* mock data */],
    error: null,
  }),
}

vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockResponse)
```

## Coverage Thresholds

The project requires minimum coverage:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

Check coverage:
```bash
npm run test:coverage
```

Coverage report is generated in `coverage/` directory. Open `coverage/index.html` in browser to see detailed coverage.

## Test Configuration

### vitest.config.js

Key settings:
- `globals: true` - No need to import `describe`, `it`, `expect`
- `environment: 'jsdom'` - Simulates browser environment
- `setupFiles: ['./src/test/setup.js']` - Runs before tests
- Coverage thresholds configured

### src/test/setup.js

Sets up:
- @testing-library/jest-dom matchers
- DOM mocking (matchMedia, localStorage, etc.)
- Global test utilities

## Best Practices

### 1. Use Descriptive Test Names

```javascript
// Good
it('should create a customer with valid name and email')

// Avoid
it('should work')
```

### 2. Follow AAA Pattern (Arrange-Act-Assert)

```javascript
it('should update customer', async () => {
  // Arrange - Set up test data
  const customerData = { name: 'John Updated' }
  mockSupabaseResponse(mockResponse)

  // Act - Perform the action
  const result = await customerService.updateCustomer('id', customerData)

  // Assert - Check the result
  expect(result.success).toBe(true)
})
```

### 3. Mock External Dependencies

```javascript
// Mock network calls
vi.mock('../supabase')

// Mock timers
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
```

### 4. Test Edge Cases

```javascript
it('should handle empty input', async () => {
  const result = await myService.process('')
  expect(result).toBeDefined()
})

it('should handle null values', async () => {
  const result = await myService.process(null)
  expect(result).toBeDefined()
})
```

### 5. Keep Tests Isolated

Each test should be independent:
- Clear mocks in `beforeEach()`
- Don't rely on test execution order
- Clean up after tests with `afterEach()`

## Running Tests in CI/CD

For continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Check coverage thresholds
  # CI fails if coverage below thresholds
```

## Debugging Tests

### Enable Console Output

```javascript
// Inside test
console.log('Debug info:', data)
```

### Run Specific Test

```bash
npm test -- --grep "customerService"
```

### Use Test UI

```bash
# Open visual test interface
npm run test:ui
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["--inspect-brk"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Issue: Tests timeout

```javascript
// Increase timeout for slow operations
it('should fetch large dataset', async () => {
  // ... test code
}, { timeout: 10000 }) // 10 second timeout
```

### Issue: Mock not working

```javascript
// Ensure mock is defined before importing the module
vi.mock('../supabase')
import * as myService from '../myService'
```

### Issue: DOM not ready

```javascript
import { screen, waitFor } from '@testing-library/react'

it('should show async content', async () => {
  render(<Component />)
  
  // Wait for element to appear
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/) (Vitest compatible)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)

## Adding Tests to Existing Code

When adding tests to existing services:

1. Create `__tests__` directory in the same folder
2. Create `.test.js` file matching the service name
3. Mock external dependencies (Supabase, etc.)
4. Test public functions with various inputs
5. Test error cases and edge cases
6. Aim for at least 70% coverage

Example flow:
```bash
# Create test file
touch src/lib/__tests__/newService.test.js

# Write tests
# Run tests
npm test

# Check coverage
npm run test:coverage
```

## Next Steps

1. Run existing tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Add tests for new features before implementation
4. Keep coverage above 70% threshold
5. Review test examples in `__tests__` directories
