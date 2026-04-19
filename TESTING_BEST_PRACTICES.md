# Testing Best Practices & Guidelines

## Overview

This document provides best practices and guidelines for writing tests in the SolarTrack Pro codebase.

## Test Structure

### Test File Organization

- **Service tests**: `src/lib/__tests__/serviceName.test.js`
- **Component tests**: `src/components/ComponentName/__tests__/ComponentName.test.jsx`
- **Hook tests**: `src/hooks/__tests__/hookName.test.js`
- **Integration tests**: `src/__tests__/integration.test.js`

### File Naming Convention

- Test files: `*.test.js` or `*.test.jsx`
- Snapshot files: `__snapshots__/ComponentName.test.jsx.snap`
- Mock files: Located in `src/test/mocks/`
- Factory files: Located in `src/test/factories.js`

## Writing Service Tests

### Service Test Template

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as serviceModule from '../service'
import * as apiClient from '../api/client'

vi.mock('../api/client')

describe('serviceModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('functionName', () => {
    it('should handle happy path', async () => {
      const mockData = { id: 1, name: 'Test' }
      const mockFn = vi.fn().mockResolvedValue(mockData)
      apiClient.query.mockReturnValue({ execute: mockFn })

      const result = await serviceModule.functionName()

      expect(result).toEqual(mockData)
    })

    it('should handle errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('API error'))
      apiClient.query.mockReturnValue({ execute: mockFn })

      const result = await serviceModule.functionName()

      expect(result.error).toBeDefined()
    })
  })
})
```

### Test Coverage for Services

Each service test should include:

1. **CRUD Operations**
   - CREATE: Valid data, invalid data, duplicates, constraints
   - READ: Existing records, missing records, filters
   - UPDATE: Valid updates, validation errors, partial updates
   - DELETE: Soft delete, hard delete, cascade effects

2. **Error Handling**
   - Network errors
   - Validation errors
   - Database errors
   - Timeout errors

3. **Edge Cases**
   - Empty results
   - Large datasets
   - Null/undefined values
   - Special characters

4. **Business Logic**
   - Calculations and aggregations
   - Status transitions
   - Constraint validations

### Mocking Best Practices

**Use factories for test data:**
```javascript
import { createCustomer, createProject } from '../../test/factories'

const customer = createCustomer({ name: 'John Doe' })
const project = createProject({ customer_id: customer.id })
```

**Mock API calls consistently:**
```javascript
import * as apiClient from '../api/client'

vi.mock('../api/client', () => ({
  query: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
}))

// In tests
const mockQueryBuilder = {
  filter: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue(testData),
}
apiClient.query.mockReturnValue(mockQueryBuilder)
```

## Writing Component Tests

### Component Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Component from '../Component'

describe('Component', () => {
  it('should render without crashing', () => {
    render(<Component />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const { user } = render(<Component />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })

  it('should display loading state', () => {
    render(<Component isLoading={true} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(<Component error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

### Component Test Checklist

- [ ] Renders without props
- [ ] Renders with required props
- [ ] Handles optional props
- [ ] User interactions (click, type, select)
- [ ] Loading states
- [ ] Error states
- [ ] Success states
- [ ] Conditional rendering
- [ ] Props validation
- [ ] Callbacks and handlers

## Writing Hook Tests

### Hook Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCustomHook } from '../useCustomHook'

describe('useCustomHook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCustomHook())
    expect(result.current.state).toBeDefined()
  })

  it('should update state', async () => {
    const { result } = renderHook(() => useCustomHook())
    
    await waitFor(() => {
      expect(result.current.state).toEqual(newValue)
    })
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useCustomHook())
    unmount()
    expect(true).toBe(true) // Verify no errors during cleanup
  })
})
```

### Hook Test Guidelines

- Test initial state
- Test state updates
- Test side effects
- Test cleanup
- Test error handling
- Test with different props/dependencies
- Test re-renders

## Writing Integration Tests

### Integration Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { createCustomer, createProject } from '../test/factories'

describe('Integration', () => {
  it('should complete workflow', async () => {
    // Setup
    const customer = createCustomer()
    const project = createProject({ customer_id: customer.id })
    
    // Execute
    const invoice = createInvoice({ project_id: project.id })
    
    // Verify
    expect(invoice.project_id).toBe(project.id)
    expect(invoice.customer_id).toBe(customer.id)
  })
})
```

### Integration Test Scope

- Multi-service workflows
- Service + Component integration
- Hook integration in components
- Error propagation across services
- Data consistency across modules

## Test Utilities

### Available Helpers

Located in `src/test/helpers.js`:

- `createMockLogger()` - Mock logger instance
- `waitFor(callback)` - Wait for condition
- `createMockFetch(data)` - Mock fetch function
- `flushPromises()` - Resolve all pending promises
- `mockTimer.install/uninstall` - Control timers
- `expectError(fn, message)` - Assert error thrown

### Available Factories

Located in `src/test/factories.js`:

- `createProject(overrides)` - Test project
- `createCustomer(overrides)` - Test customer
- `createInvoice(overrides)` - Test invoice
- `createEmail(overrides)` - Test email
- `createList(factory, count)` - Multiple test items

### Available Mocks

Located in `src/test/mocks/`:

- `supabase.js` - Mock Supabase client
- `api.js` - Mock API responses

## Coverage Targets

### Overall Coverage: 70%+

- **Services**: 90%+ coverage
  - All CRUD operations
  - Error cases
  - Edge cases
  - Validation logic

- **Components**: 70%+ coverage
  - Rendering paths
  - User interactions
  - State changes
  - Error boundaries

- **Hooks**: 80%+ coverage
  - Initialization
  - State updates
  - Side effects
  - Cleanup

- **Utilities**: 75%+ coverage
  - All exported functions
  - Error cases
  - Edge cases

## Running Tests

### Commands

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm run test -- projectService.test.js

# Specific test suite
npm run test -- --grep "Customer"
```

### Coverage Reports

- Generated in `coverage/` directory
- HTML report: `coverage/index.html`
- View detailed coverage by file and line

## Common Testing Patterns

### Testing Async Functions

```javascript
it('should handle async operation', async () => {
  const data = await asyncFunction()
  expect(data).toBeDefined()
})
```

### Testing Error Paths

```javascript
it('should handle errors', async () => {
  const mockFn = vi.fn().mockRejectedValue(new Error('Test error'))
  // ...
  expect(result.error).toBeDefined()
})
```

### Testing Callbacks

```javascript
it('should call callback', () => {
  const callback = vi.fn()
  render(<Component onSubmit={callback} />)
  fireEvent.click(screen.getByRole('button'))
  expect(callback).toHaveBeenCalled()
})
```

### Testing State Changes

```javascript
it('should update state', async () => {
  const { result } = renderHook(() => useState(0))
  act(() => {
    result.current[1](1)
  })
  expect(result.current[0]).toBe(1)
})
```

## Avoiding Common Mistakes

### ❌ Don't

- Skip error testing
- Mock too aggressively
- Test implementation details
- Ignore accessibility
- Create brittle snapshots
- Use `any` types without reason
- Forget to cleanup in afterEach
- Test multiple concerns in one test

### ✅ Do

- Test behavior, not implementation
- Use semantic queries (getByRole, getByText)
- Keep tests focused and isolated
- Use descriptive test names
- Clean up mocks between tests
- Test edge cases
- Test error scenarios
- Use factories for consistent data

## Debugging Tests

### Tips

```javascript
// Print debug info
screen.debug()

// Find element
screen.logTestingPlaygroundURL()

// Wait for element
await screen.findByText('text')

// Check what's rendered
console.log(container.innerHTML)
```

### Tools

- VS Code Test Explorer
- Vitest UI: `npm run test:ui`
- Browser DevTools for integration tests
- Console logging for debugging

## CI/CD Integration

Tests are automatically run on:
- Pull requests
- Pre-commit (with git hooks)
- Every commit to main branch

Coverage thresholds:
- Overall: 70% minimum
- Services: 90% minimum
- Components: 70% minimum

Failing tests block merge to main.

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Docs](https://testing-library.com/react)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
